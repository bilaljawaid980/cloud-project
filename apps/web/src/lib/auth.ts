import { create } from "zustand";

import { apiRequest } from "./api";

const STORAGE_KEY = "clipforge.auth";

export interface AuthSession {
  token: string;
  userId: string;
  email: string;
  name?: string;
  expiresAt: string;
}

interface AuthState {
  session: AuthSession | null;
  isHydrated: boolean;
  setSession: (session: AuthSession | null) => void;
  login: (email: string, name?: string) => Promise<AuthSession>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isHydrated: false,
  setSession: (session) => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    set({ session, isHydrated: true });
  },
  login: async (email, name) => {
    const session = await apiRequest<AuthSession>("/auth/dev-login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, name })
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    set({ session, isHydrated: true });
    return session;
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ session: null, isHydrated: true });
  }
}));

export const hydrateAuthSession = (): void => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    useAuthStore.getState().setSession(null);
    return;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      useAuthStore.getState().setSession(null);
      return;
    }

    useAuthStore.getState().setSession(parsed);
  } catch {
    useAuthStore.getState().setSession(null);
  }
};

export const getAuthToken = (): string | null => useAuthStore.getState().session?.token ?? null;
