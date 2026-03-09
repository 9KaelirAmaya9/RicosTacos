import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen, waitFor, fireEvent } from '@testing-library/dom';
import AdminOrders from '@/pages/AdminOrders';

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

// Mock Navigation component
vi.mock('@/components/Navigation', () => ({
  Navigation: () => <nav>Navigation</nav>,
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
    // Make query pending
    mockSupabase.from().select().order().limit.mockReturnValue(
      new Promise(() => {})
    );

    render(<AdminOrders />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display orders after loading', async () => {
    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-2024-002')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should filter orders by search term', async () => {
    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by order number/i);
    fireEvent.change(searchInput, { target: { value: '001' } });

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
      expect(screen.queryByText('ORD-2024-002')).not.toBeInTheDocument();
    });
  });

  it('should filter orders by status', async () => {
    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    });

    // Find and click status filter
    const statusFilter = screen.getByRole('combobox');
    fireEvent.click(statusFilter);

    // Select "pending" status
    const pendingOption = screen.getByText('Pending');
    fireEvent.click(pendingOption);

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
      expect(screen.queryByText('ORD-2024-002')).not.toBeInTheDocument();
    });
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

    render(<AdminOrders />);

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
    const fetchMock = vi.fn().mockResolvedValue({ data: mockOrders, error: null });
    mockSupabase.from().select().order().limit = fetchMock;

    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  it('should display empty state when no orders', async () => {
    mockSupabase.from().select().order().limit.mockResolvedValue({
      data: [],
      error: null,
    });

    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText(/no orders found/i)).toBeInTheDocument();
    });
  });
});

