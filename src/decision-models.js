// These are local decision backends, separate from DSH's execution model providers.
export const DECISION_MODELS = Object.freeze([
  Object.freeze({ id: 'laya', label: 'Laya', experimental: false }),
  Object.freeze({ id: 'd1-3b', label: 'd1-3B', experimental: false }),
  Object.freeze({ id: 'd1-omni-600m', label: 'd1-omni-600M', experimental: true }),
]);

export function validateDecisionModel(value = 'laya') {
  if (value !== 'systemone-api' && !DECISION_MODELS.some(model => model.id === value)) throw new Error('请选择已支持的决策模型。');
  return value;
}
