import React, { useEffect, useState } from 'react';
import { css } from './style.js';
import { ModelSettings } from './model-settings.jsx';
import { decisionModelLabel, decisionModelStatus, effortLabel, modelLabel, reasonLabel } from '../display.js';
import { installChineseLocale } from './locale.js';
import { installUnsavedGuardShortcuts } from './unsaved-guard.js';

const PANEL = 'dsh-decision-router';
const API = '/dsh-auto-router/api';
const routeLabels = data => Object.fromEntries((data?.candidates ?? []).map(candidate => [candidate.id, candidate.label ?? candidate.id]));

async function api(route, data) {
  const response = await fetch(API + route, { credentials: 'same-origin', ...(data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? '请求失败');
  return result;
}

function Icon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 12h6m0 0 4-6h6m-10 6 4 6h6" /><circle cx="3" cy="12" r="1.5" /><circle cx="21" cy="6" r="1.5" /><circle cx="21" cy="18" r="1.5" /></svg>;
}

function useStateFeed() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  async function refresh() { try { const next = await api('/state'); setData(next); setError(''); return next; } catch (error) { setError(error.message); } }
  useEffect(() => { let active = true; let pending = false; const tick = async () => { if (pending) return; pending = true; try { const next = await api('/state'); if (active) { setData(next); setError(''); } } catch (error) { if (active) setError(error.message); } finally { pending = false; } }; void tick(); const timer = setInterval(tick, 2500); return () => { active = false; clearInterval(timer); }; }, []);
  return { data, error, refresh };
}

function Page({ actions }) {
  const { data, error } = useStateFeed();
  const localTrial = data?.candidates.length > 0 && data.candidates.every(candidate => candidate.provider === 'local-fixture');
  const rows = data?.receipts ?? [];
  const sessions = Object.fromEntries((data?.sessions ?? []).map(session => [session.id, session.title]));
  const recent = rows.at(-1);
  const elapsed = rows.filter(item => item.backendModel).map(item => item.elapsedMs).sort((a,b) => a-b);
  const fallbackCount = rows.filter(row => !['system-one', 'manual-pin'].includes(row.reason)).length;
  const decisionId = data?.modelSettings?.decisionModel ?? data?.decisionModel ?? 'laya';
  const decisionStatus = decisionModelStatus(data?.service, decisionId);
  return <section className="dar" aria-label="自动选模"><div className="dar-shell">
    <header className="dar-header"><div><div className="dar-kicker"><Icon size={18} /> 智能路由</div><h1>自动选模</h1><p>查看决策状态、已配置路由和执行记录。</p></div><div className="dar-header-actions"><span className={`dar-status ${decisionStatus.ready ? 'is-ready' : ''} ${decisionId === 'systemone-api' ? 'is-cloud' : ''}`}><i />{decisionStatus.text}</span><button className="dar-button" onClick={() => actions.back()}>返回对话</button></div></header>
    {error && <div className="dar-error" role="alert">{error}</div>}
    {!data ? <p className="dar-empty">正在连接项目内 DSH…</p> : <>
      <div className="dar-stats"><div><span>已记录路由</span><strong>{rows.length}<small>条</small></strong></div><div><span>决策耗时中位数</span><strong>{elapsed.length ? elapsed[Math.floor((elapsed.length-1)/2)] : '—'}<small>毫秒</small></strong></div><div><span>触发回退</span><strong>{fallbackCount}<small>次</small></strong></div><div><span>最近执行模型</span><strong className="dar-stat-name">{modelLabel(recent?.applied.provider, recent?.applied.model)}</strong></div></div>
      <div className="dar-card-heading dar-overview-heading"><h2>已配置 {data.candidates.length} 个路由档位</h2><span className="dar-muted">在「设置 → 自动选模」中修改</span></div>
      <div className="dar-candidates">{data.candidates.map(candidate => <article key={candidate.id} className="dar-model"><div className="dar-model-title"><h3>{candidate.label}</h3><span>{effortLabel(candidate.reasoningEffort)}</span></div><p>{candidate.description}{candidate.extraDescription ? ` ${candidate.extraDescription}` : ''}</p><div className="dar-model-footer"><code>{modelLabel(candidate.provider, candidate.model)}</code><span>{candidate.provider === 'local-fixture' ? '本地测试执行端' : candidate.provider}</span></div></article>)}</div>
      <section className="dar-card dar-records" aria-label="路由记录"><div className="dar-card-heading"><h2>路由记录</h2><span className="dar-muted">全部对话 · 最近 {rows.length} 条</span></div><p className="dar-subtitle">按时间倒序展示本次服务运行期间的记录，最多保留 200 条。</p>{rows.length === 0 ? <div className="dar-empty"><Icon size={30} /><p>还没有路由记录</p><span>在对话中选择“自动”并发送任务后，记录会显示在这里。</span></div> : <div className="dar-record-table-wrap"><table className="dar-record-table"><thead><tr><th scope="col">时间</th><th scope="col">对话 / 轮次</th><th scope="col">执行模型 / 推理强度</th><th scope="col">决策模型</th><th scope="col">路由原因</th><th scope="col">耗时</th></tr></thead><tbody>{rows.slice().reverse().map((row, index) => <tr key={`${row.sessionId}-${row.turn}-${row.step}-${row.createdAt}-${index}`}>
        <td><time dateTime={row.createdAt}>{row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false }) : '—'}</time></td>
        <td><span className="dar-record-session" title={sessions[row.sessionId] ?? row.sessionId}>{sessions[row.sessionId] ?? '未命名对话'}</span><small>第 {row.turn} 轮</small></td>
        <td><span>{modelLabel(row.applied.provider, row.applied.model)}</span><small>推理强度：{effortLabel(row.applied.reasoningEffort)}</small></td>
        <td>{row.backendModel ? decisionModelLabel(row.backendModel) : '—'}{row.decisionLocation === 'cloud' && <small className="dar-cloud-text">云端 API</small>}</td>
        <td>{row.mode === 'shadow' ? '仅观察 · ' : ''}{reasonLabel(row.reason)}</td>
        <td className="dar-record-elapsed">{row.elapsedMs} 毫秒</td>
      </tr>)}</tbody></table></div>}</section>
      <footer className="dar-footer">项目内 DSH · {decisionId === 'systemone-api' ? '已启用云端决策 API' : '选模决策在本机完成'}{localTrial ? ' · 执行端为本地测试替身' : ' · 执行模型由路由配置指定'}</footer>
    </>}
  </div></section>;
}

function HeaderButton({ boundSessionId, open }) {
  const { data } = useStateFeed();
  const labels = routeLabels(data);
  const session = data?.sessions.find(item => item.id === boundSessionId);
  const latest = data?.receipts.filter(item => item.sessionId === boundSessionId).at(-1);
  const name = session?.autoSelected
    ? session.mode === 'off' ? '自动选模已暂停' : session.mode === 'shadow' ? '选模观察中' : session.pin ? '自动模式 · 指定档位' : '自动选模'
    : '当前使用指定模型';
  const selected = session?.autoSelected
    ? session.pin ? labels[session.pin] : latest && modelLabel(latest.applied.provider, latest.applied.model)
    : session?.selected && modelLabel(session.selected.provider, session.selected.model);
  return <button className="dar-header-button" onClick={open} title="查看自动选模状态与记录"><Icon size={16} /><span>{name}{selected ? ` · ${selected}` : ''}</span></button>;
}

function SettingsPage({ actions, close }) {
  const { data, error, refresh } = useStateFeed();
  return <section className="dar dar-settings-subpage" aria-label="自动选模设置"><h1>自动选模</h1><p className="dar-settings-lead">选择决策方式，定义各执行模型的任务分工。</p>{error && <div className="dar-error" role="alert">{error}</div>}<ModelSettings request={api} current={data?.modelSettings} service={data?.service} onClose={close} onSaved={saved => { actions.modelsSaved(saved); void refresh(); }} /></section>;
}

export const inject = ['slots', 'layout', 'uiWorkspace', 'locale', 'shortcuts'];
export function apply(ctx) {
  installChineseLocale(ctx);
  installUnsavedGuardShortcuts(ctx);
  let sidebarVisible = true;
  let sidebarRevision = -1;
  let updateSidebar = () => {};
  const syncSettings = saved => { if (saved.revision < sidebarRevision) return; sidebarRevision = saved.revision; sidebarVisible = saved.sidebarEnabled; updateSidebar(); };
  ctx.effect(() => { const style = document.createElement('style'); style.textContent = css; document.head.append(style); return () => style.remove(); });
  const actions = { back: () => ctx.layout.selectPanel(null), modelsSaved: syncSettings };
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL, inject: () => ({ actions }) }, Page));
  ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: PANEL, order: 15, label: () => '自动选模', inject: () => ({ actions }) }, SettingsPage));
  ctx.slots.inject('sidebar.panellist', () => {
    let dispose;
    let active = true;
    let pending = false;
    updateSidebar = () => {
      if (!active) return;
      if (sidebarVisible && !dispose) dispose = ctx.slots.register({ name: 'sidebar.panellist', id: PANEL, order: 36, label: () => '自动选模' }, Icon);
      if (!sidebarVisible && dispose) { dispose(); dispose = undefined; }
    };
    const sync = async () => {
      if (pending) return;
      pending = true;
      try { const data = await api('/state'); if (active) syncSettings(data.modelSettings); } catch {} finally { pending = false; }
    };
    void sync();
    const timer = setInterval(sync, 2500);
    return () => { active = false; clearInterval(timer); dispose?.(); updateSidebar = () => {}; };
  });
  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({ name: 'conversation.session.header.actions', id: PANEL, order: 25, inject: sessionId => ({ boundSessionId: sessionId, open: () => ctx.layout.selectPanel(PANEL) }) }, HeaderButton));
}
