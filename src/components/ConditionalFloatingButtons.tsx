import { useLocation } from "react-router-dom";
import { FloatingContactButton } from "./FloatingContactButton";

export const ConditionalFloatingButtons = () => {
  const location = useLocation();

  // No FAB on staff-facing pages — the phone button overlaps action buttons
  // on tablet-width single-column layouts (Kitchen cards, Admin order rows).
  if (location.pathname.startsWith("/kitchen") || location.pathname.startsWith("/admin")) {
    return null;
  }

  // Show phone button on all other pages (especially homepage and order page)
  return <FloatingContactButton />;
};
