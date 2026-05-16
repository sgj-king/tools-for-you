import { create } from "zustand";

type UiState = {
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  setCommandOpen: (value: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  commandOpen: false,
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  setCommandOpen: (value) => set({ commandOpen: value })
}));
