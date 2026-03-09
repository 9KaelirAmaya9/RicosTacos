import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen, waitFor, fireEvent } from '@testing-library/dom';
import Kitchen from '@/pages/Kitchen';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => {
  const mockSupabase = {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
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
    // Make query pending
    mockSupabase.from().select().in().order.mockReturnValue(
      new Promise(() => {})
    );

    render(<Kitchen />);
    expect(screen.getByText(/loading orders/i)).toBeInTheDocument();
  });

  it('should display active orders', async () => {
    render(<Kitchen />);

    await waitFor(() => {
      expect(screen.getByText('Kitchen Display')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should show order details correctly', async () => {
    render(<Kitchen />);

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
      expect(screen.getByText('Taco')).toBeInTheDocument();
      expect(screen.getByText('Burrito')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Quantity
    });
  });

  it('should show "Start Preparing" button for pending orders', async () => {
    render(<Kitchen />);

    await waitFor(() => {
      const startButton = screen.getByText(/start preparing/i);
      expect(startButton).toBeInTheDocument();
    });
  });

  it('should show "Mark Ready" button for preparing orders', async () => {
    render(<Kitchen />);

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

    render(<Kitchen />);

    await waitFor(() => {
      expect(screen.getByText(/start preparing/i)).toBeInTheDocument();
    });

    const startButton = screen.getByText(/start preparing/i);
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith('1');
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

    render(<Kitchen />);

    await waitFor(() => {
      expect(screen.getByText(/mark ready/i)).toBeInTheDocument();
    });

    const readyButton = screen.getByText(/mark ready/i);
    fireEvent.click(readyButton);

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith('2');
    });
  });

  it('should display time elapsed for orders', async () => {
    render(<Kitchen />);

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

    render(<Kitchen />);

    await waitFor(() => {
      expect(screen.getByText(/no active orders/i)).toBeInTheDocument();
    });
  });

  it('should handle print receipt', async () => {
    const { printReceipt } = await import('@/utils/printReceipt');

    render(<Kitchen />);

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
    render(<Kitchen />);

    await waitFor(() => {
      expect(screen.getByText('delivery')).toBeInTheDocument();
      expect(screen.getByText('pickup')).toBeInTheDocument();
    });
  });

  it('should display order count in header', async () => {
    render(<Kitchen />);

    await waitFor(() => {
      expect(screen.getByText(/2 active orders/i)).toBeInTheDocument();
    });
  });
});

