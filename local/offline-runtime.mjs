import { spawn } from 'node:child_process';
import { access, mkdir, realpath, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = '/usr/bin/sandbox-exec';
const profile = fileURLToPath(new URL('./offline-model.sb', import.meta.url));

// An allowlist intentionally excludes API keys, proxy settings, NODE_OPTIONS,
// PYTHONPATH, HF_TOKEN, and all LLAMA_ARG_* runtime/download/RPC overrides.
export async function offlineEnvironment(root = projectRoot, inherited = process.env) {
  const home = path.join(root, '.runtime/offline-home');
  const tmp = path.join(root, '.cache/offline-tmp');
  const cache = path.join(root, '.cache');
  for (const directory of [home, tmp, cache]) await mkdir(directory, { recursive: true });
  return {
    PATH: inherited.PATH || '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin',
    ...(inherited.HOME ? { HOME: inherited.HOME } : {}), TMPDIR: tmp, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8',
    UV_CACHE_DIR: path.join(cache, 'uv'), UV_PYTHON_PREFERENCE: 'only-managed', UV_OFFLINE: '1',
    HF_HOME: path.join(cache, 'huggingface'), XDG_CACHE_HOME: path.join(cache, 'xdg'),
    HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1', HF_HUB_DISABLE_TELEMETRY: '1',
    HF_HUB_DISABLE_IMPLICIT_TOKEN: '1', DO_NOT_TRACK: '1', USE_TF: '0',
    PYTHONNOUSERSITE: '1', PYTHONDONTWRITEBYTECODE: '1', PYTHONUNBUFFERED: '1',
  };
}

export async function assertLocalFile(file, root = projectRoot, executable = false) {
  if (!path.isAbsolute(file)) throw new Error('模型和运行程序必须使用本地绝对路径。');
  const resolved = await realpath(file);
  const allowed = await realpath(root);
  if (!resolved.startsWith(allowed + path.sep) || !(await stat(resolved)).isFile()) throw new Error('模型和运行程序必须位于本项目目录中。');
  await access(resolved, executable ? constants.X_OK : constants.R_OK);
  return resolved;
}

export async function assertPortFree(port) {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  const selected = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return selected;
}

export function spawnIsolated(command, args, { port, cwd = projectRoot, env, stdio = ['ignore', 'ignore', 'ignore'] } = {}) {
  if (process.platform !== 'darwin') throw new Error('当前离线隔离需要 macOS sandbox-exec，不能在缺少系统隔离时启动模型。');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('模型内部监听端口无效。');
  return spawn(sandbox, ['-D', `MODEL_PORT=${port}`, '-f', profile, command, ...args], { cwd, env, detached: true, stdio });
}

function groupExists(child) {
  if (!child.pid) return false;
  try { process.kill(-child.pid, 0); return true; }
  catch (error) { if (error.code === 'ESRCH') return false; throw error; }
}

export async function stopIsolated(child) {
  if (!child?.pid || !groupExists(child)) return;
  const signal = name => { try { process.kill(-child.pid, name); } catch (error) { if (error.code !== 'ESRCH') throw error; } };
  signal('SIGTERM');
  const deadline = Date.now() + 5000;
  while (groupExists(child) && Date.now() < deadline) await delay(30);
  if (groupExists(child)) signal('SIGKILL');
  const killedDeadline = Date.now() + 3000;
  while (groupExists(child) && Date.now() < killedDeadline) await delay(30);
  if (groupExists(child)) throw new Error('旧模型进程尚未退出，已停止切换模型。');
}

// Use node:http with agent:false, never fetch/global proxy configuration.
// The destination is generated from a numeric local port and cannot redirect.
export function localJson(port, pathname, { body, timeoutMs = 1500, signal, token, maxBytes = 65536 } = {}) {
  if (!Number.isInteger(port) || port < 1 || port > 65535 || !['/health', '/v1/systemone'].includes(pathname)) throw new Error('内部请求目标无效。');
  const payload = body === undefined ? undefined : Buffer.from(JSON.stringify(body));
  return new Promise((resolve, reject) => {
    const request = http.request({ hostname: '127.0.0.1', port, path: pathname, method: payload ? 'POST' : 'GET', agent: false, signal,
      headers: { ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': payload.length } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } }, response => {
      if (response.statusCode < 200 || response.statusCode >= 300) { response.resume(); reject(Object.assign(new Error('本地模型服务请求失败。'), { status: response.statusCode })); return; }
      const chunks = []; let size = 0;
      response.on('data', chunk => {
        size += chunk.length;
        if (size > maxBytes) { request.destroy(new Error('本地模型响应超过大小限制。')); return; }
        chunks.push(chunk);
      });
      response.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new Error('本地模型返回了无效响应。')); } });
      response.on('error', reject);
    });
    request.once('error', reject);
    request.setTimeout(timeoutMs, () => request.destroy(new Error('本地模型请求超时。')));
    request.end(payload);
  });
}

const probeCode = String.raw`
const net = require('node:net');
const [port, canary] = process.argv.slice(1).map(Number);
// A killed launcher must not leave this short-lived probe listening forever.
setTimeout(() => process.exit(3), 7000).unref();
function attempt(host, port) {
  return new Promise(resolve => {
    const socket = net.createConnection({host, port});
    const finish = result => { socket.destroy(); resolve(result); };
    socket.once('connect', () => finish('CONNECTED'));
    socket.once('error', error => finish(error.code));
    socket.setTimeout(1500, () => finish('TIMEOUT'));
  });
}
const server = net.createServer(socket => socket.end('loopback-inbound-ok'));
server.once('error', () => process.exit(2));
server.listen(port, '127.0.0.1', async () => {
  const loopback = await attempt('127.0.0.1', canary);
  const external = await attempt('192.0.2.1', 443);
  process.stdout.write(JSON.stringify({loopback, external})+'\n');
});
`;

export async function verifyIsolation({ root = projectRoot, signal } = {}) {
  signal?.throwIfAborted();
  if (process.platform !== 'darwin') throw new Error('系统不支持已验证的离线模型隔离，拒绝启动服务。');
  await access(sandbox, constants.X_OK);
  const port = await assertPortFree(0);
  let accepted = 0;
  const canary = net.createServer(socket => { accepted++; socket.destroy(); });
  let child;
  try {
    await new Promise((resolve, reject) => { canary.once('error', reject); canary.listen(0, '127.0.0.1', resolve); });
    const env = await offlineEnvironment(root);
    signal?.throwIfAborted();
    child = spawnIsolated(process.execPath, ['-e', probeCode, String(port), String(canary.address().port)], { port, cwd: root, env, stdio: ['ignore', 'pipe', 'ignore'] });
    const result = await new Promise((resolve, reject) => {
      let output = '';
      const timer = setTimeout(() => reject(new Error('系统隔离验证超时，拒绝声明离线就绪。')), 5000);
      const onAbort = () => { clearTimeout(timer); reject(signal.reason); };
      const settle = callback => value => { clearTimeout(timer); signal?.removeEventListener('abort', onAbort); callback(value); };
      signal?.addEventListener('abort', onAbort, { once: true });
      if (signal?.aborted) return onAbort();
      child.once('error', settle(reject));
      child.once('exit', settle(() => reject(new Error('系统隔离探针无法启动。'))));
      child.stdout.on('data', chunk => {
        output += chunk.toString();
        if (output.length > 4096) return settle(reject)(new Error('系统隔离探针响应无效。'));
        if (output.includes('\n')) { try { settle(resolve)(JSON.parse(output.split('\n')[0])); } catch { settle(reject)(new Error('系统隔离探针响应无效。')); } }
      });
    });
    signal?.throwIfAborted();
    if (!['EPERM', 'EACCES'].includes(result.loopback) || !['EPERM', 'EACCES'].includes(result.external) || accepted !== 0) throw new Error('系统未能禁止模型主动联网，拒绝启动服务。');
    const incoming = await new Promise((resolve, reject) => {
      const socket = net.createConnection({ host: '127.0.0.1', port });
      let data = '';
      socket.on('data', chunk => { data += chunk; });
      socket.once('end', () => resolve(data));
      socket.once('error', reject);
      socket.setTimeout(1500, () => socket.destroy(new Error('本机入站隔离验证超时。')));
    });
    if (incoming !== 'loopback-inbound-ok') throw new Error('系统隔离未允许预期的本机入站连接。');
    return { isolation: 'macos-sandbox', offline: true, outbound: result, inbound: 'loopback-only' };
  } finally {
    await stopIsolated(child);
    if (canary.listening) await new Promise(resolve => canary.close(resolve));
  }
}
