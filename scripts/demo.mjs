import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { root, runtimeRoot } from './environment.mjs';
import { createHarness } from '../tests/harness.mjs';
import { decisionServer, choice } from '../tests/decision-server.mjs';

const config = JSON.parse(await readFile(path.join(root, 'config/local.json'), 'utf8'));
const live = process.argv.includes('--laya');
const server = live ? null : await decisionServer((_,n) => choice(n === 1 ? 'fast' : 'strong'));
const host = await createHarness({...config, ...(server ? {endpoint:server.endpoint} : {})}, {toolStep:true});
try {
  const agent = await host.createAgent();
  for (const prompt of ['把标题 hello world 转成大写。','设计一个多区域分布式事务协议，分析并发故障和一致性。']) {
    const calls = await host.turn(agent,prompt);
    assert.equal(calls.length,2);
    assert.equal(calls[0].model,calls[1].model);
    console.log(JSON.stringify({prompt,actualRequests:calls.map(c=>({model:c.model,effort:c.effort})),decision:host.ctx.autoModelRouter.receipts().at(-1)},null,2));
  }
  const report = {generatedAt:new Date().toISOString(),dshVersion:host.version,runtimeRoot,decisionBackend:live?'local-laya':'deterministic-protocol-fixture',executorBackend:'local deterministic fixture, not a generative model',paidCalls:0,actualRequests:host.calls.map(c=>({model:c.model,effort:c.effort})),toolResults:host.toolResults,receipts:host.ctx.autoModelRouter.receipts()};
  await mkdir(path.join(root,'reports'),{recursive:true});
  await writeFile(path.join(root,'reports',live?'laya-demo.json':'integration-demo.json'),JSON.stringify(report,null,2)+'\n');
} finally { await host.close(); await server?.close(); }
