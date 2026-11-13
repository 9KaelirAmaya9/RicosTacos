import { useEffect } from "react";
import { ORDER_ONLINE_URL } from "@/config/ordering";

/** /order y /cart ahora mandan directo a la tienda online. */
const OrderRedirect = () => {
  useEffect(() => {
    window.location.replace(ORDER_ONLINE_URL);
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <a href={ORDER_ONLINE_URL} className="underline text-primary">
        Redirecting to our online store…
      </a>
    </div>
  );
};

export default OrderRedirect;
