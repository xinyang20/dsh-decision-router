const efforts = { default: '模型默认', none: '关闭', off: '关闭', minimal: '最低', low: '低', medium: '中', high: '高', xhigh: '极高', max: '最高', ultra: '超高', auto: '自动' };
const fixtures = { fast: '轻量执行端', standard: '常规执行端', strong: '强能力执行端' };

// Translate display labels only; provider/model/effort identifiers stay unchanged.
export function effortLabel(value, name) {
  if (!value) return '模型默认';
  if (name && /[\u3400-\u9fff]/.test(name)) return name;
  return efforts[value.toLowerCase()] ?? name ?? value;
}

export function modelLabel(provider, model, name) {
  if (provider === 'dsh-auto-router' && model === 'auto') return '自动';
  return (provider === 'local-fixture' && fixtures[model]) || name || model || '等待任务';
}

const reasons = {
  'system-one': '决策模型自动选择', 'manual-pin': '手动指定',
  'low-confidence': '置信度不足，已回退', 'decision-timeout': '决策超时，已回退',
  'decision-unavailable': '决策服务未连接，已回退', 'state-too-long': '文本过长，已回退',
  'decision-input-truncated': '输入被截断，已回退', 'non-text-input': '保留当前多模态设置',
  'fallback-unavailable': '回退模型不可用', 'manual-pin-unavailable': '指定模型不可用',
  'invalid-choice': '决策返回了无效选项，已回退', 'invalid-probabilities': '决策概率无效，已回退',
  'decision-http-error': '决策服务响应异常，已回退', 'decision-response-too-large': '决策响应过长，已回退',
  'no-user-text': '没有可用于选模的文本，已回退', 'insufficient-candidates': '可用档位不足，已回退', 'decision-error': '决策发生异常，已回退',
  'decision-model-not-installed': '本地决策模型未安装，已回退',
  'decision-model-unavailable': '本地决策模型不可用，已回退',
  'decision-auth-error': '决策 API 认证失败，已回退',
};
export const reasonLabel = reason => reasons[reason] ?? '本次未能完成自动选择';

export function decisionModelLabel(model) {
  if (!model || model === 'unknown') return '未记录';
  const id = model.toLowerCase().split('/').at(-1);
  return ({ laya: 'Laya', 'laya-multilingual': 'Laya', 'd1-3b': 'd1-3B', 'd1-omni-600m': 'd1-omni-600M', 'systemone-api': 'System One API（云端）' })[id] ?? model;
}

// Service readiness confirms the local manager, not that the chosen weights are loaded.
export function decisionModelStatus(service, id) {
  if (id === 'systemone-api') return { name: 'System One API（云端）', ready: false, text: '云端决策 · 数据将发送至提供商' };
  const model = service?.models?.find(model => model.id === id);
  const name = model?.label ?? model?.name ?? decisionModelLabel(id);
  if (!service) return { name, ready: false, installed: undefined, text: `${name} · 正在读取本地状态` };
  if (!service.ready) return { name, ready: false, installed: model?.installed, text: `${name} · 本地服务未连接` };
  if (service.loading === id) return { name, ready: false, installed: model?.installed, text: `${name} · 正在加载` };
  if (model?.installed === false) return { name, ready: false, installed: false, text: `${name} · 未安装` };
  if (service.model === id) return { name, ready: true, installed: model?.installed, text: `${name} · 已加载` };
  return { name, ready: model?.installed === true, installed: model?.installed, text: `${name} · ${model?.installed === true ? '已安装，按需加载' : '安装状态待确认'}` };
}
