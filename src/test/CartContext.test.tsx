import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { ReactNode } from 'react';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnThis(),
    })),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should initialize with empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    expect(result.current.cart).toEqual([]);
    expect(result.current.cartTotal).toBe(0);
  });

  it('should add item to cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart({
        id: 'item1',
        name: 'Test Item',
        price: 10.99,
      });
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].name).toBe('Test Item');
    expect(result.current.cartTotal).toBe(10.99);
  });

  it('should update quantity when adding same item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart({
        id: 'item1',
        name: 'Test Item',
        price: 10.99,
      });
    });

    act(() => {
      result.current.addToCart({
        id: 'item1',
        name: 'Test Item',
        price: 10.99,
      });
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(2);
    expect(result.current.cartTotal).toBe(21.98);
  });

  it('should remove item from cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart({
        id: 'item1',
        name: 'Test Item',
        price: 10.99,
      });
    });

    act(() => {
      result.current.removeFromCart('item1');
    });

    expect(result.current.cart).toHaveLength(0);
    expect(result.current.cartTotal).toBe(0);
  });

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart({
        id: 'item1',
        name: 'Test Item',
        price: 10.99,
      });
    });

    act(() => {
      result.current.updateQuantity('item1', 2); // Add 2 more (delta)
    });

    expect(result.current.cart[0].quantity).toBe(3); // Started with 1, added 2
    expect(result.current.cartTotal).toBe(32.97);
  });

  it('should clear cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart({
        id: 'item1',
        name: 'Test Item',
        price: 10.99,
      });
      result.current.addToCart({
        id: 'item2',
        name: 'Test Item 2',
        price: 5.99,
      });
    });

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.cart).toHaveLength(0);
    expect(result.current.cartTotal).toBe(0);
  });

  it('should calculate cart total correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart({
        id: 'item1',
        name: 'Test Item 1',
        price: 10.99,
      });
      result.current.updateQuantity('item1', 1); // Add one more (total 2)
      result.current.addToCart({
        id: 'item2',
        name: 'Test Item 2',
        price: 5.99,
      });
      result.current.updateQuantity('item2', 2); // Add two more (total 3)
    });

    const expectedTotal = (10.99 * 2) + (5.99 * 3);
    expect(result.current.cartTotal).toBeCloseTo(expectedTotal, 2);
  });
});


