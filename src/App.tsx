import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
// staleTime: 0  — always refetch in background on mount/focus
// gcTime: 5min  — keep in memory for 5 minutes (no disk persistence)
// refetchOnWindowFocus: true — refresh when admin/kitchen tab regains focus
// retry: 1      — one retry on network errors
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 1000 * 60 * 30, // 30 minutes — survives longer navigation gaps
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
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
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
