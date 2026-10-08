import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { root, runtimeRoot } from './environment.mjs';
import { createHarness } from '../tests/harness.mjs';
import { localEndpoint } from '../src/decision.js';

const config = JSON.parse(await readFile(path.join(root,'config/local.json'),'utf8'));
const cases = JSON.parse(await readFile(path.join(root,'tests/routing-cases.json'),'utf8'));
const response = await fetch(new URL('/health',localEndpoint(config.endpoint)),{signal:AbortSignal.timeout(5000),redirect:'error'});
assert.ok(response.ok,'Start the local server with pnpm run laya:serve first.');
const health = await response.json();
assert.equal(health.offline,true);
const host = await createHarness(config,{toolStep:true});
const rows = [];
try {
  for (const item of cases) {
    const agent = await host.createAgent();
    const calls = await host.turn(agent,item.prompt);
    const decision = host.ctx.autoModelRouter.receipts().at(-1);
    assert.equal(decision.sessionId,agent.id);
    assert.equal(decision.backendModel,'convaiinnovations/laya-multilingual','Evaluation requires a real Laya decision, not service-error fallback.');
    assert.equal(calls.length,2,'The real DSH loop must complete a tool call and then a second executor request.');
    assert.ok(calls.every(call => call.model === decision.applied.model && call.effort === decision.applied.reasoningEffort));
    rows.push({...item,decisionChoice:decision.decisionChoice,applied:decision.applied.model,reason:decision.reason,confidence:decision.confidence,probabilities:decision.probabilities,elapsedMs:decision.elapsedMs,executorRequests:calls.length});
    console.log(`${item.id}: expected=${item.expected}, laya=${decision.decisionChoice}, applied=${decision.applied.model}, confidence=${decision.confidence.toFixed(3)}, ${decision.elapsedMs}ms`);
  }
  const latencies = rows.map(row=>row.elapsedMs).sort((a,b)=>a-b);
  const stats = {
    cases: rows.length,
    labelAgreement: rows.filter(row=>row.decisionChoice===row.expected).length,
    appliedLabelAgreement: rows.filter(row=>row.applied===row.expected).length,
    lowConfidenceFallbacks: rows.filter(row=>row.reason==='low-confidence').length,
    decisionDistribution: Object.fromEntries(config.candidates.map(c=>[c.id,rows.filter(row=>row.decisionChoice===c.id).length])),
    appliedDistribution: Object.fromEntries(config.candidates.map(c=>[c.id,rows.filter(row=>row.applied===c.model).length])),
    latencyMs: {min:latencies[0],p50:latencies[Math.ceil(latencies.length*.5)-1],p95:latencies[Math.ceil(latencies.length*.95)-1],max:latencies.at(-1)},
    actualExecutorRequests:host.calls.length,
    completedToolCalls:host.toolResults.length,
  };
  const report = {generatedAt:new Date().toISOString(),dshVersion:host.version,runtimeRoot,health,system:{platform:os.platform(),arch:os.arch(),cpu:os.cpus()[0]?.model,node:process.version},config,methodology:'18 hand-authored routing examples, not a held-out benchmark. Expected labels express the configured task taxonomy, not measured execution quality. Independent DSH agent per case; deterministic executor fixture performs one real DSH tool call per case. Existing running Laya process; model load time reported separately. No cloud inference or paid executor calls.',paidCalls:0,executorBackend:'local deterministic fixture, not a generative model',stats,rows};
  await mkdir(path.join(root,'reports'),{recursive:true});
  await writeFile(path.join(root,'reports/laya-evaluation.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(stats,null,2));
} finally { await host.close(); }
