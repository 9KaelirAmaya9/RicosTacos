import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConditionalFloatingButtons } from "@/components/ConditionalFloatingButtons";
import { StickyOrderBar } from "@/components/StickyOrderBar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { lazy, Suspense } from "react";

// Route-level code splitting — each page is its own JS chunk, loaded on demand.
// This cuts the initial bundle size significantly, improving mobile load time
// and Google Core Web Vitals scores.
const Index = lazy(() => import("./pages/Index"));
const Menu = lazy(() => import("./pages/Menu"));
const Order = lazy(() => import("./pages/Order"));
const Location = lazy(() => import("./pages/Location"));
const Catering = lazy(() => import("./pages/Catering"));
const Cart = lazy(() => import("./pages/Cart"));
const Auth = lazy(() => import("./pages/Auth"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));
const Profile = lazy(() => import("./pages/Profile"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const Logout = lazy(() => import("./pages/Logout"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminRoles = lazy(() => import("./pages/AdminRoles"));
const AdminPasswordManagement = lazy(() => import("./pages/AdminPasswordManagement"));
const AdminMenu = lazy(() => import("./pages/AdminMenu"));
const Kitchen = lazy(() => import("./pages/Kitchen"));
const KitchenLogin = lazy(() => import("./pages/KitchenLogin"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ServerError = lazy(() => import("./pages/ServerError"));
const MenuCatalog = lazy(() => import("./pages/MenuCatalog"));
const Birria = lazy(() => import("./pages/Birria"));
const TacosBrooklyn = lazy(() => import("./pages/TacosBrooklyn"));
const MexicanRestaurantBrooklyn = lazy(() => import("./pages/MexicanRestaurantBrooklyn"));
const CateringBrooklyn = lazy(() => import("./pages/CateringBrooklyn"));
const DebugAuth = lazy(() => import("./pages/DebugAuth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));

// Kitchen-specific error fallback — shows a "Reload" button instead of
// navigating away, so staff can recover without losing the /kitchen route.
// Rendered outside any hook/context so it's safe inside an ErrorBoundary.
const KitchenErrorFallback = (
  <div className="min-h-screen flex items-center justify-center p-6 bg-background">
    <div className="max-w-md w-full text-center space-y-4">
      <p className="text-5xl">⚠️</p>
      <h1 className="text-2xl font-bold">Kitchen Display Error</h1>
      <p className="text-muted-foreground">
        Something crashed on the kitchen display. Tap Reload to get back to orders.
        If orders keep disappearing, call the manager.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-base font-semibold"
      >
        Reload Kitchen Display
      </button>
    </div>
  </div>
);

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
  <HelmetProvider>
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CartProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <div
                  id="sr-announcer"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  className="sr-only"
                />
                <Suspense fallback={null}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/menu" element={<Menu />} />
                    <Route path="/menu-catalog" element={<MenuCatalog />} />
                    <Route path="/order" element={<Order />} />
                    <Route path="/location" element={<Location />} />
                    <Route path="/catering" element={<Catering />} />
                    <Route path="/birria" element={<Birria />} />
                    <Route path="/tacos-brooklyn" element={<TacosBrooklyn />} />
                    <Route path="/mexican-restaurant-brooklyn" element={<MexicanRestaurantBrooklyn />} />
                    <Route path="/catering-brooklyn" element={<CateringBrooklyn />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/kitchen-login" element={<KitchenLogin />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/order-history" element={<OrderHistory />} />
                    <Route path="/logout" element={<Logout />} />
                    <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
                    <Route path="/admin/orders" element={<ProtectedRoute requiredRole="admin"><AdminOrders /></ProtectedRoute>} />
                    <Route path="/admin/roles" element={<ProtectedRoute requiredRole="admin"><AdminRoles /></ProtectedRoute>} />
                    <Route path="/admin/passwords" element={<ProtectedRoute requiredRole="admin"><AdminPasswordManagement /></ProtectedRoute>} />
                    <Route path="/admin/menu" element={<ProtectedRoute requiredRole="admin"><AdminMenu /></ProtectedRoute>} />
                    <Route path="/kitchen" element={<ProtectedRoute requiredRole="kitchen"><ErrorBoundary fallback={KitchenErrorFallback}><Kitchen /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/order-success" element={<OrderSuccess />} />
                    <Route path="/500" element={<ServerError />} />
                    <Route path="/debug-auth" element={<ProtectedRoute requiredRole="admin"><DebugAuth /></ProtectedRoute>} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <ConditionalFloatingButtons />
                <StickyOrderBar />
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </CartProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  </HelmetProvider>
);

export default App;
