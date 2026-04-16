import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthContextStore } from '../store/authContextStore';

interface User {
  id: number;
  fullName: string;
  email: string;
  roles: string[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => {
        // Clear both stores to ensure complete cleanup
        set({ token: null, user: null, isAuthenticated: false });
        useAuthContextStore.getState().clearUserContext();
        
        // Explicitly clear localStorage as a fallback safeguard
        localStorage.removeItem('eduflow-auth');
        localStorage.removeItem('eduflow-auth-context');
        
        // Force complete reset of session
        sessionStorage.clear();
      },
    }),
    {
      name: 'eduflow-auth',
    }
  )
);
