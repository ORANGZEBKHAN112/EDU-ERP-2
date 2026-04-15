import { create } from "zustand";

interface AppState {
  campuses: any[];
  classes: any[];
  setCampuses: (data: any[]) => void;
  setClasses: (data: any[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  campuses: [],
  classes: [],
  setCampuses: (data) => set({ campuses: data }),
  setClasses: (data) => set({ classes: data }),
}));
