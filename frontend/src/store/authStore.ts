import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthApi } from "@/lib/api";

export type UserRole =
  | "mota_admin"
  | "district_officer"
  | "forest_revenue_officer"
  | "pda_planner"
  | "ngo_user"
  | "citizen_user";

export interface User {
  id: string | number;
  username: string;
  role: UserRole;
  district?: string | number | null;
  state?: string | number | null;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  acceptAuth: (user: User, token: string) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  canAccessRoute: (route: string) => boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  mota_admin: [
    "atlas:full",
    "claims:read_all",
    "claims:approve_override",
    "reports:export_all",
    "admin:users",
    "admin:settings",
    "planning:read",
    "alerts:read_all",
    "ai:simulate"
  ],
  district_officer: [
    "atlas:district",
    "claims:crud_district",
    "claims:approve",
    "tasks:assign",
    "reports:export_district",
    "alerts:read_district"
  ],
  forest_revenue_officer: [
    "atlas:verify",
    "claims:verify_land",
    "map:edit",
    "tasks:update",
    "reports:read_district"
  ],
  pda_planner: ["atlas:read", "claims:read", "planning:full", "reports:export", "ai:simulate"],
  ngo_user: ["atlas:read", "claims:create", "claims:read_own", "community:reports", "tasks:read"],
  citizen_user: ["atlas:public", "claims:create_own", "claims:read_own", "docs:read", "help:read"]
};

const ROUTE_ACCESS: Record<string, UserRole[]> = {
  "/": [],
  "/login": [],
  "/register": [],
  "/docs": [],
  "/help": [],
  "/dashboard": ["mota_admin", "district_officer", "forest_revenue_officer", "pda_planner", "ngo_user", "citizen_user"],
  "/atlas": ["mota_admin", "district_officer", "forest_revenue_officer", "pda_planner", "ngo_user", "citizen_user"],
  "/claims": ["mota_admin", "district_officer", "forest_revenue_officer", "pda_planner", "ngo_user", "citizen_user"],
  "/claims/new": ["ngo_user", "citizen_user"],
  "/tasks": ["district_officer", "forest_revenue_officer"],
  "/alerts": ["mota_admin", "district_officer"],
  "/reports": ["mota_admin", "district_officer", "pda_planner"],
  "/planning": ["pda_planner"],
  "/community/reports": ["mota_admin", "district_officer", "ngo_user"],
  "/admin": ["mota_admin"],
  "/ai/simulate": ["mota_admin", "pda_planner"]
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        const { token, user } = await AuthApi.login(username, password);
        set({ user, token, isAuthenticated: true });
        return true;
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      acceptAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        const perms = ROLE_PERMISSIONS[user.role] || [];
        return perms.includes(permission);
      },

      canAccessRoute: (route: string) => {
        const { user } = get();
        if (!ROUTE_ACCESS[route] || ROUTE_ACCESS[route].length === 0) return true;
        if (!user) return false;
        const allowed =
          ROUTE_ACCESS[route] ||
          ROUTE_ACCESS[route.split("/").slice(0, -1).join("/") || "/"] ||
          [];
        return allowed.includes(user.role);
      }
    }),
    {
      name: "fra-auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);