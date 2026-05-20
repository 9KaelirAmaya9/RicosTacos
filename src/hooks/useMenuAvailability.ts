import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Fetches the set of item IDs currently marked inactive in menu_items.
// Used by Menu and Order pages to hide 86'd items in real-time.
//
// Polling every 30s keeps the menu in sync without a persistent WebSocket.
// Real-time subscription fires on any UPDATE so changes from AdminMenu or the
// Kitchen 86 panel propagate to the customer-facing pages within ~1 second.

const POLL_MS = 30_000;

export function useMenuAvailability() {
  const [inactiveIds, setInactiveIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("menu_items")
        .select("id")
        .eq("active", false);
      setInactiveIds(new Set((data ?? []).map((r: { id: string }) => r.id)));
    } catch {
      // Non-critical — keep showing all items if the fetch fails
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const poll = window.setInterval(fetch, POLL_MS);

    // Real-time: fire on any menu_items change so 86's propagate in ~1s
    const channel = supabase
      .channel("menu-availability")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "menu_items" },
        () => { void fetch(); }
      )
      .subscribe();

    return () => {
      window.clearInterval(poll);
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [fetch]);

  return { inactiveIds, loading };
}
