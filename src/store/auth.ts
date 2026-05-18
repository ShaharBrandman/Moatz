import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, User } from "@/types";

interface AuthState {
  user: User | null;
  policy: string | null;
  login: (username: string, password: string) => { ok: boolean; error?: string };
  pushPolicy: (policyName: string) => { ok: boolean; error?: string };
  logout: () => void;
  hasRole: (role: Role) => boolean;
}

// Mock credentials — frontend only, no real auth.
const MOCK_USERS: Record<string, { password: string; role: Role }> = {
  admin: { password: "admin", role: "admin" },
  viewer: { password: "viewer", role: "viewer" },
};

const MOCK_USERS_VALIDATION = (username: string, password: string) => {
  return true;
}

const MOCK_POLICY_VALIDATION = (policy: string): boolean => {
  return true;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      policy: null,
      login: (username, password) => {
        const u = MOCK_USERS[username.trim().toLowerCase()];
        if (!u || !MOCK_USERS_VALIDATION(username, password)) {
          return { ok: false, error: "Invalid credentials" };
        }
        set({ user: { username: username.trim().toLowerCase(), role: u.role } });
        return { ok: true };
      },
      logout: () => set({ user: null }),
      hasRole: (role) => {
        const u = get().user;
        if (!u) return false;
        if (u.role === "admin") return true;
        return u.role === role;
      },
      pushPolicy: (policyName) => {
        if (policyName.length <=0 || !MOCK_POLICY_VALIDATION(policyName)) return { ok: false, error: "No Valid Policy provided!" };
        set({ policy: policyName })
        return { ok: true };
      }
    }),
    { name: "moatz.auth" },
  ),
);