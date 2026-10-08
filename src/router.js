import { CloudDecisionClient, LocalDecisionClient } from './decision.js';
import { AUTO_PROVIDER } from './auto-model.js';
import { validateDecisionModel } from './decision-models.js';
import { CLOUD_DECISION_MODEL, normalizeCloudDecision } from './cloud-config.js';

export function normalizeConfig(raw = {}) {
  // An empty configuration is the install-time state; incomplete one-route
  // configurations remain invalid and no placeholder executor is invented.
  const supplied = raw.candidates === undefined ? [] : raw.candidates;
  if (!Array.isArray(supplied) || supplied.length === 1 || supplied.length > 6) throw new Error('请配置 2–6 个路由档位。');
  const ids = new Set();
  const candidates = supplied.map(candidate => {
    if (candidate.provider === AUTO_PROVIDER) throw new Error('自动模式不能作为执行档位，请选择具体模型。');
    for (const [field, name] of Object.entries({ id: '标识', provider: '供应商', model: '模型', description: '用途描述' })) if (typeof candidate[field] !== 'string' || !candidate[field].trim()) throw new Error(`请填写路由档位的${name}。`);
    if (!/^[a-z][a-z0-9_-]{0,31}$/.test(candidate.id) || ids.has(candidate.id)) throw new Error('路由标识必须唯一，以小写字母开头，且只能包含 1–32 个小写字母、数字、下划线或连字符。');
    ids.add(candidate.id);
    if (candidate.reasoningEffort !== undefined && (typeof candidate.reasoningEffort !== 'string' || !candidate.reasoningEffort)) throw new Error('推理强度无效。');
    const label = candidate.label ?? ({ fast: '轻量', standard: '常规', strong: '强能力' }[candidate.id] ?? candidate.id);
    if (typeof label !== 'string' || !label.trim() || label.length > 60) throw new Error('请为每个档位填写不超过 60 字符的名称。');
    if (candidate.extraDescription !== undefined && (typeof candidate.extraDescription !== 'string' || candidate.extraDescription.length > 1000)) throw new Error('补充说明不能超过 1000 字符。');
    return Object.freeze({ ...candidate, label, extraDescription: candidate.extraDescription ?? '' });
  });
  const fallback = raw.fallback ?? null;
  if (candidates.length === 0 ? fallback !== null : !ids.has(fallback)) throw new Error('请选择一个已配置的路由档位作为回退档位。');
  const minConfidence = raw.minConfidence ?? 0.5;
  if (!Number.isFinite(minConfidence) || minConfidence < 0 || minConfidence > 1) throw new Error('最低置信度必须在 0 到 1 之间。');
  const mode = raw.mode ?? 'shadow';
  if (!['auto', 'shadow', 'off'].includes(mode)) throw new Error('请选择自动选模、仅观察或关闭模式。');
  const sidebarEnabled = raw.sidebarEnabled ?? true;
  if (typeof sidebarEnabled !== 'boolean') throw new Error('侧边栏开关必须为开启或关闭。');
  const decisionModel = validateDecisionModel(raw.decisionModel);
  const cloudDecision = raw.cloudDecision === undefined ? undefined : normalizeCloudDecision(raw.cloudDecision);
  if (decisionModel === CLOUD_DECISION_MODEL && !cloudDecision) throw new Error('请配置云端决策服务并确认数据传输提示。');
  return Object.freeze({ ...raw, candidates, fallback, minConfidence, mode, sidebarEnabled, decisionModel, cloudDecision });
}

export class ModelRouter {
  constructor(config, llm) {
    this.config = normalizeConfig(config);
    this.llm = llm;
    this.client = new LocalDecisionClient({ ...this.config, decisionModel: this.config.decisionModel === CLOUD_DECISION_MODEL ? 'laya' : this.config.decisionModel });
    this.cloudClient = new CloudDecisionClient(this.config);
  }
  async eligible(candidate, signal) {
    if (!candidate || candidate.provider === AUTO_PROVIDER) return false;
    try {
      const info = await this.llm.resolveModelInfo(candidate.provider, candidate.model, signal);
      if (candidate.reasoningEffort !== undefined && !info.reasoning?.efforts?.some(e => e.id === candidate.reasoningEffort)) return false;
      return info.provider === candidate.provider && info.id === candidate.model;
    } catch { signal?.throwIfAborted(); return false; }
  }
  async route(state, signal) {
    const config = this.config;
    const began = performance.now();
    const candidates = [];
    for (const candidate of config.candidates) if (await this.eligible(candidate, signal)) candidates.push(candidate);
    const fallback = candidates.find(candidate => candidate.id === config.fallback);
    const failed = reason => ({ candidate: fallback, reason, confidence: null, elapsedMs: Math.round(performance.now() - began), decisionLocation: config.decisionModel === CLOUD_DECISION_MODEL ? 'cloud' : 'local' });
    if (!fallback) return failed('fallback-unavailable');
    if (state.nonText) return { ...failed('non-text-input'), candidate: undefined };
    if (!state.request?.trim()) return failed('no-user-text');
    if (candidates.length < 2) return failed('insufficient-candidates');
    try {
      const decision = config.decisionModel === CLOUD_DECISION_MODEL
        ? await this.cloudClient.choose(state, candidates, signal, config.cloudDecision)
        : await this.client.choose(state, candidates, signal, config.decisionModel);
      const confident = decision.confidence >= config.minConfidence;
      return { ...decision, candidate: confident ? candidates.find(c => c.id === decision.choice) : fallback, reason: confident ? 'system-one' : 'low-confidence' };
    } catch (error) {
      signal?.throwIfAborted();
      return failed(error.code ?? 'decision-error');
    }
  }
}

export function selectConfig(base, candidate) {
  if (!candidate) return base;
  const { reasoningEffort: _previous, ...rest } = base;
  return { ...rest, provider: candidate.provider, model: candidate.model, ...(candidate.reasoningEffort === undefined ? {} : { reasoningEffort: candidate.reasoningEffort }) };
}
