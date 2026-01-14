import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { Suspense, lazy } from "react";
import { Loading } from "@/components/Loading";

// Lazy loading pages
const Index = lazy(() => import("./pages/Index"));
const MontarCesta = lazy(() => import("./pages/MontarCesta"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Historico = lazy(() => import("./pages/Historico"));
const Profile = lazy(() => import("./pages/Profile")); // Added
const Login = lazy(() => import("./pages/Login"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const WhatsappConnect = lazy(() => import('./pages/admin/Whatsapp'));
const Chat = lazy(() => import('./pages/admin/Chat'));
const Customers = lazy(() => import("./pages/admin/Customers"));
const CustomerDetails = lazy(() => import("./pages/admin/CustomerDetails"));
const OrderDetail = lazy(() => import("./pages/admin/OrderDetail"));
const BudgetOptions = lazy(() => import("./pages/admin/BudgetOptions"));
const Products = lazy(() => import("./pages/admin/Products"));
const Categories = lazy(() => import("./pages/admin/Categories"));
const Financial = lazy(() => import("./pages/admin/Financial"));
const Banners = lazy(() => import("./pages/admin/Banners"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const Reports = lazy(() => import("./pages/admin/Reports"));
// Delivery Routes
const DeliveryLayout = lazy(() => import("@/layouts/DeliveryLayout"));
const RouteList = lazy(() => import("@/pages/delivery/RouteList"));
const DeliveryOrderDetail = lazy(() => import("@/pages/delivery/OrderDetail"));
const DeliveryLogin = lazy(() => import("@/pages/delivery/DeliveryLogin"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/montar-cesta" element={<MontarCesta />} />
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/historico" element={<ProtectedRoute><Historico /></ProtectedRoute>} />
                  <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/admin" element={
                    <AdminProtectedRoute>
                      <AdminLayout />
                    </AdminProtectedRoute>
                  }>
                    <Route index element={<Dashboard />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="products" element={<Products />} />
                    <Route path="categories" element={<Categories />} />
                    <Route path="budgets" element={<BudgetOptions />} />
                    <Route path="banners" element={<Banners />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="customers/:id" element={<CustomerDetails />} />
                    <Route path="orders/:orderId" element={<OrderDetail />} />
                    <Route path="financial" element={<Financial />} />
                    <Route path="whatsapp" element={<WhatsappConnect />} />
                    <Route path="chat" element={<Chat />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>

                  {/* Delivery Driver Routes - Simple phone auth */}
                  <Route path="/delivery/login" element={<DeliveryLogin />} />
                  <Route path="/delivery" element={<DeliveryLayout />}>
                    <Route index element={<RouteList />} />
                    <Route path="order/:id" element={<DeliveryOrderDetail />} />
                    {/* Placeholder for future map/profile */}
                    <Route path="map" element={<div className="p-4">Mapa em breve</div>} />
                    <Route path="profile" element={<div className="p-4">Perfil em breve</div>} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider >
);

export default App;
