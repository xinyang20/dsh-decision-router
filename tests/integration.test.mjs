import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { createHarness } from './harness.mjs';
import { decisionServer, choice } from './decision-server.mjs';
import { AUTO_PROVIDER, AUTO_MODEL } from '../src/auto-model.js';
import { CLOUD_DECISION_MODEL } from '../src/cloud-config.js';

const config = JSON.parse(await readFile(new URL('../config/local.json', import.meta.url), 'utf8'));
const automatic = { provider: AUTO_PROVIDER, model: AUTO_MODEL };
const lastTurnEnd = agent => agent.session.snapshotEvents().findLast(event => event.type === 'turn/end').data.reason;

const confirmedCloud = () => ({
  endpoint: 'https://api.typesafe.ai/v1/systemone', model: 'jev-latest', apiKey: 'fixture-key-never-sent',
  consent: { version: 1, endpoint: 'https://api.typesafe.ai/v1/systemone', model: 'jev-latest' },
});

// Only the remote socket primitive is replaced; routing still goes through the
// project-local DSH agent loop, saved preferences and the production cloud client.
function cloudDecisions(t, { status = 200, answer = { ...choice('standard'), model: 'jev-protocol-fixture' } } = {}) {
  const requests = [];
  t.mock.method(https, 'request', (_url, _options, callback) => {
    const request = new EventEmitter();
    request.end = payload => {
      requests.push(JSON.parse(payload));
      queueMicrotask(() => {
        const response = new PassThrough();
        response.statusCode = status;
        callback(response);
        response.end(JSON.stringify(answer));
      });
    };
    return request;
  });
  return requests;
}

test('saved cloud decisions run only for native auto; local failures never switch to the saved cloud service', async t => {
  const remote = cloudDecisions(t);
  const local = await decisionServer((_, count) => count === 1 ? choice('fast') : null); t.after(() => local.close());
  const host = await createHarness({ ...config, endpoint: local.endpoint }, { toolStep: true }); t.after(() => host.close());
  const control = host.ctx.autoModelRouter;
  const automaticAgent = await host.createAgent();
  const manualAgent = await host.createAgent({ provider: 'local-fixture', model: 'strong', reasoningEffort: 'medium' });
  assert.deepEqual((await host.turn(automaticAgent, '默认在本机决策。')).map(call => call.model), ['fast', 'fast']);
  assert.equal(local.requests.length, 1);
  assert.equal(remote.length, 0);
  assert.equal(control.receipts().at(-1).decisionLocation, 'local');

  await control.models.save({ ...control.models.snapshot(), decisionModel: CLOUD_DECISION_MODEL, cloudDecision: confirmedCloud() });
  assert.equal(remote.length, 0, '保存云配置本身不会发送任务');
  assert.deepEqual((await host.turn(manualAgent, '仍然使用我手选的执行模型。')).map(call => [call.model, call.effort]), [['strong', 'medium'], ['strong', 'medium']]);
  assert.equal(remote.length, 0);
  assert.equal(local.requests.length, 1);
  assert.equal(control.receipts().length, 1);

  assert.deepEqual((await host.turn(automaticAgent, '明确开启的云端决策。')).map(call => [call.model, call.effort]), [['standard', 'medium'], ['standard', 'medium']]);
  assert.equal(remote.length, 1, '一次云决策覆盖整轮工具交互');
  assert.equal(local.requests.length, 1);
  assert.equal(remote[0].model, 'jev-latest');
  assert.equal(control.receipts().at(-1).decisionLocation, 'cloud');
  assert.equal(control.receipts().at(-1).backendModel, 'jev-protocol-fixture');

  await control.models.save({ ...control.models.snapshot(), decisionModel: 'laya' });
  assert.deepEqual((await host.turn(automaticAgent, '本地服务故障也不要切换到云端。')).map(call => call.model), ['strong', 'strong']);
  assert.equal(local.requests.length, 2);
  assert.equal(remote.length, 1, '保留云配置不等于授权本地失败时自动使用云端');
  assert.equal(control.receipts().at(-1).reason, 'decision-http-error');
  assert.equal(control.receipts().at(-1).decisionLocation, 'local');
});

test('cloud authentication failure uses the execution fallback without invoking another decision backend', async t => {
  const remote = cloudDecisions(t, { status: 401, answer: { error: 'fixture-key-never-sent should not be reflected' } });
  const local = await decisionServer(() => choice('fast')); t.after(() => local.close());
  const host = await createHarness({ ...config, endpoint: local.endpoint }, { toolStep: true }); t.after(() => host.close());
  const control = host.ctx.autoModelRouter;
  await control.models.save({ ...control.models.snapshot(), decisionModel: CLOUD_DECISION_MODEL, cloudDecision: confirmedCloud() });
  const calls = await host.turn(await host.createAgent(), '认证失败后使用配置的执行回退档位。');
  assert.deepEqual(calls.map(call => [call.model, call.effort]), [['strong', 'high'], ['strong', 'high']]);
  assert.equal(remote.length, 1);
  assert.equal(local.requests.length, 0);
  const receipt = control.receipts().at(-1);
  assert.equal(receipt.reason, 'decision-auth-error');
  assert.equal(receipt.decisionLocation, 'cloud');
  assert.equal(receipt.backendModel, null, '失败响应不能伪装成实际模型决策成功');
  assert.doesNotMatch(JSON.stringify(receipt), /fixture-key-never-sent/);
});

test('a concrete native model bypasses decisions and sidebar pins while preserving its effort', async t => {
  const server = await decisionServer(() => choice('strong')); t.after(() => server.close());
  const host = await createHarness({ ...config, endpoint: server.endpoint }, { toolStep: true }); t.after(() => host.close());
  const manual = { provider: 'local-fixture', model: 'fast', reasoningEffort: 'high' };
  const agent = await host.createAgent(manual);
  host.ctx.autoModelRouter.setMode(agent, 'auto');
  host.ctx.autoModelRouter.pin(agent, 'strong');
  assert.deepEqual((await host.turn(agent, 'Keep my selected model.')).map(call => [call.provider, call.model, call.effort]), [['local-fixture', 'fast', 'high'], ['local-fixture', 'fast', 'high']]);
  host.selectModel(agent, { provider: 'local-fixture', model: 'standard' });
  assert.deepEqual((await host.turn(agent, 'Use provider default effort.')).map(call => [call.provider, call.model, call.effort]), [['local-fixture', 'standard', undefined], ['local-fixture', 'standard', undefined]]);
  assert.equal(server.requests.length, 0);
  assert.equal(host.ctx.autoModelRouter.receipts().length, 0);
});

test('native auto to manual to auto changes apply across successive turns', async t => {
  const server = await decisionServer((_, n) => choice(n === 1 ? 'fast' : 'strong')); t.after(() => server.close());
  const host = await createHarness({ ...config, endpoint: server.endpoint }); t.after(() => host.close());
  const agent = await host.createAgent();
  assert.equal((await host.turn(agent, 'First automatic request.'))[0].model, 'fast');
  host.selectModel(agent, { provider: 'local-fixture', model: 'standard', reasoningEffort: 'low' });
  assert.deepEqual((await host.turn(agent, 'Manual request.')).map(call => [call.model, call.effort]), [['standard', 'low']]);
  assert.equal(server.requests.length, 1);
  assert.equal(host.ctx.autoModelRouter.receipts().length, 1);
  host.selectModel(agent, automatic);
  assert.equal((await host.turn(agent, 'Second automatic request.'))[0].model, 'strong');
  assert.equal(server.requests.length, 2);
  assert.equal(host.ctx.autoModelRouter.receipts().length, 2);
  assert.deepEqual(agent.session.snapshotEvents().filter(event => event.type === 'model/selection').map(event => event.data.model), ['auto', 'standard', 'auto']);
});

test('a concrete native selection made during a tool step takes priority on the next request', async t => {
  const server = await decisionServer(() => choice('fast')); t.after(() => server.close());
  let switched = false;
  const host = await createHarness({ ...config, endpoint: server.endpoint }, { toolStep: true, onTool: () => {
    switched = true;
    host.selectModel(agent, { provider: 'local-fixture', model: 'standard', reasoningEffort: 'high' });
  } }); t.after(() => host.close());
  const agent = await host.createAgent();
  assert.deepEqual((await host.turn(agent, 'Switch after the local tool.')).map(call => [call.model, call.effort]), [['fast', 'low'], ['standard', 'high']]);
  assert.equal(switched, true);
  assert.equal(server.requests.length, 1);
  assert.equal(host.ctx.autoModelRouter.receipts().length, 1);
});

test('project-local DSH switches actual requests and holds one route through a real tool step', async t => {
  const server = await decisionServer((_,n) => choice(n === 1 ? 'fast' : 'strong'));
  t.after(() => server.close());
  const host = await createHarness({ ...config, endpoint: server.endpoint }, { toolStep: true });
  t.after(() => host.close());
  const agent = await host.createAgent();
  const first = await host.turn(agent, 'Convert this label to uppercase.');
  assert.deepEqual(first.map(call => [call.model,call.effort]), [['fast','low'],['fast','low']]);
  assert.deepEqual(host.toolResults, [5]);
  const toolCall = first[1].messages.flatMap(message => message.content).find(block => block.type === 'tool-call');
  assert.equal(typeof toolCall.arguments, 'string', 'DSH token projections require raw JSON argument strings.');
  assert.deepEqual(JSON.parse(toolCall.arguments), { a: 2, b: 3 });
  const second = await host.turn(agent, 'Design a distributed transaction protocol.');
  assert.deepEqual(second.map(call => [call.model,call.effort]), [['strong','high'],['strong','high']]);
  assert.equal(server.requests.length, 2);
  assert.equal(host.ctx.autoModelRouter.receipts().length, 2);
  assert.equal(first[0].messages.filter(m => m.source.kind === 'user')[0].content[0].text, 'Convert this label to uppercase.');
});

test('low confidence, HTTP failure and an invalid choice all use the configured fallback', async t => {
  const answers = [choice('fast', { fast: 0.36, standard: 0.34, strong: 0.30 }), null, choice('not-configured')];
  const server = await decisionServer((_,n) => answers[n-1]); t.after(() => server.close());
  const host = await createHarness({ ...config, endpoint: server.endpoint }); t.after(() => host.close());
  const agent = await host.createAgent();
  for (let i=0; i<answers.length; i++) assert.equal((await host.turn(agent, `request ${i}`))[0].model, 'strong');
  assert.deepEqual(host.ctx.autoModelRouter.receipts().map(r => r.reason), ['low-confidence','decision-http-error','invalid-choice']);
});

test('a slow decision falls back without blocking the DSH turn', async t => {
  const server = await decisionServer(async () => { await new Promise(resolve => setTimeout(resolve, 120)); return choice('fast'); }); t.after(() => server.close());
  const host = await createHarness({ ...config, endpoint: server.endpoint, timeoutMs: 20 }); t.after(() => host.close());
  const agent = await host.createAgent();
  assert.equal((await host.turn(agent, 'hello'))[0].model, 'strong');
  assert.equal(host.ctx.autoModelRouter.receipts()[0].reason, 'decision-timeout');
});

test('shadow mode suggests a route but executes the fallback; off mode skips decisions and executes the fallback', async t => {
  const server = await decisionServer(() => choice('fast')); t.after(() => server.close());
  const host = await createHarness({ ...config, endpoint: server.endpoint, mode: 'shadow' }); t.after(() => host.close());
  const agent = await host.createAgent();
  assert.deepEqual((await host.turn(agent, 'architecture')).map(call => [call.model, call.effort]), [['strong', 'high']]);
  assert.equal(host.ctx.autoModelRouter.receipts()[0].proposed, 'fast');
  assert.equal(host.ctx.autoModelRouter.receipts()[0].applied.model, 'strong');
  host.ctx.autoModelRouter.setMode(agent, 'off');
  assert.deepEqual((await host.turn(agent, 'hello')).map(call => [call.model, call.effort]), [['strong', 'high']]);
  assert.equal(server.requests.length, 1);
  assert.equal(host.ctx.autoModelRouter.receipts().length, 1);
});

test('manual pins and route state are isolated between concurrent DSH agents', async t => {
  const server = await decisionServer(() => choice('strong')); t.after(() => server.close());
  const host = await createHarness({ ...config, endpoint: server.endpoint }); t.after(() => host.close());
  const a = await host.createAgent(); const b = await host.createAgent();
  host.ctx.autoModelRouter.pin(a, 'fast');
  const [ra,rb] = await Promise.all([host.turn(a, 'manual task'), host.turn(b, 'automatic task')]);
  assert.equal(ra[0].model, 'fast'); assert.equal(rb[0].model, 'strong');
  assert.equal(server.requests.length, 1);
  host.ctx.autoModelRouter.pin(a, null);
  assert.equal((await host.turn(a, 'next task'))[0].model, 'strong');
  assert.equal(server.requests[0].state.recent.length, 0);
  assert.deepEqual(server.requests[1].state.recent, ['manual task']);
});

test('saving an explicit global mode preference clears every session override and respects concrete native selections', async t => {
  const server = await decisionServer(() => choice('standard')); t.after(() => server.close());
  const host = await createHarness({ ...config, endpoint: server.endpoint }); t.after(() => host.close());
  const control = host.ctx.autoModelRouter;
  const a = await host.createAgent();
  const b = await host.createAgent();
  const manual = await host.createAgent({ provider: 'local-fixture', model: 'fast', reasoningEffort: 'high' });
  control.setMode(a, 'off'); control.pin(a, 'fast');
  control.setMode(b, 'shadow'); control.pin(b, 'strong');
  control.setMode(manual, 'off'); control.pin(manual, 'strong');
  // An explicit save also removes overrides when the global value stays the same.
  await control.models.preferences({ revision: control.models.snapshot().revision, mode: 'auto' });
  for (const agent of [a, b, manual]) {
    assert.equal(control.snapshot(agent).mode, 'auto');
    assert.equal(control.snapshot(agent).pin, null);
  }
  assert.equal((await host.turn(a, 'Use the global strategy.'))[0].model, 'standard');
  assert.equal((await host.turn(b, 'Use the same global strategy.'))[0].model, 'standard');
  assert.deepEqual((await host.turn(manual, 'Keep my native model.')).map(call => [call.model, call.effort]), [['fast', 'high']]);
  assert.equal(server.requests.length, 2);
});

test('sidebar-only preferences, legacy saves without mode and rejected saves preserve session overrides', async t => {
  const server = await decisionServer(() => choice('standard')); t.after(() => server.close());
  const host = await createHarness({ ...config, endpoint: server.endpoint }); t.after(() => host.close());
  const control = host.ctx.autoModelRouter;
  const agent = await host.createAgent();
  control.setMode(agent, 'auto'); control.pin(agent, 'fast');
  const before = control.snapshot(agent);
  await control.models.preferences({ revision: control.models.snapshot().revision, sidebarEnabled: false });
  assert.deepEqual(control.snapshot(agent), before);
  await assert.rejects(control.models.preferences({ revision: -1, mode: 'off' }), { status: 409 });
  assert.deepEqual(control.snapshot(agent), before);
  const { mode: _mode, ...legacyPayload } = control.models.snapshot();
  await control.models.save({ ...legacyPayload, sidebarEnabled: true });
  assert.deepEqual(control.snapshot(agent), before);
  await assert.rejects(control.models.save({ ...control.models.snapshot(), mode: 'off', revision: -1 }), { status: 409 });
  assert.deepEqual(control.snapshot(agent), before);
  await assert.rejects(control.models.save({ ...control.models.snapshot(), mode: 'invalid' }), { status: 400 });
  assert.deepEqual(control.snapshot(agent), before);
  assert.equal((await host.turn(agent, 'Still use my compatibility pin.'))[0].model, 'fast');
  assert.equal(server.requests.length, 0);
});

test('a failed persistent global-mode save leaves all session overrides active', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'dsh-global-mode-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const host = await createHarness({ ...config, modelsFile: path.join(root, 'blocked', 'routes.json') }); t.after(() => host.close());
  const control = host.ctx.autoModelRouter;
  const agent = await host.createAgent();
  control.setMode(agent, 'off'); control.pin(agent, 'fast');
  const before = control.snapshot(agent);
  const settings = control.models.snapshot();
  await writeFile(path.join(root, 'blocked'), 'not a directory');
  await assert.rejects(control.models.save({ ...settings, mode: 'shadow' }), { status: 500 });
  assert.deepEqual(control.snapshot(agent), before);
  assert.deepEqual(control.models.snapshot(), settings);
});

test('a global-mode save during a pending decision affects the next turn without changing the current mode or executor', async t => {
  let reached, release;
  const reachedPromise = new Promise(resolve => { reached = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  const server = await decisionServer(async () => { reached(); await gate; return choice('fast'); }); t.after(() => server.close());
  const host = await createHarness({ ...config, endpoint: server.endpoint }, { toolStep: true }); t.after(() => host.close());
  const agent = await host.createAgent();
  const control = host.ctx.autoModelRouter;
  const first = host.turn(agent, 'Preserve this in-flight automatic decision.');
  await reachedPromise;
  await control.models.save({ ...control.models.snapshot(), mode: 'off' });
  assert.equal(control.snapshot(agent).mode, 'off');
  release();
  assert.deepEqual((await first).map(call => call.model), ['fast', 'fast']);
  assert.equal(control.receipts()[0].mode, 'auto');
  assert.deepEqual((await host.turn(agent, 'Use the newly saved global pause.')).map(call => call.model), ['strong', 'strong']);
  assert.equal(server.requests.length, 1);
});

test('clearing a session pin between tool steps does not replace its already cached executor', async t => {
  let reached, release;
  let hold = true;
  const reachedPromise = new Promise(resolve => { reached = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  const host = await createHarness(config, { toolStep: true }); t.after(() => host.close());
  const agent = await host.createAgent();
  const control = host.ctx.autoModelRouter;
  control.setMode(agent, 'auto'); control.pin(agent, 'fast');
  host.ctx.on('agent/pre-step', async ({ step }, next) => {
    const result = await next();
    if (step === 2 && hold) { hold = false; reached(); await gate; }
    return result;
  });
  const first = host.turn(agent, 'Keep the pin for this tool loop.');
  await reachedPromise;
  await control.models.save({ ...control.models.snapshot(), mode: 'off' });
  assert.equal(control.snapshot(agent).pin, null);
  release();
  assert.deepEqual((await first).map(call => call.model), ['fast', 'fast']);
  assert.deepEqual((await host.turn(agent, 'Use the global mode next turn.')).map(call => call.model), ['strong', 'strong']);
  assert.equal(control.receipts()[0].reason, 'manual-pin');
});

test('an unavailable candidate is excluded, and an unavailable fallback stops auto before executor dispatch', async t => {
  const server = await decisionServer(body => ({ model: 'fixture', answers: { executor: { choice: 'strong', probabilities: Object.fromEntries(Object.keys(body.questions.executor.criteria).map(id => [id,id === 'strong' ? 0.99 : 0.01])) } } })); t.after(() => server.close());
  const host = await createHarness({ ...config, endpoint: server.endpoint }, { unavailable: ['fast'] }); t.after(() => host.close());
  assert.equal((await host.turn(await host.createAgent(), 'task'))[0].model, 'strong');
  assert.deepEqual(Object.keys(server.requests[0].questions.executor.criteria), ['standard','strong']);
  const other = await createHarness({ ...config, endpoint: server.endpoint }, { unavailable: ['strong'] }); t.after(() => other.close());
  const agent = await other.createAgent();
  assert.deepEqual(await other.turn(agent, 'task'), []);
  const failure = lastTurnEnd(agent);
  assert.equal(failure.kind, 'error');
  assert.match(failure.error.message, /回退模型不可用|自动选模没有可用的执行模型/);
  assert.equal(other.calls.length, 0);
  assert.equal(server.requests.length, 1);
});

test('canceling a pending decision never starts an executor request', async t => {
  let received;
  const receivedPromise = new Promise(resolve => { received = resolve; });
  const server = await decisionServer(async () => { received(); await new Promise(resolve => setTimeout(resolve, 120)); return choice('fast'); }); t.after(() => server.close());
  const host = await createHarness({ ...config, endpoint: server.endpoint }); t.after(() => host.close());
  const agent = await host.createAgent();
  const turn = host.turn(agent, 'cancel this');
  await receivedPromise;
  agent.cancel({kind:'interrupted'});
  await turn;
  assert.equal(host.calls.length, 0);
});

test('changing the decision backend takes effect next turn and keeps the in-flight turn stable', async t => {
  let received, release;
  const firstReceived = new Promise(resolve => { received = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  const server = await decisionServer(async (body, count) => {
    if (count === 1) { received(); await gate; }
    return choice(body.model === 'laya' ? 'fast' : 'standard');
  });
  t.after(() => server.close());
  const host = await createHarness({ ...config, endpoint: server.endpoint, decisionModel: 'laya' }, { toolStep: true });
  t.after(() => host.close());
  const agent = await host.createAgent();
  const first = host.turn(agent, '第一轮');
  await firstReceived;
  await host.ctx.autoModelRouter.models.save({ ...host.ctx.autoModelRouter.models.snapshot(), decisionModel: 'd1-3b' });
  release();
  assert.deepEqual((await first).map(call => call.model), ['fast', 'fast']);
  assert.deepEqual((await host.turn(agent, '第二轮')).map(call => call.model), ['standard', 'standard']);
  assert.deepEqual(server.requests.map(body => body.model), ['laya', 'd1-3b']);
  assert.equal(host.ctx.autoModelRouter.receipts().length, 2);
});
