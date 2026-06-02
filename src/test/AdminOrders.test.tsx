import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/dom';
import { renderWithProviders } from './utils';
import AdminOrders from '@/pages/AdminOrders';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => {
  const mockSupabase = {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  };
  return {
    supabase: mockSupabase,
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock printReceipt
vi.mock('@/utils/printReceipt', () => ({
  printReceipt: vi.fn(),
}));

// Mock Navigation component
vi.mock('@/components/Navigation', () => ({
  Navigation: () => <nav>Navigation</nav>,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ session: { access_token: 'test-token' }, user: null }),
}));

vi.mock('@/hooks/useOrderAlarm', () => {
  const startAlarm = vi.fn();
  const stopAlarm = vi.fn();
  const unlockAudio = vi.fn(async () => true);
  return { useOrderAlarm: () => ({ startAlarm, stopAlarm, unlockAudio }) };
});

vi.mock('@/utils/sentry', () => ({
  captureException: vi.fn(),
}));

const mockOrders = [
  {
    id: '1',
    order_number: 'ORD-2024-001',
    customer_name: 'John Doe',
    customer_phone: '555-0100',
    order_type: 'delivery',
    items: [{ name: 'Taco', quantity: 2, price: 5.99 }],
    status: 'pending',
    total: 12.98,
    subtotal: 11.98,
    tax: 1.00,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    order_number: 'ORD-2024-002',
    customer_name: 'Jane Smith',
    customer_phone: '555-0200',
    order_type: 'pickup',
    items: [{ name: 'Burrito', quantity: 1, price: 8.99 }],
    status: 'preparing',
    total: 9.79,
    subtotal: 8.99,
    tax: 0.80,
    created_at: new Date().toISOString(),
  },
];

describe('AdminOrders', () => {
  let mockSupabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // AdminOrders fetches orders via raw fetch() against the Supabase REST API
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOrders,
    }));

    const module = await import('@/integrations/supabase/client');
    mockSupabase = module.supabase;

    // Mock Supabase query chain
    const selectMock = vi.fn().mockReturnThis();
    const orderMock = vi.fn().mockReturnThis();
    const limitMock = vi.fn().mockResolvedValue({
      data: mockOrders,
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: selectMock,
      order: orderMock,
      limit: limitMock,
    });

    // Mock real-time channel
    mockSupabase.channel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    });
  });

  it('should render loading state initially', () => {
    // AdminOrders uses raw fetch() — make it hang to keep loading state
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));

    renderWithProviders(<AdminOrders />);
    // Component renders but orders haven't loaded yet
    expect(screen.getByText('Order Tracking')).toBeInTheDocument();
    expect(screen.queryByText('ORD-2024-001')).not.toBeInTheDocument();
  });

  it('should display orders after loading', async () => {
    renderWithProviders(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-2024-002')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should filter orders by search term', async () => {
    renderWithProviders(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by order/i);
    fireEvent.change(searchInput, { target: { value: '001' } });

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
      expect(screen.queryByText('ORD-2024-002')).not.toBeInTheDocument();
    });
  });

  it('should filter orders by status', async () => {
    // Pre-set the status filter via sessionStorage — AdminOrders.tsx reads this in its
    // useState initializer: `sessionStorage.getItem("rt_admin_orders_filter") ?? "all"`
    sessionStorage.setItem('rt_admin_orders_filter', 'pending');

    renderWithProviders(<AdminOrders />);

    await waitFor(() => {
      // ORD-2024-001 has status 'pending' — shown
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
      // ORD-2024-002 has status 'preparing' — filtered out
      expect(screen.queryByText('ORD-2024-002')).not.toBeInTheDocument();
    });

    sessionStorage.removeItem('rt_admin_orders_filter');
  });

  it('should update order status', async () => {
    const updateMock = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: mockOrders, error: null }),
      update: vi.fn().mockReturnValue({
        eq: updateMock,
      }),
    });

    renderWithProviders(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    });

    // Find status select for first order and change it
    const statusSelects = screen.getAllByRole('combobox');
    const orderStatusSelect = statusSelects.find((select) =>
      select.textContent?.includes('pending')
    );

    if (orderStatusSelect) {
      fireEvent.click(orderStatusSelect);
      const preparingOption = screen.getByText('Preparing');
      fireEvent.click(preparingOption);

      await waitFor(() => {
        expect(updateMock).toHaveBeenCalled();
      });
    }
  });

  it('should handle refresh button', async () => {
    // Track global fetch calls — component uses raw fetch()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOrders,
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    });

    const callCountBeforeRefresh = fetchMock.mock.calls.length;
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThan(callCountBeforeRefresh);
    });
  });

  it('should display empty state when no orders', async () => {
    // Override fetch to return empty list
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }));

    renderWithProviders(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText(/no orders match the current filters/i)).toBeInTheDocument();
    });
  });
});

