import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { root } from './environment.mjs';
import { createHarness } from '../tests/harness.mjs';

const prompt = process.argv.slice(2).join(' ').trim();
if (!prompt) {
  console.error('用法：pnpm run try "要交给 DSH 的任务"。先在另一终端运行 pnpm run laya:serve。');
  process.exitCode = 1;
} else {
  const config = JSON.parse(await readFile(path.join(root, 'config/local.json'), 'utf8'));
  const host = await createHarness(config, { toolStep: true });
  try {
    const agent = await host.createAgent();
    const calls = await host.turn(agent, prompt);
    console.log('本地试用：真实 DSH + 离线 Laya。执行端是确定性测试替身，不会完成用户任务。');
    console.log(JSON.stringify({
      prompt,
      dshVersion: host.version,
      decision: host.ctx.autoModelRouter.receipts().at(-1),
      actualExecutorRequests: calls.map(call => ({ model: call.model, effort: call.effort })),
      toolResults: host.toolResults,
    }, null, 2));
  } finally {
    await host.close();
  }
}
