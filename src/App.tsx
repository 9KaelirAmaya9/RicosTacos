import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ConditionalFloatingButtons } from "@/components/ConditionalFloatingButtons";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MobileLayout } from "@/components/mobile/MobileLayout";
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
import DatabaseVerification from "./pages/DatabaseVerification";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminMenu from "./pages/AdminMenu";
import AdminReset from "./pages/AdminReset";
import Bootstrap from "./pages/Bootstrap";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Configure React Query with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <MobileLayout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/menu-catalog" element={<MenuCatalog />} />
                  <Route path="/order" element={<Order />} />
                  <Route path="/location" element={<Location />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/auth" element={<Auth />} />

                  {/* Auth route aliases (avoid 404s from common variants) */}
                  <Route path="/sign-in" element={<Navigate to="/signin" replace />} />

                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/bootstrap" element={<Bootstrap />} />
                  <Route path="/kitchen-login" element={<KitchenLogin />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/order-history" element={<OrderHistory />} />
                  <Route path="/logout" element={<Logout />} />
                  <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
                  <Route path="/admin/orders" element={<ProtectedRoute requiredRole="admin"><AdminOrders /></ProtectedRoute>} />
                  <Route path="/admin/analytics" element={<ProtectedRoute requiredRole="admin"><AdminAnalytics /></ProtectedRoute>} />
                  <Route path="/admin/menu" element={<ProtectedRoute requiredRole="admin"><AdminMenu /></ProtectedRoute>} />
                  <Route path="/admin/roles" element={<ProtectedRoute requiredRole="admin"><AdminRoles /></ProtectedRoute>} />
                  <Route path="/admin/passwords" element={<ProtectedRoute requiredRole="admin"><AdminPasswordManagement /></ProtectedRoute>} />
                  <Route path="/admin/verify" element={<ProtectedRoute requiredRole="admin"><DatabaseVerification /></ProtectedRoute>} />
                  <Route path="/admin/reset" element={<ProtectedRoute requiredRole="admin"><AdminReset /></ProtectedRoute>} />
                  <Route path="/kitchen" element={<ProtectedRoute requiredRole="kitchen"><Kitchen /></ProtectedRoute>} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route path="/500" element={<ServerError />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <ConditionalFloatingButtons />
              </MobileLayout>
            </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
