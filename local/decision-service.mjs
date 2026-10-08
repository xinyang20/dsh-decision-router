import http from 'node:http';
import { access, mkdir, rm, writeFile } from 'node:fs/promises';
import { randomBytes, randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { projectRoot, assertLocalFile, assertPortFree, localJson, offlineEnvironment, spawnIsolated, stopIsolated, verifyIsolation } from './offline-runtime.mjs';

export const MODEL_DEFINITIONS = Object.freeze([
  { id: 'laya', label: 'Laya 多语言', responseModel: 'convaiinnovations/laya-multilingual', experimental: false, runtime: 'Laya 0.3.28', device: 'cpu', relativeFile: '.runtime/models/laya-multilingual/model.safetensors' },
  { id: 'd1-3b', label: 'd1 3B', responseModel: 'LiquidAI/d1-3B', experimental: false, runtime: 'llama.cpp', device: '自动选择本机设备', relativeFile: '.runtime/models/d1-3b/d1-3B-Q4_K_M.gguf' },
  { id: 'd1-omni-600m', label: 'd1 Omni 600M', responseModel: 'LiquidAI/d1-omni-600M', experimental: true, runtime: 'llama.cpp', device: '自动选择本机设备', relativeFile: '.runtime/models/d1-omni-600m/d1-omni-600M-Q8_0.gguf' },
]);

const fault = (status, code, message) => Object.assign(new Error(message), { status, code });
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const MAX_BYTES = 65536;

export function validateRequest(body) {
  if (!object(body) || Object.keys(body).some(key => !['model', 'state', 'questions'].includes(key))) throw fault(400, 'invalid-request', '请求仅支持模型、任务状态和执行档位问题。');
  const model = body.model === undefined || body.model === 'laya-local' ? 'laya' : body.model;
  if (!MODEL_DEFINITIONS.some(item => item.id === model)) throw fault(400, 'unknown-model', '请选择已支持的本地决策模型。');
  if (!(typeof body.state === 'string' || body.state !== null && typeof body.state === 'object') || JSON.stringify(body.state).length > 16000) throw fault(400, 'invalid-state', '任务状态无效或过长。');
  const question = body.questions?.executor;
  if (!object(body.questions) || Object.keys(body.questions).length !== 1 || !object(question) || question.type !== 'choice') throw fault(400, 'invalid-question', '仅支持执行档位的单选决策。');
  if (typeof question.instructions !== 'string' || !question.instructions.trim() || question.instructions.length > 4000) throw fault(400, 'invalid-instructions', '决策说明无效或过长。');
  if (!object(question.criteria)) throw fault(400, 'invalid-candidates', '请提供 2–6 个执行档位。');
  const entries = Object.entries(question.criteria);
  if (entries.length < 2 || entries.length > 6 || entries.some(([id, description]) => !/^[a-z][a-z0-9_-]{0,31}$/.test(id) || typeof description !== 'string' || !description.trim() || description.length > 2200)) throw fault(400, 'invalid-candidates', '档位标识或描述无效，请提供 2–6 个执行档位。');
  return { model, payload: { state: body.state, questions: { executor: { type: 'choice', instructions: question.instructions, criteria: Object.fromEntries(entries) } } } };
}

export function normalizeResponse(result, id, criteria, elapsedMs) {
  const answer = result?.answers?.executor;
  const ids = Object.keys(criteria);
  const probabilities = Array.isArray(answer?.probabilities) ? Object.fromEntries(ids.map((key, index) => [key, answer.probabilities[index]])) : answer?.probabilities;
  if (!answer || !ids.includes(answer.choice) || !object(probabilities) || Object.keys(probabilities).length !== ids.length || ids.some(key => !Number.isFinite(probabilities[key]) || probabilities[key] < 0 || probabilities[key] > 1)) throw fault(502, 'invalid-decision', '本地模型返回了无效的决策分布。');
  const values = ids.map(key => probabilities[key]);
  if (Math.abs(values.reduce((sum, value) => sum + value, 0) - 1) > 0.01 || probabilities[answer.choice] < Math.max(...values) - 1e-6 || Array.isArray(answer.probabilities) && answer.probabilities.length !== ids.length) throw fault(502, 'invalid-decision', '本地模型返回了无效的决策分布。');
  const confidence = Number.isFinite(answer.confidence) && answer.confidence >= 0 && answer.confidence <= 1 ? answer.confidence : Math.max(0, (probabilities[answer.choice] - 1 / ids.length) / (1 - 1 / ids.length));
  const usage = Object.fromEntries(['input_tokens', 'output_tokens'].filter(key => Number.isSafeInteger(result.usage?.[key]) && result.usage[key] >= 0).map(key => [key, result.usage[key]]));
  if (result.usage?.truncated === true) usage.truncated = true;
  return { model: MODEL_DEFINITIONS.find(item => item.id === id)?.responseModel ?? id, answers: { executor: { type: 'choice', choice: answer.choice, probabilities, confidence } }, elapsedMs, ...(Object.keys(usage).length ? { usage } : {}) };
}

async function installed(definition, root) {
  try {
    await assertLocalFile(path.join(root, definition.relativeFile), root);
    if (definition.id === 'laya') await access(path.join(root, '.venv/pyvenv.cfg'));
    else await assertLocalFile(path.join(root, '.runtime/llama-cpp/bin/llama-server'), root, true);
    return true;
  } catch { return false; }
}

export async function startBackend(definition, { root = projectRoot, ports = { laya: 39411, d1: 39412 }, signal } = {}) {
  const model = await assertLocalFile(path.join(root, definition.relativeFile), root);
  const port = ports[definition.id === 'laya' ? 'laya' : 'd1'];
  await assertPortFree(port);
  const env = await offlineEnvironment(root);
  const token = randomBytes(32).toString('base64url');
  const keyFile = path.join(root, '.runtime/offline-home', `internal-${randomUUID()}.key`);
  await mkdir(path.dirname(keyFile), { recursive: true });
  await writeFile(keyFile, token + '\n', { flag: 'wx', mode: 0o600 });
  let child;
  let closed = false;
  let exited = false;
  let failure;
  const close = async () => {
    if (closed) return;
    await stopIsolated(child);
    closed = true;
    await rm(keyFile, { force: true });
  };
  try {
    const command = definition.id === 'laya' ? 'uv' : await assertLocalFile(path.join(root, '.runtime/llama-cpp/bin/llama-server'), root, true);
    const args = definition.id === 'laya'
      ? ['run', '--locked', '--offline', 'local/server.py', '--port', String(port), '--token-file', keyFile]
      : ['-m', model, '--host', '127.0.0.1', '--port', String(port), '-c', '4096', '-b', '4096', '-ub', '4096', '--parallel', '1', '--offline', '--no-mmproj', '--no-webui', '--api-key-file', keyFile, '--log-disable'];
    child = spawnIsolated(command, args, { port, cwd: root, env });
    child.once('error', error => { failure = error; });
    child.once('exit', () => { exited = true; });
    const deadline = Date.now() + 90000;
    let ready = false;
    while (Date.now() < deadline) {
      signal?.throwIfAborted();
      if (failure || exited) throw fault(503, 'model-start-failed', '本地模型启动失败，请检查离线安装文件和运行环境。');
      try {
        const health = await localJson(port, '/health', { token, timeoutMs: 800, signal });
        ready = definition.id === 'laya' ? health.ready === true && health.offline === true : health.status === 'ok';
        if (ready) break;
      } catch { signal?.throwIfAborted(); }
      await delay(150, undefined, { signal });
    }
    if (!ready) throw fault(503, 'model-load-timeout', '本地模型加载超时，没有调用任何云端服务。');
    return {
      id: definition.id, device: definition.device, runtime: definition.runtime,
      alive: () => !exited && !failure && !closed,
      infer: (payload, requestSignal) => localJson(port, '/v1/systemone', { body: payload, token, timeoutMs: 90000, signal: requestSignal }),
      close,
    };
  } catch (error) { await close(); throw error; }
}

export class DecisionManager {
  constructor({ root = projectRoot, ports, launch = startBackend, inspect = installed, isolationCheck = verifyIsolation } = {}) {
    this.root = root; this.ports = ports; this.launch = launch; this.inspect = inspect; this.isolationCheck = isolationCheck;
    this.current = null; this.loading = null; this.queue = Promise.resolve(); this.pending = 0; this.closed = false; this.isolation = null;
    this.shutdown = new AbortController();
  }
  initialize() {
    this.initializing ??= (async () => {
      const isolation = await this.isolationCheck({ root: this.root, signal: this.shutdown.signal });
      this.shutdown.signal.throwIfAborted();
      if (isolation.isolation !== 'macos-sandbox' || isolation.offline !== true) throw fault(503, 'isolation-unavailable', '系统离线隔离不可用，拒绝启动模型服务。');
      this.isolation = isolation;
    })();
    return this.initializing;
  }
  async health() {
    const active = this.current?.alive() ? this.current : null;
    const models = await Promise.all(MODEL_DEFINITIONS.map(async definition => ({ id: definition.id, label: definition.label, experimental: definition.experimental, installed: await this.inspect(definition, this.root) })));
    return { ready: Boolean(this.isolation) && !this.closed, offline: this.isolation?.offline === true, service: 'dsh-local-decisions', model: active?.id ?? null, loading: this.loading, device: active?.device ?? null, runtime: active?.runtime ?? null, models, isolation: this.isolation?.isolation ?? null, queued: this.pending };
  }
  async stopCurrent() {
    if (!this.current) return;
    await this.current.close();
    this.current = null;
  }
  async ensure(id) {
    if (this.current?.id === id && this.current.alive()) return this.current;
    const definition = MODEL_DEFINITIONS.find(item => item.id === id);
    if (!await this.inspect(definition, this.root)) throw fault(503, 'model-not-installed', '所选本地决策模型尚未完整安装，没有调用任何云端服务。');
    this.loading = id;
    try {
      await this.stopCurrent();
      this.shutdown.signal.throwIfAborted();
      this.current = await this.launch(definition, { root: this.root, ports: this.ports, signal: this.shutdown.signal });
      return this.current;
    } finally { this.loading = null; }
  }
  decide(body, signal) {
    const { model, payload } = validateRequest(body);
    if (this.closed || !this.isolation) throw fault(503, 'service-not-ready', '离线决策服务尚未就绪。');
    if (this.pending >= 16) throw fault(429, 'queue-full', '本地决策队列已满，请稍后重试。');
    this.pending++;
    const operation = async () => {
      const began = performance.now();
      const combined = signal ? AbortSignal.any([signal, this.shutdown.signal]) : this.shutdown.signal;
      combined.throwIfAborted();
      // A disconnected first caller may leave a useful loaded worker; it never runs inference.
      const worker = await this.ensure(model);
      combined.throwIfAborted();
      try {
        const response = await worker.infer(payload, combined);
        return normalizeResponse(response, model, payload.questions.executor.criteria, Math.round(performance.now() - began));
      } catch (error) {
        // Canceling HTTP alone does not stop a CPU model's inference. Reap the worker
        // before releasing the serial queue, so no two model computations overlap.
        await this.stopCurrent();
        throw error;
      }
    };
    const pending = this.queue.then(operation).finally(() => { this.pending--; });
    this.queue = pending.catch(() => {});
    return pending;
  }
  async close() {
    this.closed = true;
    this.shutdown.abort();
    await this.initializing?.catch(() => {});
    await this.queue;
    await this.stopCurrent();
  }
}

function admit(req) {
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) throw fault(403, 'local-only', '仅允许本机请求。');
  if (!/^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(req.headers.host ?? '')) throw fault(403, 'untrusted-host', '请求主机不受信任。');
  if (req.headers.origin !== undefined || req.headers['sec-fetch-site'] === 'cross-site') throw fault(403, 'browser-access-disabled', '决策服务不接受浏览器直接请求。');
}

async function body(req) {
  if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') throw fault(415, 'invalid-content-type', '请使用 JSON 请求。');
  if (req.headers['content-encoding'] && req.headers['content-encoding'] !== 'identity') throw fault(415, 'unsupported-encoding', '不支持压缩请求。');
  if (Number(req.headers['content-length']) > MAX_BYTES) throw fault(413, 'request-too-large', '请求超过大小限制。');
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > MAX_BYTES) throw fault(413, 'request-too-large', '请求超过大小限制。'); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw fault(400, 'invalid-json', 'JSON 格式不正确。'); }
}

function reply(res, status, value) {
  if (res.destroyed) return;
  const payload = Buffer.from(JSON.stringify(value));
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': payload.length, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(payload);
}

export async function createDecisionService({ port = 39401, manager = new DecisionManager() } = {}) {
  await manager.initialize();
  const server = http.createServer(async (req, res) => {
    const controller = new AbortController();
    res.once('close', () => { if (!res.writableEnded) controller.abort(); });
    try {
      admit(req);
      if (req.method === 'GET' && req.url === '/health') return reply(res, 200, await manager.health());
      if (req.method !== 'POST' || req.url !== '/v1/systemone') throw fault(404, 'not-found', '接口不存在。');
      return reply(res, 200, await manager.decide(await body(req), controller.signal));
    } catch (error) {
      // Never reflect worker output, request text, URL values, or exception chains.
      reply(res, error.status >= 400 && error.status < 600 ? error.status : 503, { error: error.code ?? 'local-decision-failed', message: error.status ? error.message : '本地决策失败，请检查模型安装或稍后重试；没有调用云端服务。' });
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 5000;
  try { await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); }); }
  catch (error) { await manager.close(); throw error; }
  return { server, manager, port: server.address().port, async close() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await manager.close(); } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manager = new DecisionManager();
  let service;
  let stopping = false;
  // Register before initialization: Seatbelt verification itself owns a worker.
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
    if (stopping) return;
    stopping = true;
    if (service) await service.close(); else await manager.close();
    process.exit(0);
  });
  try {
    service = await createDecisionService({ manager });
    console.log(JSON.stringify({ url: `http://127.0.0.1:${service.port}`, ...(await service.manager.health()) }));
  } catch (error) { await manager.close(); if (!stopping) { console.error(error.status ? error.message : '离线决策服务启动失败，请检查系统隔离与本机端口。'); process.exitCode = 1; } }
}
