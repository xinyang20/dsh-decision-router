import { localEndpoint, localRequest } from './decision.js';
import { DECISION_MODELS } from './decision-models.js';

export const API = '/dsh-auto-router/api';

function failure(status, message) {
  return Object.assign(new Error(message), { status });
}

export function admitLocal(req, connection) {
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) throw failure(403, '仅允许本机访问。');
  const host = req.headers.host;
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host ?? '')) throw failure(403, '请求主机不受信任。');
  if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && req.headers.origin !== `http://${host}`)) throw failure(403, '请求来源不匹配。');
  const result = connection.admit(req);
  if ('rejection' in result) throw failure(result.rejection, '请通过 DSH 的本地登录链接打开页面。');
}

async function body(req) {
  if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') throw failure(415, '请使用 JSON 请求。');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 65536) throw failure(413, '请求过长。');
    chunks.push(Buffer.from(chunk));
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
    return data;
  } catch { throw failure(400, 'JSON 格式不正确。'); }
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
}

export function mountWeb(ctx, router, control) {
  let health;
  let healthAt = 0;
  let healthPending;
  async function serviceHealth() {
    if (Date.now() - healthAt < 3000) return health;
    healthPending ??= (async () => {
      try {
        const response = await localRequest(new URL('/health', localEndpoint(router.config.endpoint)), { signal: AbortSignal.timeout(1500) });
        if (response.status !== 200) throw new Error();
        const data = response.body;
        const managed = data.service === 'dsh-local-decisions' && data.offline === true && data.isolation === 'macos-sandbox';
        health = { ready: managed && data.ready === true, offline: managed, model: data.model, loading: data.loading ?? null, device: data.device, isolation: data.isolation,
          models: DECISION_MODELS.map(model => ({ ...model, installed: managed && data.models?.some(item => item.id === model.id && item.installed === true) === true })) };
      } catch { health = { ready: false, offline: false, model: null, loading: null, models: DECISION_MODELS.map(model => ({ ...model, installed: false })) }; }
      healthAt = Date.now();
      healthPending = undefined;
      return health;
    })();
    return healthPending;
  }
  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: API, handler: async (req, res) => {
    try {
      admitLocal(req, ctx.connection);
      const route = new URL(req.url, `http://${req.headers.host}`).pathname.slice(API.length);
      if (req.method === 'GET' && route === '/state') {
        const preview = ctx.get('autoRouterPreview');
        return json(res, 200, {
          service: await serviceHealth(),
          candidates: router.config.candidates,
          modelSettings: control.models.snapshot(),
          minConfidence: router.config.minConfidence,
          fallback: router.config.fallback,
          preview: preview?.info ?? null,
          sessions: ctx.agents.list().map(agent => ({ id: agent.id, title: agent.session.header.title || (agent.id === preview?.info.sessionId ? '自动选模体验' : `对话 ${agent.id.slice(0, 8)}`), ...control.snapshot(agent) })),
          receipts: control.receipts(),
        });
      }
      if (req.method === 'GET' && route === '/models') {
        const service = await serviceHealth();
        return json(res, 200, { ...await control.models.catalog(), decisionModels: service.models, decisionService: service });
      }
      if (req.method === 'POST' && route === '/models') return json(res, 200, await control.models.save(await body(req)));
      if (req.method === 'POST' && route === '/preferences') return json(res, 200, await control.models.preferences(await body(req)));
      if (req.method === 'POST' && route === '/settings') {
        const data = await body(req);
        const agent = typeof data.sessionId === 'string' ? ctx.agents.get(data.sessionId) : undefined;
        if (!agent) throw failure(404, '请先打开一个对话。');
        if (!['auto', 'shadow', 'off'].includes(data.mode)) throw failure(400, '无效的路由模式。');
        if (data.pin !== null && !router.config.candidates.some(candidate => candidate.id === data.pin)) throw failure(400, '无效的执行模型。');
        control.setMode(agent, data.mode);
        control.pin(agent, data.pin);
        return json(res, 200, control.snapshot(agent));
      }
      if (req.method === 'POST' && route === '/trial') {
        const preview = ctx.get('autoRouterPreview');
        if (!preview) throw failure(404, '当前宿主未启用本地试用。');
        const data = await body(req);
        if (typeof data.prompt !== 'string' || !data.prompt.trim() || data.prompt.length > 3000) throw failure(400, '请输入 1–3000 字符的任务。');
        return json(res, 200, await preview.run(data.prompt.trim()));
      }
      throw failure(404, '接口不存在。');
    } catch (error) {
      if (!res.headersSent) json(res, error.status ?? 500, { message: error.status ? error.message : '操作失败，请重试。' });
      else res.destroy();
    }
  } }));
}
