import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import { BrowserRouter } from 'react-router-dom';
import Admin from '@/pages/Admin';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
  };
  return {
    supabase: mockSupabase,
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Admin Dashboard', () => {
  let mockSupabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('@/integrations/supabase/client');
    mockSupabase = module.supabase;
    
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    });
  });

  it('should render loading state initially', () => {
    // Mock pending promise
    mockSupabase.from().select().gte().order.mockReturnValue(
      new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('should display metrics after loading', async () => {
    const mockOrders = [
      { id: '1', total: 25.50, created_at: new Date().toISOString() },
      { id: '2', total: 15.75, created_at: new Date().toISOString() },
    ];

    // Mock the three parallel queries
    const selectMock = vi.fn();
    const gteMock = vi.fn();
    const eqMock = vi.fn();
    const orderMock = vi.fn();

    selectMock
      .mockReturnValueOnce({
        gte: gteMock,
        order: orderMock,
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: mockOrders, error: null }),
      })
      .mockReturnValueOnce({
        eq: eqMock,
      });

    gteMock.mockReturnValue({
      order: orderMock,
    });

    orderMock
      .mockResolvedValueOnce({ data: mockOrders, error: null })
      .mockResolvedValueOnce({ count: 100, error: null })
      .mockResolvedValueOnce({ count: 5, error: null });

    mockSupabase.from.mockReturnValue({
      select: selectMock,
    });

    render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
    });

    // Check for metric cards
    expect(screen.getByText(/today's orders/i)).toBeInTheDocument();
    expect(screen.getByText(/today's revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/pending orders/i)).toBeInTheDocument();
    expect(screen.getByText(/total orders/i)).toBeInTheDocument();
  });

  it('should display error message on failure', async () => {
    const selectMock = vi.fn();
    selectMock.mockReturnValue({
      gte: vi.fn().mockReturnValue({
        order: vi.fn().mockRejectedValue(new Error('Database error')),
      }),
    });

    mockSupabase.from.mockReturnValue({
      select: selectMock,
    });

    render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should have quick action buttons', async () => {
    // Mock successful data fetch
    const mockData = { data: [], error: null };
    const selectMock = vi.fn();
    selectMock
      .mockReturnValueOnce({
        gte: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue(mockData),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ count: 0, error: null }),
      })
      .mockReturnValueOnce({
        eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
      });

    mockSupabase.from.mockReturnValue({
      select: selectMock,
    });

    render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/view all orders/i)).toBeInTheDocument();
      expect(screen.getByText(/manage roles/i)).toBeInTheDocument();
      expect(screen.getByText(/kitchen display/i)).toBeInTheDocument();
    });
  });
});

