import { create } from "zustand";

type PlaygroundState = {
  model: string;
  apiKey: string;
  imageUrl: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  setModel: (value: string) => void;
  setApiKey: (value: string) => void;
  setImageUrl: (value: string) => void;
  setTemperature: (value: number) => void;
  setMaxTokens: (value: number) => void;
  setSystemPrompt: (value: string) => void;
};

export const usePlaygroundStore = create<PlaygroundState>((set) => ({
  model: "chat-pro",
  apiKey: "",
  imageUrl: "",
  temperature: 0.4,
  maxTokens: 2048,
  systemPrompt: "你是企业级 AI API 平台的交互助手，需要给出稳定、清晰、可执行的建议。",
  setModel: (value) => set({ model: value }),
  setApiKey: (value) => set({ apiKey: value }),
  setImageUrl: (value) => set({ imageUrl: value }),
  setTemperature: (value) => set({ temperature: value }),
  setMaxTokens: (value) => set({ maxTokens: value }),
  setSystemPrompt: (value) => set({ systemPrompt: value })
}));
