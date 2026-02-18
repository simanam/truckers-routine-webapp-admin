import { create } from "zustand";
import { api } from "./api";
import type { User, AuthResponse, LoginRequest, OAuthLoginRequest } from "./types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  login: (credentials: LoginRequest) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true });
    try {
      const data = await api.fetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      api.setTokens(data.session.access_token, data.session.refresh_token);

      const me = await api.fetch<User>("/auth/me");
      if (me.role !== "admin" && me.role !== "super_admin") {
        api.clearTokens();
        throw new Error("Access denied. Admin privileges required.");
      }

      set({ user: me, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  googleLogin: async (credential: string) => {
    set({ isLoading: true });
    try {
      const payload: OAuthLoginRequest = {
        provider: "google",
        id_token: credential,
      };

      const data = await api.fetch<AuthResponse>("/auth/oauth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      api.setTokens(data.session.access_token, data.session.refresh_token);

      const me = await api.fetch<User>("/auth/me");
      set({ user: me, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.fetch("/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout errors
    }
    api.clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  initialize: async () => {
    if (get().isInitialized) return;

    if (!api.hasRefreshToken()) {
      set({ isInitialized: true });
      return;
    }

    set({ isLoading: true });
    try {
      const me = await api.fetch<User>("/auth/me");
      set({ user: me, isAuthenticated: true });
    } catch {
      api.clearTokens();
    }
    set({ isLoading: false, isInitialized: true });
  },

  setUser: (user: User) => set({ user }),
}));
