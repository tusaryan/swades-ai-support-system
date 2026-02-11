
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  apiLogin,
  apiRegister,
  apiLogout,
  apiRefreshToken,
  setAccessToken,
} from "./api";
import type { User } from "./types";

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await apiLogin(email, password);
          setAccessToken(data.accessToken);
          set({
            user: data.user,
            accessToken: data.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email, password, name) => {
        set({ isLoading: true });
        try {
          const data = await apiRegister(email, password, name);
          setAccessToken(data.accessToken);
          set({
            user: data.user,
            accessToken: data.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await apiLogout();
        } catch {
          // ignore logout errors
        }
        setAccessToken(null);
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      refreshToken: async () => {
        try {
          const data = await apiRefreshToken();
          setAccessToken(data.accessToken);
          set({ accessToken: data.accessToken });
        } catch {
          get().clearAuth();
        }
      },

      setAuth: (user, token) => {
        setAccessToken(token);
        set({
          user,
          accessToken: token,
          isAuthenticated: true,
        });
      },

      clearAuth: () => {
        setAccessToken(null);
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
