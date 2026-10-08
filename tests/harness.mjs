import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { importDsh, dshVersion } from '../scripts/runtime.mjs';
import * as routerPlugin from '../src/index.js';
import { AUTO_PROVIDER, AUTO_MODEL } from '../src/auto-model.js';

const { Context } = await importDsh('@deepseek-ai/cordis');
const { LlmRuntime, LlmAdapter, createUserMessage } = await importDsh('@deepseek-ai/dsh-llm');
const { default: AgentRegistry, installModelSelection } = await importDsh('@deepseek-ai/dsh-agent');
const { default: SessionRegistry } = await importDsh('@deepseek-ai/dsh-session');
const { default: SessionProjectionRegistry } = await importDsh('@deepseek-ai/dsh-session-projection');
const { default: SystemPrompt } = await importDsh('@deepseek-ai/dsh-system-prompt');
const { default: ToolRuntime, defineTool } = await importDsh('@deepseek-ai/dsh-tools');
const { default: AgentLoop } = await importDsh('@deepseek-ai/dsh-agent-loop');

export async function createHarness(config = {}, { toolStep = false, unavailable = [], onTool, useDefaultStorage = false } = {}) {
  // Tests isolate saved preferences unless explicitly checking the host default.
  const settingsRoot = !useDefaultStorage && config.modelsFile === undefined ? await mkdtemp(path.join(os.tmpdir(), 'dsh-router-harness-')) : undefined;
  if (settingsRoot) config = { ...config, modelsFile: path.join(settingsRoot, 'model-tiers.json') };
  const ctx = new Context();
  const calls = []; const toolResults = []; const handles = [];
  const selections = new WeakMap();
  class FixtureAdapter extends LlmAdapter {
    async listModels(provider) { return ['fast','standard','strong'].filter(id => !unavailable.includes(id)).map(id => ({ provider, id, name: id })); }
    async resolveModel(provider, id) {
      if (unavailable.includes(id) || !['fast','standard','strong'].includes(id)) throw new Error('Unknown local fixture model');
      return { provider, id, name: id, inputModalities: ['text'], context: { contextWindow: 32768 }, reasoning: { efforts: ['low','medium','high'].map(id => ({ id, name: id })) }, defaultMaxTokens: 256 };
    }
    async *stream(options) {
      options.signal?.throwIfAborted();
      calls.push({ sessionId: ctx.agents.currentInitiator()?.id, provider: options.provider, model: options.model, effort: options.reasoningEffort, messages: structuredClone(options.messages) });
      const lastUser = options.messages.findLastIndex(message => message.source?.kind === 'user');
      const after = options.messages.slice(lastUser + 1);
      if (toolStep && !after.some(message => message.role === 'tool')) {
        const block = { type: 'tool-call', id: randomUUID(), name: 'fixture_add', arguments: JSON.stringify({ a: 2, b: 3 }) };
        yield { type: 'block-start', index: 0, blockType: 'tool-call' };
        yield { type: 'block-end', index: 0, block };
        yield { type: 'finish', reason: { kind: 'tool-calls' } };
      } else {
        const text = `[LOCAL EXECUTOR FIXTURE: ${options.model}/${options.reasoningEffort ?? 'default'}] route received${toolStep ? '; fixture_add=5' : ''}`;
        yield { type: 'block-start', index: 0, blockType: 'text' };
        yield { type: 'text-delta', index: 0, text };
        yield { type: 'block-end', index: 0, block: { type: 'text', text } };
        yield { type: 'finish', reason: { kind: 'stop' } };
      }
    }
  }
  for (const [plugin, cfg] of [[SessionProjectionRegistry, {}], [SessionRegistry, {}], [AgentRegistry, {}], [LlmRuntime, {}], [SystemPrompt, { includeHarnessIdentity: false, includeRuntimeContext: false }], [ToolRuntime, { mode: 'native' }], [AgentLoop, {}]]) await ctx.plugin(plugin, cfg).await();
  ctx.llm.registerAdapter(['local-fixture'], new FixtureAdapter());
  ctx.tools.register(defineTool({ name: 'fixture_add', description: 'Local deterministic integration fixture; adds two numbers.', parameters: { a: { type: 'number', required: true }, b: { type: 'number', required: true } }, output: { schema: { type: 'number' }, render: (_args, result) => [{ type: 'text', text: String(result) }] }, execute: ({a,b}) => { toolResults.push(a+b); onTool?.(); return a+b; } }));
  try { await ctx.plugin(routerPlugin, config).await(); }
  catch (error) {
    await ctx.fiber.dispose();
    if (settingsRoot) await rm(settingsRoot, { recursive: true, force: true });
    throw error;
  }
  function selectModel(agent, selected) {
    const selection = structuredClone(selected);
    agent.session.append('model/selection', selection);
    selections.get(agent).current = selection;
  }
  async function createAgent(selection = { provider: AUTO_PROVIDER, model: AUTO_MODEL }) {
    const handle = await ctx.agents.create({ sessionId: randomUUID(), agentOptions: selection });
    const reference = { current: undefined, assembled: undefined };
    selections.set(handle.agent, reference);
    installModelSelection(handle.agent.ctx, reference);
    selectModel(handle.agent, selection);
    handles.push(handle); return handle.agent;
  }
  return {
    version: dshVersion, ctx, calls, toolResults, createAgent, selectModel,
    async turn(agent, prompt) {
      const before = calls.length;
      agent.followup(createUserMessage({ content: [{ type: 'text', text: prompt }], source: { kind: 'user' } }));
      await Promise.race([agent.whenIdle(), new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('DSH turn timed out')), 15000); timer.unref(); })]);
      return calls.slice(before).filter(call => call.sessionId === agent.id);
    },
    async close() {
      try { for (const handle of handles) await handle.dispose(); await ctx.fiber.dispose(); }
      finally { if (settingsRoot) await rm(settingsRoot, { recursive: true, force: true }); }
    },
  };
}
