import { spawn } from 'node:child_process';
import { root, localEnvironment } from './environment.mjs';

const child = spawn('uv', process.argv.slice(2), { cwd: root, env: localEnvironment(), stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
