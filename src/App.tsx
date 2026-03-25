import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConditionalFloatingButtons } from "@/components/ConditionalFloatingButtons";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Order from "./pages/Order";
import Location from "./pages/Location";
import Cart from "./pages/Cart";
import Auth from "./pages/Auth";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import OrderHistory from "./pages/OrderHistory";
import Logout from "./pages/Logout";
import Admin from "./pages/Admin";
import AdminOrders from "./pages/AdminOrders";
import AdminRoles from "./pages/AdminRoles";
import AdminPasswordManagement from "./pages/AdminPasswordManagement";
import Kitchen from "./pages/Kitchen";
import KitchenLogin from "./pages/KitchenLogin";
import Dashboard from "./pages/Dashboard";
import OrderSuccess from "./pages/OrderSuccess";
import NotFound from "./pages/NotFound";
import ServerError from "./pages/ServerError";
import MenuCatalog from "./pages/MenuCatalog";
import DebugAuth from "./pages/DebugAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// ── QueryClient ───────────────────────────────────────────────────────────────
// staleTime: 0  — data is always stale so background refetches run immediately
//               on mount/focus. The persisted cache is shown first (instant),
//               then the fresh fetch replaces it silently.
// gcTime: 24h   — keep cache in memory for a full day (persister handles disk)
// refetchOnWindowFocus: true — refresh when admin/kitchen tab regains focus
// retry: 1      — one retry on network errors
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// ── localStorage persister ────────────────────────────────────────────────────
// Writes the React Query cache to localStorage after every successful fetch.
// On tab reopen / PWA relaunch, PersistQueryClientProvider hydrates the
// QueryClient from localStorage BEFORE rendering children — so admin-metrics
// and kitchen-orders are available on the very first render with no blank state.
//
// key: "rt-query-cache-v1"
//   Bump the version suffix (v2, v3…) whenever the cached data shape changes
//   to force all clients to discard the old cache and start fresh.
//
// maxAge: 24h — discard localStorage cache older than 24 hours so yesterday's
//   data never shows as today's orders.
//
// throttleTime: 1000ms — at most one localStorage write per second to avoid
//   performance issues on rapid real-time updates.
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "rt-query-cache-v1",
  throttleTime: 1000,
});

const App = () => (
  <ErrorBoundary>
    {/*
      PersistQueryClientProvider replaces QueryClientProvider.

      On first load: renders children immediately with empty cache, fetches data.
      On tab reopen / PWA relaunch: hydrates from localStorage first (instant
      render with cached orders), then fires background refetch to get fresh data.

      persistOptions.buster: bump this string to force a full cache clear across
      all clients (e.g. after a breaking schema change).
    */}
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        buster: "rt-v1",
      }}
    >
      <LanguageProvider>
        <CartProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/menu-catalog" element={<MenuCatalog />} />
                  <Route path="/order" element={<Order />} />
                  <Route path="/location" element={<Location />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/kitchen-login" element={<KitchenLogin />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/order-history" element={<OrderHistory />} />
                  <Route path="/logout" element={<Logout />} />
                  <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
                  <Route path="/admin/orders" element={<ProtectedRoute requiredRole="admin"><AdminOrders /></ProtectedRoute>} />
                  <Route path="/admin/roles" element={<ProtectedRoute requiredRole="admin"><AdminRoles /></ProtectedRoute>} />
                  <Route path="/admin/passwords" element={<ProtectedRoute requiredRole="admin"><AdminPasswordManagement /></ProtectedRoute>} />
                  <Route path="/kitchen" element={<ProtectedRoute requiredRole="kitchen"><Kitchen /></ProtectedRoute>} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route path="/500" element={<ServerError />} />
                  <Route path="/debug-auth" element={<DebugAuth />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <ConditionalFloatingButtons />
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </CartProvider>
      </LanguageProvider>
    </PersistQueryClientProvider>
  </ErrorBoundary>
);

export default App;
