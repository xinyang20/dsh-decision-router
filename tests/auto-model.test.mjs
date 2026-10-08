import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importDsh } from '../scripts/runtime.mjs';
import { AUTO_PROVIDER, AUTO_MODEL, isAutoModel, registerAutoModel } from '../src/auto-model.js';

const { Context } = await importDsh('@deepseek-ai/cordis');
const { LlmRuntime } = await importDsh('@deepseek-ai/dsh-llm');

test('native automatic model is discoverable and validates through the project-local DSH runtime', async t => {
  const ctx = new Context();
  t.after(() => ctx.fiber.dispose());
  await ctx.plugin(LlmRuntime, {}).await();
  await registerAutoModel(ctx);
  assert.equal(ctx.llm.listProviders().find(provider => provider.id === AUTO_PROVIDER)?.name, '自动选模');
  const models = await ctx.llm.listModels(AUTO_PROVIDER);
  assert.equal(models[0].name, '自动');
  assert.equal(isAutoModel(models[0]), true);
  assert.equal(isAutoModel({ provider: 'local-fixture', model: AUTO_MODEL }), false);
  assert.deepEqual(await ctx.llm.resolveCallConfig({ provider: AUTO_PROVIDER, model: AUTO_MODEL }), { provider: AUTO_PROVIDER, model: AUTO_MODEL });
  await assert.rejects(ctx.llm.resolveModelInfo(AUTO_PROVIDER, 'unknown'), { code: 'AUTO_MODEL_UNAVAILABLE' });
});

test('an automatic model that escapes routing fails explicitly rather than recursing or generating an answer', async t => {
  const ctx = new Context();
  t.after(() => ctx.fiber.dispose());
  await ctx.plugin(LlmRuntime, {}).await();
  await registerAutoModel(ctx);
  const call = await ctx.llm.prepareCall({ provider: AUTO_PROVIDER, model: AUTO_MODEL });
  const chunks = [];
  for await (const chunk of call.stream({ ...call.config, messages: [], signal: new AbortController().signal })) chunks.push(chunk);
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].type, 'finish');
  assert.equal(chunks[0].reason.kind, 'error');
  assert.equal(chunks[0].reason.failure.code, 'AUTO_ROUTING_REQUIRED');
  assert.match(chunks[0].reason.failure.message, /选择具体模型/);
});
