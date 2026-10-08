import React, { useEffect, useId, useRef, useState } from 'react';
import { Modal } from '@deepseek-ai/dsh-client-ui-primitives';
import { Picker } from './picker.jsx';
import { decisionModelStatus, modelLabel } from '../display.js';
import { DECISION_MODELS } from '../decision-models.js';
import { CLOUD_DECISION_MODEL, DEFAULT_CLOUD_ENDPOINT, DEFAULT_CLOUD_MODEL } from '../cloud-config.js';
import { useUnsavedGuard } from './unsaved-guard.js';
import { RouteEditor } from './route-editor.jsx';

const cloudDraft = value => ({ endpoint: value?.endpoint ?? DEFAULT_CLOUD_ENDPOINT, model: value?.model ?? DEFAULT_CLOUD_MODEL, apiKey: '', consent: value?.consent ?? null, hasApiKey: value?.hasApiKey ?? false });
const editable = data => ({ candidates: data.candidates, fallback: data.fallback, sidebarEnabled: data.sidebarEnabled, decisionModel: data.decisionModel ?? 'laya', mode: data.mode ?? 'auto', cloudDecision: cloudDraft(data.cloudDecision) });
const modes = { auto: '自动选择', shadow: '仅观察', off: '暂停决策' };
const modeHelp = { auto: '由决策模型选择执行模型，无法确定时使用回退档位。', shadow: '记录决策模型的建议，实际使用回退档位执行。', off: '暂停调用决策模型，直接使用回退档位执行。' };
const savedListeners = new Set();

export function ModelSettings({ request, onSaved, current, service, onClose }) {
  const editorId = useId();
  const [catalog, setCatalog] = useState(null);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [preferenceBusy, setPreferenceBusy] = useState(false);
  const [consentPrompt, setConsentPrompt] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const consentResolver = useRef(null);
  const dirty = draft && JSON.stringify(draft) !== JSON.stringify(editable(catalog));
  const cloudSelected = draft?.decisionModel === CLOUD_DECISION_MODEL;
  const guard = useUnsavedGuard({ dirty: Boolean(dirty), busy: busy || preferenceBusy || Boolean(consentPrompt) || Boolean(removingId), onSave: () => save(), onClose });
  const removing = draft?.candidates.find(candidate => candidate.id === removingId);
  const decisionService = service ?? catalog?.decisionService;
  const availableDecisions = decisionService?.models ?? catalog?.decisionModels ?? [];
  const decisionModels = DECISION_MODELS.map(model => ({ ...model, ...availableDecisions.find(candidate => candidate.id === model.id) }));
  const selectedDecision = decisionModels.find(model => model.id === draft?.decisionModel);
  const decisionStatus = decisionModelStatus(decisionService && { ...decisionService, models: decisionModels }, draft?.decisionModel ?? 'laya');
  function acceptExternal(next) {
    if (!catalog || next.revision <= catalog.revision) return;
    setNotice('');
    if (dirty) { setError('配置已在另一个页面更新。当前草稿已保留，请重新载入后再修改。'); return; }
    setCatalog(previous => ({ ...previous, ...next })); setDraft(editable(next)); setError('');
  }
  useEffect(() => {
    const listener = (next, sender) => { if (sender !== editorId) acceptExternal(next); };
    savedListeners.add(listener);
    return () => savedListeners.delete(listener);
  }, [catalog, dirty]);
  useEffect(() => { if (current) acceptExternal(current); }, [current?.revision]);
  async function load(replace = false) {
    setBusy(true); setError(''); setNotice('');
    try {
      const next = await request('/models');
      setCatalog(current => replace || !current ? next : { ...current, providers: next.providers, decisionModels: next.decisionModels, decisionService: next.decisionService });
      if (replace) { setDraft(editable(next)); setEditingId(null); }
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  useEffect(() => { let active = true; request('/models').then(next => { if (active) { setCatalog(next); setDraft(editable(next)); } }).catch(error => { if (active) setError(error.message); }); return () => { active = false; }; }, []);
  function update(id, patch) {
    setNotice('');
    setDraft(current => ({ ...current, candidates: current.candidates.map(candidate => candidate.id === id ? { ...candidate, ...patch } : candidate) }));
  }
  function add() {
    const provider = catalog.providers.find(provider => provider.models.some(model => model.available));
    const model = provider?.models.find(model => model.available);
    setNotice('');
    const id = `route_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
    setDraft(current => ({ ...current, fallback: current.fallback ?? id, candidates: [...current.candidates, { id, label: '', provider: provider?.id ?? '', model: model?.id ?? '', description: '', extraDescription: '' }] }));
    setEditingId(id);
  }
  function remove(id) {
    if (draft.candidates.length <= 2) return;
    setNotice('');
    setDraft(current => {
      const candidates = current.candidates.filter(candidate => candidate.id !== id);
      return { ...current, candidates, fallback: current.fallback === id ? candidates[0].id : current.fallback };
    });
    if (editingId === id) setEditingId(null);
    setRemovingId(null);
  }
  function askConsent(config) {
    setConsentPrompt({ endpoint: config.endpoint, model: config.model });
    return new Promise(resolve => { consentResolver.current = resolve; });
  }
  function answerConsent(accepted) {
    setConsentPrompt(null);
    consentResolver.current?.(accepted);
    consentResolver.current = null;
  }
  useEffect(() => () => consentResolver.current?.(false), []);
  const consentFor = config => ({ version: 1, endpoint: config.endpoint.trim(), model: config.model.trim() });
  async function changeDecision(value) {
    if (value === CLOUD_DECISION_MODEL) {
      if (!await askConsent(draft.cloudDecision)) return;
      setDraft(current => ({ ...current, decisionModel: value, cloudDecision: { ...current.cloudDecision, consent: consentFor(current.cloudDecision) } }));
    } else setDraft(current => ({ ...current, decisionModel: value, cloudDecision: cloudDraft(catalog.cloudDecision) }));
    setNotice('');
  }
  async function preference(patch) {
    if (preferenceBusy || busy) return;
    setPreferenceBusy(true); setError(''); setNotice('');
    try {
      const saved = await request('/preferences', { revision: catalog.revision, ...patch });
      setCatalog(previous => ({ ...previous, ...saved }));
      setDraft(previous => ({ ...previous, mode: saved.mode, sidebarEnabled: saved.sidebarEnabled }));
      for (const listener of savedListeners) listener(saved, editorId);
      onSaved(saved);
    } catch (error) { setError(error.message); }
    finally { setPreferenceBusy(false); }
  }
  async function save(event) {
    event?.preventDefault();
    let next = draft;
    if (next.decisionModel === CLOUD_DECISION_MODEL) {
      const expected = consentFor(next.cloudDecision);
      const actual = next.cloudDecision.consent;
      if (!actual || actual.version !== 1 || actual.endpoint !== expected.endpoint || actual.model !== expected.model) {
        if (!await askConsent(next.cloudDecision)) return false;
        next = { ...next, cloudDecision: { ...next.cloudDecision, consent: expected } };
        setDraft(next);
      }
    }
    setBusy(true); setError(''); setNotice('');
    try {
      const { cloudDecision, ...settings } = next;
      const cloud = next.decisionModel === CLOUD_DECISION_MODEL ? { endpoint: cloudDecision.endpoint, model: cloudDecision.model, consent: cloudDecision.consent, ...(cloudDecision.apiKey ? { apiKey: cloudDecision.apiKey } : {}) } : undefined;
      const saved = await request('/models', { ...settings, ...(cloud ? { cloudDecision: cloud } : {}), revision: catalog.revision });
      setCatalog(current => ({ ...current, ...saved })); setDraft(editable(saved));
      setEditingId(null);
      for (const listener of savedListeners) listener(saved, editorId);
      onSaved(saved);
      setNotice(saved.persistent ? '已保存到本地。新配置从下一轮决策生效，重启后保留。' : '已保存，从下一轮决策生效。当前宿主未设置持久化路径，重启后会恢复默认值。');
      return true;
    } catch (error) { setError(error.message); return false; }
    finally { setBusy(false); }
  }
  return <div className="dar-model-settings" ref={guard.rootRef}>
    {error && <div className="dar-error" role="alert">{error}</div>}
    {notice && <div className="dar-success" role="status">{notice}</div>}
    {!draft ? <div className="dar-empty"><p>正在读取路由配置…</p>{error && <button className="dar-button" onClick={() => void load(true)}>重新载入</button>}</div> : <form onSubmit={save}>
      <fieldset disabled={busy} className="dar-settings-fields">
        <div className="dar-mode-setting"><div className="dar-mode-setting-row"><div><h2>路由模式</h2><p>自动保存，从下一轮生效。</p></div><Picker label="路由模式" value={draft.mode} disabled={busy || preferenceBusy} onChange={mode => void preference({ mode })} options={Object.entries(modes).map(([value, label]) => ({ value, label }))} /></div><p className="dar-mode-help">{modeHelp[draft.mode]}</p></div>
        <div className="dar-settings-options dar-sidebar-setting"><div><h2>侧边栏入口</h2><p>切换后立即生效，无需单独保存。</p></div><Picker label="侧边栏入口" value={draft.sidebarEnabled ? 'on' : 'off'} disabled={busy || preferenceBusy} onChange={value => void preference({ sidebarEnabled: value === 'on' })} options={[{ value: 'on', label: '开启（默认）' }, { value: 'off', label: '关闭' }]} /></div>
        <section className="dar-decision-settings" aria-label="决策模型设置">
          <div className="dar-decision-heading"><h2>决策模型</h2><span className={`dar-tag ${cloudSelected ? 'dar-cloud-text' : ''}`}>{cloudSelected ? '云端 API' : '本地推理'}</span></div>
          <div className="dar-decision-choice"><Picker label="决策模型" value={draft.decisionModel} disabled={busy || preferenceBusy} onChange={value => void changeDecision(value)} options={[...decisionModels.map(model => ({ value: model.id, label: `${model.label}${model.experimental ? '（实验）' : ''}`, description: model.installed === true ? '本机运行 · 已安装' : model.installed === false ? '本机运行 · 未安装' : '本机运行 · 安装状态待确认' })), { value: CLOUD_DECISION_MODEL, label: 'System One API（云端）', description: 'Jev 或兼容接口 · 需确认数据传输风险' }]} /><span className={`dar-status ${decisionStatus.ready ? 'is-ready' : ''} ${cloudSelected ? 'is-cloud' : ''}`}><i />{decisionStatus.text}</span></div>
          {cloudSelected ? <><div className="dar-cloud-warning"><strong>注意：相关数据将离开本机</strong><p>任务内容、近期上下文及各档模型的用途描述和补充说明可能被传输到 System One 模型提供商的服务器。请注意甄别提供商及接口地址。</p></div><div className="dar-cloud-fields"><label>API 地址<input type="url" required aria-label="决策 API 地址" value={draft.cloudDecision.endpoint} onChange={event => setDraft(current => ({ ...current, cloudDecision: { ...current.cloudDecision, endpoint: event.target.value, apiKey: '', hasApiKey: false, consent: null } }))} /></label><label>决策模型名称<input required maxLength={100} aria-label="API 决策模型名称" value={draft.cloudDecision.model} onChange={event => setDraft(current => ({ ...current, cloudDecision: { ...current.cloudDecision, model: event.target.value, consent: null } }))} /></label><label>API 密钥<input type="password" autoComplete="new-password" aria-label="决策 API 密钥" maxLength={4096} required={!draft.cloudDecision.hasApiKey} placeholder={draft.cloudDecision.hasApiKey ? '已配置；留空保留原密钥' : '输入提供商的 API 密钥'} value={draft.cloudDecision.apiKey} onChange={event => setDraft(current => ({ ...current, cloudDecision: { ...current.cloudDecision, apiKey: event.target.value } }))} /></label></div><p className="dar-inline-note">密钥仅保存在本机配置文件，不会回显。API 失败时使用回退执行档位，不会自动切换到其他远程服务。</p></> : <p className="dar-decision-hint">本机推理，任务内容不出机。模型修改保存后生效。</p>}
          {selectedDecision?.experimental && <p className="dar-inline-note">此模型为实验支持，请先用本地测试任务检查选择结果。</p>}
          {selectedDecision?.installed === false && <div className="dar-decision-warning" role="status"><p>所选决策模型尚未安装。可以保存此选择；安装完成前无法进行该模型的自动决策，将使用已配置的回退执行档位。</p><p>在项目目录运行{draft.decisionModel === 'laya' ? <><code>pnpm run laya:setup</code>，再运行 <code>pnpm run laya:download</code></> : <code>pnpm run d1:setup</code>}，完成后刷新模型列表。</p></div>}
          {!cloudSelected && selectedDecision?.installed === undefined && <p className="dar-inline-note">尚未确认所选模型是否已安装，请连接本地服务后刷新模型列表。不可用时会使用回退执行档位。</p>}
        </section>
        <div className="dar-settings-intro"><div><h2>路由档位</h2><p>设置 2–6 个选择。档位不代表固定排名，也可以按前端、后端、翻译等任务划分。</p></div><span className="dar-tag">{draft.candidates.length} / 6</span></div>
        <div className="dar-provider-help"><p>供应商、接口密钥和可用模型请在左下角 <strong>设置 → 模型</strong> 中配置，然后刷新列表。这里复用 DSH 已配置的模型。在对话底部选择“自动”后，才会根据以下档位路由；选择具体模型时直接使用该模型。</p><button type="button" className="dar-button" onClick={() => void load(false)}>刷新模型列表</button></div>
        {!catalog.providers.some(provider => provider.models.some(model => model.available)) ? <p className="dar-inline-note">尚未发现可用执行模型，请先在「设置 → 模型」中添加供应商和模型，再刷新列表。</p> : !catalog.providers.some(provider => provider.id !== 'local-fixture' && provider.models.some(model => model.available)) && <p className="dar-inline-note">当前仅发现本地测试执行端。选择这些模型可验证路由流程，但不会生成真实任务答案。</p>}
        {draft.candidates.length === 0 && <p className="dar-inline-note">尚未配置路由。请添加 2–6 个档位、选择执行模型并填写用途，保存后开启自动选择。</p>}
        <div className="dar-route-editors">{draft.candidates.map((candidate, index) => <RouteEditor key={candidate.id} candidate={candidate} index={index} catalog={catalog} busy={busy || preferenceBusy} isFallback={candidate.id === draft.fallback} canRemove={draft.candidates.length > 2} editing={editingId === candidate.id} onEdit={() => setEditingId(current => current === candidate.id ? null : candidate.id)} onRemove={() => setRemovingId(candidate.id)} onChange={patch => update(candidate.id, patch)} />)}</div>
        <div className="dar-route-controls"><button type="button" className="dar-button" disabled={draft.candidates.length >= 6} onClick={add}>＋ 添加路由档位</button><label>无法确定时使用<Picker label="回退档位" value={draft.fallback} disabled={busy} onChange={value => { setNotice(''); setDraft({ ...draft, fallback: value }); }} options={draft.candidates.map(candidate => ({ value: candidate.id, label: candidate.label || '未命名路由', description: modelLabel(candidate.provider, candidate.model) }))} /></label></div>
        <p className="dar-inline-note">描述和补充说明会一起交给所选的决策模型。保持简洁，说明各自擅长与不适合的任务；它们不依赖名称、标识或排列顺序来表达优先级。</p>
      </fieldset>
      <div className="dar-save-row"><span>{dirty ? '模型配置有未保存的修改' : '模型配置已同步'}</span><div><button type="button" className="dar-button" disabled={busy || preferenceBusy} onClick={() => void load(true)}>{dirty ? '放弃修改并重新载入' : '重新载入'}</button><button className="dar-primary" type="submit" disabled={busy || preferenceBusy || !dirty}>{busy ? '正在保存…' : '保存模型配置'}</button></div></div>
    </form>}
    <Modal open={Boolean(removing)} title="删除路由档位？" closeLabel="取消" onClose={() => setRemovingId(null)} footer={<div className="dar-dialog-actions"><button className="dar-button" onClick={() => setRemovingId(null)}>取消</button><button className="dar-danger-button" onClick={() => remove(removingId)}>删除档位</button></div>}><p className="dar-dialog-copy">确定删除「{removing?.label || '未命名路由'}」？删除先保留在草稿中，保存模型配置后才会生效。</p>{removingId === draft?.fallback && <p className="dar-dialog-copy">这是当前回退档位，删除后将改用「{draft?.candidates.find(candidate => candidate.id !== removingId)?.label}」。</p>}</Modal>
    <Modal open={Boolean(consentPrompt)} title="启用云端决策前，请确认" closeLabel="放弃" onClose={() => answerConsent(false)} footer={<div className="dar-dialog-actions"><button className="dar-button" onClick={() => answerConsent(false)}>放弃</button><button className="dar-danger-button" onClick={() => answerConsent(true)}>我已了解</button></div>}><div className="dar-cloud-warning" role="alert"><strong>此操作可能将相关数据传输到 System One 模型提供商的服务器！</strong><p>包括本轮任务内容、近期对话上下文、路由档位的用途描述和补充说明。请注意甄别提供商，并确认你愿意向其传输这些数据。</p><p>目标接口：<code>{consentPrompt?.endpoint}</code><br />决策模型：{consentPrompt?.model}</p><p>选择“我已了解”后可继续配置。保存后，对话选择“自动”且路由模式为“自动选择”或“仅观察”时会发送云端请求；“暂停决策”不会发送。</p></div></Modal>
    <Modal open={guard.pending} title="模型配置尚未保存" closeLabel="继续编辑" onClose={guard.continueEditing} description="不保存就关闭会丢失相关修改，是否保存？" footer={<div className="dar-dialog-actions"><button className="dar-button" disabled={guard.saving} onClick={guard.continueEditing}>继续编辑</button><button className="dar-button" disabled={guard.saving} onClick={guard.discard}>放弃修改</button><button className="dar-primary" disabled={guard.saving} onClick={guard.saveAndClose}>{guard.saving ? '正在保存…' : '保存并关闭'}</button></div>}>{(error || guard.error) && <p className="dar-inline-error" role="alert">{error || guard.error}</p>}</Modal>
  </div>;
}
