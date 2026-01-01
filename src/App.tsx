import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Suspense, lazy } from "react";
import { Loading } from "@/components/Loading";

// Lazy loading pages
const Index = lazy(() => import("./pages/Index"));
const MontarCesta = lazy(() => import("./pages/MontarCesta"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Historico = lazy(() => import("./pages/Historico"));
const Login = lazy(() => import("./pages/Login"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const WhatsappConnect = lazy(() => import('./pages/admin/Whatsapp'));
const Customers = lazy(() => import("./pages/admin/Customers"));
const CustomerDetails = lazy(() => import("./pages/admin/CustomerDetails"));
const BudgetOptions = lazy(() => import("./pages/admin/BudgetOptions"));
const Products = lazy(() => import("./pages/admin/Products"));
const Categories = lazy(() => import("./pages/admin/Categories"));
const Banners = lazy(() => import("./pages/admin/Banners"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const Reports = lazy(() => import("./pages/admin/Reports"));
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
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Dashboard />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="products" element={<Products />} />
                    <Route path="categories" element={<Categories />} />
                    <Route path="budgets" element={<BudgetOptions />} />
                    <Route path="banners" element={<Banners />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="customers/:id" element={<CustomerDetails />} />
                    <Route path="whatsapp" element={<WhatsappConnect />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
