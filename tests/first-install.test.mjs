import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHarness } from './harness.mjs';
import { decisionServer, choice } from './decision-server.mjs';
import { ModelRouter, normalizeConfig } from '../src/router.js';

const installed = { mode: 'off', candidates: [], fallback: null };
const candidates = [
  { id: 'simple', label: '简单任务', provider: 'local-fixture', model: 'fast', description: '格式整理与翻译。', extraDescription: '', reasoningEffort: 'low' },
  { id: 'complex', label: '复杂任务', provider: 'local-fixture', model: 'strong', description: '复杂编程与架构设计。', extraDescription: '', reasoningEffort: 'high' },
];
async function directory(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'dsh-router-install-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test('an empty installation exposes configuration and never calls a decision or placeholder executor', async t => {
  const server = await decisionServer(() => choice('simple')); t.after(() => server.close());
  const host = await createHarness({ ...installed, endpoint: server.endpoint }); t.after(() => host.close());
  const models = host.ctx.autoModelRouter.models;
  assert.deepEqual(models.snapshot().candidates, []);
  assert.equal(models.snapshot().fallback, null);
  assert.equal(models.snapshot().persistent, true);
  assert.equal((await models.catalog()).providers.some(provider => provider.id === 'local-fixture'), true);
  const agent = await host.createAgent();
  for (const mode of ['off', 'auto', 'shadow']) {
    await models.preferences({ revision: models.snapshot().revision, mode });
    assert.deepEqual(await host.turn(agent, '尚未配置执行档位。'), []);
    const result = agent.session.snapshotEvents().findLast(event => event.type === 'turn/end').data.reason;
    assert.equal(result.kind, 'error');
    assert.match(JSON.stringify(result), /设置 → 自动选模.*2–6/);
  }
  assert.equal(server.requests.length, 0);
  assert.equal(host.ctx.autoModelRouter.receipts().length, 0);
  await assert.rejects(models.save(models.snapshot()), /2–6/);
  host.selectModel(agent, { provider: 'local-fixture', model: 'standard', reasoningEffort: 'medium' });
  assert.deepEqual((await host.turn(agent, '原生具体模型仍可使用。')).map(call => [call.model, call.effort]), [['standard', 'medium']]);
});

test('host storage follows DSH_HOME and survives unconfigured preference changes and completed setup', async t => {
  const root = await directory(t);
  const previousHome = process.env.DSH_HOME;
  process.env.DSH_HOME = root;
  t.after(() => { if (previousHome === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = previousHome; });
  const expectedFile = path.join(root, 'plugins', 'dsh-decision-router', 'model-tiers.json');
  let host = await createHarness(installed, { useDefaultStorage: true });
  const savedPreferences = await host.ctx.autoModelRouter.models.preferences({ revision: 0, sidebarEnabled: false, mode: 'shadow' });
  assert.deepEqual(savedPreferences.candidates, []);
  assert.equal((await stat(expectedFile)).mode & 0o777, 0o600);
  await host.close();
  host = await createHarness(installed, { useDefaultStorage: true });
  assert.deepEqual(host.ctx.autoModelRouter.models.snapshot(), savedPreferences);
  const configured = await host.ctx.autoModelRouter.models.save({ ...savedPreferences, candidates, fallback: 'complex', mode: 'auto' });
  await host.close();
  host = await createHarness(installed, { useDefaultStorage: true }); t.after(() => host.close());
  assert.deepEqual(host.ctx.autoModelRouter.models.snapshot(), configured);
  assert.deepEqual(JSON.parse(await readFile(expectedFile, 'utf8')).candidates, candidates);
});

test('explicit preview storage keeps precedence over the host default and retains its saved configuration', async t => {
  const root = await directory(t);
  const modelsFile = path.join(root, 'preview', 'model-tiers.json');
  let host = await createHarness({ ...installed, candidates, fallback: 'complex', mode: 'auto', modelsFile });
  const saved = await host.ctx.autoModelRouter.models.preferences({ revision: 0, sidebarEnabled: false });
  await host.close();
  host = await createHarness({ ...installed, modelsFile }); t.after(() => host.close());
  assert.deepEqual(host.ctx.autoModelRouter.models.snapshot(), saved);
  assert.equal(JSON.parse(await readFile(modelsFile, 'utf8')).fallback, 'complex');
});

test('empty configuration is distinct from incomplete or malformed routes', async () => {
  assert.deepEqual(normalizeConfig().candidates, []);
  assert.equal(normalizeConfig().fallback, null);
  for (const invalid of [{ candidates: null }, { candidates: {} }, { candidates: [candidates[0]], fallback: 'simple' }, { candidates: [], fallback: 'stale' }]) assert.throws(() => normalizeConfig(invalid));
  let called = false;
  const router = new ModelRouter(installed, { resolveModelInfo() { called = true; throw new Error('must not resolve'); } });
  router.client.choose = () => { called = true; throw new Error('must not infer'); };
  const result = await router.route({ request: 'empty' }, new AbortController().signal);
  assert.equal(result.reason, 'fallback-unavailable');
  assert.equal(result.candidate, undefined);
  assert.equal(called, false);
});

test('the public install patch starts paused without fixture routes', async () => {
  const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8');
  assert.match(patch, /name: dsh-decision-router/);
  assert.match(patch, /mode: off/);
  assert.match(patch, /candidates: \[\]/);
  assert.doesNotMatch(patch, /local-fixture|fallback: strong/);
});
