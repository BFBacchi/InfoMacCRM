import { create } from "zustand";

type UiState = {
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
};

/**
 * Estado global mínimo de UI (panel de notificaciones, etc.).
 */
export const useUiStore = create<UiState>((set) => ({
  notificationsOpen: false,
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),
}));
