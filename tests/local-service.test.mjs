import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { DecisionManager, createDecisionService, validateRequest, normalizeResponse } from '../local/decision-service.mjs';
import { assertPortFree, localJson, offlineEnvironment, spawnIsolated, stopIsolated, verifyIsolation } from '../local/offline-runtime.mjs';

const input = (model = 'laya') => ({ model, state: { request: 'Translate a label.', recent: [] }, questions: { executor: { type: 'choice', instructions: 'Choose by task fit.', criteria: { fast: 'Simple tasks.', strong: 'Complex tasks.' } } } });
const answer = { answers: { executor: { choice: 'fast', probabilities: { fast: 0.9, strong: 0.1 } } }, usage: { input_tokens: 20, output_tokens: 0 } };
// Unit-level lifecycle doubles are distinct from the real Seatbelt probe below.
const isolatedDouble = async () => ({ offline: true, isolation: 'macos-sandbox' });
function fakeManager(options = {}) { return new DecisionManager({ inspect: async () => true, isolationCheck: isolatedDouble, ...options }); }
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }

test('offline worker environment retains HOME and strips credentials, proxies, injection and llama overrides', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'dsh-offline-env-')); t.after(() => rm(root, { recursive: true, force: true }));
  const env = await offlineEnvironment(root, { HOME: '/retained-home', PATH: '/usr/bin:/bin', HTTP_PROXY: 'private-proxy', https_proxy: 'private-proxy', OPENAI_API_KEY: 'private-key', HF_TOKEN: 'private-token', LLAMA_ARG_HF_REPO: 'remote/model', LLAMA_ARG_RPC: 'remote:9000', NODE_OPTIONS: '--require=bad', PYTHONPATH: '/bad' });
  assert.equal(env.HOME, '/retained-home');
  for (const key of ['HTTP_PROXY', 'https_proxy', 'OPENAI_API_KEY', 'HF_TOKEN', 'LLAMA_ARG_HF_REPO', 'LLAMA_ARG_RPC', 'NODE_OPTIONS', 'PYTHONPATH']) assert.equal(env[key], undefined);
  for (const key of ['HF_HUB_OFFLINE', 'TRANSFORMERS_OFFLINE', 'HF_HUB_DISABLE_TELEMETRY', 'HF_HUB_DISABLE_IMPLICIT_TOKEN', 'UV_OFFLINE']) assert.equal(env[key], '1');
});

test('only local model IDs and a bounded executor-choice schema are accepted', () => {
  assert.equal(validateRequest(input('laya-local')).model, 'laya');
  const withoutModel = input(); delete withoutModel.model;
  assert.equal(validateRequest(withoutModel).model, 'laya');
  for (const patch of [{ model: 'https://cloud.invalid/model' }, { state: null }, { files: ['https://remote.invalid/image.png'] }, { state: 'x'.repeat(16001) }, { questions: { executor: { type: 'score' } } }, { questions: { executor: { type: 'choice', instructions: 'Choose', criteria: { fast: 'only one' } } } }]) assert.throws(() => validateRequest({ ...input(), ...patch }), error => error.status === 400);
  const response = normalizeResponse(answer, 'd1-3b', input().questions.executor.criteria, 12);
  assert.equal(response.model, 'LiquidAI/d1-3B');
  assert.equal(response.answers.executor.confidence, 0.8);
  assert.throws(() => normalizeResponse({ answers: { executor: { choice: 'strong', probabilities: { fast: 0.9, strong: 0.1 } } } }, 'laya', input().questions.executor.criteria, 1), error => error.status === 502);
});

test('health checks do not load any model and unverifiable isolation fails closed', async () => {
  let launches = 0;
  const manager = fakeManager({ launch: async () => { launches++; throw new Error(); } });
  await manager.initialize();
  const health = await manager.health();
  assert.equal(health.service, 'dsh-local-decisions');
  assert.equal(health.ready, true);
  assert.equal(health.model, null);
  assert.equal(health.loading, null);
  assert.equal(health.models.length, 3);
  assert.equal(launches, 0);
  await manager.close();
  await assert.rejects(fakeManager({ isolationCheck: async () => ({ offline: true, isolation: 'environment-flags-only' }) }).initialize(), /系统离线隔离不可用/);
});

test('closing during isolation initialization waits for cancellation cleanup and never becomes ready', async () => {
  const started = deferred(); let cleaned = false;
  const manager = fakeManager({ isolationCheck: async ({ signal }) => {
    started.resolve();
    try { await delay(10000, undefined, { signal }); return isolatedDouble(); }
    finally { await delay(10); cleaned = true; }
  } });
  const initialization = manager.initialize();
  const rejected = assert.rejects(initialization, { name: 'AbortError' });
  await started.promise;
  await manager.close(); await rejected;
  assert.equal(cleaned, true);
  assert.equal((await manager.health()).ready, false);
});

test('requests are serialized and switching waits for complete previous-worker shutdown', async t => {
  const events = []; let resident = 0; let concurrent = 0; let peakResident = 0; let peakInference = 0;
  const manager = fakeManager({ launch: async definition => {
    resident++; peakResident = Math.max(peakResident, resident); events.push(`start:${definition.id}`);
    return { id: definition.id, alive: () => true, infer: async () => { concurrent++; peakInference = Math.max(peakInference, concurrent); await delay(10); events.push(`infer:${definition.id}`); concurrent--; return answer; }, close: async () => { events.push(`stopping:${definition.id}`); await delay(20); resident--; events.push(`stopped:${definition.id}`); } };
  } }); t.after(() => manager.close());
  await manager.initialize();
  const results = await Promise.all([manager.decide(input()), manager.decide(input()), manager.decide(input('d1-3b'))]);
  assert.equal(results[2].model, 'LiquidAI/d1-3B');
  assert.equal(peakResident, 1); assert.equal(peakInference, 1);
  assert.deepEqual(events, ['start:laya', 'infer:laya', 'infer:laya', 'stopping:laya', 'stopped:laya', 'start:d1-3b', 'infer:d1-3b']);
});

test('loading status is truthful and canceled loading requests never invoke inference', async t => {
  const started = deferred(); const release = deferred(); let inferred = false;
  const manager = fakeManager({ launch: async definition => { started.resolve(); await release.promise; return { id: definition.id, alive: () => true, infer: async () => { inferred = true; return answer; }, close: async () => {} }; } }); t.after(() => manager.close());
  await manager.initialize();
  const controller = new AbortController();
  const operation = manager.decide(input(), controller.signal);
  const rejected = assert.rejects(operation, { name: 'AbortError' });
  await started.promise;
  const loading = await manager.health();
  assert.equal(loading.loading, 'laya'); assert.equal(loading.model, null);
  controller.abort(); release.resolve(); await rejected;
  const loaded = await manager.health();
  assert.equal(loaded.loading, null); assert.equal(loaded.model, 'laya'); assert.equal(inferred, false);
});

test('canceling inference reaps its worker before a queued model can start', async t => {
  const reached = deferred(); const events = [];
  const manager = fakeManager({ launch: async definition => {
    events.push(`start:${definition.id}`);
    return { id: definition.id, alive: () => true, infer: async (_, signal) => {
      if (definition.id !== 'laya') return answer;
      reached.resolve(); await delay(10000, undefined, { signal }); return answer;
    }, close: async () => { await delay(15); events.push(`closed:${definition.id}`); } };
  } }); t.after(() => manager.close());
  await manager.initialize();
  const controller = new AbortController();
  const first = manager.decide(input(), controller.signal); const rejected = assert.rejects(first, { name: 'AbortError' });
  await reached.promise;
  const second = manager.decide(input('d1-omni-600m'));
  controller.abort(); await rejected; await second;
  assert.deepEqual(events, ['start:laya', 'closed:laya', 'start:d1-omni-600m']);
});

function call(port, pathname, { payload, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const content = payload === undefined ? undefined : typeof payload === 'string' ? payload : JSON.stringify(payload);
    const request = http.request({ hostname: '127.0.0.1', port, path: pathname, method: content ? 'POST' : 'GET', agent: false, headers: { ...(content ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(content) } : {}), ...headers } }, response => {
      let text = ''; response.on('data', chunk => { text += chunk; }); response.on('end', () => resolve({ status: response.statusCode, body: JSON.parse(text) })); response.on('error', reject);
    });
    request.on('error', reject); request.end(content);
  });
}

test('HTTP rejects browser origins, hostile Host, oversize input and malformed schemas before inference', async t => {
  let launches = 0;
  const manager = fakeManager({ launch: async definition => { launches++; return { id: definition.id, alive: () => true, infer: async () => answer, close: async () => {} }; } });
  const service = await createDecisionService({ port: 0, manager }); t.after(() => service.close());
  assert.equal((await call(service.port, '/health')).body.model, null);
  assert.equal((await call(service.port, '/health', { headers: { Host: 'attacker.example' } })).status, 403);
  assert.equal((await call(service.port, '/v1/systemone', { payload: input(), headers: { Origin: 'http://127.0.0.1:39393' } })).status, 403);
  assert.equal((await call(service.port, '/v1/systemone', { payload: 'x'.repeat(65537) })).status, 413);
  assert.equal((await call(service.port, '/v1/systemone', { payload: '{}' })).status, 400);
  assert.equal((await call(service.port, '/v1/systemone', { payload: '{invalid' })).status, 400);
  assert.equal(launches, 0);
  const valid = await call(service.port, '/v1/systemone', { payload: input() });
  assert.equal(valid.status, 200); assert.equal(valid.body.model, 'convaiinnovations/laya-multilingual'); assert.equal(launches, 1);
});

test('internal HTTP never follows redirects or inherits a proxy', async t => {
  let redirected = 0;
  const target = http.createServer((_, response) => { redirected++; response.end('{}'); });
  await new Promise(resolve => target.listen(0, '127.0.0.1', resolve)); t.after(() => new Promise(resolve => target.close(resolve)));
  const redirect = http.createServer((_, response) => { response.writeHead(302, { Location: `http://127.0.0.1:${target.address().port}/health` }); response.end(); });
  await new Promise(resolve => redirect.listen(0, '127.0.0.1', resolve)); t.after(() => new Promise(resolve => redirect.close(resolve)));
  await assert.rejects(localJson(redirect.address().port, '/health'), error => error.status === 302);
  assert.equal(redirected, 0);
});

test('real macOS isolation allows loopback inbound but denies loopback and external outbound', { skip: process.platform !== 'darwin' }, async () => {
  const result = await verifyIsolation();
  assert.equal(result.isolation, 'macos-sandbox');
  assert.equal(result.offline, true);
  for (const code of Object.values(result.outbound)) assert.ok(['EPERM', 'EACCES'].includes(code));
  assert.equal(result.inbound, 'loopback-only');
});

test('isolated shutdown terminates both the launcher and inherited process-group descendants', { skip: process.platform !== 'darwin' }, async () => {
  const port = await assertPortFree(0);
  const code = 'const {spawn}=require("node:child_process");const child=spawn(process.execPath,["-e","setInterval(()=>{},1000)"],{stdio:"ignore"});console.log(child.pid);setInterval(()=>{},1000);';
  const child = spawnIsolated(process.execPath, ['-e', code], { port, env: await offlineEnvironment(), stdio: ['ignore', 'pipe', 'ignore'] });
  try {
    const descendant = await new Promise((resolve, reject) => { child.once('error', reject); child.stdout.once('data', chunk => resolve(Number(chunk.toString().trim()))); });
    assert.ok(Number.isInteger(descendant));
    await stopIsolated(child);
    assert.throws(() => process.kill(child.pid, 0), error => error.code === 'ESRCH');
    assert.throws(() => process.kill(descendant, 0), error => error.code === 'ESRCH');
  } finally { await stopIsolated(child); }
});
