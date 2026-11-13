import type { AnchorHTMLAttributes } from "react";
import { ORDER_ONLINE_URL } from "@/config/ordering";

/** Link externo a la tienda online (order.store). Reemplaza a <Link to="/order">. */
export const OrderLink = ({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a href={ORDER_ONLINE_URL} target="_blank" rel="noopener noreferrer" {...props}>
    {children}
  </a>
);
