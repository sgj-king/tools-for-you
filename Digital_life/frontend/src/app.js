const $ = (selector) => document.querySelector(selector);

const CHAT_PAGE_SIZE = 12;

const state = {
  leftOpen: true,
  rightOpen: true,
  inputMode: "text",
  outputMode: "voice",
  attachedImage: null,
  ttsVoice: "zh-CN-XiaoxiaoNeural",
  ttsSpeed: 1.05,
  environmentTrend: [22, 28, 31, 25, 36, 23, 29, 38, 27, 35, 41, 33],
  platformLinks: {},
  platformUser: null,
  platformMenuOpen: false,
  messages: [],
  chatPage: 0,
  pendingAi: null,
};

const featuredModels = [
  {
    id: "claude",
    name: "Claude",
    provider: "Anthropic",
    icon: "/assets/model-icons/claude.svg",
    summary: "擅长长文本理解、复杂推理、代码协作和高质量写作，适合需要稳健上下文处理的工作流。",
    tags: ["长上下文", "推理", "写作", "代码"],
  },
  {
    id: "gemini",
    name: "Gemini",
    provider: "Google DeepMind",
    icon: "/assets/model-icons/gemini.svg",
    summary: "面向多模态理解和搜索增强场景，适合图文信息整理、知识问答和跨工具任务。",
    tags: ["多模态", "检索", "Agent", "知识"],
  },
  {
    id: "codex",
    name: "Codex",
    provider: "OpenAI",
    icon: "/assets/model-icons/codex.svg",
    summary: "面向真实代码仓库的编程助手，适合读代码、改代码、运行验证和协作式软件开发。",
    tags: ["代码仓库", "自动化", "测试", "工程"],
  },
  {
    id: "kimi",
    name: "Kimi",
    provider: "Moonshot AI",
    icon: "/assets/model-icons/kimi.svg",
    summary: "中文长文本和资料阅读体验突出，适合文档分析、知识库问答和内容总结。",
    tags: ["中文", "长文本", "文档", "总结"],
  },
  {
    id: "qwen",
    name: "Qwen",
    provider: "Alibaba Cloud",
    icon: "/assets/model-icons/qwen.svg",
    summary: "覆盖通用对话、代码、多模态和开源部署生态，适合平台接入和本地化扩展。",
    tags: ["开源生态", "通用", "代码", "多模态"],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    provider: "DeepSeek",
    icon: "/assets/model-icons/deepseek.svg",
    summary: "在推理、数学和代码任务中表现活跃，适合成本敏感的高强度推理链路。",
    tags: ["推理", "数学", "代码", "性价比"],
  },
  {
    id: "doubao",
    name: "Doubao",
    provider: "ByteDance",
    icon: "/assets/model-icons/doubao.svg",
    summary: "偏向中文业务场景和多模态产品集成，适合内容生成、客服和企业应用。",
    tags: ["中文业务", "多模态", "内容", "应用"],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    provider: "Perplexity AI",
    icon: "/assets/model-icons/perplexity.svg",
    summary: "以搜索增强问答和来源追踪见长，适合需要实时信息核验的研究型场景。",
    tags: ["搜索增强", "来源", "研究", "问答"],
  },
  {
    id: "sora",
    name: "Sora",
    provider: "OpenAI",
    icon: "/assets/model-icons/sora.svg",
    summary: "面向视频生成和视觉叙事任务，适合创意视频、镜头设计和多媒体内容生产。",
    tags: ["视频", "创意", "视觉", "生成"],
  },
  {
    id: "mistral",
    name: "Mistral",
    provider: "Mistral AI",
    icon: "/assets/model-icons/mistral.svg",
    summary: "欧洲 AI 模型生态代表之一，适合通用推理、企业部署和开放模型方案。",
    tags: ["开放模型", "企业", "推理", "部署"],
  },
  {
    id: "zhipu",
    name: "Zhipu",
    provider: "智谱 AI",
    icon: "/assets/model-icons/zhipu.svg",
    summary: "GLM 系列生态覆盖中文对话、多模态和智能体应用，适合国内业务集成。",
    tags: ["GLM", "中文", "智能体", "多模态"],
  },
  {
    id: "hunyuan",
    name: "Hunyuan",
    provider: "Tencent",
    icon: "/assets/model-icons/hunyuan.svg",
    summary: "腾讯混元生态适合企业应用、办公协作、内容理解和多模态能力接入。",
    tags: ["企业", "办公", "腾讯云", "多模态"],
  },
  {
    id: "wenxin",
    name: "Wenxin",
    provider: "Baidu",
    icon: "/assets/model-icons/wenxin.svg",
    summary: "文心生态覆盖中文知识、搜索和行业应用，适合知识问答与业务流程自动化。",
    tags: ["中文知识", "搜索", "行业", "自动化"],
  },
  {
    id: "minimax",
    name: "MiniMax",
    provider: "MiniMax",
    icon: "/assets/model-icons/minimax.svg",
    summary: "面向对话、语音和多模态交互，适合角色陪伴、内容生成和实时互动体验。",
    tags: ["对话", "语音", "角色", "互动"],
  },
  {
    id: "chatglm",
    name: "ChatGLM",
    provider: "智谱 AI",
    icon: "/assets/model-icons/chatglm.svg",
    summary: "GLM 生态中的对话模型系列，适合中文问答、知识助手、代码辅助和企业应用集成。",
    tags: ["中文", "对话", "代码", "企业"],
  },
  {
    id: "yi",
    name: "Yi",
    provider: "01.AI",
    icon: "/assets/model-icons/yi.svg",
    summary: "面向通用语言理解和生成的模型系列，适合中文内容处理、摘要和多场景助手能力。",
    tags: ["中文", "通用", "摘要", "助手"],
  },
  {
    id: "baichuan",
    name: "Baichuan",
    provider: "百川智能",
    icon: "/assets/model-icons/baichuan.svg",
    summary: "覆盖中文知识问答、搜索增强和行业应用，适合企业知识库和业务流程自动化。",
    tags: ["知识库", "搜索", "行业", "中文"],
  },
  {
    id: "spark",
    name: "Spark",
    provider: "讯飞星火",
    icon: "/assets/model-icons/spark.svg",
    summary: "中文语音、教育、办公和通用问答生态较完整，适合语音交互和中文业务场景。",
    tags: ["语音", "教育", "办公", "中文"],
  },
  {
    id: "yuanbao",
    name: "Yuanbao",
    provider: "Tencent",
    icon: "/assets/model-icons/yuanbao.svg",
    summary: "腾讯元宝面向日常问答、内容生成和办公场景，适合和腾讯生态服务联动。",
    tags: ["办公", "内容", "腾讯", "问答"],
  },
  {
    id: "gemma",
    name: "Gemma",
    provider: "Google",
    icon: "/assets/model-icons/gemma.svg",
    summary: "Google 开放模型系列，适合轻量部署、实验验证、微调和本地推理场景。",
    tags: ["开放模型", "轻量", "微调", "本地"],
  },
  {
    id: "llava",
    name: "LLaVA",
    provider: "LLaVA",
    icon: "/assets/model-icons/llava.svg",
    summary: "经典开源视觉语言模型方向，适合图像理解、视觉问答和多模态实验。",
    tags: ["视觉语言", "图像理解", "开源", "多模态"],
  },
  {
    id: "cohere",
    name: "Cohere",
    provider: "Cohere",
    icon: "/assets/model-icons/cohere.svg",
    summary: "面向企业检索增强、嵌入、重排序和文本生成，适合 RAG 与知识系统建设。",
    tags: ["RAG", "嵌入", "重排序", "企业"],
  },
  {
    id: "dalle",
    name: "DALL·E",
    provider: "OpenAI",
    icon: "/assets/model-icons/dalle.svg",
    summary: "图像生成模型系列，适合创意视觉、概念图、产品图和内容生产。",
    tags: ["图像生成", "创意", "视觉", "设计"],
  },
  {
    id: "kling",
    name: "Kling",
    provider: "Kuaishou",
    icon: "/assets/model-icons/kling.svg",
    summary: "视频生成和视觉创作工具生态，适合短视频创意、镜头运动和视觉叙事。",
    tags: ["视频生成", "视觉", "创意", "镜头"],
  },
  {
    id: "hailuo",
    name: "Hailuo",
    provider: "MiniMax",
    icon: "/assets/model-icons/hailuo.svg",
    summary: "面向视频生成与创意互动的模型产品，适合短片、动态海报和内容营销。",
    tags: ["视频", "创意", "互动", "内容"],
  },
  {
    id: "luma",
    name: "Luma",
    provider: "Luma AI",
    icon: "/assets/model-icons/luma.svg",
    summary: "面向视频、3D 和视觉生成工作流，适合创意素材、动态镜头和空间内容探索。",
    tags: ["视频", "3D", "视觉", "生成"],
  },
  {
    id: "stability",
    name: "Stability",
    provider: "Stability AI",
    icon: "/assets/model-icons/stability.svg",
    summary: "Stable Diffusion 生态代表，适合图像生成、风格化、编辑和可控视觉工作流。",
    tags: ["图像", "开源生态", "风格化", "编辑"],
  },
  {
    id: "nvidia",
    name: "NVIDIA AI",
    provider: "NVIDIA",
    icon: "/assets/model-icons/nvidia.svg",
    summary: "提供推理加速、模型服务和多模态 AI 基础设施，适合高性能部署与企业平台。",
    tags: ["推理加速", "基础设施", "部署", "企业"],
  },
  {
    id: "siliconcloud",
    name: "SiliconCloud",
    provider: "SiliconFlow",
    icon: "/assets/model-icons/siliconcloud.svg",
    summary: "聚合多类开源与商业模型服务，适合快速接入、模型切换和推理 API 调度。",
    tags: ["模型聚合", "API", "开源模型", "调度"],
  },
  {
    id: "modelscope",
    name: "ModelScope",
    provider: "ModelScope",
    icon: "/assets/model-icons/modelscope.svg",
    summary: "模型社区和部署生态，适合发现开源模型、试验能力和构建本地推理链路。",
    tags: ["模型社区", "开源", "部署", "实验"],
  },
];

const els = {
  leftCollapse: $("#leftCollapse"),
  rightCollapse: $("#rightCollapse"),
  leftRail: $("#leftRail"),
  rightRail: $("#rightRail"),
  chatInput: $("#chatInput"),
  sendButton: $("#sendButton"),
  micButton: $("#micButton"),
  emojiButton: $("#emojiButton"),
  imageButton: $("#imageButton"),
  imageInput: $("#imageInput"),
  voicePlayer: $("#voicePlayer"),
  chatHistory: $("#chatHistory"),
  chatEmpty: $("#chatEmpty"),
  chatCount: $("#chatCount"),
  chatPagePrev: $("#chatPagePrev"),
  chatPageNext: $("#chatPageNext"),
  chatPageIndicator: $("#chatPageIndicator"),
  profileTier: $("#profileTier"),
  profileMood: $("#profileMood"),
  memoryDrawer: $("#memoryDrawer"),
  memoryQuery: $("#memoryQuery"),
  memorySearchButton: $("#memorySearchButton"),
  rememberButton: $("#rememberButton"),
  drawerTitle: $("#drawerTitle"),
  drawerContent: $("#drawerContent"),
  platformAccount: $("#platformAccount"),
  platformEntryLink: $("#platformEntryLink"),
  itToolsEntryLink: $("#itToolsEntryLink"),
  platformProfile: $("#platformProfile"),
  platformProfileButton: $("#platformProfileButton"),
  platformProfileAvatar: $("#platformProfileAvatar"),
  platformProfileInitials: $("#platformProfileInitials"),
  platformProfileName: $("#platformProfileName"),
  platformProfileRole: $("#platformProfileRole"),
  platformProfileMenu: $("#platformProfileMenu"),
  platformAvatarInput: $("#platformAvatarInput"),
  platformMenuAvatar: $("#platformMenuAvatar"),
  platformMenuInitials: $("#platformMenuInitials"),
  platformMenuName: $("#platformMenuName"),
  platformMenuEmail: $("#platformMenuEmail"),
  platformMenuOrg: $("#platformMenuOrg"),
  platformDisplayNameInput: $("#platformDisplayNameInput"),
  platformAvatarButton: $("#platformAvatarButton"),
  platformSaveNameButton: $("#platformSaveNameButton"),
  platformConsoleLink: $("#platformConsoleLink"),
  platformLogoutButton: $("#platformLogoutButton"),
  platformProfileMessage: $("#platformProfileMessage"),
  modelOrbitTrack: $("#modelOrbitTrack"),
  modelInfoDialog: $("#modelInfoDialog"),
  modelInfoIcon: $("#modelInfoIcon"),
  modelInfoTitle: $("#modelInfoTitle"),
  modelInfoProvider: $("#modelInfoProvider"),
  modelInfoSummary: $("#modelInfoSummary"),
  modelInfoMeta: $("#modelInfoMeta"),
  modelInfoSource: $("#modelInfoSource"),
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  return response.json();
}

function setPanel(side, open) {
  if (side === "left") {
    state.leftOpen = open;
    document.body.classList.toggle("left-collapsed", !open);
  } else {
    state.rightOpen = open;
    document.body.classList.toggle("right-collapsed", !open);
  }
  document.body.classList.toggle("asleep", !state.leftOpen && !state.rightOpen);
}

function updateClock() {
  const now = new Date();
  const days = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  $("#clockTime").textContent = now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
  $("#clockDate").textContent = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${days[now.getDay()]}`;
}

function formatTime(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function totalChatPages() {
  return Math.max(1, Math.ceil(state.messages.length / CHAT_PAGE_SIZE));
}

function clampChatPage(page) {
  const total = totalChatPages();
  return Math.max(0, Math.min(total - 1, page));
}

function renderChatHistory({ stayOnPage = false } = {}) {
  if (!els.chatHistory) return;
  const total = totalChatPages();
  if (!stayOnPage) state.chatPage = total - 1;
  state.chatPage = clampChatPage(state.chatPage);

  if (els.chatCount) els.chatCount.textContent = String(state.messages.length);
  if (els.chatPageIndicator) {
    els.chatPageIndicator.textContent = `第 ${state.chatPage + 1} / ${total} 页`;
  }
  if (els.chatPagePrev) els.chatPagePrev.disabled = state.chatPage === 0;
  if (els.chatPageNext) els.chatPageNext.disabled = state.chatPage >= total - 1;

  if (!state.messages.length) {
    els.chatHistory.innerHTML = `
      <div class="chat-empty" id="chatEmpty">
        <p>把心里的小事悄悄告诉星语，</p>
        <p>对话会全部留在这里 ✨</p>
      </div>`;
    return;
  }

  const start = state.chatPage * CHAT_PAGE_SIZE;
  const slice = state.messages.slice(start, start + CHAT_PAGE_SIZE);
  els.chatHistory.innerHTML = slice
    .map((msg) => {
      const isUser = msg.role === "user";
      const cls = isUser ? "user" : "ai";
      const author = isUser ? "你" : "星语";
      const pending = msg.pending ? " pending" : "";
      const meta = msg.pending ? "（正在轻轻整理回答…）" : formatTime(msg.ts);
      return `
        <article class="chat-message ${cls}${pending}">
          <span class="chat-avatar ${cls}"></span>
          <div class="chat-bubble">
            <header><strong>${author}</strong><time>${meta}</time></header>
            <p>${escapeHtml(msg.text)}</p>
          </div>
        </article>`;
    })
    .join("");

  if (state.chatPage === total - 1) {
    requestAnimationFrame(() => {
      els.chatHistory.scrollTop = els.chatHistory.scrollHeight;
    });
  }
}

function appendMessage(role, text, opts = {}) {
  const msg = { role, text, ts: Date.now(), pending: Boolean(opts.pending) };
  state.messages.push(msg);
  if (opts.pending) state.pendingAi = msg;
  renderChatHistory();
  return msg;
}

function resolvePendingAi(text) {
  if (state.pendingAi) {
    state.pendingAi.text = text;
    state.pendingAi.pending = false;
    state.pendingAi.ts = Date.now();
    state.pendingAi = null;
    renderChatHistory({ stayOnPage: true });
  } else {
    appendMessage("ai", text);
  }
}

function updateMeters(payload) {
  const emotion = payload.emotion;
  const memory = payload.memory;
  const env = payload.environment;
  if (emotion) {
    setMeter("emotion", emotion.emotion_index ?? 92);
    setMeter("energy", emotion.energy ?? 85);
    setMeter("intimacy", emotion.intimacy ?? 100);
    $("#connectLabel").textContent = emotion.mood || "稳定";
    $("#calmValue").textContent = emotion.calm ?? 72;
    $("#curiosityValue").textContent = emotion.curiosity ?? 88;
    $("#resonanceValue").textContent = emotion.resonance ?? 91;
    if (els.profileMood) els.profileMood.textContent = emotion.mood || "稳定";
  }
  if (memory) {
    $("#firstMeet").textContent = memory.first_meet || "2026.05.11";
    $("#sharedTopics").textContent = memory.shared_topics ?? 0;
    $("#goodPhrases").textContent = memory.good_phrases ?? 0;
    $("#focusTag").textContent = memory.focus_tag || "未设置";
    drawRadar(memory);
  }
  if (env) {
    $("#envTemp").textContent = env.temperature || "-270.3°C";
    $("#envRegion").textContent = env.star_region || "M78 星云";
    $("#envSignal").textContent = env.signal || "98%";
    $("#envGravity").textContent = env.gravity || "0.01G";
    state.environmentTrend = env.trend || state.environmentTrend;
    drawTrend(state.environmentTrend);
  }
}

function setMeter(name, value) {
  $(`#${name}Value`).textContent = `${value}%`;
  $(`#${name}Meter`).style.width = `${value}%`;
}

async function sendMessage() {
  let message = els.chatInput.value.trim();
  if (state.attachedImage) {
    message += `\n（附加图像：${state.attachedImage.name}）`;
  }
  if (!message) return;

  els.chatInput.value = "";
  state.attachedImage = null;
  appendMessage("user", message);
  appendMessage("ai", "正在整理星尘里的回答…", { pending: true });
  els.sendButton.disabled = true;
  try {
    const payload = await api("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        input_mode: state.inputMode,
        output_mode: state.outputMode,
        voice: state.ttsVoice,
        tts_speed: state.ttsSpeed,
      }),
    });
    resolvePendingAi(payload.reply);
    updateMeters(payload);
    if ((state.outputMode === "voice" || state.outputMode === "both") && payload.reply && payload.reply.trim()) {
      await speak(payload.reply);
    }
  } catch (error) {
    const reply = "连接有点小波动呢，等我一会儿再说啦~";
    resolvePendingAi(reply);
    console.error(error);
  } finally {
    els.sendButton.disabled = false;
  }
}

async function speak(text) {
  const utteranceText = (text || "").trim();
  if (!utteranceText) return;
  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: utteranceText, voice: state.ttsVoice, speed: state.ttsSpeed, response_format: "mp3" }),
    });
    if (!response.ok) throw new Error(await response.text());
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    els.voicePlayer.src = url;
    await els.voicePlayer.play();
    els.voicePlayer.onended = () => URL.revokeObjectURL(url);
  } catch (error) {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(utteranceText);
      utterance.lang = "zh-CN";
      utterance.rate = state.ttsSpeed;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
    console.warn(error);
  }
}

function setupVoiceInput() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    els.micButton.addEventListener("click", () => {
      state.inputMode = "text";
      els.micButton.classList.remove("active");
    });
    return;
  }
  const recognition = new Recognition();
  recognition.lang = "zh-CN";
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.onstart = () => els.micButton.classList.add("active");
  recognition.onend = () => els.micButton.classList.remove("active");
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map((result) => result[0].transcript).join("");
    els.chatInput.value = transcript;
    if (event.results[event.results.length - 1].isFinal) {
      state.inputMode = "voice";
    }
  };
  els.micButton.addEventListener("click", () => recognition.start());
}

function openMemoryDrawer(mode = "memory") {
  els.drawerTitle.textContent = mode === "settings" ? "更多功能" : "记忆回溯";
  if (mode === "settings") {
    els.drawerContent.innerHTML = settingsMarkup();
    bindSettings();
  } else {
    els.drawerContent.innerHTML = "<div class='drawer-card'>星语正在等你输入检索词，或直接写入一条新的长期记忆。</div>";
  }
  els.memoryDrawer.showModal();
}

async function searchMemory() {
  const query = els.memoryQuery.value.trim();
  const payload = await api("/api/memory/search", {
    method: "POST",
    body: JSON.stringify({ query, top_k: 8 }),
  });
  if (!payload.hits.length) {
    els.drawerContent.innerHTML = "<div class='drawer-card'>没有找到相关记忆。</div>";
    return;
  }
  els.drawerContent.innerHTML = payload.hits
    .map((hit) => `<div class="drawer-card"><small>${escapeHtml(hit.source)} · ${hit.score.toFixed(1)}</small>${escapeHtml(hit.text)}</div>`)
    .join("");
  updateMeters({ memory: payload.memory });
}

async function rememberText() {
  const text = els.memoryQuery.value.trim();
  if (!text) return;
  const payload = await api("/api/memory", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  els.drawerContent.innerHTML = `<div class="drawer-card"><small>已写入长期记忆</small>${escapeHtml(payload.entry)}</div>`;
  updateMeters({ memory: payload.memory });
}

function settingsMarkup() {
  return `
    <div class="drawer-card">
      <small>输出模式</small>
      <label><input type="radio" name="outputMode" value="text" ${state.outputMode === "text" ? "checked" : ""}> 文本</label>
      <label><input type="radio" name="outputMode" value="voice" ${state.outputMode === "voice" ? "checked" : ""}> 语音</label>
      <label><input type="radio" name="outputMode" value="both" ${state.outputMode === "both" ? "checked" : ""}> 文本 + 语音</label>
    </div>
    <div class="drawer-card">
      <small>TTS 声线（默认偏温柔活泼的女声）</small>
      <select id="voiceSelect">
        ${[
          ["zh-CN-XiaoxiaoNeural", "晓晓 · 温柔活泼"],
          ["zh-CN-XiaoyiNeural", "晓伊 · 甜美轻柔"],
          ["zh-CN-XiaoshuangNeural", "晓双 · 童趣可爱"],
          ["zh-CN-XiaohanNeural", "晓涵 · 温暖大姐姐"],
          ["zh-CN-YunxiNeural", "云希 · 阳光男声"],
          ["zh-CN-YunjianNeural", "云健 · 沉稳男声"],
          ["nova", "Nova · 英文女声"],
          ["alloy", "Alloy · 英文中性"],
        ]
          .map(([value, label]) => `<option value="${value}" ${value === state.ttsVoice ? "selected" : ""}>${label}</option>`)
          .join("")}
      </select>
      <input id="speedRange" type="range" min="0.75" max="1.4" step="0.05" value="${state.ttsSpeed}">
    </div>
    <div class="drawer-card">
      <small>本地模型</small>
      <span id="llmInfo">读取中...</span>
    </div>
  `;
}

function bindSettings() {
  document.querySelectorAll("input[name='outputMode']").forEach((node) => {
    node.addEventListener("change", () => {
      state.outputMode = node.value;
    });
  });
  $("#voiceSelect").addEventListener("change", (event) => {
    state.ttsVoice = event.target.value;
  });
  $("#speedRange").addEventListener("input", (event) => {
    state.ttsSpeed = Number(event.target.value);
  });
  api("/api/health").then((payload) => {
    $("#llmInfo").textContent = `${payload.openclaw_model} · ${payload.openclaw_base_url}`;
  });
}

async function loadPlatformEntryLink() {
  if (!els.platformEntryLink) return;
  try {
    const payload = await api("/api/platform/home");
    state.platformLinks = payload?.links || {};
    renderPlatformAccount(null);
    if (payload?.links?.login) {
      els.platformEntryLink.href = payload.links.login;
    }
    if (els.platformConsoleLink && payload?.links?.console) {
      els.platformConsoleLink.href = payload.links.console;
    }
    if (els.itToolsEntryLink) {
      const itHref = payload?.links?.itTools || "";
      if (itHref) {
        els.itToolsEntryLink.href = itHref;
        els.itToolsEntryLink.hidden = false;
      } else {
        els.itToolsEntryLink.hidden = true;
      }
    }
    if (payload?.links?.sessionState) {
      const sessionResponse = await fetch(payload.links.sessionState, {
        cache: "no-store",
        credentials: "include"
      });
      if (sessionResponse.ok) {
        const sessionPayload = await sessionResponse.json();
        renderPlatformAccount(sessionPayload?.data?.authenticated ? sessionPayload.data.sessionUser : null);
      }
    }
  } catch (error) {
    console.warn(error);
    renderPlatformAccount(null);
  }
}

function renderPlatformAccount(user) {
  state.platformUser = user || null;
  const loggedIn = Boolean(state.platformUser);
  if (els.platformAccount) {
    els.platformAccount.dataset.state = loggedIn ? "member" : "guest";
  }
  if (els.platformEntryLink) {
    els.platformEntryLink.hidden = loggedIn;
    els.platformEntryLink.href = state.platformLinks.login || "#";
  }
  if (els.platformProfile) {
    els.platformProfile.hidden = !loggedIn;
  }
  if (!loggedIn) {
    closePlatformMenu();
    updatePlatformSaveButton();
    return;
  }

  const initials = getInitials(user.displayName);
  setAvatar(els.platformProfileAvatar, els.platformProfileInitials, user.avatarUrl, user.displayName, initials);
  setAvatar(els.platformMenuAvatar, els.platformMenuInitials, user.avatarUrl, user.displayName, initials);
  els.platformProfileName.textContent = user.displayName || "未登录用户";
  els.platformProfileRole.textContent = user.role || "member";
  els.platformMenuName.textContent = user.displayName || "未登录用户";
  els.platformMenuEmail.textContent = user.email || "-";
  els.platformMenuOrg.textContent = user.orgName || "-";
  els.platformDisplayNameInput.value = user.displayName || "";
  if (els.profileTier) {
    els.profileTier.textContent = user.tier || "free";
    els.profileTier.dataset.tier = (user.tier || "free").toLowerCase();
  }
  if (els.platformConsoleLink) {
    els.platformConsoleLink.href = state.platformLinks.console || "#";
  }
  updatePlatformSaveButton();
}

function updatePlatformSaveButton() {
  if (!els.platformSaveNameButton) return;
  const current = state.platformUser?.displayName || "";
  const draft = (els.platformDisplayNameInput?.value || "").trim();
  const canSave = Boolean(state.platformUser) && draft.length >= 2 && draft !== current;
  els.platformSaveNameButton.disabled = !canSave;
}

function setAvatar(img, fallback, src, displayName, initials) {
  if (!img || !fallback) return;
  if (src) {
    img.src = src;
    img.alt = displayName || "用户头像";
    img.hidden = false;
    fallback.hidden = true;
  } else {
    img.hidden = true;
    img.removeAttribute("src");
    fallback.textContent = initials;
    fallback.hidden = false;
  }
}

function getInitials(displayName = "") {
  const chunks = String(displayName).trim().split(/\s+/).filter(Boolean);
  if (!chunks.length) return "U";
  if (chunks.length === 1) return chunks[0].slice(0, 2).toUpperCase();
  return `${chunks[0][0] || ""}${chunks[1][0] || ""}`.toUpperCase();
}

function togglePlatformMenu(open = !state.platformMenuOpen) {
  state.platformMenuOpen = open;
  if (els.platformAccount) {
    els.platformAccount.dataset.open = String(open);
  }
  if (els.platformProfileMenu) {
    els.platformProfileMenu.hidden = !open;
  }
  if (els.platformProfileButton) {
    els.platformProfileButton.setAttribute("aria-expanded", String(open));
  }
  if (els.platformProfileMessage && open) {
    els.platformProfileMessage.textContent = "";
  }
}

function closePlatformMenu() {
  togglePlatformMenu(false);
}

async function platformSessionFetch(options = {}) {
  if (!state.platformLinks.sessionState) {
    throw new Error("平台会话接口尚未配置");
  }
  const response = await fetch(state.platformLinks.sessionState, {
    cache: "no-store",
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || response.statusText);
  }
  return payload;
}

async function savePlatformProfile(patch) {
  const payload = await platformSessionFetch({
    method: "PUT",
    body: JSON.stringify(patch),
  });
  renderPlatformAccount(payload?.data?.sessionUser || state.platformUser);
  els.platformProfileMessage.textContent = "资料已更新";
}

async function logoutPlatformAccount() {
  if (!state.platformLinks.sessionState) {
    throw new Error("平台会话接口尚未配置");
  }
  const logoutUrl = new URL(state.platformLinks.sessionState);
  logoutUrl.searchParams.set("action", "logout");
  const response = await fetch(logoutUrl.toString(), {
    method: "POST",
    cache: "no-store",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error?.message || response.statusText);
  }
  renderPlatformAccount(null);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("读取头像文件失败"));
    reader.readAsDataURL(file);
  });
}

async function createAvatarDataUrl(file) {
  const allowed = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
  if (!allowed.has(file.type)) {
    throw new Error("头像仅支持 PNG、JPEG、WebP 或 GIF。");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("头像文件不能超过 2MB。");
  }
  const dataUrl = await readFileAsDataUrl(file);
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("头像图片解析失败，请换一张图片。"));
    img.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = Math.max(0, (image.naturalWidth - sourceSize) / 2);
  const sourceY = Math.max(0, (image.naturalHeight - sourceSize) / 2);
  ctx.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 320, 320);
  const compressed = canvas.toDataURL("image/webp", 0.82);
  return compressed.startsWith("data:image/webp") ? compressed : canvas.toDataURL("image/png");
}

function renderModelOrbit() {
  if (!els.modelOrbitTrack) return;
  const angleStep = 360 / featuredModels.length;
  els.modelOrbitTrack.innerHTML = featuredModels
    .map((model, index) => {
      return `
        <button class="model-orbit-item" data-model-id="${model.id}" style="--angle: ${index * angleStep}deg" aria-label="查看 ${escapeHtml(model.name)} 模型信息">
          <img src="${model.icon}" alt="" loading="lazy" />
        </button>
      `;
    })
    .join("");
  els.modelOrbitTrack.querySelectorAll(".model-orbit-item").forEach((button) => {
    button.addEventListener("click", () => openModelInfo(button.dataset.modelId));
  });
}

function openModelInfo(modelId) {
  const model = featuredModels.find((item) => item.id === modelId);
  if (!model || !els.modelInfoDialog) return;
  els.modelInfoIcon.src = model.icon;
  els.modelInfoIcon.alt = `${model.name} 图标`;
  els.modelInfoTitle.textContent = model.name;
  els.modelInfoProvider.textContent = model.provider;
  els.modelInfoSummary.textContent = model.summary;
  els.modelInfoMeta.innerHTML = model.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  els.modelInfoSource.href = `https://icons.lobehub.com/components/${model.id}`;
  if (typeof els.modelInfoDialog.showModal === "function") {
    els.modelInfoDialog.showModal();
  } else {
    els.modelInfoDialog.setAttribute("open", "");
  }
}

function drawWave() {
  const canvas = $("#waveCanvas");
  const ctx = canvas.getContext("2d");
  let tick = 0;
  function frame() {
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(19, 22, 20, 0.34)";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(66, 82, 76, 0.35)";
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#34cba2");
    gradient.addColorStop(0.52, "#72a8f6");
    gradient.addColorStop(1, "#e3a14d");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const amp = Math.sin((x + tick) * 0.07) * 16 + Math.sin((x - tick) * 0.019) * 24;
      const y = height / 2 + amp * Math.sin((x + tick) * 0.21);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    tick += 1.8;
    requestAnimationFrame(frame);
  }
  frame();
}

function drawRadar(memory = {}) {
  const canvas = $("#radarCanvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(79, 98, 91, 0.72)";
  ctx.lineWidth = 1;
  for (let r = 24; r <= 72; r += 16) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 78, cy + Math.sin(a) * 78);
    ctx.stroke();
  }
  const count = Math.max(1, memory.memory_count || 1);
  const points = [0.72, 0.56 + Math.min(count / 18, 0.32), 0.66, 0.48 + Math.min((memory.shared_topics || 0) / 20, 0.34), 0.82];
  ctx.beginPath();
  points.forEach((value, index) => {
    const a = -Math.PI / 2 + (Math.PI * 2 * index) / points.length;
    const x = cx + Math.cos(a) * value * 70;
    const y = cy + Math.sin(a) * value * 70;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(52, 203, 162, 0.22)";
  ctx.strokeStyle = "#34cba2";
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f7d894";
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawTrend(values = []) {
  const canvas = $("#trendCanvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(79, 98, 91, 0.46)";
  for (let x = 0; x < w; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const gradient = ctx.createLinearGradient(0, 0, w, 0);
  gradient.addColorStop(0, "#72a8f6");
  gradient.addColorStop(1, "#34cba2");
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2;
  ctx.beginPath();
  values.forEach((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * w;
    const y = h - ((value - min) / Math.max(max - min, 1)) * (h - 16) - 8;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function setupStarfield() {
  const canvas = $("#starfield");
  const ctx = canvas.getContext("2d");
  const particles = [];
  const colors = ["#34cba2", "#72a8f6", "#43c77a", "#e3a14d", "#e7f1ed"];
  function resize() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
  }
  function seed() {
    particles.length = 0;
    const count = Math.min(240, Math.floor((window.innerWidth * window.innerHeight) / 6200));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 2.2 + 0.4,
        vx: (Math.random() - 0.5) * 0.00026,
        vy: (Math.random() - 0.5) * 0.00022,
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2,
      });
    }
  }
  function draw(time) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    for (const p of particles) {
      p.x = (p.x + p.vx + 1) % 1;
      p.y = (p.y + p.vy + 1) % 1;
      const pulse = 0.55 + Math.sin(time * 0.002 + p.phase) * 0.45;
      const x = p.x * sw;
      const y = p.y * sh;
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 14 * pulse;
      ctx.globalAlpha = 0.42 + pulse * 0.42;
      ctx.arc(x, y, p.r * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = "rgba(52, 203, 162, 0.26)";
    for (let i = 0; i < particles.length; i += 3) {
      const a = particles[i];
      const b = particles[(i + 17) % particles.length];
      const ax = a.x * sw;
      const ay = a.y * sh;
      const bx = b.x * sw;
      const by = b.y * sh;
      const dist = Math.hypot(ax - bx, ay - by);
      if (dist < 180) {
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
    }
    ctx.restore();
    requestAnimationFrame(draw);
  }
  resize();
  seed();
  window.addEventListener("resize", () => {
    resize();
    seed();
  });
  requestAnimationFrame(draw);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bindEvents() {
  els.platformEntryLink?.addEventListener("click", (event) => {
    if (!state.platformUser) return;
    event.preventDefault();
    togglePlatformMenu();
  });
  els.platformProfileButton?.addEventListener("click", (event) => {
    event.preventDefault();
    togglePlatformMenu();
  });
  els.platformDisplayNameInput?.addEventListener("input", updatePlatformSaveButton);
  els.platformAvatarButton?.addEventListener("click", () => els.platformAvatarInput?.click());
  els.platformAvatarInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const avatarUrl = await createAvatarDataUrl(file);
      await savePlatformProfile({
        displayName: els.platformDisplayNameInput.value.trim() || state.platformUser?.displayName,
        avatarUrl,
      });
    } catch (error) {
      els.platformProfileMessage.textContent = error.message || "头像上传失败";
    }
  });
  els.platformSaveNameButton?.addEventListener("click", async () => {
    try {
      await savePlatformProfile({
        displayName: els.platformDisplayNameInput.value.trim(),
      });
    } catch (error) {
      els.platformProfileMessage.textContent = error.message || "姓名保存失败";
    }
  });
  els.platformLogoutButton?.addEventListener("click", async () => {
    try {
      await logoutPlatformAccount();
      window.location.reload();
    } catch (error) {
      els.platformProfileMessage.textContent = error.message || "退出登录失败";
    }
  });
  document.addEventListener("click", (event) => {
    if (!state.platformMenuOpen) return;
    const target = event.target;
    if (els.platformAccount?.contains(target)) return;
    closePlatformMenu();
  });
  els.leftCollapse.addEventListener("click", () => setPanel("left", false));
  els.rightCollapse.addEventListener("click", () => setPanel("right", false));
  els.leftRail.addEventListener("click", () => setPanel("left", !state.leftOpen));
  els.rightRail.addEventListener("click", () => setPanel("right", !state.rightOpen));
  els.chatPagePrev?.addEventListener("click", () => {
    state.chatPage = clampChatPage(state.chatPage - 1);
    renderChatHistory({ stayOnPage: true });
  });
  els.chatPageNext?.addEventListener("click", () => {
    state.chatPage = clampChatPage(state.chatPage + 1);
    renderChatHistory({ stayOnPage: true });
  });
  els.sendButton.addEventListener("click", sendMessage);
  els.chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") sendMessage();
  });
  els.emojiButton.addEventListener("click", () => {
    const marks = [" 星光", " 想你", " 记住这刻", " 陪我聊聊"];
    els.chatInput.value += marks[Math.floor(Math.random() * marks.length)];
    els.chatInput.focus();
  });
  els.imageButton.addEventListener("click", () => els.imageInput.click());
  els.imageInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) {
      state.attachedImage = file;
      els.chatInput.value = `${els.chatInput.value} [${file.name}]`.trim();
    }
  });
  $("#voiceModeButton").addEventListener("click", () => {
    state.outputMode = state.outputMode === "voice" ? "text" : "voice";
    $("#voiceModeButton").classList.toggle("active", state.outputMode === "voice");
    els.micButton.click();
  });
  $("#projectionButton").addEventListener("click", () => {
    document.body.classList.toggle("projection-on");
    $("#projectionButton").classList.toggle("active");
  });
  $("#memoryButton").addEventListener("click", () => openMemoryDrawer("memory"));
  $("#openMemoryDrawer").addEventListener("click", () => openMemoryDrawer("memory"));
  $("#exploreButton").addEventListener("click", async () => {
    const env = await api("/api/environment");
    updateMeters({ environment: env });
    $("#exploreButton").classList.toggle("active");
  });
  $("#moreButton").addEventListener("click", () => openMemoryDrawer("settings"));
  els.memorySearchButton.addEventListener("click", (event) => {
    event.preventDefault();
    searchMemory();
  });
  els.rememberButton.addEventListener("click", (event) => {
    event.preventDefault();
    rememberText();
  });
  els.modelInfoDialog?.addEventListener("click", (event) => {
    const rect = els.modelInfoDialog.getBoundingClientRect();
    const outside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;
    if (outside) els.modelInfoDialog.close();
  });
}

async function boot() {
  renderModelOrbit();
  bindEvents();
  setupVoiceInput();
  setupStarfield();
  drawWave();
  drawRadar();
  drawTrend(state.environmentTrend);
  renderChatHistory();
  updateClock();
  setInterval(updateClock, 1000);
  try {
    const payload = await api("/api/state");
    updateMeters(payload);
    $("#onlineStatus").textContent = "在线";
  } catch (error) {
    $("#onlineStatus").textContent = "离线";
    console.error(error);
  }
  await loadPlatformEntryLink();
}

boot();
