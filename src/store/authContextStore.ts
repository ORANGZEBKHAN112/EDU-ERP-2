import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthContext {
  user: {
    id: number;
    name: string;
    email: string;
    roles: string[];
  };
  schoolId: number;
  campusIds: number[];
  isAuthenticated: boolean;
}

interface AuthContextState extends AuthContext {
  setUserContext: (context: AuthContext) => void;
  clearUserContext: () => void;
}

export const useAuthContextStore = create<AuthContextState>()(
  persist(
    (set) => ({
      user: {
        id: 0,
        name: "",
        email: "",
        roles: [],
      },
      schoolId: 0,
      campusIds: [],
      isAuthenticated: false,
      setUserContext: (context) => set({ ...context }),
      clearUserContext: () => set({
        user: { id: 0, name: "", email: "", roles: [] },
        schoolId: 0,
        campusIds: [],
        isAuthenticated: false,
      }),
    }),
    {
      name: "eduflow-auth-context",
    }
  )
);
