export const CLOUD_DECISION_MODEL = 'systemone-api';
export const DEFAULT_CLOUD_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
export const DEFAULT_CLOUD_MODEL = 'jev-latest';

function endpointFrom(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 2048 || /[\r\n]/.test(value)) throw new Error('请填写有效的云端决策 HTTPS 地址。');
  let url;
  try { url = new URL(value.trim()); } catch { throw new Error('请填写有效的云端决策 HTTPS 地址。'); }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password || url.href.includes('?') || url.href.includes('#')) throw new Error('云端决策地址必须使用 HTTPS，且不能包含用户名、密码、查询参数或片段。');
  return url.href;
}

// Returns the secret configuration for server-side use only. A missing value is
// valid for local models; a partial cloud draft is never a saved configuration.
export function normalizeCloudDecision(raw, previous) {
  if (raw === undefined) raw = previous;
  if (raw === undefined) return undefined;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('云端决策配置无效。');
  const endpoint = endpointFrom(raw.endpoint);
  if (typeof raw.model !== 'string' || !raw.model.trim() || raw.model.length > 100 || /[\r\n]/.test(raw.model)) throw new Error('请填写不超过 100 字符的云端决策模型名称。');
  const model = raw.model.trim();
  const apiKey = raw.apiKey === undefined && previous?.endpoint === endpoint ? previous.apiKey : raw.apiKey;
  if (typeof apiKey !== 'string' || !apiKey.trim() || apiKey.length > 4096 || /[\r\n\u2028\u2029]/.test(apiKey)) throw new Error('请填写有效的云端 API Key；更改地址后必须重新填写，且密钥不能包含换行。');
  const consent = raw.consent;
  if (!consent || typeof consent !== 'object' || Array.isArray(consent) || consent.version !== 1 || consent.model !== model) throw new Error('请明确确认将任务内容发送至当前云端决策地址和模型。');
  let consentEndpoint;
  try { consentEndpoint = endpointFrom(consent.endpoint); } catch { throw new Error('请明确确认将任务内容发送至当前云端决策地址和模型。'); }
  if (consentEndpoint !== endpoint) throw new Error('云端地址或模型已变化，请重新确认任务内容的发送范围。');
  return Object.freeze({ endpoint, model, apiKey: apiKey.trim(), consent: Object.freeze({ version: 1, endpoint, model }) });
}

export function publicCloudDecision(config) {
  if (!config) return undefined;
  return { endpoint: config.endpoint, model: config.model, hasApiKey: Boolean(config.apiKey), consent: { version: config.consent.version, endpoint: config.consent.endpoint, model: config.consent.model } };
}
