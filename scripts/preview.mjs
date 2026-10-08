import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, symlink, realpath, lstat, readlink, unlink } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { root, localEnvironment } from './environment.mjs';
import { localRequest } from '../src/decision.js';

await import('./build.mjs');
const env = { ...localEnvironment(), DSH_TELEMETRY: '0' };
const profile = path.join(env.DSH_HOME, 'profiles/web');
const packageName = 'dsh-decision-router';
await mkdir(path.join(profile, 'node_modules'), { recursive: true });
async function link(source, target) {
  try { await symlink(source, target, process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) { if (error.code !== 'EEXIST' || await realpath(target) !== await realpath(source)) throw error; }
}
async function removeManagedLink(name, source) {
  const target = path.join(profile, 'node_modules', name);
  try {
    if (!(await lstat(target)).isSymbolicLink()) return;
    const linked = path.resolve(path.dirname(target), await readlink(target));
    if (linked === path.resolve(source)) await unlink(target);
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
let previousProfile = {};
try { previousProfile = JSON.parse(await readFile(path.join(profile, 'package.json'), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const dependencies = { ...previousProfile.dependencies };
const retired = new Set(['dsh-auto-router-local']);
await removeManagedLink('dsh-auto-router-local', root);
delete dependencies['dsh-auto-router-local'];
// The old generated preview included an unrelated sibling resource plugin.
// Retire only that managed reference and link; never touch its data directory.
if (previousProfile.name === 'dsh-auto-router-preview') {
  const source = dependencies['dsh-project-space'];
  if (typeof source === 'string' && source.startsWith('file:')) {
    await removeManagedLink('dsh-project-space', path.resolve(profile, source.slice(5)));
    delete dependencies['dsh-project-space'];
    retired.add('dsh-project-space');
  }
}
await link(root, path.join(profile, 'node_modules', packageName));
const bundles = [...new Set([...(previousProfile.dsh?.profile?.bundles ?? []).filter(name => !retired.has(name)), '@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', packageName])];
await writeFile(path.join(profile, 'package.json'), JSON.stringify({ ...previousProfile, name: 'dsh-decision-router-preview', private: true, dependencies: { ...dependencies, [packageName]: `file:${root}` }, dsh: { ...previousProfile.dsh, profile: { ...previousProfile.dsh?.profile, bundles } } }, null, 2) + '\n');
const config = JSON.parse(await readFile(path.join(root, 'config/local.json'), 'utf8'));
// JSON is valid YAML; all generated configuration stays in this plugin's isolated DSH home.
const patch = [
  { id: packageName, config: { ...config, modelsFile: path.join(root, '.runtime/model-tiers.json') } },
  { id: 'agent-default-model', config: { provider: 'local-fixture', model: 'standard' } },
  { id: 'session-title-llm', disabled: true },
  { id: 'session-telemetry-otel', disabled: true },
  { id: 'desktop-product-telemetry', disabled: true },
  { id: 'workspace-controller', config: { documentsDirectory: path.join(root, '.runtime/documents') } },
  { id: 'tools', config: { mode: 'native' } },
  { insert: [{ id: 'auto-router-preview-fixture', name: path.join(root, 'local/fixture.mjs') }] },
];
const overlay = path.join(root, '.runtime/preview.patch.yml');
await writeFile(overlay, JSON.stringify(patch, null, 2) + '\n');

const port = 39393;
await new Promise((resolve, reject) => {
  const check = net.createServer();
  check.once('error', () => reject(new Error(`端口 ${port} 已被占用，请先检查已有的本地 DSH 进程。`)));
  check.listen(port, '127.0.0.1', () => check.close(resolve));
});
const children = [];
let closing = false;
function stop() { if (closing) return; closing = true; for (const child of children) child.kill('SIGTERM'); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
function launch(name, args) {
  const child = spawn(process.execPath, args, { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  children.push(child);
  const output = createWriteStream(path.join(root, `.runtime/${name}.log`), { mode: 0o600 });
  child.stdout.pipe(output, { end: false });
  child.stderr.pipe(output, { end: false });
  let buffered = '';
  child.stdout.on('data', chunk => {
    buffered += chunk.toString();
    const lines = buffered.split('\n'); buffered = lines.pop();
    for (const line of lines) {
      const login = line.match(/http:\/\/127\.0\.0\.1:39393\/\?token=[^\s\u001b]+/)?.[0];
      if (login) void writeFile(path.join(root, '.runtime/preview-url.txt'), login + '\n', { mode: 0o600 }).then(() => console.log('DSH 已启动：http://127.0.0.1:39393/ （本地登录链接已写入 .runtime/preview-url.txt）'));
    }
  });
  child.on('error', error => { console.error(`${name}: ${error.message}`); process.exitCode = 1; stop(); });
  child.on('exit', (code, signal) => { output.end(); if (!closing) { console.error(`${name} exited (${code ?? signal}); see .runtime/${name}.log`); process.exitCode = code ?? 1; stop(); } });
  return child;
}

try {
  let ready = false;
  async function checkDecisionService() {
    const { status, body: health } = await localRequest('http://127.0.0.1:39401/health', { signal: AbortSignal.timeout(1000) });
    if (status !== 200 || health.service !== 'dsh-local-decisions' || health.isolation !== 'macos-sandbox') throw new Error('决策端口上运行的不是受隔离保护的本地决策服务。');
    return health.ready === true && health.offline === true;
  }
  if (process.platform === 'darwin') {
    try { ready = await checkDecisionService(); } catch (error) { if (error.code !== 'ECONNREFUSED') throw error; }
    if (!ready) {
      launch('decisions', ['local/decision-service.mjs']);
      for (let count = 0; count < 45 && !ready && !closing; count++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        try { ready = await checkDecisionService(); } catch {}
      }
      if (!ready) throw new Error('macOS 本地决策服务未能启动，请检查 sandbox-exec 是否可用及 .runtime/decisions.log。');
    }
  } else {
    console.warn('当前系统不支持已验证的 macOS 离线隔离，已跳过本地决策服务。Web 预览仍可配置云端决策；本地决策不可用时会使用回退档位。预览执行端是测试替身。');
  }
  if (!closing) {
    console.log(ready ? '离线决策管理服务已就绪，模型将在首次使用时加载。正在挂载 DSH Web 插件…' : '正在挂载 DSH Web 插件，本地决策服务未启用…');
    launch('dsh-preview', ['scripts/dsh.mjs', '--profile', 'web', '--patch', overlay, '--no-open', '--port', String(port)]);
  }
} catch (error) { console.error(error.message); process.exitCode = 1; stop(); }
