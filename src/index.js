import { ModelRouter, selectConfig } from './router.js';
import { mountWeb } from './web.js';
import { createModelSettings } from './model-settings.js';
import { isAutoModel, registerAutoModel } from './auto-model.js';
import { dshHomePath } from '@deepseek-ai/dsh-home-paths';

export const name = 'dsh-decision-router';
export const inject = ['llm'];

export async function apply(ctx, config = {}) {
  const router = new ModelRouter({ ...config, modelsFile: config.modelsFile ?? dshHomePath('plugins', name, 'model-tiers.json') }, ctx.llm);
  const models = await createModelSettings(router);
  await registerAutoModel(ctx);
  const turns = new WeakMap();
  let modes = new WeakMap();
  let pins = new WeakMap();
  const history = new WeakMap();
  const receipts = [];
  const modeFor = agent => modes.get(agent) ?? router.config.mode;
  const pinFor = agent => router.config.candidates.some(candidate => candidate.id === pins.get(agent)) ? pins.get(agent) : null;
  for (const method of ['save', 'preferences']) {
    const save = models[method];
    models[method] = async data => {
      const saved = await save(data);
      if (Object.hasOwn(data, 'mode')) {
        // A committed global mode replaces compatibility-only session overrides.
        // Existing turns keep their already captured mode and routing result.
        modes = new WeakMap();
        pins = new WeakMap();
      }
      return saved;
    };
  }
  const control = {
    models,
    snapshot: agent => {
      const selected = agent.session.snapshotEvents().findLast(event => event.type === 'model/selection')?.data
        ?? agent.session.requestHeader()?.config ?? ctx.get('agentDefaultModel')?.currentSelection() ?? null;
      return { mode: modeFor(agent), pin: pinFor(agent), selected, autoSelected: isAutoModel(selected) };
    },
    setMode(agent, mode) {
      if (!['auto', 'shadow', 'off'].includes(mode)) throw new Error('请选择有效的路由策略。');
      modes.set(agent, mode);
    },
    pin(agent, id) {
      if (id === null) { pins.delete(agent); return; }
      if (!router.config.candidates.some(candidate => candidate.id === id)) throw new Error('指定的路由档位不存在。');
      pins.set(agent, id);
    },
    receipts: () => structuredClone(receipts),
  };
  ctx.provide('autoModelRouter', control);
  ctx.inject(['webServer', 'connection', 'agents'], web => mountWeb(web, router, control));
  ctx.effect(() => () => { receipts.length = 0; });
  ctx.effect(() => ctx.on('agent/pre-step', async ({ agent, turn, signal }, next) => {
    const decision = await next();
    if (decision.kind !== 'enter' || turns.get(agent)?.turn === turn) return decision;
    signal.throwIfAborted();
    const user = decision.messages.filter(message => message.source?.kind === 'user');
    const request = user.flatMap(message => message.content.filter(block => block.type === 'text').map(block => block.text)).join('\n');
    const nonText = user.some(message => message.content.some(block => block.type !== 'text'));
    const previous = history.get(agent) ?? [];
    turns.set(agent, { turn, state: { request, recent: previous.slice(-2), nonText }, pending: null, result: null });
    if (request) history.set(agent, [...previous.slice(-1), request.slice(0,600)]);
    return decision;
  }));
  ctx.effect(() => ctx.on('agent/request', async ({ agent, turn, step, signal }, next) => {
    const base = await next();
    signal.throwIfAborted();
    // The native model picker owns routing intent, including switches between tool steps.
    if (!isAutoModel(base)) return base;
    if (router.config.candidates.length === 0) throw new Error('自动选模尚未配置。请在“设置 → 自动选模”添加并保存 2–6 个路由档位，或在模型选择器中选择具体模型。');
    const entry = turns.get(agent);
    if (!entry || entry.turn !== turn) return base;
    const mode = entry.mode ??= modeFor(agent);
    async function fallback() {
      const candidate = router.config.candidates.find(item => item.id === router.config.fallback);
      if (!candidate || !await router.eligible(candidate, signal)) throw new Error('回退模型不可用，请重新配置路由或在模型选择器中选择具体模型。');
      return candidate;
    }
    if (mode === 'off') {
      entry.pausedCandidate ??= await fallback();
      return selectConfig(base, entry.pausedCandidate);
    }
    if (!entry.pending) {
      const pin = pinFor(agent);
      entry.pending = pin ? (async () => {
        const candidate = router.config.candidates.find(item => item.id === pin);
        return await router.eligible(candidate, signal) ? { candidate, reason: 'manual-pin', confidence: null, elapsedMs: 0 } : { reason: 'manual-pin-unavailable', confidence: null, elapsedMs: 0 };
      })() : router.route(entry.state, signal);
    }
    const result = await entry.pending;
    signal.throwIfAborted();
    if (result.reason === 'non-text-input') throw new Error('自动选模目前仅支持文本任务，请在模型选择器中选择支持此输入的具体模型。');
    if (mode === 'auto' && !result.candidate) throw new Error('自动选模没有可用的执行模型，请检查指定档位和回退模型。');
    if (mode === 'shadow') entry.observedCandidate ??= await fallback();
    const applied = selectConfig(base, mode === 'shadow' ? entry.observedCandidate : result.candidate);
    if (!entry.result) {
      entry.result = result;
      receipts.push({ createdAt: new Date().toISOString(), sessionId: agent.id, turn, step, mode, reason: result.reason, decisionChoice: result.choice ?? null, proposed: result.candidate?.id ?? null, proposedLabel: result.candidate?.label ?? null, applied: { provider: applied.provider, model: applied.model, reasoningEffort: applied.reasoningEffort }, confidence: result.confidence, probabilities: result.probabilities ?? null, elapsedMs: result.elapsedMs, backendModel: result.backendModel ?? null, decisionLocation: result.decisionLocation ?? null });
      if (receipts.length > 200) receipts.shift();
    }
    // A turn uses one decision even when the real DSH loop performs several tool steps.
    return applied;
  }));
}
