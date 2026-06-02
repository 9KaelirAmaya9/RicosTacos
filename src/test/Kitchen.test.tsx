import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/dom';
import { renderWithProviders } from './utils';
import Kitchen from '@/pages/Kitchen';

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

// Mock NotificationSettings
vi.mock('@/components/NotificationSettings', () => ({
  NotificationSettings: () => <div>Notification Settings</div>,
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

vi.mock('@/hooks/usePushNotifications', () => {
  const autoSubscribe = vi.fn();
  return { usePushNotifications: () => ({ autoSubscribe }) };
});

vi.mock('@/hooks/useMenuAvailability', () => ({
  useMenuAvailability: () => ({ inactiveIds: new Set() }),
}));

vi.mock('@/utils/sentry', () => ({
  captureException: vi.fn(),
}));

const mockActiveOrders = [
  {
    id: '1',
    order_number: 'ORD-2024-001',
    customer_name: 'John Doe',
    customer_phone: '555-0100',
    order_type: 'delivery',
    items: [
      { name: 'Taco', quantity: 2, price: 5.99 },
      { name: 'Burrito', quantity: 1, price: 8.99 },
    ],
    status: 'pending',
    total: 25.97,
    subtotal: 20.97,
    tax: 5.00,
    created_at: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
  },
  {
    id: '2',
    order_number: 'ORD-2024-002',
    customer_name: 'Jane Smith',
    customer_phone: '555-0200',
    order_type: 'pickup',
    items: [{ name: 'Quesadilla', quantity: 1, price: 7.99 }],
    status: 'preparing',
    total: 8.79,
    subtotal: 7.99,
    tax: 0.80,
    created_at: new Date(Date.now() - 10 * 60000).toISOString(), // 10 minutes ago
  },
];

describe('Kitchen Dashboard', () => {
  let mockSupabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Kitchen fetches orders via raw fetch() against the Supabase REST API
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockActiveOrders,
    }));

    const module = await import('@/integrations/supabase/client');
    mockSupabase = module.supabase;

    // Mock Supabase query chain
    const selectMock = vi.fn().mockReturnThis();
    const inMock = vi.fn().mockReturnThis();
    const orderMock = vi.fn().mockResolvedValue({
      data: mockActiveOrders,
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: selectMock,
      in: inMock,
      order: orderMock,
    });

    // Mock real-time channel
    mockSupabase.channel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    });
  });

  it('should render loading state initially', () => {
    // Kitchen uses raw fetch() — make it hang to keep loading state
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));

    renderWithProviders(<Kitchen />);
    expect(screen.getByText(/loading kitchen orders/i)).toBeInTheDocument();
  });

  it('should display active orders', async () => {
    renderWithProviders(<Kitchen />);

    await waitFor(() => {
      // Header is always unique
      expect(screen.getByText('Kitchen Display')).toBeInTheDocument();
      // Customer names may appear multiple times (active orders + pending safety-net section)
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
    });
  });

  it('should show order details correctly', async () => {
    renderWithProviders(<Kitchen />);

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
      expect(screen.getByText('Taco')).toBeInTheDocument();
      expect(screen.getByText('Burrito')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Quantity
    });
  });

  it('should show "Start Preparing" button for pending orders', async () => {
    renderWithProviders(<Kitchen />);

    await waitFor(() => {
      // May have multiple "Start Preparing" variants (pending safety-net + active order buttons)
      const startButtons = screen.getAllByText(/start preparing/i);
      expect(startButtons.length).toBeGreaterThan(0);
    });
  });

  it('should show "Mark Ready" button for preparing orders', async () => {
    renderWithProviders(<Kitchen />);

    await waitFor(() => {
      const readyButton = screen.getByText(/mark ready/i);
      expect(readyButton).toBeInTheDocument();
    });
  });

  it('should update order status from pending to preparing', async () => {
    const updateMock = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockActiveOrders, error: null }),
      update: vi.fn().mockReturnValue({
        eq: updateMock,
      }),
    });

    renderWithProviders(<Kitchen />);

    await waitFor(() => {
      expect(screen.getAllByText(/start preparing/i).length).toBeGreaterThan(0);
    });

    // Multiple buttons may exist — click the first one (pending safety-net section)
    const startButton = screen.getAllByText(/start preparing/i)[0];
    fireEvent.click(startButton);

    await waitFor(() => {
      // supabase.from("orders").update(...).eq("id", orderId) → eq called with ("id", "1")
      expect(updateMock).toHaveBeenCalledWith('id', '1');
    });
  });

  it('should update order status from preparing to ready', async () => {
    const updateMock = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockActiveOrders, error: null }),
      update: vi.fn().mockReturnValue({
        eq: updateMock,
      }),
    });

    renderWithProviders(<Kitchen />);

    await waitFor(() => {
      expect(screen.getByText(/mark ready/i)).toBeInTheDocument();
    });

    const readyButton = screen.getByText(/mark ready/i);
    fireEvent.click(readyButton);

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith('id', '2');
    });
  });

  it('should display time elapsed for orders', async () => {
    renderWithProviders(<Kitchen />);

    await waitFor(() => {
      // Should show time elapsed (e.g., "5 min ago")
      const timeElements = screen.getAllByText(/\d+ min/i);
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  it('should display empty state when no active orders', async () => {
    mockSupabase.from().select().in().order.mockResolvedValue({
      data: [],
      error: null,
    });

    renderWithProviders(<Kitchen />);

    await waitFor(() => {
      expect(screen.getByText(/no active orders/i)).toBeInTheDocument();
    });
  });

  it('should handle print receipt', async () => {
    const { printReceipt } = await import('@/utils/printReceipt');

    renderWithProviders(<Kitchen />);

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    });

    const printButtons = screen.getAllByText(/print receipt/i);
    fireEvent.click(printButtons[0]);

    await waitFor(() => {
      expect(printReceipt).toHaveBeenCalled();
    });
  });

  it('should show order type badge', async () => {
    renderWithProviders(<Kitchen />);

    await waitFor(() => {
      expect(screen.getByText('delivery')).toBeInTheDocument();
      expect(screen.getByText('pickup')).toBeInTheDocument();
    });
  });

  it('should display order count in header', async () => {
    renderWithProviders(<Kitchen />);

    await waitFor(() => {
      expect(screen.getByText(/2 active orders/i)).toBeInTheDocument();
    });
  });
});

