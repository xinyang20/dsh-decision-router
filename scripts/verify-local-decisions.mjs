import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { root } from './environment.mjs';
import { LocalDecisionClient, localRequest } from '../src/decision.js';
import { createHarness } from '../tests/harness.mjs';

const config = JSON.parse(await readFile(path.join(root, 'config/local.json'), 'utf8'));
const healthUrl = new URL('/health', config.endpoint);
const health = (await localRequest(healthUrl, { signal: AbortSignal.timeout(3000) })).body;
assert.equal(health.service, 'dsh-local-decisions');
assert.equal(health.offline, true);
assert.equal(health.isolation, 'macos-sandbox');
const tasks = [
  { id: 'format', prompt: '把 hello world 转成大写，只输出结果。' },
  { id: 'coding', prompt: '写一个 TypeScript 函数，移除数组中重复的字符串，保留原顺序。' },
  { id: 'reasoning', prompt: '分析分布式支付在网络分区和重试情况下如何避免重复扣款，给出恢复协议与一致性取舍。' },
];
const backendNames = { laya: 'convaiinnovations/laya-multilingual', 'd1-3b': 'LiquidAI/d1-3B', 'd1-omni-600m': 'LiquidAI/d1-omni-600M' };
const backends = [];
for (const decisionModel of Object.keys(backendNames)) {
  assert.ok(health.models.some(model => model.id === decisionModel && model.installed), `${decisionModel} 权重未安装`);
  const client = new LocalDecisionClient({ ...config, timeoutMs: 60000, decisionModel });
  const began = performance.now();
  const initial = await client.choose({ request: '你好', recent: [], nonText: false }, config.candidates);
  assert.equal(initial.backendModel, backendNames[decisionModel]);
  const loadAndFirstRequestMs = Math.round(performance.now() - began);
  const host = await createHarness({ ...config, decisionModel, timeoutMs: 30000 }, { toolStep: true });
  const rows = [];
  try {
    const agent = await host.createAgent();
    for (const task of tasks) {
      const calls = await host.turn(agent, task.prompt);
      const receipt = host.ctx.autoModelRouter.receipts().at(-1);
      assert.equal(receipt?.backendModel, backendNames[decisionModel], '必须是实际模型决策，不能以服务故障回退冒充成功');
      assert.equal(calls.length, 2);
      assert.ok(calls.every(call => call.model === receipt.applied.model && call.effort === receipt.applied.reasoningEffort));
      assert.equal(Object.keys(receipt.probabilities).length, 3);
      rows.push({ id: task.id, receipt, executorRequests: calls.length });
      console.log(`${decisionModel} / ${task.id}: 建议 ${receipt.decisionChoice}，执行 ${receipt.applied.model}，${receipt.elapsedMs} 毫秒`);
    }
    assert.equal(host.ctx.autoModelRouter.receipts().length, tasks.length, '一轮含工具步骤也只路由一次');
    host.selectModel(agent, { provider: 'local-fixture', model: 'standard', reasoningEffort: 'low' });
    const manual = await host.turn(agent, '手动选择后保持当前模型。');
    assert.ok(manual.every(call => call.model === 'standard' && call.effort === 'low'));
    assert.equal(host.ctx.autoModelRouter.receipts().length, tasks.length);
    const routes = [
      { id: 'frontend', description: '专门处理 React 页面、交互设计、无障碍表单。' },
      { id: 'backend', description: '专门处理后端 API、SQL 迁移、数据库事务。' },
    ];
    const unordered = await client.choose({ request: '为 React 登录表单添加键盘导航和错误提示。', recent: [], nonText: false }, routes);
    assert.deepEqual(Object.keys(unordered.probabilities).sort(), ['backend', 'frontend']);
    backends.push({ id: decisionModel, loadAndFirstRequestMs, healthAfter: (await localRequest(healthUrl)).body, rows, unordered, manualBypass: true });
  } finally { await host.close(); }
}
// Restore the default model in memory after the test; saved user settings are never edited.
await new LocalDecisionClient({ ...config, timeoutMs: 60000, decisionModel: 'laya' }).choose({ request: '你好', recent: [], nonText: false }, config.candidates);
const report = { generatedAt: new Date().toISOString(), system: { platform: os.platform(), arch: os.arch(), node: process.version },
  complete: true, health, backends,
  methodology: '真实本地决策权重，模型子进程禁止主动网络连接；项目内 DSH 的真实代理与工具循环，执行端是确定性本地测试替身。中文任务仅用于接口与集成验证，不是独立质量评测。首次调用包含模型切换及加载，后续时延为本机端到端值。没有云端决策或付费执行调用。',
};
await mkdir(path.join(root, 'reports'), { recursive: true });
await writeFile(path.join(root, 'reports/local-decisions-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log('3 个本地决策模型均通过真实 DSH 路由验证；已恢复 Laya，用户设置未改动。');
