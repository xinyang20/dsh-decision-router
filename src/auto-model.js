import { LlmAdapter, LlmError } from '@deepseek-ai/dsh-llm';

export const AUTO_PROVIDER = 'dsh-auto-router';
export const AUTO_MODEL = 'auto';

export function isAutoModel(selection) {
  return selection?.provider === AUTO_PROVIDER && (selection.model ?? selection.id) === AUTO_MODEL;
}

/** Advertise routing intent through DSH's native model catalog and durable selection. */
export async function registerAutoModel(ctx) {
  const modelInfo = () => ({
    provider: AUTO_PROVIDER,
    id: AUTO_MODEL,
    name: '自动',
    description: '根据任务用途选择执行模型和推理强度。',
    inputModalities: ['text'],
  });
  class AutoModelAdapter extends LlmAdapter {
    providerInfo(provider) {
      return { id: provider, name: '自动选模' };
    }
    async listModels() {
      return [modelInfo()];
    }
    async resolveModel(provider, model, signal) {
      signal?.throwIfAborted();
      if (!isAutoModel({ provider, model })) throw new LlmError('自动选模入口不存在，请重新选择模型。', 'AUTO_MODEL_UNAVAILABLE');
      // Capabilities and limits belong to the executor chosen by agent/request.
      // In particular, effort must come from that route's saved configuration.
      return modelInfo();
    }
    async *stream(options) {
      options.signal?.throwIfAborted();
      throw new LlmError('自动选模尚未解析到可用的执行模型。请检查路由配置，或在模型选择器中选择具体模型。', 'AUTO_ROUTING_REQUIRED');
    }
  }
  return ctx.llm.registerAdapter([AUTO_PROVIDER], new AutoModelAdapter());
}
