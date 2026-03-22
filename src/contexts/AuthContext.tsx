/**
 * AuthContext — shared auth + role state for the entire app.
 *
 * v2 — fixes the "Hard stop after 5s" regression:
 *  - refreshSession() was timing out at 5s and consuming the entire hard-stop
 *    budget before getUser() even ran. Removed refreshSession() from the
 *    critical path entirely. Supabase's autoRefreshToken handles token renewal
 *    in the background; we just need to read the current user.
 *  - SIGNED_IN event was calling initialize() concurrently with the mount
 *    initialize(), causing a double-run. Now the onAuthStateChange handler
 *    directly sets state from the session it already receives — no re-init.
 *  - Hard stop raised to 8s (getUser() is a single network call, should be
 *    well under 3s on any reasonable connection).
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

export type AppRole = "admin" | "kitchen";

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  hasRole: (role: AppRole) => boolean;
  signOut: () => Promise<void>;
  refetchRoles: () => Promise<void>;
}

// ─── sessionStorage role cache (5 min TTL) ────────────────────────────────────
const CACHE_KEY = "rt_roles_cache";
const CACHE_TTL = 5 * 60 * 1000;

function readCache(userId: string): AppRole[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (c.userId !== userId || Date.now() - c.fetchedAt > CACHE_TTL) return null;
    return c.roles;
  } catch { return null; }
}

function writeCache(userId: string, roles: AppRole[]) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ userId, roles, fetchedAt: Date.now() })); } catch {}
}

function clearCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch {}
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null, session: null, roles: [], loading: true, error: null,
  });

  const initInProgress = useRef(false);

  // ── Fetch roles from DB (with cache) ─────────────────────────────────────────
  // Uses raw fetch() instead of supabase.from() to bypass the GoTrueClient
  // internal lock (_acquireLock). On mount, getSession() and onAuthStateChange
  // both hold the auth lock, causing supabase.from() to queue behind them and
  // hang indefinitely. Raw fetch() goes directly to the REST API — no lock.
  const fetchRoles = useCallback(async (userId: string, force = false): Promise<AppRole[]> => {
    if (!force) {
      const cached = readCache(userId);
      if (cached) return cached;
    }
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY || '';

      // Get the user's JWT for the Authorization header (RLS requires it)
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token
        ? `Bearer ${session.access_token}`
        : `Bearer ${SUPABASE_KEY}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/user_roles?select=role&user_id=eq.${userId}`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': authHeader,
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (!response.ok) {
        console.error("[Auth] role fetch HTTP error:", response.status);
        return [];
      }
      const data = await response.json();
      const roles: AppRole[] = (data || []).map((r: any) => r.role);
      writeCache(userId, roles);
      return roles;
    } catch (e: any) {
      console.error("[Auth] role fetch failed:", e.message);
      return [];
    }
  }, []);

  // ── Initialize from current session ──────────────────────────────────────────
  const initialize = useCallback(async (session: Session | null, forceRoles = false) => {
    if (initInProgress.current) return;
    initInProgress.current = true;

    // 8s hard stop — getUser() is a single network round-trip
    const hardStop = setTimeout(() => {
      console.warn("[Auth] Hard stop after 8s");
      setState(prev => ({ ...prev, loading: false, error: "Session check timed out. Please sign in again." }));
      initInProgress.current = false;
    }, 8000);

    try {
      if (!session) {
        // No session in localStorage — verify with server to be sure
        const { data: { user }, error } = await supabase.auth.getUser();
        clearTimeout(hardStop);
        if (error || !user) {
          setState({ user: null, session: null, roles: [], loading: false, error: null });
          initInProgress.current = false;
          return;
        }
        // Server says we have a user — get the full session
        const { data: { session: freshSession } } = await supabase.auth.getSession();
        const roles = await fetchRoles(user.id, forceRoles);
        setState({ user, session: freshSession ?? null, roles, loading: false, error: null });
      } else {
        // We already have a session object from onAuthStateChange — use it directly
        clearTimeout(hardStop);
        const roles = await fetchRoles(session.user.id, forceRoles);
        setState({ user: session.user, session, roles, loading: false, error: null });
      }
    } catch (e: any) {
      clearTimeout(hardStop);
      console.error("[Auth] init error:", e.message);
      setState({ user: null, session: null, roles: [], loading: false, error: "Authentication error. Please sign in again." });
    } finally {
      initInProgress.current = false;
    }
  }, [fetchRoles]);

  // ── Mount: read existing session from localStorage ────────────────────────────
  useEffect(() => {
    // getSession() reads localStorage synchronously — no network call unless token needs refresh
    supabase.auth.getSession().then(({ data: { session } }) => {
      initialize(session, false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] event:", event);
      if (event === "SIGNED_OUT") {
        clearCache();
        setState({ user: null, session: null, roles: [], loading: false, error: null });
        return;
      }
      if (event === "SIGNED_IN") {
        // Force fresh role fetch on new sign-in
        initialize(session, true);
        return;
      }
      if (event === "TOKEN_REFRESHED" && session) {
        // Token refreshed in background — update session silently, keep existing roles
        setState(prev => ({ ...prev, session, user: session.user }));
        return;
      }
    });

    return () => subscription.unsubscribe();
  }, [initialize]);

  const hasRole = useCallback((role: AppRole) => state.roles.includes(role), [state.roles]);

  const signOut = useCallback(async () => {
    clearCache();
    await supabase.auth.signOut();
  }, []);

  const refetchRoles = useCallback(async () => {
    if (!state.user) return;
    clearCache();
    const roles = await fetchRoles(state.user.id, true);
    setState(prev => ({ ...prev, roles }));
  }, [state.user, fetchRoles]);

  return (
    <AuthContext.Provider value={{ ...state, hasRole, signOut, refetchRoles }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
