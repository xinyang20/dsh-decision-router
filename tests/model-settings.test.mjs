import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import os from 'node:os';
import path from 'node:path';
import { createHarness } from './harness.mjs';
import { decisionServer, choice } from './decision-server.mjs';
import { ModelRouter } from '../src/router.js';
import { createModelSettings } from '../src/model-settings.js';
import { AUTO_PROVIDER, AUTO_MODEL } from '../src/auto-model.js';
import { decisionModelLabel, decisionModelStatus, reasonLabel } from '../src/display.js';
import { CLOUD_DECISION_MODEL, DEFAULT_CLOUD_ENDPOINT, DEFAULT_CLOUD_MODEL, normalizeCloudDecision, publicCloudDecision } from '../src/cloud-config.js';
import { API, mountWeb } from '../src/web.js';

const config = JSON.parse(await readFile(new URL('../config/local.json', import.meta.url), 'utf8'));
const route = (id, model, effort, description = 'General coding tasks.') => ({ id, label: id, provider: 'local-fixture', model, reasoningEffort: effort, description, extraDescription: '' });
async function directory(t) { const root = await mkdtemp(path.join(os.tmpdir(), 'dsh-router-settings-')); t.after(() => rm(root, { recursive: true, force: true })); return root; }
const cloud = (apiKey = 'unit-test-key-not-a-real-credential', endpoint = DEFAULT_CLOUD_ENDPOINT, model = DEFAULT_CLOUD_MODEL) => ({ endpoint, model, apiKey, consent: { version: 1, endpoint, model } });

test('saved model, effort, custom names and sidebar visibility survive a fresh DSH host', async t => {
  const root = await directory(t);
  const server = await decisionServer(() => choice('fast')); t.after(() => server.close());
  const settings = { ...config, endpoint: server.endpoint, modelsFile: path.join(root, 'routes.json') };
  const host = await createHarness(settings, { toolStep: true });
  const models = host.ctx.autoModelRouter.models;
  const saved = await models.save({ ...models.snapshot(), candidates: [route('frontend', 'standard', 'high'), route('backend', 'strong', 'low')], fallback: 'backend', sidebarEnabled: false, decisionModel: 'd1-3b' });
  assert.equal(saved.persistent, true);
  assert.equal(saved.revision, 1);
  assert.equal(saved.decisionModel, 'd1-3b');
  await host.close();
  const reopened = await createHarness(settings, { toolStep: true }); t.after(() => reopened.close());
  assert.deepEqual(reopened.ctx.autoModelRouter.models.snapshot(), saved);
  const agent = await reopened.createAgent();
  reopened.ctx.autoModelRouter.pin(agent, 'frontend');
  assert.deepEqual((await reopened.turn(agent, 'render a form')).map(call => [call.model, call.effort]), [['standard', 'high'], ['standard', 'high']]);
});

test('legacy built-in descriptions migrate once while custom English content and routing assignments stay intact', async t => {
  const root = await directory(t);
  const file = path.join(root, 'routes.json');
  const legacyFast = 'Fast, lowest-cost executor for greetings, translation, formatting, and simple factual questions.';
  const legacyStrong = 'Strong reasoning executor for architecture, difficult mathematics, concurrency bugs, security analysis, and complex changes across multiple modules.';
  const candidates = [
    { ...route('fast', 'fast', 'low', legacyFast), label: 'My fast route', extraDescription: 'Keep my English notes.' },
    route('standard', 'standard', 'medium', 'My custom coding route.'),
    route('strong', 'strong', 'high', legacyStrong),
    route('custom', 'fast', 'low', legacyFast),
    { ...route('external', 'fast', 'low', legacyFast), provider: 'custom-provider' },
  ];
  await writeFile(file, JSON.stringify({ revision: 7, candidates, fallback: 'strong', sidebarEnabled: false }));
  const host = await createHarness({ ...config, modelsFile: file });
  const saved = host.ctx.autoModelRouter.models.snapshot();
  assert.equal(saved.revision, 8);
  assert.equal(saved.candidates[0].description, config.candidates[0].description);
  assert.equal(saved.candidates[2].description, config.candidates[2].description);
  assert.deepEqual(saved.candidates.map(({ description, ...candidate }) => candidate), candidates.map(({ description, ...candidate }) => candidate));
  for (const index of [1, 3, 4]) assert.equal(saved.candidates[index].description, candidates[index].description);
  const persisted = await readFile(file, 'utf8');
  assert.deepEqual(JSON.parse(persisted), { revision: saved.revision, candidates: saved.candidates, mode: saved.mode, fallback: saved.fallback, sidebarEnabled: saved.sidebarEnabled, decisionModel: 'laya' });
  await host.close();
  const reopened = await createHarness({ ...config, modelsFile: file }); t.after(() => reopened.close());
  assert.deepEqual(reopened.ctx.autoModelRouter.models.snapshot(), saved);
  assert.equal(await readFile(file, 'utf8'), persisted);
});

test('candidate count, duplicate IDs, effort, provider, fallback and stale edits are rejected atomically', async t => {
  const root = await directory(t);
  const host = await createHarness({ ...config, modelsFile: path.join(root, 'routes.json') }); t.after(() => host.close());
  const models = host.ctx.autoModelRouter.models;
  const baseline = await models.save(models.snapshot());
  const originalFile = await readFile(path.join(root, 'routes.json'), 'utf8');
  const invalid = [
    { candidates: baseline.candidates.slice(0, 1) },
    { candidates: Array.from({ length: 7 }, (_, i) => route(`route_${i}`, 'fast', 'low')) },
    { candidates: [baseline.candidates[0], baseline.candidates[0]] },
    { candidates: baseline.candidates.map((candidate, i) => i ? candidate : { ...candidate, reasoningEffort: 'impossible' }) },
    { candidates: baseline.candidates.map((candidate, i) => i ? candidate : { ...candidate, provider: 'missing' }) },
    { candidates: baseline.candidates.map((candidate, i) => i ? candidate : { ...candidate, description: ' ' }) },
    { fallback: 'absent' }, { sidebarEnabled: 'false' }, { revision: 0 },
    ...['remote-model', 'http://127.0.0.1:1234', '', null, {}].map(decisionModel => ({ decisionModel })),
    ...['enabled', '', null, false, 1, {}].map(mode => ({ mode })),
  ];
  for (const patch of invalid) {
    await assert.rejects(models.save({ ...baseline, ...patch }), error => [400, 409].includes(error.status));
    assert.deepEqual(models.snapshot(), baseline);
    assert.equal(await readFile(path.join(root, 'routes.json'), 'utf8'), originalFile);
  }
});

test('global routing modes persist across fresh hosts and omitted legacy payloads retain the current mode', async t => {
  const root = await directory(t);
  const file = path.join(root, 'routes.json');
  const settings = { ...config, mode: 'off', modelsFile: file };
  const host = await createHarness(settings); t.after(() => host.close());
  const models = host.ctx.autoModelRouter.models;
  assert.equal(models.snapshot().mode, 'off');
  for (const mode of ['shadow', 'auto', 'off']) {
    const saved = await models.save({ ...models.snapshot(), mode });
    assert.equal(saved.mode, mode);
    assert.equal((await models.catalog()).mode, mode);
    assert.equal(JSON.parse(await readFile(file, 'utf8')).mode, mode);
    const reopened = await createHarness({ ...settings, mode: mode === 'auto' ? 'off' : 'auto' });
    try { assert.deepEqual(reopened.ctx.autoModelRouter.models.snapshot(), saved); }
    finally { await reopened.close(); }
    const { mode: omittedMode, ...legacyPayload } = models.snapshot();
    assert.equal((await models.save(legacyPayload)).mode, omittedMode);
    assert.equal(JSON.parse(await readFile(file, 'utf8')).mode, omittedMode);
  }
});

test('an older saved configuration inherits the configured global mode once and never resets it on reopen', async t => {
  const root = await directory(t);
  const file = path.join(root, 'routes.json');
  const candidates = new ModelRouter(config, {}).config.candidates;
  await writeFile(file, JSON.stringify({ revision: 4, candidates, fallback: config.fallback, sidebarEnabled: true, decisionModel: 'd1-3b' }));
  const first = await createHarness({ ...config, mode: 'shadow', modelsFile: file });
  const snapshot = first.ctx.autoModelRouter.models.snapshot();
  assert.equal(snapshot.mode, 'shadow');
  assert.equal(snapshot.revision, 5);
  const persisted = await readFile(file, 'utf8');
  assert.equal(JSON.parse(persisted).mode, 'shadow');
  await first.close();
  const reopened = await createHarness({ ...config, mode: 'auto', modelsFile: file }); t.after(() => reopened.close());
  assert.deepEqual(reopened.ctx.autoModelRouter.models.snapshot(), snapshot);
  assert.equal(await readFile(file, 'utf8'), persisted);
});

test('invalid persisted global modes are rejected without rewriting saved settings', async t => {
  const root = await directory(t);
  const file = path.join(root, 'routes.json');
  for (const mode of [null, 'enabled', false]) {
    const contents = JSON.stringify({ revision: 1, candidates: new ModelRouter(config, {}).config.candidates, fallback: config.fallback, sidebarEnabled: true, decisionModel: 'laya', mode });
    await writeFile(file, contents);
    await assert.rejects(createModelSettings(new ModelRouter({ ...config, modelsFile: file }, {})), /自动选择、仅观察或暂停决策/);
    assert.equal(await readFile(file, 'utf8'), contents);
  }
});

test('decision model choices share the saved catalog, accept not-yet-installed local models and preserve legacy clients', async t => {
  const root = await directory(t);
  const file = path.join(root, 'routes.json');
  const host = await createHarness({ ...config, modelsFile: file }); t.after(() => host.close());
  const models = host.ctx.autoModelRouter.models;
  assert.equal(models.snapshot().decisionModel, 'laya');
  for (const decisionModel of ['d1-3b', 'd1-omni-600m', 'laya']) {
    const saved = await models.save({ ...models.snapshot(), decisionModel });
    assert.equal(saved.decisionModel, decisionModel);
    assert.equal((await models.catalog()).decisionModel, decisionModel);
    assert.equal(JSON.parse(await readFile(file, 'utf8')).decisionModel, decisionModel);
  }
  await models.save({ ...models.snapshot(), decisionModel: 'd1-omni-600m' });
  const { decisionModel, ...legacyRequest } = models.snapshot();
  assert.equal((await models.save(legacyRequest)).decisionModel, decisionModel);
});

test('a legacy persisted file receives the Laya decision model exactly once without changing route content', async t => {
  const root = await directory(t);
  const file = path.join(root, 'routes.json');
  const candidates = [route('first', 'fast', 'low', 'Custom first route.'), route('second', 'strong', 'high', 'Custom second route.')];
  await writeFile(file, JSON.stringify({ revision: 2, candidates, fallback: 'second', sidebarEnabled: true }));
  const settings = { ...config, decisionModel: 'd1-3b', modelsFile: file };
  const first = await createHarness(settings);
  const snapshot = first.ctx.autoModelRouter.models.snapshot();
  assert.equal(snapshot.decisionModel, 'laya');
  assert.equal(snapshot.revision, 3);
  assert.deepEqual(snapshot.candidates, candidates);
  const persisted = await readFile(file, 'utf8');
  await first.close();
  const second = await createHarness(settings); t.after(() => second.close());
  assert.deepEqual(second.ctx.autoModelRouter.models.snapshot(), snapshot);
  assert.equal(await readFile(file, 'utf8'), persisted);
});

test('invalid persisted decision models cannot silently become a usable configuration', async t => {
  const root = await directory(t);
  const file = path.join(root, 'routes.json');
  await writeFile(file, JSON.stringify({ revision: 1, candidates: new ModelRouter(config, {}).config.candidates, fallback: config.fallback, sidebarEnabled: true, decisionModel: 'cloud-router' }));
  await assert.rejects(createModelSettings(new ModelRouter({ ...config, modelsFile: file }, {})), /决策模型/);
});

test('local service readiness never implies the selected decision weights are loaded', () => {
  const service = { ready: true, model: null, loading: null, models: [{ id: 'laya', installed: true }, { id: 'd1-3b', installed: false }, { id: 'd1-omni-600m', installed: true }] };
  assert.match(decisionModelStatus(service, 'laya').text, /已安装，按需加载/);
  assert.equal(decisionModelStatus(service, 'd1-3b').ready, false);
  assert.match(decisionModelStatus(service, 'd1-3b').text, /未安装/);
  assert.match(decisionModelStatus({ ...service, model: 'laya' }, 'laya').text, /已加载/);
  assert.doesNotMatch(decisionModelStatus({ ...service, model: 'laya' }, 'd1-omni-600m').text, /已加载/);
  assert.match(decisionModelStatus({ ...service, loading: 'd1-omni-600m' }, 'd1-omni-600m').text, /正在加载/);
  assert.equal(decisionModelStatus({ ...service, ready: false }, 'laya').ready, false);
  assert.equal(decisionModelLabel('convaiinnovations/laya-multilingual'), 'Laya');
  assert.equal(decisionModelLabel('d1-3b'), 'd1-3B');
  assert.doesNotMatch(reasonLabel('system-one'), /Laya/);
});

test('the native automatic model is discoverable but cannot be configured as a recursive executor', async t => {
  const host = await createHarness(config); t.after(() => host.close());
  assert.equal(host.ctx.llm.listProviders().some(provider => provider.id === AUTO_PROVIDER), true);
  assert.equal((await host.ctx.llm.listModels(AUTO_PROVIDER))[0].id, AUTO_MODEL);
  const models = host.ctx.autoModelRouter.models;
  assert.equal((await models.catalog()).providers.some(provider => provider.id === AUTO_PROVIDER), false);
  const before = models.snapshot();
  const candidates = before.candidates.map((candidate, index) => index ? candidate : { ...candidate, provider: AUTO_PROVIDER, model: AUTO_MODEL });
  await assert.rejects(models.save({ ...before, candidates }), /自动模式不能作为执行档位/);
  assert.deepEqual(models.snapshot(), before);
  assert.throws(() => new ModelRouter({ ...config, candidates }, host.ctx.llm), /自动模式不能作为执行档位/);
});

test('2–6 unordered routes send task descriptions and supplemental notes to the decision model', async t => {
  const server = await decisionServer(body => {
    const ids = Object.keys(body.questions.executor.criteria);
    return { model: 'fixture', answers: { executor: { choice: 'frontend', probabilities: Object.fromEntries(ids.map(id => [id, id === 'frontend' ? 1 : 0])) } } };
  }); t.after(() => server.close());
  const host = await createHarness({ ...config, endpoint: server.endpoint }); t.after(() => host.close());
  const models = host.ctx.autoModelRouter.models;
  for (let count = 2; count <= 6; count++) {
    const candidates = [route('backend', 'strong', 'medium', 'Backend APIs and database transactions.'), { ...route('frontend', 'standard', 'medium', 'Frontend React UI and visual design.'), extraDescription: 'Prefer this route for accessible forms; send SQL migrations to backend.' }, ...Array.from({ length: count - 2 }, (_, i) => route(`other_${i}`, 'fast', 'low'))].reverse();
    await models.save({ ...models.snapshot(), candidates, fallback: 'backend' });
    const calls = await host.turn(await host.createAgent(), 'Build an accessible React form.');
    assert.equal(calls[0].model, 'standard');
    assert.equal(calls[0].effort, 'medium');
    const question = server.requests.at(-1).questions.executor;
    assert.equal(Object.keys(question.criteria).length, count);
    assert.match(question.criteria.frontend, /accessible forms/);
    assert.match(question.instructions, /unordered peers/);
  }
});

test('editing routes during a pending decision keeps its model through all tool steps', async t => {
  let reached; let release;
  const reachedPromise = new Promise(resolve => { reached = resolve; });
  const releasePromise = new Promise(resolve => { release = resolve; });
  const server = await decisionServer(async (_, n) => { if (n === 1) { reached(); await releasePromise; } return choice('fast'); }); t.after(() => server.close());
  const host = await createHarness({ ...config, endpoint: server.endpoint }, { toolStep: true }); t.after(() => host.close());
  const agent = await host.createAgent();
  const pending = host.turn(agent, 'first task');
  await reachedPromise;
  const models = host.ctx.autoModelRouter.models;
  const state = models.snapshot();
  await models.save({ ...state, decisionModel: 'd1-3b', candidates: state.candidates.map(candidate => candidate.id === 'fast' ? { ...candidate, model: 'strong', reasoningEffort: 'high' } : candidate) });
  release();
  assert.deepEqual((await pending).map(call => [call.model, call.effort]), [['fast', 'low'], ['fast', 'low']]);
  assert.equal(server.requests[0].model, 'laya');
  assert.deepEqual((await host.turn(agent, 'second task')).map(call => [call.model, call.effort]), [['strong', 'high'], ['strong', 'high']]);
  assert.equal(server.requests[1].model, 'd1-3b');
});

test('removing a pinned route clears the stale selection and resumes automatic routing', async t => {
  const server = await decisionServer(body => ({ model: 'fixture', answers: { executor: { choice: 'strong', probabilities: Object.fromEntries(Object.keys(body.questions.executor.criteria).map(id => [id, id === 'strong' ? 1 : 0])) } } })); t.after(() => server.close());
  const host = await createHarness({ ...config, endpoint: server.endpoint }); t.after(() => host.close());
  const agent = await host.createAgent();
  host.ctx.autoModelRouter.pin(agent, 'fast');
  const models = host.ctx.autoModelRouter.models;
  await models.save({ ...models.snapshot(), candidates: models.snapshot().candidates.filter(candidate => candidate.id !== 'fast') });
  assert.equal(host.ctx.autoModelRouter.snapshot(agent).pin, null);
  assert.equal((await host.turn(agent, 'task'))[0].model, 'strong');
});

test('a failed local write preserves active settings and the catalog exposes no credentials', async t => {
  const root = await directory(t);
  const llm = { listProviders: () => [{ id: 'local-fixture', name: 'Test', apiKey: 'must-not-leak' }], listModels: async provider => [{ provider, id: 'fast', name: 'Fast', apiKey: 'must-not-leak' }], resolveModelInfo: async (provider, id) => ({ provider, id }) };
  const models = await createModelSettings(new ModelRouter({ ...config, modelsFile: path.join(root, 'blocked', 'routes.json') }, llm));
  const state = models.snapshot();
  await writeFile(path.join(root, 'blocked'), 'not a directory');
  await assert.rejects(models.save({ ...state, mode: state.mode === 'off' ? 'auto' : 'off', candidates: [route('a', 'fast'), route('b', 'fast')], fallback: 'b' }), { status: 500 });
  assert.deepEqual(models.snapshot(), state);
  const catalog = await models.catalog();
  assert.equal(catalog.providers[0].models[0].efforts.length, 0);
  assert.equal(JSON.stringify(catalog).includes('must-not-leak'), false);
});

test('preferences save independently of unavailable models and reject unrelated writes', async t => {
  const root = await directory(t); const file = path.join(root, 'preferences.json');
  let modelCalls = 0;
  const router = new ModelRouter({ ...config, modelsFile: file }, { listModels: async () => { modelCalls++; throw new Error('offline provider'); } });
  const models = await createModelSettings(router);
  const original = models.snapshot();
  const saved = await models.preferences({ revision: original.revision, mode: 'off', sidebarEnabled: false });
  assert.equal(saved.mode, 'off'); assert.equal(saved.sidebarEnabled, false); assert.equal(modelCalls, 0);
  assert.deepEqual(saved.candidates, original.candidates);
  assert.equal(JSON.parse(await readFile(file, 'utf8')).mode, 'off');
  const restored = await createModelSettings(new ModelRouter({ ...config, modelsFile: file }, {}));
  assert.deepEqual(restored.snapshot(), saved);
  await assert.rejects(models.save(saved), { status: 400 });
  const callsAfterRejectedFullSave = modelCalls;
  const next = await models.preferences({ revision: saved.revision, mode: 'shadow' });
  assert.equal(next.sidebarEnabled, false); assert.equal(modelCalls, callsAfterRejectedFullSave);
  for (const patch of [{ candidates: [] }, { decisionModel: 'd1-3b' }, { cloudDecision: cloud() }, { mode: null }, { sidebarEnabled: 'true' }]) await assert.rejects(models.preferences({ revision: next.revision, ...patch }), { status: 400 });
  assert.deepEqual(models.snapshot(), next);
  await assert.rejects(models.preferences({ revision: saved.revision, mode: 'auto' }), { status: 409 });
});

test('preferences and full saves share the same optimistic-lock queue', async t => {
  const root = await directory(t);
  let reached; let release;
  const reachedPromise = new Promise(resolve => { reached = resolve; });
  const released = new Promise(resolve => { release = resolve; });
  const llm = {
    listModels: async () => { reached(); await released; return config.candidates.map(candidate => ({ id: candidate.model })); },
    resolveModelInfo: async (provider, id) => ({ provider, id, reasoning: { efforts: ['low', 'medium', 'high'].map(id => ({ id })) } }),
  };
  const models = await createModelSettings(new ModelRouter({ ...config, modelsFile: path.join(root, 'routes.json') }, llm));
  const original = models.snapshot();
  const saving = models.save({ ...original, fallback: 'fast' });
  await reachedPromise;
  const changing = models.preferences({ revision: original.revision, mode: 'off' });
  const conflict = assert.rejects(changing, { status: 409 });
  release(); const saved = await saving; await conflict;
  assert.equal(models.snapshot().fallback, 'fast');
  assert.equal(models.snapshot().mode, original.mode);
  assert.equal((await models.preferences({ revision: saved.revision, mode: 'off' })).mode, 'off');
});

test('a failed preference write preserves every active field and the revision', async t => {
  const root = await directory(t);
  const file = path.join(root, 'blocked', 'routes.json');
  const models = await createModelSettings(new ModelRouter({ ...config, modelsFile: file }, {}));
  const before = models.snapshot();
  await writeFile(path.join(root, 'blocked'), 'not a directory');
  await assert.rejects(models.preferences({ revision: before.revision, mode: 'off', sidebarEnabled: false }), { status: 500 });
  assert.deepEqual(models.snapshot(), before);
});

test('cloud configuration requires HTTPS, bounded credentials and consent for the exact endpoint and model', () => {
  assert.equal(normalizeCloudDecision(undefined), undefined);
  const valid = normalizeCloudDecision(cloud());
  const sanitized = publicCloudDecision(valid);
  assert.deepEqual(sanitized, { endpoint: DEFAULT_CLOUD_ENDPOINT, model: DEFAULT_CLOUD_MODEL, hasApiKey: true, consent: { version: 1, endpoint: DEFAULT_CLOUD_ENDPOINT, model: DEFAULT_CLOUD_MODEL } });
  assert.equal(sanitized.apiKey, undefined);
  const invalid = [
    { endpoint: 'http://api.typesafe.ai/v1/systemone' },
    { endpoint: 'https://user:password@api.typesafe.ai/v1/systemone' },
    { endpoint: DEFAULT_CLOUD_ENDPOINT + '?key=secret' }, { endpoint: DEFAULT_CLOUD_ENDPOINT + '#' },
    { endpoint: 'not-a-url' }, { apiKey: '' }, { apiKey: 'one\ntwo' }, { apiKey: 'one\rtwo' }, { apiKey: 'x'.repeat(4097) },
    { model: '' }, { model: 'x'.repeat(101) }, { consent: undefined }, { consent: false },
    { consent: { version: 2, endpoint: DEFAULT_CLOUD_ENDPOINT, model: DEFAULT_CLOUD_MODEL } },
    { consent: { version: 1, endpoint: 'https://another.invalid/v1/systemone', model: DEFAULT_CLOUD_MODEL } },
    { consent: { version: 1, endpoint: DEFAULT_CLOUD_ENDPOINT, model: 'another-model' } },
  ];
  for (const patch of invalid) assert.throws(() => normalizeCloudDecision({ ...cloud(), ...patch }));
  const { apiKey, ...withoutKey } = cloud();
  assert.equal(normalizeCloudDecision(withoutKey, valid).apiKey, apiKey);
  const changedEndpoint = 'https://different.invalid/v1/systemone';
  const moved = cloud(undefined, changedEndpoint); delete moved.apiKey;
  assert.throws(() => normalizeCloudDecision(moved, valid), /更改地址后必须重新填写/);
  assert.throws(() => new ModelRouter({ ...config, decisionModel: CLOUD_DECISION_MODEL }, {}), /云端|确认/);
});

test('cloud credentials persist privately, stay redacted and cannot follow endpoint changes silently', async t => {
  const root = await directory(t); const file = path.join(root, 'routes.json');
  const secret = 'test-private-decision-key';
  const host = await createHarness({ ...config, modelsFile: file }); t.after(() => host.close());
  const models = host.ctx.autoModelRouter.models;
  const initial = models.snapshot();
  await assert.rejects(models.save({ ...initial, decisionModel: CLOUD_DECISION_MODEL, cloudDecision: { ...cloud(secret), consent: undefined } }), { status: 400 });
  assert.deepEqual(models.snapshot(), initial);
  const saved = await models.save({ ...initial, decisionModel: CLOUD_DECISION_MODEL, cloudDecision: cloud(secret) });
  assert.equal(saved.cloudDecision.hasApiKey, true);
  assert.equal(saved.cloudDecision.apiKey, undefined);
  assert.equal(JSON.stringify(await models.catalog()).includes(secret), false);
  assert.equal(JSON.parse(await readFile(file, 'utf8')).cloudDecision.apiKey, secret);
  assert.equal((await stat(file)).mode & 0o777, 0o600);
  const changedPreferences = await models.preferences({ revision: saved.revision, sidebarEnabled: false });
  assert.equal(JSON.parse(await readFile(file, 'utf8')).cloudDecision.apiKey, secret);
  const reopened = await createHarness({ ...config, modelsFile: file });
  try { assert.deepEqual(reopened.ctx.autoModelRouter.models.snapshot(), changedPreferences); }
  finally { await reopened.close(); }
  const { cloudDecision, ...legacyPayload } = changedPreferences;
  assert.equal((await models.save(legacyPayload)).cloudDecision.hasApiKey, true);
  const anotherEndpoint = 'https://another.invalid/v1/systemone';
  const moved = { ...cloudDecision, endpoint: anotherEndpoint, consent: { ...cloudDecision.consent, endpoint: anotherEndpoint } };
  const beforeMoved = models.snapshot();
  await assert.rejects(models.save({ ...beforeMoved, cloudDecision: moved }), { status: 400 });
  assert.deepEqual(models.snapshot(), beforeMoved);
  const replacement = 'test-replacement-decision-key';
  await models.save({ ...models.snapshot(), cloudDecision: { ...moved, apiKey: replacement } });
  assert.equal(JSON.parse(await readFile(file, 'utf8')).cloudDecision.apiKey, replacement);
  await models.save({ ...models.snapshot(), decisionModel: 'laya' });
  const { cloudDecision: retainedCloud, ...localPayload } = models.snapshot();
  assert.equal(retainedCloud.hasApiKey, true);
  await assert.rejects(models.save({ ...localPayload, decisionModel: CLOUD_DECISION_MODEL }), /重新确认/);
  await models.save({ ...localPayload, decisionModel: CLOUD_DECISION_MODEL, cloudDecision: retainedCloud });
  assert.equal(JSON.stringify(models.snapshot()).includes(replacement), false);
});

test('web state, model catalog and independent preference responses never expose the cloud API key', async t => {
  const root = await directory(t);
  const secret = 'test-never-return-this-key';
  const router = new ModelRouter({ ...config, endpoint: 'http://127.0.0.1:9/v1/systemone', decisionModel: CLOUD_DECISION_MODEL, cloudDecision: cloud(secret), modelsFile: path.join(root, 'routes.json') }, { listProviders: () => [] });
  const models = await createModelSettings(router);
  let handler;
  const ctx = { effect: callback => callback(), webServer: { register: route => { handler = route.handler; return () => {}; } }, connection: { admit: () => ({}) }, get: () => undefined, agents: { list: () => [] } };
  mountWeb(ctx, router, { models, snapshot: () => ({}), receipts: () => [] });
  const request = async (method, route, payload) => {
    const req = Readable.from(payload === undefined ? [] : [Buffer.from(JSON.stringify(payload))]);
    Object.assign(req, { method, url: API + route, socket: { remoteAddress: '127.0.0.1' }, headers: { host: '127.0.0.1:39393', 'content-type': 'application/json' } });
    let status; let text;
    const res = { writeHead: value => { status = value; }, end: value => { text = value; }, destroy: () => assert.fail('unexpected response destruction') };
    await handler(req, res);
    assert.equal(status, 200);
    assert.equal(text.includes(secret), false);
    assert.equal(text.includes('"apiKey"'), false);
    return JSON.parse(text);
  };
  assert.equal((await request('GET', '/state')).modelSettings.cloudDecision.hasApiKey, true);
  assert.equal((await request('GET', '/models')).cloudDecision.hasApiKey, true);
  const changed = await request('POST', '/preferences', { revision: models.snapshot().revision, mode: 'off', sidebarEnabled: false });
  assert.equal(changed.mode, 'off'); assert.equal(changed.sidebarEnabled, false);
  assert.equal(JSON.parse(await readFile(path.join(root, 'routes.json'), 'utf8')).cloudDecision.apiKey, secret);
});
