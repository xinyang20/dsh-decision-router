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
const checks = [];
const request = (route, data, extra = {}) => fetch(API + route, { ...(data === undefined ? {} : { method: 'POST', body: JSON.stringify(data) }), headers: { Cookie: cookie, 'Content-Type': 'application/json', ...extra } });
async function json(route, data) { const response = await request(route, data); const result = await response.json(); assert.ok(response.ok, result.message); return result; }
function pass(name) { checks.push(name); console.log(`通过：${name}`); }

assert.equal((await fetch(API + '/state')).status, 401);
pass('宿主鉴权不可绕过');
assert.equal((await request('/state', undefined, { Origin: 'https://example.invalid' })).status, 403);
pass('跨来源请求被拒绝');
const state = await json('/state');
const expectedBackend = { laya: 'convaiinnovations/laya-multilingual', 'd1-3b': 'LiquidAI/d1-3B', 'd1-omni-600m': 'LiquidAI/d1-omni-600M' }[state.modelSettings.decisionModel ?? 'laya'];
assert.ok(expectedBackend);
assert.equal(state.service.ready, true);
assert.equal(state.candidates.length, 3);
const sessionId = state.preview.sessionId;
assert.equal(state.sessions.find(item => item.id === sessionId)?.autoSelected, true, '请先在体验对话的原生模型选择器中选择“自动”，再运行 Web 验证。');
const fallback = state.candidates.find(candidate => candidate.id === state.fallback);
assert.ok(fallback, '请先配置有效的回退档位。');
await json('/settings', { sessionId, mode: 'auto', pin: null });
assert.equal((await request('/settings', { sessionId, mode: 'off', pin: 'missing' })).status, 400);
assert.equal((await json('/state')).sessions.find(item => item.id === sessionId).mode, 'auto');
assert.equal((await request('/trial', { prompt: '' })).status, 400);
pass('无效设置不会部分生效，空任务被拒绝');

const auto = await json('/trial', { prompt: '把字符串 hello world 转成大写，只输出结果。' });
assert.equal(auto.receipt.backendModel, expectedBackend);
assert.equal(auto.actualRequests.length, 2);
assert.ok(auto.actualRequests.every(call => call.model === auto.receipt.applied.model));
pass('真实本地决策模型 决策作用于工具调用前后的两次 DSH 请求');

await json('/settings', { sessionId, mode: 'auto', pin: 'fast' });
const manual = await json('/trial', { prompt: '设计一个分布式支付账本。' });
assert.equal(manual.receipt.reason, 'manual-pin');
assert.ok(manual.actualRequests.every(call => call.model === 'fast' && call.effort === 'low'));
pass('自动入口内手动指定执行档位生效');

await json('/settings', { sessionId, mode: 'shadow', pin: null });
const shadow = await json('/trial', { prompt: '编写一个 TypeScript 函数，移除重复字符串。' });
assert.equal(shadow.receipt.mode, 'shadow');
assert.equal(shadow.receipt.backendModel, expectedBackend);
assert.equal(shadow.receipt.applied.provider, fallback.provider);
assert.ok(shadow.actualRequests.every(call => call.model === fallback.model && call.effort === fallback.reasoningEffort));
pass('观察模式记录 本地决策建议，实际使用配置的回退模型与推理强度');

await json('/settings', { sessionId, mode: 'off', pin: null });
const off = await json('/trial', { prompt: '你好' });
assert.equal(off.receipt, null);
assert.ok(off.actualRequests.every(call => call.model === fallback.model && call.effort === fallback.reasoningEffort));
pass('暂停决策时不生成路由回执，使用配置的回退模型与推理强度');

await json('/settings', { sessionId, mode: 'auto', pin: null });
await writeFile(path.join(root, 'reports/web-verification.json'), JSON.stringify({ generatedAt: new Date().toISOString(), base, checks, complete: true, execution: '项目内真实 DSH Web、离线决策模型和确定性本地测试执行端；原生模型选择器明确选择自动。', auto, manual, shadow, off }, null, 2) + '\n');
console.log(`${checks.length} 项 Web 集成验证通过，路由策略已恢复为自动选择。`);
