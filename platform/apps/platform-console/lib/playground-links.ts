import type { ModelCard, ModelDetail } from "@/types/domain";

export type PlaygroundLaunchPreset = {
  model: string;
  prompt: string;
  source: "catalog" | "detail";
  sourceModelId: string;
  sourceName: string;
  sourceSummary?: string;
  requestedModelId: string;
  requestedModelName: string;
};

type LaunchableModel = Pick<ModelCard, "id" | "publicName" | "summary" | "modalities">;

const providerModelIDPrefix = "provider__";

export function buildPlaygroundHref(model: LaunchableModel, source: PlaygroundLaunchPreset["source"] = "catalog") {
  const resolvedModel = resolvePlayableModel(model);
  const prompt = defaultPromptForModel(resolvedModel, model.publicName);
  const query = new URLSearchParams({
    model: resolvedModel,
    prompt,
    source,
    source_model_id: model.id,
    source_name: model.publicName,
    requested_model_id: model.id,
    requested_model_name: model.publicName
  });

  if (model.summary.trim()) {
    query.set("source_summary", model.summary.trim());
  }

  return `/console/playground?${query.toString()}`;
}

export function readPlaygroundPreset(searchParams: { get(name: string): string | null }): PlaygroundLaunchPreset | null {
  const model = searchParams.get("model")?.trim();
  const sourceModelId = searchParams.get("source_model_id")?.trim();
  const sourceName = searchParams.get("source_name")?.trim();
  if (!model || !sourceModelId || !sourceName) {
    return null;
  }

  const sourceValue = searchParams.get("source")?.trim() === "detail" ? "detail" : "catalog";
  const requestedModelId = searchParams.get("requested_model_id")?.trim() || sourceModelId;
  const requestedModelName = searchParams.get("requested_model_name")?.trim() || sourceName;

  return {
    model,
    prompt: searchParams.get("prompt")?.trim() || defaultPromptForModel(model, sourceName),
    source: sourceValue,
    sourceModelId,
    sourceName,
    sourceSummary: searchParams.get("source_summary")?.trim() || undefined,
    requestedModelId,
    requestedModelName
  };
}

export function defaultPromptForModel(model: string, displayName?: string) {
  const subject = displayName?.trim() || model;
  switch (model) {
    case "reasoning-pro":
      return `请基于 ${subject} 给出一份简洁的能力验证结果，并说明适合的复杂推理场景。`;
    case "vision-pro":
      return `请确认你已收到图片输入，并结合 ${subject} 用一句中文描述图像内容。`;
    case "embedding-large":
      return `请说明 ${subject} 是否适合做向量检索，并解释它与对话模型的区别。`;
    default:
      return `请用两段中文介绍 ${subject} 的适用场景、输出风格与推荐使用方式。`;
  }
}

export function resolvePlayableModel(model: LaunchableModel | Pick<ModelDetail, "id" | "publicName" | "summary" | "modalities">) {
  if (!model.id.startsWith(providerModelIDPrefix)) {
    return model.id;
  }

  const hintedLogicalModels = extractLogicalModels(model.summary);
  if (hintedLogicalModels.length > 0) {
    return pickPreferredLogicalModel(hintedLogicalModels, model.modalities);
  }

  if (model.modalities.includes("image")) {
    return "vision-pro";
  }

  const normalized = `${model.id} ${model.publicName} ${model.summary}`.toLowerCase();
  if (normalized.includes("embedding")) {
    return "embedding-large";
  }
  if (normalized.includes("reason")) {
    return "reasoning-pro";
  }
  return "chat-pro";
}

function extractLogicalModels(summary: string) {
  const match = summary.match(/映射逻辑模型[:：]\s*([^。]+)/);
  if (!match?.[1]) {
    return [];
  }
  return match[1]
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickPreferredLogicalModel(logicalModels: string[], modalities: string[]) {
  if (logicalModels.includes("chat-pro")) {
    return "chat-pro";
  }
  if (logicalModels.includes("reasoning-pro")) {
    return "reasoning-pro";
  }
  if (modalities.includes("image") && logicalModels.includes("vision-pro")) {
    return "vision-pro";
  }
  if (logicalModels.includes("embedding-large")) {
    return "embedding-large";
  }
  return logicalModels[0] ?? "chat-pro";
}
