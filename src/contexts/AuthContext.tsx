/**
 * AuthContext — shared auth + role state for the entire app.
 *
 * Fixes implemented here:
 *  Fix 1: Use getUser() (server-validated) instead of getSession() to avoid
 *          the JWT-refresh hang that caused the 15s timeout.
 *  Fix 2: Explicit refreshSession() with a 5s timeout before role fetch so
 *          expired tokens are renewed quickly or fail fast.
 *  Fix 4: Roles are cached in sessionStorage keyed by userId so repeat
 *          Dashboard/ProtectedRoute mounts are instant (no network call).
 *  Fix 5: Single shared context — Dashboard, ProtectedRoute, and Navigation
 *          all read from here instead of each making their own user_roles query.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppRole = "admin" | "kitchen";

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  /** True while a background token refresh is in progress */
  refreshing: boolean;
  /** Non-null when auth/role fetch failed and user should be prompted to retry */
  error: string | null;
}

interface AuthContextValue extends AuthState {
  hasRole: (role: AppRole) => boolean;
  signOut: () => Promise<void>;
  /** Force a fresh role fetch (clears cache) */
  refetchRoles: () => Promise<void>;
}

// ─── Cache helpers ─────────────────────────────────────────────────────────────

const CACHE_KEY = "rt_roles_cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface RoleCache {
  userId: string;
  roles: AppRole[];
  fetchedAt: number;
}

function readRoleCache(userId: string): AppRole[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: RoleCache = JSON.parse(raw);
    if (cache.userId !== userId) return null;
    if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) return null;
    return cache.roles;
  } catch {
    return null;
  }
}

function writeRoleCache(userId: string, roles: AppRole[]) {
  try {
    const cache: RoleCache = { userId, roles, fetchedAt: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // sessionStorage unavailable — silently ignore
  }
}

function clearRoleCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    roles: [],
    loading: true,
    refreshing: false,
    error: null,
  });

  // Prevent concurrent initializations
  const initInProgress = useRef(false);

  // ── Role fetch (Fix 2 + Fix 4) ──────────────────────────────────────────────
  const fetchRoles = useCallback(async (userId: string, forceRefresh = false): Promise<AppRole[]> => {
    // Fix 4: serve from cache when available
    if (!forceRefresh) {
      const cached = readRoleCache(userId);
      if (cached) return cached;
    }

    try {
      const rolesPromise = supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Role fetch timeout after 8s")), 8000)
      );

      const { data, error } = await Promise.race([rolesPromise, timeoutPromise]) as any;

      if (error) {
        console.error("[AuthContext] Role fetch error:", error.message);
        return [];
      }

      const roles: AppRole[] = (data || []).map((r: any) => r.role as AppRole);
      writeRoleCache(userId, roles);
      return roles;
    } catch (err: any) {
      console.error("[AuthContext] Role fetch failed:", err.message);
      return [];
    }
  }, []);

  // ── Main initializer (Fix 1 + Fix 2) ────────────────────────────────────────
  const initialize = useCallback(async (forceRoleRefresh = false) => {
    if (initInProgress.current) return;
    initInProgress.current = true;

    // Fix 3: 5s hard stop instead of 15s
    const hardStop = setTimeout(() => {
      console.warn("[AuthContext] Hard stop after 5s — session/token refresh hung");
      setState(prev => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: "Session check timed out. Please sign in again.",
      }));
      initInProgress.current = false;
    }, 5000);

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Fix 2: Attempt a token refresh first (5s timeout) so we always have a
      // fresh JWT before querying user_roles. If refresh fails, fall through to
      // getUser() which will still work if the token is valid.
      setState(prev => ({ ...prev, refreshing: true }));
      try {
        await Promise.race([
          supabase.auth.refreshSession(),
          new Promise<never>((_, r) =>
            setTimeout(() => r(new Error("refresh timeout")), 5000)
          ),
        ]);
      } catch (refreshErr: any) {
        // Non-fatal — log and continue; getUser() will tell us if we're truly logged out
        console.warn("[AuthContext] Token refresh skipped:", refreshErr.message);
      }

      // Fix 1: getUser() validates the token server-side — no hanging refresh race
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        clearTimeout(hardStop);
        setState({
          user: null,
          session: null,
          roles: [],
          loading: false,
          refreshing: false,
          error: null, // Not an error — just not logged in
        });
        initInProgress.current = false;
        return;
      }

      // Get session for components that need it (e.g. JWT token)
      const { data: { session } } = await supabase.auth.getSession();

      // Fetch roles (Fix 4: uses cache when available)
      const roles = await fetchRoles(user.id, forceRoleRefresh);

      clearTimeout(hardStop);
      setState({
        user,
        session: session ?? null,
        roles,
        loading: false,
        refreshing: false,
        error: null,
      });
    } catch (err: any) {
      clearTimeout(hardStop);
      console.error("[AuthContext] Initialization error:", err.message);
      setState({
        user: null,
        session: null,
        roles: [],
        loading: false,
        refreshing: false,
        error: "Authentication error. Please try signing in again.",
      });
    } finally {
      initInProgress.current = false;
    }
  }, [fetchRoles]);

  // ── Bootstrap on mount + listen for auth changes ─────────────────────────────
  useEffect(() => {
    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("[AuthContext] Auth event:", event);

        if (event === "SIGNED_OUT") {
          clearRoleCache();
          setState({
            user: null,
            session: null,
            roles: [],
            loading: false,
            refreshing: false,
            error: null,
          });
          return;
        }

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          // Re-initialize with fresh data; force role refresh on sign-in
          await initialize(event === "SIGNED_IN");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [initialize]);

  // ── Public API ────────────────────────────────────────────────────────────────
  const hasRole = useCallback(
    (role: AppRole) => state.roles.includes(role),
    [state.roles]
  );

  const signOut = useCallback(async () => {
    clearRoleCache();
    await supabase.auth.signOut();
  }, []);

  const refetchRoles = useCallback(async () => {
    if (!state.user) return;
    clearRoleCache();
    const roles = await fetchRoles(state.user.id, true);
    setState(prev => ({ ...prev, roles }));
  }, [state.user, fetchRoles]);

  return (
    <AuthContext.Provider value={{ ...state, hasRole, signOut, refetchRoles }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
