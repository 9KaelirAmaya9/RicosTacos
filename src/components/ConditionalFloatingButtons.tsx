import { useLocation } from "react-router-dom";
import { FloatingContactButton } from "./FloatingContactButton";
import { FloatingCartButton } from "./FloatingCartButton";

export const ConditionalFloatingButtons = () => {
  const location = useLocation();
  
  // Show cart button only on menu page (NOT on order page to avoid blocking buttons)
  if (location.pathname === "/menu") {
    return <FloatingCartButton />;
  }
  
  // Show phone button on all other pages (especially homepage and order page)
  return <FloatingContactButton />;
};
