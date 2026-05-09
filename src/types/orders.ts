export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  order_type: string;
  items: OrderItem[];
  status: "pending" | "paid" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
  total: number;
  subtotal: number;
  tax: number;
  delivery_address?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  user_id?: string | null;
}

export interface OrderDetails {
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  order_type: string;
  delivery_address: string | null;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  status: string;
  created_at: string;
}
