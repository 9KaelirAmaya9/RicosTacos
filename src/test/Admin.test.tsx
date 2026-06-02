import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/dom';
import { renderWithProviders } from './utils';
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
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  };
  return {
    supabase: mockSupabase,
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ session: { access_token: 'test-token' }, user: { id: 'u1' }, roles: ['admin'] }),
}));

vi.mock('@/hooks/usePushNotifications', () => {
  const autoSubscribe = vi.fn();
  return { usePushNotifications: () => ({ autoSubscribe }) };
});

vi.mock('@/hooks/useOrderAlarm', () => {
  const startAlarm = vi.fn();
  const stopAlarm = vi.fn();
  const unlockAudio = vi.fn(async () => true);
  return { useOrderAlarm: () => ({ startAlarm, stopAlarm, unlockAudio }) };
});

vi.mock('@/components/NotificationSettings', () => ({
  NotificationSettings: () => <div>Notification Settings</div>,
}));

vi.mock('@/utils/sentry', () => ({
  captureException: vi.fn(),
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

    // Admin fetches metrics via raw fetch() against the Supabase REST API
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
      headers: { get: () => '0' },
    }));

    const module = await import('@/integrations/supabase/client');
    mockSupabase = module.supabase;

    mockSupabase.channel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    });

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

    renderWithProviders(<Admin />);

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

    renderWithProviders(<Admin />);

    await waitFor(() => {
      expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
    });

    // Check for metric cards (always rendered — titles match the metricCards array in Admin.tsx)
    expect(screen.getByText(/today's orders/i)).toBeInTheDocument();
    expect(screen.getByText(/today's revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/pending orders/i)).toBeInTheDocument();
    expect(screen.getByText(/this week/i)).toBeInTheDocument();
  });

  it('should display error message on failure', async () => {
    // Admin uses raw fetch() — make it reject to trigger the error UI.
    // Admin.tsx has retry:3 + retryDelay:2000, so the error appears after ~6 seconds.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    renderWithProviders(<Admin />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load dashboard metrics/i)).toBeInTheDocument();
    }, { timeout: 10000 });
  }, 12000);

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

    renderWithProviders(<Admin />);

    await waitFor(() => {
      expect(screen.getAllByText(/all orders/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/manage roles/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/kitchen display/i).length).toBeGreaterThan(0);
    });
  });
});

