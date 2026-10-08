import { mkdir, readFile, rename, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { normalizeConfig } from './router.js';
import { AUTO_PROVIDER } from './auto-model.js';
import { CLOUD_DECISION_MODEL, normalizeCloudDecision, publicCloudDecision } from './cloud-config.js';

const fail = (status, message) => Object.assign(new Error(message), { status });

const legacyDescriptions = {
  fast: new Map([
    ['Fast, lowest-cost executor for greetings, translation, formatting, and simple factual questions.', '响应快速、成本最低，适合问候、翻译、格式整理和简单事实问答。'],
    ['Simple formatting and factual questions.', '适合简单格式整理和事实问答。'],
  ]),
  standard: new Map([
    ['Balanced coding executor for implementing a single function, ordinary bug fixes, and routine unit tests.', '能力与成本均衡，适合单个函数的实现、常规缺陷修复和普通单元测试。'],
  ]),
  strong: new Map([
    ['Strong reasoning executor for architecture, difficult mathematics, concurrency bugs, security analysis, and complex changes across multiple modules.', '推理能力较强，适合架构设计、复杂数学、并发缺陷、安全分析及跨多个模块的复杂修改。'],
    ['Complex coding, architecture, and reasoning.', '适合复杂编程、架构设计和推理任务。'],
  ]),
};

// Translate only untouched built-in descriptions. User labels, notes, and custom routes are preserved.
function migrateDescriptions(candidates, originals) {
  return candidates.map((candidate, index) => {
    const original = originals[index];
    if (original.provider !== 'local-fixture' || original.id !== original.model) return candidate;
    const description = Object.hasOwn(legacyDescriptions, original.id) ? legacyDescriptions[original.id].get(original.description) : undefined;
    return description ? { ...candidate, description } : candidate;
  });
}

async function persistSettings(file, settings) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(temporary, JSON.stringify(settings, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    await rename(temporary, file);
  } catch { throw fail(500, '本地配置保存失败，原设置已保留。'); }
  finally { await rm(temporary, { force: true }).catch(() => {}); }
}

function modeFrom(value, current) {
  if (value === undefined) return current;
  if (!['auto', 'shadow', 'off'].includes(value)) throw fail(400, '请选择自动选择、仅观察或暂停决策。');
  return value;
}

// Execution credentials stay in DSH's provider settings. A cloud decision key
// is held only in the private server configuration and its owner-only file.
function candidatesFrom(data, { allowEmpty = false } = {}) {
  if (allowEmpty && Array.isArray(data) && data.length === 0) return [];
  if (!Array.isArray(data) || data.length < 2 || data.length > 6) throw fail(400, '请配置 2–6 个路由档位。');
  const ids = new Set();
  return data.map(item => {
    if (!item || typeof item.id !== 'string' || !/^[a-z][a-z0-9_-]{0,31}$/.test(item.id) || ids.has(item.id)) throw fail(400, '路由标识无效或重复。');
    const { id } = item;
    ids.add(id);
    for (const field of ['provider', 'model', 'description']) {
      if (typeof item[field] !== 'string' || !item[field].trim() || item[field].length > (field === 'description' ? 1000 : 200)) throw fail(400, '每个档位的供应商、模型和用途描述必须填写，且不能过长。');
    }
    if (typeof item.label !== 'string' || !item.label.trim() || item.label.length > 60) throw fail(400, '请为每个档位填写不超过 60 字符的名称。');
    if (item.extraDescription !== undefined && (typeof item.extraDescription !== 'string' || item.extraDescription.length > 1000)) throw fail(400, '补充说明不能超过 1000 字符。');
    if (item.reasoningEffort !== undefined && (typeof item.reasoningEffort !== 'string' || !item.reasoningEffort.trim() || item.reasoningEffort.length > 100)) throw fail(400, '推理强度无效。');
    return { id, label: item.label.trim(), provider: item.provider.trim(), model: item.model.trim(), description: item.description.trim(), extraDescription: item.extraDescription?.trim() ?? '', ...(item.reasoningEffort === undefined ? {} : { reasoningEffort: item.reasoningEffort }) };
  });
}

export async function createModelSettings(router) {
  const file = router.config.modelsFile;
  if (file !== undefined && (typeof file !== 'string' || !path.isAbsolute(file))) throw new Error('模型配置文件必须使用本地绝对路径。');
  let revision = 0;
  if (file) {
    try {
      const saved = JSON.parse(await readFile(file, 'utf8'));
      if (!Number.isSafeInteger(saved.revision) || saved.revision < 1) throw new Error('已保存的模型配置版本无效。');
      const originalCandidates = candidatesFrom(saved.candidates, { allowEmpty: true });
      const candidates = migrateDescriptions(originalCandidates, saved.candidates);
      const proposed = normalizeConfig({ ...router.config, candidates, mode: modeFrom(saved.mode, router.config.mode), fallback: saved.fallback, sidebarEnabled: saved.sidebarEnabled, decisionModel: saved.decisionModel === undefined ? 'laya' : saved.decisionModel, cloudDecision: normalizeCloudDecision(saved.cloudDecision, router.config.cloudDecision) });
      const migrated = saved.mode === undefined || saved.decisionModel === undefined || candidates.some((candidate, index) => candidate.description !== originalCandidates[index].description);
      revision = saved.revision + (migrated ? 1 : 0);
      if (migrated) await persistSettings(file, persisted(proposed, revision));
      router.config = proposed;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  let queue = Promise.resolve();
  const snapshot = () => ({ candidates: structuredClone(router.config.candidates), mode: router.config.mode, fallback: router.config.fallback, sidebarEnabled: router.config.sidebarEnabled, decisionModel: router.config.decisionModel ?? 'laya', ...(router.config.cloudDecision ? { cloudDecision: publicCloudDecision(router.config.cloudDecision) } : {}), revision, persistent: Boolean(file) });
  function persisted(config, revision) {
    return { revision, candidates: config.candidates, mode: config.mode, fallback: config.fallback, sidebarEnabled: config.sidebarEnabled, decisionModel: config.decisionModel, ...(config.cloudDecision ? { cloudDecision: config.cloudDecision } : {}) };
  }
  function enqueue(change) {
    const pending = queue.then(change);
    queue = pending.catch(() => {});
    return pending;
  }
  async function commit(proposed) {
    const nextRevision = revision + 1;
    if (file) await persistSettings(file, persisted(proposed, nextRevision));
    // Commit only after persistence succeeds. In-flight turns retain their previous config.
    router.config = proposed;
    revision = nextRevision;
    return snapshot();
  }
  return {
    snapshot,
    async catalog() {
      const providers = await Promise.all(router.llm.listProviders().filter(provider => provider.id !== AUTO_PROVIDER).map(async provider => {
        const name = provider.id === 'local-fixture' ? '本地测试执行端' : provider.name || provider.id;
        try {
          const listed = await router.llm.listModels(provider.id);
          const models = await Promise.all(listed.map(async model => {
            try {
              const info = await router.llm.resolveModelInfo(provider.id, model.id, AbortSignal.timeout(5000));
              return { id: model.id, name: model.name, available: true, efforts: info.reasoning?.efforts?.map(({ id, name }) => ({ id, name })) ?? [] };
            } catch { return { id: model.id, name: model.name, available: false, efforts: [] }; }
          }));
          return { id: provider.id, name, models };
        } catch { return { id: provider.id, name, models: [], error: '模型列表暂不可用。' }; }
      }));
      return { ...snapshot(), providers };
    },
    preferences(data) {
      return enqueue(async () => {
        if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).some(key => !['revision', 'mode', 'sidebarEnabled'].includes(key))) throw fail(400, '此接口仅接受路由策略和侧边栏开关。');
        if (data.revision !== revision) throw fail(409, '配置已在其他页面更新，请重新载入后再保存。');
        if (data.mode === undefined && data.sidebarEnabled === undefined) throw fail(400, '请选择要更新的设置。');
        if (data.sidebarEnabled !== undefined && typeof data.sidebarEnabled !== 'boolean') throw fail(400, '侧边栏开关无效。');
        const proposed = Object.freeze({ ...router.config, mode: modeFrom(data.mode, router.config.mode), sidebarEnabled: data.sidebarEnabled ?? router.config.sidebarEnabled });
        // Preference changes never resolve execution models or inspect API availability.
        return commit(proposed);
      });
    },
    save(data) {
      const save = async () => {
        if (data.revision !== revision) throw fail(409, '配置已在其他页面更新，请重新载入后再保存。');
        const candidates = candidatesFrom(data.candidates);
        if (typeof data.sidebarEnabled !== 'boolean') throw fail(400, '侧边栏开关无效。');
        if (!candidates.some(candidate => candidate.id === data.fallback)) throw fail(400, '请选择一个有效的回退档位。');
        let proposed;
        try {
          const decisionModel = data.decisionModel === undefined ? router.config.decisionModel ?? 'laya' : data.decisionModel;
          if (decisionModel === CLOUD_DECISION_MODEL && router.config.decisionModel !== CLOUD_DECISION_MODEL && data.cloudDecision?.consent === undefined) throw new Error('启用云端决策前，请重新确认将任务内容发送至所选地址和模型。');
          const cloudDecision = normalizeCloudDecision(data.cloudDecision, router.config.cloudDecision);
          proposed = normalizeConfig({ ...router.config, candidates, mode: modeFrom(data.mode, router.config.mode), fallback: data.fallback, sidebarEnabled: data.sidebarEnabled, decisionModel, cloudDecision });
        } catch (error) { throw fail(400, error.message); }
        for (const candidate of candidates) {
          try {
            const listed = await router.llm.listModels(candidate.provider);
            if (!listed.some(model => model.id === candidate.model) || !await router.eligible(candidate, AbortSignal.timeout(5000))) throw new Error();
          } catch { throw fail(400, `「${candidate.label}」的模型或推理强度不可用，请先在 DSH「设置 → 模型」配置供应商并刷新列表。`); }
        }
        return commit(proposed);
      };
      return enqueue(save);
    },
  };
}
