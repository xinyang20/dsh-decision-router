import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, open, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

// This is the only network-enabled installation step. Runtime inference uses local files.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const engineRoot = path.join(root, '.runtime/llama-cpp');
const release = {
  version: 'b11490',
  commit: '9c2e0e491a822adae1f0b1c831adb4160057d24f',
  source: 'https://github.com/ggml-org/llama.cpp/releases/tag/b11490',
  archive: 'llama-b11490-bin-macos-arm64.tar.gz',
  bytes: 12041307,
};
const models = [
  {
    id: 'd1-3b', repo: 'LiquidAI/d1-3B-GGUF',
    revision: 'bb1e436ea78eb96a3f1acb6da865f70c2fbeb563',
    filename: 'd1-3B-Q4_K_M.gguf', bytes: 1674456672, licenseBytes: 10574,
  },
  {
    id: 'd1-omni-600m', repo: 'LiquidAI/d1-omni-600M-GGUF',
    revision: '04397145ed8381350403aa556db0ec6a49dd8c07',
    filename: 'd1-omni-600M-Q8_0.gguf', bytes: 407207584, licenseBytes: 10572,
  },
];

if (process.platform !== 'darwin' || process.arch !== 'arm64') {
  throw new Error('此安装脚本固定使用官方 macOS Apple Silicon 构建；当前平台不适用。');
}
if (process.argv.length > 2) throw new Error('用法：pnpm exec node scripts/setup-d1.mjs');

const env = {
  ...process.env,
  LLAMA_CACHE: path.join(engineRoot, 'cache'),
  XDG_CACHE_HOME: path.join(engineRoot, 'cache'),
  TMPDIR: path.join(engineRoot, 'tmp'),
  HF_HUB_DISABLE_TELEMETRY: '1',
  DO_NOT_TRACK: '1',
};
await Promise.all([engineRoot, env.LLAMA_CACHE, env.TMPDIR].map(p => mkdir(p, { recursive: true })));

function run(command, args, capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, env, stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit' });
    let output = '';
    if (capture) {
      child.stdout.on('data', chunk => { output += chunk; });
      child.stderr.on('data', chunk => { output += chunk; });
    }
    child.on('error', reject);
    child.on('exit', (code, signal) => code === 0
      ? resolve(output)
      : reject(new Error(`${command} 退出：${signal ?? code}${capture ? `\n${output}` : ''}`)));
  });
}

async function size(filename) {
  try { return (await stat(filename)).size; } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function checkGguf(filename) {
  const handle = await open(filename, 'r');
  try {
    const magic = Buffer.alloc(4);
    await handle.read(magic, 0, magic.length, 0);
    if (magic.toString('ascii') !== 'GGUF') throw new Error(`文件不是 GGUF：${filename}`);
  } finally { await handle.close(); }
}

async function download(url, destination, bytes, gguf = false) {
  await mkdir(path.dirname(destination), { recursive: true });
  if (await size(destination) === bytes) {
    if (gguf) await checkGguf(destination);
    console.log(`已准备：${path.relative(root, destination)}`);
    return;
  }
  const partial = `${destination}.part`;
  if ((await size(partial) ?? 0) > bytes) await rm(partial);
  if (await size(partial) !== bytes) {
    console.log(`下载：${path.basename(destination)}（${(bytes / 1e6).toFixed(1)} MB）`);
    await run('curl', ['--fail', '--location', '--silent', '--show-error', '--retry', '4',
      '--retry-delay', '2', '--connect-timeout', '30', '--max-time', '7200',
      '--continue-at', '-', '--output', partial, url]);
  }
  const received = await size(partial);
  if (received !== bytes) throw new Error(`下载长度不符：${destination}，预期 ${bytes}，实际 ${received}`);
  if (gguf) await checkGguf(partial);
  await rename(partial, destination);
  console.log(`完成：${path.relative(root, destination)}`);
}

async function writeJson(filename, value) {
  const partial = `${filename}.part`;
  await writeFile(partial, `${JSON.stringify(value, null, 2)}\n`);
  await rename(partial, filename);
}

async function installEngine() {
  const binary = path.join(engineRoot, 'bin/llama-server');
  const metadataPath = path.join(engineRoot, 'installation.json');
  let metadata;
  try { metadata = JSON.parse(await readFile(metadataPath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (await size(binary) !== null) {
    if (metadata?.version !== release.version) throw new Error('已有其他 llama.cpp 安装，请先确认版本，脚本不会覆盖它。');
  } else {
    const archive = path.join(engineRoot, 'downloads', release.archive);
    const source = `https://github.com/ggml-org/llama.cpp/releases/download/${release.version}/${release.archive}`;
    await download(source, archive, release.bytes);
    const entries = (await run('tar', ['-tzf', archive], true)).trim().split('\n');
    if (entries.some(entry => !entry.startsWith(`llama-${release.version}/`) || entry.split('/').includes('..'))) {
      throw new Error('发布包目录结构不符合预期。');
    }
    const staging = path.join(engineRoot, `.extract-${release.version}`);
    await rm(staging, { recursive: true, force: true });
    await mkdir(staging);
    await run('tar', ['-xzf', archive, '-C', staging]);
    const payload = path.join(staging, `llama-${release.version}`);
    if (!await size(path.join(payload, 'llama-server'))) throw new Error('发布包缺少 llama-server。');
    await rename(payload, path.join(engineRoot, 'bin'));
    await rm(staging, { recursive: true, force: true });
    await writeJson(metadataPath, {
      ...release, platform: 'darwin', architecture: 'arm64',
      binary: path.relative(root, binary),
      license: '.runtime/llama-cpp/bin/LICENSE',
      downloadedFrom: source,
    });
  }
  const version = await run(binary, ['--version'], true);
  if (!version.includes(release.commit.slice(0, 7))) throw new Error(`llama.cpp 版本与固定构建不符：${version}`);
  console.log(`llama.cpp ${release.version} 已准备：${binary}`);
}

async function installModel(model) {
  const directory = path.join(root, '.runtime/models', model.id);
  const base = `https://huggingface.co/${model.repo}/resolve/${model.revision}`;
  await download(`${base}/${model.filename}`, path.join(directory, model.filename), model.bytes, true);
  await download(`${base}/LICENSE`, path.join(directory, 'LICENSE'), model.licenseBytes);
  await writeJson(path.join(directory, 'installation.json'), {
    id: model.id, repo: model.repo, revision: model.revision,
    filename: model.filename, bytes: model.bytes,
    source: `https://huggingface.co/${model.repo}/tree/${model.revision}`,
    downloadedFrom: `${base}/${model.filename}`,
    license: 'LICENSE', licenseSource: `${base}/LICENSE`,
    modalities: ['text'], projectorInstalled: false,
  });
}

await installEngine();
const installations = await Promise.allSettled(models.map(installModel));
const failures = installations.filter(result => result.status === 'rejected');
if (failures.length) throw new AggregateError(failures.map(result => result.reason), '部分下载未完成；重新运行本命令可继续下载。');
console.log('两款 d1 决策模型已准备完成。后续推理只读取本机文件，无需联网。');
