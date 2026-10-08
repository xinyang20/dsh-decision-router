import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { importDsh } from '../scripts/runtime.mjs';
import { root } from '../scripts/environment.mjs';
import { effortLabel, modelLabel } from '../src/display.js';
import { AUTO_PROVIDER } from '../src/auto-model.js';

const { LlmAdapter, createUserMessage } = await importDsh('@deepseek-ai/dsh-llm');
const { defineTool } = await importDsh('@deepseek-ai/dsh-tools');
export const inject = ['llm', 'agents', 'tools', 'workspaceRegistry', 'autoModelRouter'];

export async function apply(ctx) {
  const calls = [];
  const names = Object.fromEntries(['fast', 'standard', 'strong'].map(model => [model, modelLabel('local-fixture', model)]));
  class PreviewAdapter extends LlmAdapter {
    providerInfo(provider) { return { id: provider, name: '本地测试执行端' }; }
    async listModels(provider) { return Object.keys(names).map(id => ({ provider, id, name: `${names[id]}（本地测试）` })); }
    async resolveModel(provider, id) {
      if (!Object.hasOwn(names, id)) throw new Error('本地测试执行端不存在。');
      return { provider, id, name: `${names[id]}（本地测试）`, inputModalities: ['text'], context: { contextWindow: 32768 }, reasoning: { efforts: ['low', 'medium', 'high'].map(id => ({ id, name: effortLabel(id) })) }, defaultMaxTokens: 512 };
    }
    async *stream(options) {
      options.signal?.throwIfAborted();
      const sessionId = ctx.agents.currentInitiator()?.id;
      calls.push({ id: randomUUID(), sessionId, model: options.model, effort: options.reasoningEffort });
      if (calls.length > 500) calls.shift();
      const lastUser = options.messages.findLastIndex(message => message.source?.kind === 'user');
      if (lastUser < 0) throw new Error('本地体验仅支持由用户消息发起的轮次。');
      const hasTool = options.messages.slice(lastUser + 1).some(message => message.role === 'tool');
      if (!hasTool && options.tools?.some(tool => tool.name === 'router_probe')) {
        yield { type: 'block-start', index: 0, blockType: 'tool-call' };
        yield { type: 'block-end', index: 0, block: { type: 'tool-call', id: randomUUID(), name: 'router_probe', arguments: JSON.stringify({ a: 2, b: 3 }) } };
        yield { type: 'finish', reason: { kind: 'tool-calls' } };
      } else {
        const text = `本地路由测试完成。\n\n执行端：**${names[options.model]}**\n推理强度：**${effortLabel(options.reasoningEffort)}**\n${hasTool ? 'DSH 已完成测试工具调用，2 + 3 = 5。\n' : ''}\n此执行端是测试替身，用于检查选模和工具循环，不生成任务答案。`;
        yield { type: 'block-start', index: 0, blockType: 'text' };
        yield { type: 'text-delta', index: 0, text };
        yield { type: 'block-end', index: 0, block: { type: 'text', text } };
        yield { type: 'finish', reason: { kind: 'stop' } };
      }
    }
  }
  ctx.llm.registerAdapter(['local-fixture'], new PreviewAdapter());
  ctx.tools.register(defineTool({ name: 'router_probe', description: '本地路由测试：将两个数字相加。', parameters: { a: { type: 'number', required: true }, b: { type: 'number', required: true } }, output: { schema: { type: 'number' }, render: (_args, value) => [{ type: 'text', text: String(value) }] }, execute: ({ a, b }) => a + b }));
  const cwd = path.join(root, '.runtime/demo-project');
  await mkdir(cwd, { recursive: true });
  const workspace = await ctx.workspaceRegistry.create(cwd, '自动选模 · 本地体验');
  const handle = await ctx.agents.create({ sessionId: randomUUID(), meta: { cwd }, agentOptions: { provider: 'local-fixture', model: 'standard', reasoningEffort: 'medium' } });
  const agent = handle.agent;
  await workspace.attachSession(agent.id);
  ctx.effect(() => () => handle.dispose());
  let running = false;
  ctx.provide('autoRouterPreview', {
    info: { sessionId: agent.id, workspaceId: workspace.id, executor: 'fixture' },
    async run(prompt) {
      if (running) throw Object.assign(new Error('上一条试用任务尚未结束。'), { status: 409 });
      if (ctx.autoModelRouter.models.snapshot().candidates.some(candidate => candidate.provider !== 'local-fixture')) throw Object.assign(new Error('本地体验仅运行测试执行端。已配置真实模型，请在 DSH 新对话中使用。'), { status: 409 });
      const selected = ctx.autoModelRouter.snapshot(agent).selected;
      if (selected?.provider !== 'local-fixture' && selected?.provider !== AUTO_PROVIDER) throw Object.assign(new Error('体验对话已选择真实模型，请在对话中发送任务；本地测试按钮仅支持测试执行端。'), { status: 409 });
      running = true;
      const previousCall = calls.at(-1)?.id;
      const previousReceipt = ctx.autoModelRouter.receipts().filter(row => row.sessionId === agent.id).at(-1)?.turn;
      let timeout;
      try {
        agent.followup(createUserMessage({ content: [{ type: 'text', text: prompt }], source: { kind: 'user' } }));
        await Promise.race([agent.whenIdle(), new Promise((_, reject) => { timeout = setTimeout(() => { agent.cancel({ kind: 'interrupted' }); reject(Object.assign(new Error('测试超时，请重试。'), { status: 504 })); }, 15000); })]);
        const receipt = ctx.autoModelRouter.receipts().filter(row => row.sessionId === agent.id && row.turn > (previousReceipt ?? 0)).at(-1) ?? null;
        const newCalls = calls.slice(previousCall ? calls.findIndex(call => call.id === previousCall) + 1 : 0).filter(call => call.sessionId === agent.id);
        if (!newCalls.length) throw Object.assign(new Error('DSH 没有调用本地执行端，请检查宿主日志。'), { status: 500 });
        return { receipt, actualRequests: newCalls.map(({ model, effort }) => ({ model, effort })), sessionId: agent.id };
      } finally { clearTimeout(timeout); running = false; }
    },
  });
}
