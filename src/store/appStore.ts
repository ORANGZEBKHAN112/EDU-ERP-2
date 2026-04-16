import { create } from "zustand";
import apiClient from "@/services/apiClient";

interface AppState {
  campuses: any[];
  classes: any[];
  roles: string[];
  isCampusesLoaded: boolean;
  isClassesLoaded: boolean;
  isRolesLoaded: boolean;
  isLoadingCampuses: boolean;
  isLoadingClasses: boolean;
  isLoadingRoles: boolean;
  fetchCampuses: (force?: boolean) => Promise<void>;
  fetchClasses: (force?: boolean) => Promise<void>;
  fetchRoles: (force?: boolean) => Promise<void>;
  setCampuses: (data: any[]) => void;
  setClasses: (data: any[]) => void;
  setRoles: (data: string[]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  campuses: [],
  classes: [],
  roles: [],
  isCampusesLoaded: false,
  isClassesLoaded: false,
  isRolesLoaded: false,
  isLoadingCampuses: false,
  isLoadingClasses: false,
  isLoadingRoles: false,

  fetchCampuses: async (force = false) => {
    if (get().isCampusesLoaded && !force) return;
    if (get().isLoadingCampuses) return;

    set({ isLoadingCampuses: true });
    try {
      const res = await apiClient.get('/campuses');
      set({ 
        campuses: Array.isArray(res.data) ? res.data : [], 
        isCampusesLoaded: true 
      });
    } catch (error) {
      console.error('Failed to fetch campuses', error);
    } finally {
      set({ isLoadingCampuses: false });
    }
  },

  fetchClasses: async (force = false) => {
    if (get().isClassesLoaded && !force) return;
    if (get().isLoadingClasses) return;

    set({ isLoadingClasses: true });
    try {
      const res = await apiClient.get('/classes');
      set({ 
        classes: Array.isArray(res.data) ? res.data : [], 
        isClassesLoaded: true 
      });
    } catch (error) {
      console.error('Failed to fetch classes', error);
    } finally {
      set({ isLoadingClasses: false });
    }
  },

  fetchRoles: async (force = false) => {
    if (get().isRolesLoaded && !force) return;
    if (get().isLoadingRoles) return;

    set({ isLoadingRoles: true });
    try {
      const res = await apiClient.get('/roles');
      set({ 
        roles: Array.isArray(res.data) ? res.data : [], 
        isRolesLoaded: true 
      });
    } catch (error) {
      console.error('Failed to fetch roles', error);
    } finally {
      set({ isLoadingRoles: false });
    }
  },

  setCampuses: (data) => set({ campuses: data, isCampusesLoaded: true }),
  setClasses: (data) => set({ classes: data, isClassesLoaded: true }),
  setRoles: (data) => set({ roles: data, isRolesLoaded: true }),
}));
