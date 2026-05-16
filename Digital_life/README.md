# 星语 StarryChat 数字生命网页

前后端分离结构：

- `frontend/`：星空界面、左右面板、人物睡眠/苏醒切换、粒子、衣裙飘动、眨眼、语音/文本输入输出。
- `backend/`：FastAPI API、OpenClaw/OpenAI-compatible LLM 适配、TTSFM 在线 TTS、长期记忆、当天记忆、情感状态。

## 运行

推荐使用项目根平台编排一键启动，它会同时拉起平台后端、原平台前端、New API 和 Digital_life 融合首页：

```bash
cd /home/sgj/projects/NewAPI/platform
./scripts/dev-up.sh
```

浏览器打开：

```text
http://127.0.0.1:8008/
```

如果只想单独调试 Digital_life，可以直接运行：

```bash
cd /home/sgj/projects/NewAPI/Digital_life
/home/sgj/miniconda3/envs/py311/bin/python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8008
```

浏览器打开：

```text
http://127.0.0.1:8008/
```

## OpenClaw 配置

默认按 OpenAI-compatible Chat Completions 调用本地模型：

```bash
export OPENCLAW_BASE_URL=http://127.0.0.1:11434/v1
export OPENCLAW_API_KEY=openclaw-local
export OPENCLAW_MODEL=openclaw
```

如果你的 OpenClaw 服务地址不同，只需要改这三个环境变量。

## TTS

后端默认优先调用 FreeTTS 公共 REST API，失败后再尝试 TTSFM 和浏览器兜底：

```bash
export FREETTS_BASE_URL=https://freetts.org/api
export TTS_BASE_URL=http://ttsapi.site
export TTS_DEFAULT_VOICE=zh-CN-XiaoxiaoNeural
```

前端会在接口不可用时自动退回浏览器内置语音合成。

## 记忆文件

- 长期记忆：`backend/data/agent_workspace/MEMORY.md`
- 每日记忆：`backend/data/agent_workspace/memory/YYYY-MM-DD.md`
- 情感状态：`backend/data/agent_workspace/emotion_state.json`
- 记忆统计：`backend/data/agent_workspace/memory_state.json`
