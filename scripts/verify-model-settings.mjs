import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { root } from './environment.mjs';
await mkdir(path.join(root, 'reports'), { recursive: true });

const base = 'http://127.0.0.1:39393';
const API = base + '/dsh-auto-router/api';
const login = (await readFile(path.join(root, '.runtime/preview-url.txt'), 'utf8')).trim();
assert.equal(new URL(login).origin, base);
const authentication = await fetch(login, { redirect: 'manual' });
const cookie = authentication.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
assert.ok(cookie);
const request = (route, data, headers = {}) => fetch(API + route, { ...(data === undefined ? {} : { method: 'POST', body: JSON.stringify(data) }), headers: { Cookie: cookie, 'Content-Type': 'application/json', ...headers } });
async function json(route, data) { const response = await request(route, data); const result = await response.json(); assert.ok(response.ok, result.message); return result; }
const checks = [];
function pass(name) { checks.push(name); console.log(`通过：${name}`); }
const original = await json('/models');
const state = await json('/state');
const expectedBackend = { laya: 'convaiinnovations/laya-multilingual', 'd1-3b': 'LiquidAI/d1-3B', 'd1-omni-600m': 'LiquidAI/d1-omni-600M' }[state.modelSettings.decisionModel ?? 'laya'];
assert.ok(expectedBackend);
const sessionId = state.preview.sessionId;
const originalSession = state.sessions.find(item => item.id === sessionId);
assert.equal(originalSession?.autoSelected, true, '请先在体验对话的原生模型选择器中选择“自动”，再运行模型设置验证。');
assert.equal((await fetch(API + '/models')).status, 401);
assert.equal((await request('/models', original, { Origin: 'https://example.invalid' })).status, 403);
assert.ok(original.providers.find(provider => provider.id === 'local-fixture').models.every(model => model.efforts.some(effort => effort.id === 'high')));
pass('模型设置复用 DSH 鉴权和受支持的推理强度目录');
let current = original;
try {
  const frontend = { id: 'frontend', label: '前端界面', provider: 'local-fixture', model: 'standard', reasoningEffort: 'high', description: '前端界面设计和 React 组件开发。', extraDescription: '优先处理无障碍表单和视觉优化；后端数据库任务应交给后端档位。' };
  const backend = { id: 'backend', label: '后端开发', provider: 'local-fixture', model: 'strong', reasoningEffort: 'medium', description: '后端接口和数据库工程，与前端档位处于同一能力水平。', extraDescription: '优先处理 SQL 迁移、事务和服务端调试。' };
  current = await json('/models', { ...current, candidates: [frontend, backend], fallback: 'backend', sidebarEnabled: false });
  assert.equal((await json('/state')).modelSettings.sidebarEnabled, false);
  assert.equal((await json('/models')).candidates.length, 2);
  await json('/settings', { sessionId, mode: 'auto', pin: 'frontend' });
  const applied = await json('/trial', { prompt: '创建一个支持无障碍访问的 React 表单。' });
  assert.ok(applied.actualRequests.every(call => call.model === 'standard' && call.effort === 'high'));
  assert.equal(applied.receipt.proposedLabel, '前端界面');
  pass('两个自定义档位保存成功，模型与推理强度用于实际 DSH 请求');
  assert.equal((await request('/models', original)).status, 409);
  const invalid = { ...current, candidates: [...current.candidates, ...Array.from({ length: 5 }, (_, i) => ({ ...frontend, id: `extra_${i}` }))] };
  assert.equal((await request('/models', invalid)).status, 400);
  assert.deepEqual((await json('/models')).candidates, current.candidates);
  pass('过期编辑和七个档位被拒绝，现有配置保持不变');
  current = await json('/models', { ...current, candidates: [backend, frontend, ...Array.from({ length: 4 }, (_, i) => ({ ...frontend, id: `extra_${i}`, label: `其他任务 ${i + 1}`, model: 'fast', reasoningEffort: 'low', description: ['翻译和文本格式整理。', '总结已有文档。', '编写终端命令说明。', '简单事实问答。'][i], extraDescription: '' }))], sidebarEnabled: true });
  await json('/settings', { sessionId, mode: 'auto', pin: null });
  const routed = await json('/trial', { prompt: '将 hello world 翻译为中文。' });
  assert.equal(routed.receipt.backendModel, expectedBackend);
  assert.equal(Object.keys(routed.receipt.probabilities).length, 6);
  const target = current.candidates.find(candidate => candidate.id === routed.receipt.proposed);
  assert.ok(routed.actualRequests.every(call => call.model === target.model && call.effort === target.reasoningEffort));
  pass('六个无序档位进入真实离线决策模型 决策并用于 DSH 工具步骤');
} finally {
  current = await json('/models');
  await json('/models', { ...original, revision: current.revision });
  await json('/settings', { sessionId, mode: originalSession.mode, pin: originalSession.pin });
}
await writeFile(path.join(root, 'reports/model-settings-verification.json'), JSON.stringify({ generatedAt: new Date().toISOString(), checks, complete: true, note: '真实本地 DSH、离线决策模型和确定性测试执行端；原生模型选择器明确选择自动。原配置已恢复，本验证不评估真实生成质量。' }, null, 2) + '\n');
console.log(`${checks.length} 项模型设置验证通过，原配置已恢复。`);
