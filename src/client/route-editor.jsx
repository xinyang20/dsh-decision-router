import React, { useId } from 'react';
import { Picker } from './picker.jsx';
import { effortLabel, modelLabel } from '../display.js';

export function RouteEditor({ candidate, index, catalog, busy, isFallback, canRemove, editing, onEdit, onRemove, onChange }) {
  const editorId = useId();
  const providers = catalog?.providers ?? [];
  const provider = providers.find(item => item.id === candidate.provider);
  const model = provider?.models.find(item => item.id === candidate.model);
  const efforts = model?.efforts ?? [];
  const effort = efforts.find(item => item.id === candidate.reasoningEffort);
  const unavailable = !model?.available || Boolean(candidate.reasoningEffort && !effort);
  const providerName = provider?.name || candidate.provider || '未选择供应商';
  const modelName = candidate.model ? modelLabel(candidate.provider, candidate.model, model?.name) : '未选择执行模型';
  const modelSummary = `${providerName} · ${modelName} · ${effortLabel(candidate.reasoningEffort, effort?.name)}`;
  const description = candidate.description?.trim() ?? '';
  const extraDescription = candidate.extraDescription?.trim() ?? '';
  const purposeSummary = [description, extraDescription ? `补充：${extraDescription}` : ''].filter(Boolean).join('；');

  function changeModel(providerId, modelId) {
    const next = providers.find(item => item.id === providerId)?.models.find(item => item.id === modelId);
    onChange({ provider: providerId, model: modelId, reasoningEffort: next?.efforts?.some(item => item.id === candidate.reasoningEffort) ? candidate.reasoningEffort : undefined });
  }

  return <article className={`dar-route-editor ${editing ? 'is-editing' : 'is-readonly'}`} aria-label={`路由 ${index + 1}`}>
    <div className="dar-route-title">
      <h3>{candidate.label || '新路由'}</h3>
      {isFallback && <span className="dar-tag">回退档位</span>}
      <div className="dar-route-actions">
        <button type="button" className="dar-route-edit" disabled={busy} aria-label={`${editing ? '收起' : '编辑'}路由 ${index + 1}`} aria-expanded={Boolean(editing)} aria-controls={editing ? editorId : undefined} onClick={onEdit}>{editing ? '收起' : '编辑'}</button>
        <button type="button" className="dar-remove" disabled={busy || !canRemove} title={!canRemove ? '至少保留 2 个路由档位' : undefined} aria-label={`删除路由 ${index + 1}`} onClick={onRemove}>删除</button>
      </div>
    </div>
    {!editing ? <div className="dar-route-summary">
      <p className="dar-route-model-line" title={modelSummary}>{modelSummary}</p>
      <p className="dar-route-description" title={purposeSummary || '尚未填写用途描述'}>{purposeSummary || '尚未填写用途描述'}</p>
    </div> : <div id={editorId}>
      <div className="dar-route-fields">
        <label>名称<input aria-label={`路由 ${index + 1} 名称`} required maxLength={60} disabled={busy} value={candidate.label} placeholder="例如：前端设计" onChange={event => onChange({ label: event.target.value })} /></label>
        <label>供应商<Picker label={`路由 ${index + 1} 供应商`} value={candidate.provider} disabled={busy} onChange={value => { const next = providers.find(item => item.id === value); changeModel(value, next?.models.find(item => item.available)?.id ?? ''); }} options={[...(!provider ? [{ value: candidate.provider, label: `${candidate.provider || '请选择供应商'}（不可用）`, disabled: true }] : []), ...providers.map(item => ({ value: item.id, label: item.name, description: item.id === 'local-fixture' ? '仅用于本地流程测试' : item.id, disabled: !item.models.some(model => model.available) }))]} /></label>
        <label>执行模型<Picker label={`路由 ${index + 1} 模型`} value={candidate.model} disabled={busy} searchable onChange={value => changeModel(candidate.provider, value)} options={[...(!model ? [{ value: candidate.model, label: `${candidate.model || '请选择模型'}（不可用）`, disabled: true }] : []), ...(provider?.models ?? []).map(item => ({ value: item.id, label: modelLabel(candidate.provider, item.id, item.name), description: candidate.provider === 'local-fixture' ? '本地测试模型' : item.id, searchText: item.id, disabled: !item.available }))]} /></label>
        <label>推理强度<Picker label={`路由 ${index + 1} 推理强度`} value={candidate.reasoningEffort ?? ''} disabled={busy || !model?.available} onChange={value => onChange({ reasoningEffort: value || undefined })} options={[{ value: '', label: '模型默认', description: efforts.length === 0 ? '此模型不支持单独设置推理强度' : '沿用模型的默认推理强度' }, ...(candidate.reasoningEffort && !effort ? [{ value: candidate.reasoningEffort, label: `${effortLabel(candidate.reasoningEffort)}（不可用）`, disabled: true }] : []), ...efforts.map(item => ({ value: item.id, label: effortLabel(item.id, item.name) }))]} /></label>
      </div>
      <div className="dar-description-fields">
        <label>用途与能力描述<textarea aria-label={`路由 ${index + 1} 用途描述`} required maxLength={1000} disabled={busy} value={candidate.description} placeholder="描述适合处理的任务，决策模型会依据这段描述选择。" onChange={event => onChange({ description: event.target.value })} /></label>
        <label>补充说明（可选）<textarea aria-label={`路由 ${index + 1} 补充说明`} maxLength={1000} disabled={busy} value={candidate.extraDescription ?? ''} placeholder="例如：优先处理 React 页面、交互与视觉设计；数据库迁移交给后端路由。" onChange={event => onChange({ extraDescription: event.target.value })} /></label>
      </div>
    </div>}
    {unavailable && <p className="dar-inline-error">当前模型或推理强度不可用，请重新选择。</p>}
  </article>;
}
