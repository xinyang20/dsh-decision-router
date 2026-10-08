import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runtimeRoot } from './environment.mjs';

export const dshVersion = '0.2.0-rc.2';
const projectRequire = createRequire(path.join(runtimeRoot, 'package.json'));
let runtimeResolvers;

async function resolvers() {
  if (!runtimeResolvers) {
    runtimeResolvers = (async () => {
      let manifestFile;
      try { manifestFile = projectRequire.resolve('@deepseek-ai/dsh/package.json'); }
      catch (cause) { throw new Error('未找到项目内 DSH，请先运行 pnpm install。', { cause }); }
      const dsh = JSON.parse(await readFile(manifestFile, 'utf8'));
      if (dsh.version !== dshVersion) throw new Error(`需要项目内 DSH ${dshVersion}，当前为 ${dsh.version}。`);
      const dshRequire = createRequire(manifestFile);
      const baseRequire = createRequire(dshRequire.resolve('@deepseek-ai/dsh-base/package.json'));
      // Follow declared dependencies instead of depending on pnpm's store
      // layout or assuming only one peer-resolved package instance exists.
      return [baseRequire, dshRequire, projectRequire];
    })();
  }
  return runtimeResolvers;
}

export async function installedPackage(name) {
  for (const resolve of await resolvers()) {
    let manifestFile;
    try { manifestFile = resolve.resolve(`${name}/package.json`); }
    catch (error) {
      if (['MODULE_NOT_FOUND', 'ERR_PACKAGE_PATH_NOT_EXPORTED'].includes(error.code)) continue;
      throw error;
    }
    const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
    const expected = name === '@deepseek-ai/cordis' ? '4.0.4' : dshVersion;
    if (manifest.version !== expected) throw new Error(`需要 ${name} ${expected}，当前为 ${manifest.version}。`);
    return { directory: path.dirname(manifestFile), manifest, resolve };
  }
  throw new Error(`项目内 DSH 未提供 ${name}，请检查 pnpm install 是否完成。`);
}
export async function importDsh(name) {
  const { resolve } = await installedPackage(name);
  return import(pathToFileURL(resolve.resolve(name)).href);
}
