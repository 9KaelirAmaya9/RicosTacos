import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartContextType {
  cart: CartItem[];
  orderType: "pickup" | "delivery";
  setOrderType: (type: "pickup" | "delivery") => void;
  addToCart: (item: { id: string; name: string; price: number; image?: string }) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'ricos-tacos-cart';
const ORDER_TYPE_STORAGE_KEY = 'ricos-tacos-order-type';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("pickup");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart and order type from localStorage or database on mount
  useEffect(() => {
    const loadCart = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Load order type from localStorage
      const storedOrderType = localStorage.getItem(ORDER_TYPE_STORAGE_KEY);
      if (storedOrderType === 'pickup' || storedOrderType === 'delivery') {
        setOrderType(storedOrderType);
      }

      if (user) {
        // Load from database for authenticated users
        const { data, error } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', user.id);

        if (!error && data) {
          const cartItems: CartItem[] = data.map(item => ({
            id: item.item_name,
            name: item.item_name_english || item.item_name,
            price: parseFloat(item.price.toString()),
            quantity: item.quantity,
            image: item.image || undefined
          }));
          setCart(cartItems);
        }
      } else {
        // Load from localStorage for guest users
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          try {
            setCart(JSON.parse(stored));
          } catch (e) {
            console.error('Error parsing cart from localStorage', e);
          }
        }
      }
      
      setIsLoading(false);
    };

    loadCart();
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUserId = session?.user?.id || null;
      setUserId(newUserId);

      if (event === 'SIGNED_IN' && newUserId) {
        // Merge localStorage cart with database on sign in
        const localCart = localStorage.getItem(CART_STORAGE_KEY);
        if (localCart) {
          try {
            const localItems: CartItem[] = JSON.parse(localCart);
            
            // Sync local cart to database
            if (localItems.length > 0) {
              for (const item of localItems) {
                await supabase.from('cart_items').upsert({
                  user_id: newUserId,
                  item_name: item.id,
                  item_name_english: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  image: item.image || '',
                  category: ''
                }, {
                  onConflict: 'user_id,item_name'
                });
              }

              // Clear localStorage after syncing
              localStorage.removeItem(CART_STORAGE_KEY);
            }
          } catch (e) {
            console.error('Error syncing cart', e);
          }
        }

        // Load cart from database
        const { data } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', newUserId);

        if (data) {
          const cartItems: CartItem[] = data.map(item => ({
            id: item.item_name,
            name: item.item_name_english || item.item_name,
            price: parseFloat(item.price.toString()),
            quantity: item.quantity,
            image: item.image || undefined
          }));
          setCart(cartItems);
        }
      } else if (event === 'SIGNED_OUT') {
        // Get current cart state before saving
        const currentCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
        if (currentCart.length > 0) {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(currentCart));
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [cart]);

  // Persist cart changes with debouncing
  useEffect(() => {
    if (isLoading) return;

    const timeoutId = setTimeout(async () => {
      if (userId) {
        // Sync to database for authenticated users - use upsert instead of delete+insert
        if (cart.length > 0) {
          const { error } = await supabase.from('cart_items').upsert(
            cart.map(item => ({
              user_id: userId,
              item_name: item.id,
              item_name_english: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image || '',
              category: ''
            })),
            {
              onConflict: 'user_id,item_name'
            }
          );
          
          if (error) {
            console.error('Error syncing cart to database:', error);
          }
        } else {
          // Clear cart items if cart is empty
          await supabase.from('cart_items').delete().eq('user_id', userId);
        }
      } else {
        // Save to localStorage for guest users
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      }
    }, 500); // Debounce by 500ms

    return () => clearTimeout(timeoutId);
  }, [cart, userId, isLoading]);

  // Persist order type changes
  useEffect(() => {
    localStorage.setItem(ORDER_TYPE_STORAGE_KEY, orderType);
  }, [orderType]);

  const addToCart = (item: { id: string; name: string; price: number; image?: string }) => {
    console.log("addToCart called with:", item);
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added to cart!`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prevCart => {
      const updatedCart = prevCart.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      ).filter(item => item.quantity > 0);
      return updatedCart;
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const clearCart = async () => {
    if (userId) {
      await supabase.from('cart_items').delete().eq('user_id', userId);
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
    
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        orderType,
        setOrderType,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
