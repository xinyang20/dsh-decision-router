import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { root, runtimeRoot } from './environment.mjs';

const require = createRequire(path.join(runtimeRoot, 'package.json'));
const { build } = require('esbuild');
const result = await build({ entryPoints: [path.join(root, 'src/client/index.jsx')], bundle: true, platform: 'browser', format: 'cjs', target: 'es2022', external: ['react', 'react-dom', '@deepseek-ai/dsh-client-ui-primitives'], write: false });
await mkdir(path.join(root, 'lib'), { recursive: true });
await writeFile(path.join(root, 'lib/client.js'), `window.__ModuleLoader__.load({id:"dsh-decision-router",factory:(require)=>{const module={exports:{}};const exports=module.exports;\n${result.outputFiles[0].text}\nreturn module.exports;}});\n`);
console.log('Built the DSH Auto Router browser plugin using the project-local esbuild.');
