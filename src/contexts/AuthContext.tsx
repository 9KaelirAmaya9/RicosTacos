/**
 * AuthContext — shared auth + role state for the entire app.
 *
 * v3 — fixes "no admin/kitchen cards on Android PWA after sign-in":
 *
 *  Root cause: On Android Chrome PWA (standalone), the Supabase client fires
 *  INITIAL_SESSION (via onAuthStateChange) AND the mount getSession() call
 *  almost simultaneously. The mount call wins the initInProgress lock and
 *  starts fetching roles. Then SIGNED_IN fires — but initInProgress is still
 *  true, so initialize() returns immediately without fetching roles. The mount
 *  call had session=null (localStorage was empty at that instant on a fresh
 *  PWA launch), so it calls getUser() which returns the user but with no
 *  session — and roles come back empty because the JWT hasn't been written to
 *  localStorage yet. Result: user is set, roles = [].
 *
 *  Fix:
 *  1. Replace the single initInProgress boolean with a queue/pending-session
 *     ref. If SIGNED_IN arrives while init is running, we store the session
 *     and re-run after the current init completes.
 *  2. On SIGNED_IN we always do a fresh role fetch (force=true), bypassing
 *     the sessionStorage cache.
 *  3. INITIAL_SESSION event (fired by onAuthStateChange on first subscriber
 *     registration) is now handled explicitly — it replaces the separate
 *     getSession() call, eliminating the race entirely.
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

  // True while an initialize() call is in flight
  const initInProgress = useRef(false);
  // If a SIGNED_IN event arrives while init is running, store it here
  const pendingSignIn = useRef<Session | null | undefined>(undefined);

  // ── Fetch roles from DB (with cache) ─────────────────────────────────────────
  const fetchRoles = useCallback(async (userId: string, force = false): Promise<AppRole[]> => {
    if (!force) {
      const cached = readCache(userId);
      if (cached) {
        console.log("[Auth] roles from cache:", cached);
        return cached;
      }
    }
    try {
      const { data, error } = await Promise.race([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        new Promise<never>((_, r) => setTimeout(() => r(new Error("role timeout")), 8000)),
      ]) as any;
      if (error) { console.error("[Auth] role fetch error:", error.message); return []; }
      const roles: AppRole[] = (data || []).map((r: any) => r.role);
      console.log("[Auth] roles from DB:", roles);
      writeCache(userId, roles);
      return roles;
    } catch (e: any) {
      console.error("[Auth] role fetch failed:", e.message);
      return [];
    }
  }, []);

  // ── Core initializer ─────────────────────────────────────────────────────────
  const initialize = useCallback(async (session: Session | null, forceRoles = false) => {
    if (initInProgress.current) {
      // Queue the latest session so we re-run after current init finishes
      if (forceRoles) {
        pendingSignIn.current = session;
      }
      return;
    }
    initInProgress.current = true;
    pendingSignIn.current = undefined;

    const hardStop = setTimeout(() => {
      console.warn("[Auth] Hard stop after 8s");
      setState(prev => ({ ...prev, loading: false, error: "Session check timed out. Please sign in again." }));
      initInProgress.current = false;
    }, 8000);

    try {
      if (!session) {
        // No session passed — ask the server
        const { data: { user }, error } = await supabase.auth.getUser();
        clearTimeout(hardStop);
        if (error || !user) {
          setState({ user: null, session: null, roles: [], loading: false, error: null });
          initInProgress.current = false;
          return;
        }
        const { data: { session: freshSession } } = await supabase.auth.getSession();
        const roles = await fetchRoles(user.id, forceRoles);
        setState({ user, session: freshSession ?? null, roles, loading: false, error: null });
      } else {
        // Session already in hand — use it directly
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
      // If a SIGNED_IN arrived while we were running, process it now
      if (pendingSignIn.current !== undefined) {
        const pending = pendingSignIn.current;
        pendingSignIn.current = undefined;
        console.log("[Auth] processing queued SIGNED_IN after init");
        initialize(pending, true);
      }
    }
  }, [fetchRoles]);

  // ── Mount ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION synchronously after the
    // Supabase client's own initialize() resolves. We use that as our
    // single source of truth instead of a separate getSession() call,
    // which eliminates the race between the two.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] event:", event, "session:", session?.user?.id ?? null);

      if (event === "INITIAL_SESSION") {
        // First session read on mount — may be null (not signed in) or a session
        initialize(session ?? null, false);
        return;
      }

      if (event === "SIGNED_IN") {
        // Explicit sign-in — always force fresh role fetch
        initialize(session, true);
        return;
      }

      if (event === "SIGNED_OUT") {
        clearCache();
        setState({ user: null, session: null, roles: [], loading: false, error: null });
        return;
      }

      if (event === "TOKEN_REFRESHED" && session) {
        // Background token refresh — update session/user silently, keep roles
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
