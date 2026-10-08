import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const runtimeRoot = path.resolve(root, process.env.DSH_RUNTIME_ROOT ?? '.');
export function localEnvironment() {
  const env = { ...process.env,
    DSH_HOME: path.join(root, '.runtime/dsh-home'),
    UV_CACHE_DIR: path.join(root, '.cache/uv'),
    UV_PYTHON_PREFERENCE: 'only-managed',
    HF_HOME: path.join(root, '.cache/huggingface'),
    HF_HUB_DISABLE_TELEMETRY: '1',
    DO_NOT_TRACK: '1',
    XDG_CACHE_HOME: path.join(root, '.cache/xdg'),
    TMPDIR: path.join(root, '.cache/tmp'),
  };
  for (const key of ['DSH_HOME', 'UV_CACHE_DIR', 'HF_HOME', 'XDG_CACHE_HOME', 'TMPDIR']) mkdirSync(env[key], { recursive: true });
  return env;
}
