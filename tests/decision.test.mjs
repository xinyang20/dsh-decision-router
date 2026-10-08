import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { CloudDecisionClient, LocalDecisionClient, localEndpoint, parseChoice } from '../src/decision.js';
import { selectConfig } from '../src/router.js';
import { decisionServer, choice } from './decision-server.mjs';

const candidates = ['fast','standard','strong'].map(id => ({id,description:id}));
test('only literal loopback endpoints are accepted', () => {
  for (const url of ['https://api.typesafe.ai/v1/systemone','http://localhost:39401','http://127.0.0.1.evil.test','http://127.0.0.1@evil.test','file:///tmp/a']) assert.throws(() => localEndpoint(url));
  assert.equal(localEndpoint('http://127.0.0.1:39401/v1/systemone'), 'http://127.0.0.1:39401/v1/systemone');
});
test('redirect responses are rejected without following the destination', async t => {
  let destinationRequests = 0;
  const server = createServer((request, response) => {
    if (request.url === '/destination') { destinationRequests++; response.end('{}'); return; }
    response.writeHead(302, { Location: '/destination' });
    response.end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const client = new LocalDecisionClient({endpoint:`http://127.0.0.1:${server.address().port}/decision`});
  await assert.rejects(client.choose({request:'hello'},candidates), {code:'decision-unavailable'});
  assert.equal(destinationRequests,0);
});
test('choice confidence is computed from a valid complete probability distribution', () => {
  const body = choice('fast', {fast:0.6,standard:0.3,strong:0.1}); body.answers.executor.confidence = 0.99;
  assert.ok(Math.abs(parseChoice(body,candidates).confidence-0.4)<1e-10);
  for (const probabilities of [{fast:1}, {fast:1,standard:1,strong:1}, {fast:-1,standard:1,strong:1}, {fast:0.1,standard:0.1,strong:0.8}, [0.8,0.1,0.1,0]]) assert.throws(() => parseChoice(choice('fast',probabilities), candidates));
});
test('oversized state and model-reported truncation trigger fallback instead of silent classification', async t => {
  const server = await decisionServer(() => ({...choice('fast'),usage:{truncated:true}})); t.after(() => server.close());
  const client = new LocalDecisionClient({endpoint:server.endpoint,maxStateChars:128});
  await assert.rejects(client.choose({request:'a'.repeat(200)},candidates), {code:'state-too-long'});
  assert.equal(server.requests.length,0);
  await assert.rejects(client.choose({request:'hello'},candidates), {code:'decision-input-truncated'});
});
test('a model switch clears unsupported inherited effort and preserves unrelated call options', () => {
  assert.deepEqual(selectConfig({provider:'a',model:'a',reasoningEffort:'high',maxTokens:500}, {provider:'b',model:'b'}), {provider:'b',model:'b',maxTokens:500});
});

test('decision backend selection is explicit and unknown or cloud models are rejected before dispatch', async t => {
  const server = await decisionServer(() => choice('fast')); t.after(() => server.close());
  const client = new LocalDecisionClient({ endpoint: server.endpoint });
  for (const model of ['laya', 'd1-3b', 'd1-omni-600m']) await client.choose({ request: '本地选模' }, candidates, undefined, model);
  assert.deepEqual(server.requests.map(request => request.model), ['laya', 'd1-3b', 'd1-omni-600m']);
  for (const model of ['d1', 'cloud', 'systemone-api', 'https://example.com/model']) await assert.rejects(client.choose({ request: '不会发送' }, candidates, undefined, model));
  assert.throws(() => new LocalDecisionClient({ decisionModel: 'systemone-api' }));
  assert.equal(server.requests.length, 3);
});

test('decision transport bypasses a process-wide fetch dispatcher', async t => {
  const server = await decisionServer(() => choice('fast')); t.after(() => server.close());
  const client = new LocalDecisionClient({ endpoint: server.endpoint });
  const original = globalThis.fetch;
  let intercepted = 0;
  globalThis.fetch = () => { intercepted++; throw new Error('proxy dispatcher must not receive decision data'); };
  try { assert.equal((await client.choose({ request: '本机任务' }, candidates)).choice, 'fast'); }
  finally { globalThis.fetch = original; }
  assert.equal(intercepted, 0);
  assert.equal(server.requests.length, 1);
});

const cloudConfig = () => ({
  endpoint: 'https://api.typesafe.ai/v1/systemone', model: 'jev-latest', apiKey: 'test-only-no-real-key',
  consent: { version: 1, endpoint: 'https://api.typesafe.ai/v1/systemone', model: 'jev-latest' },
});

// Replace the HTTPS primitive in-process: these tests never open an external socket.
function secureFixture(t, { status = 200, raw = JSON.stringify(choice('fast')) } = {}) {
  const calls = [];
  t.mock.method(https, 'request', (url, options, callback) => {
    const call = { url: url.href, options }; calls.push(call);
    const request = new EventEmitter();
    request.end = payload => {
      call.payload = payload;
      queueMicrotask(() => {
        const response = new PassThrough();
        response.statusCode = status;
        response.headers = { location: 'https://unconfirmed.example/v1/systemone' };
        callback(response);
        response.end(raw);
      });
    };
    return request;
  });
  return calls;
}

test('cloud decisions require current consent and credentials before any dispatch', async () => {
  let calls = 0;
  const client = new CloudDecisionClient({}, { request: async () => { calls++; return { status: 200, body: choice('fast') }; } });
  const valid = cloudConfig();
  for (const config of [undefined, {}, { ...valid, consent: undefined }, { ...valid, apiKey: '' },
    { ...valid, consent: { ...valid.consent, version: 0 } },
    { ...valid, endpoint: 'https://other.example/v1/systemone' },
    { ...valid, model: 'jev-preview' },
    { ...valid, endpoint: 'http://api.typesafe.ai/v1/systemone', consent: { ...valid.consent, endpoint: 'http://api.typesafe.ai/v1/systemone' } }]) {
    await assert.rejects(client.choose({ request: '不会发送' }, candidates, undefined, config));
  }
  assert.equal(calls, 0);
  await client.choose({ request: '已确认' }, candidates, undefined, valid);
  assert.equal(calls, 1);
  valid.consent = undefined;
  await assert.rejects(client.choose({ request: '已撤销确认' }, candidates, undefined, valid));
  assert.equal(calls, 1);
});

test('confirmed cloud transport uses HTTPS and sends only the bounded typed decision request', async t => {
  const calls = secureFixture(t, { raw: JSON.stringify({ ...choice('fast'), model: 'jev-1.13.0', usage: { output_tokens: 34 } }) });
  const config = cloudConfig();
  const state = { request: '整理字段', recent: ['上一轮说明'], nonText: false };
  const routes = candidates.map(candidate => ({ ...candidate, extraDescription: '附加用途' }));
  const result = await new CloudDecisionClient().choose(state, routes, undefined, config);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, config.endpoint);
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.agent, false);
  assert.equal(calls[0].options.rejectUnauthorized, true);
  assert.equal(calls[0].options.headers.Authorization, `Bearer ${config.apiKey}`);
  const payload = JSON.parse(calls[0].payload);
  assert.deepEqual(Object.keys(payload).sort(), ['model', 'questions', 'state']);
  assert.equal(payload.model, config.model);
  assert.deepEqual(payload.state, state);
  assert.equal(payload.questions.executor.type, 'choice');
  assert.deepEqual(Object.keys(payload.questions.executor.criteria), ['fast', 'standard', 'strong']);
  assert.match(payload.questions.executor.criteria.fast, /附加用途/);
  assert.ok(!calls[0].payload.includes(config.apiKey));
  assert.equal(result.backendModel, 'jev-1.13.0');
  assert.equal(result.decisionLocation, 'cloud');
  assert.equal(result.choice, 'fast');
});

test('cloud HTTP authentication failures and redirects never retry or follow another endpoint', async t => {
  for (const status of [401, 403, 302, 307, 429, 529]) {
    await t.test(`HTTP ${status}`, async t => {
      const calls = secureFixture(t, { status, raw: 'untrusted error containing a private task' });
      await assert.rejects(new CloudDecisionClient().choose({ request: '任务' }, candidates, undefined, cloudConfig()),
        { code: [401, 403].includes(status) ? 'decision-auth-error' : 'decision-http-error' });
      assert.equal(calls.length, 1);
    });
  }
});

test('cloud responses are bounded and malformed distributions cannot become successful routes', async t => {
  for (const [label, raw, code] of [
    ['too large', ' '.repeat(65537), 'decision-response-too-large'],
    ['invalid JSON', '<html>private error</html>', 'decision-unavailable'],
    ['invalid probabilities', JSON.stringify(choice('fast', { fast: 1, standard: 1, strong: 1 })), 'invalid-probabilities'],
    ['truncated input', JSON.stringify({ ...choice('fast'), usage: { truncated: true } }), 'decision-input-truncated'],
  ]) {
    await t.test(label, async t => {
      secureFixture(t, { raw });
      await assert.rejects(new CloudDecisionClient().choose({ request: '任务' }, candidates, undefined, cloudConfig()), { code });
    });
  }
});

test('cloud transport honors total timeout and caller cancellation without another attempt', async () => {
  let calls = 0;
  const request = (_endpoint, { signal }) => new Promise((resolve, reject) => {
    calls++;
    const timer = setTimeout(() => resolve({ status: 200, body: choice('fast') }), 1000);
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
  const client = new CloudDecisionClient({ timeoutMs: 30 }, { request });
  await assert.rejects(client.choose({ request: '任务' }, candidates, undefined, cloudConfig()), { code: 'decision-timeout' });
  assert.equal(calls, 1);
  const controller = new AbortController();
  const reason = new Error('caller canceled');
  const pending = client.choose({ request: '取消任务' }, candidates, controller.signal, cloudConfig());
  controller.abort(reason);
  await assert.rejects(pending, error => error === reason);
  assert.equal(calls, 2);
  await assert.rejects(client.choose({ request: '已取消' }, candidates, controller.signal, cloudConfig()), error => error === reason);
  assert.equal(calls, 2);
});

test('cloud request limits apply before dispatch and transport errors cannot reflect secrets', async () => {
  let calls = 0;
  const client = new CloudDecisionClient({ maxStateChars: 128 }, { request: async () => { calls++; throw new Error('test-only-no-real-key private-task'); } });
  await assert.rejects(client.choose({ request: 'a'.repeat(200) }, candidates, undefined, cloudConfig()), { code: 'state-too-long' });
  assert.equal(calls, 0);
  await assert.rejects(client.choose({ request: 'private-task' }, candidates, undefined, cloudConfig()), error => {
    assert.equal(error.code, 'decision-unavailable');
    assert.doesNotMatch(error.message, /test-only-no-real-key|private-task/);
    assert.equal(error.cause, undefined);
    return true;
  });
  assert.equal(calls, 1);
});

test('cloud responses without a model identifier retain the explicitly configured model', async () => {
  const body = choice('fast'); delete body.model;
  const client = new CloudDecisionClient({}, { request: async () => ({ status: 200, body }) });
  const result = await client.choose({ request: '任务' }, candidates, undefined, cloudConfig());
  assert.equal(result.backendModel, 'jev-latest');
});
