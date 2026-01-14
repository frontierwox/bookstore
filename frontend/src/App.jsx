import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductListing from './pages/ProductListing';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import OrderHistory from './pages/OrderHistory';
import OrderDetails from './pages/OrderDetails';
import Profile from './pages/Profile';
import Success from './pages/Success';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './admin/AdminLogin';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import "./index.css";

// Admin components
import AdminLayout from './admin/AdminLayout';
import ProductManagementDashboard from './admin/ProductManagementDashboard';
import SalesAnalyticsDashboard from './admin/SalesAnalyticsDashboard';
import OrderManagement from './admin/OrderManagement';
import StockControl from './admin/StockControl';
import AdminProductForm from './admin/AdminProductForm';
import AdminOrderDetails from './admin/AdminOrderDetails';

function App() {
  const appName = import.meta.env.VITE_APP_NAME || 'Saree Store';

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AdminAuthProvider>
          <CartProvider>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <div className="app">
                <Navbar appName={appName} />
                <main className="main-content">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<ProductListing />} />
                    <Route path="/products/:id" element={<ProductDetails />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/cart" element={<Cart />} />

                    {/* Protected User Routes */}
                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute>
                          <Checkout />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/orders"
                      element={
                        <ProtectedRoute>
                          <OrderHistory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/orders/:id"
                      element={
                        <ProtectedRoute>
                          <OrderDetails />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/success"
                      element={
                        <ProtectedRoute>
                          <Success />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    
                    {/* Admin protected routes with layout */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute adminOnly>
                          <AdminLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="products" element={<ProductManagementDashboard />} />
                      <Route path="products/new" element={<AdminProductForm mode="create" />} />
                      <Route path="products/:id/edit" element={<AdminProductForm mode="edit" />} />
                      <Route path="analytics" element={<SalesAnalyticsDashboard />} />
                      <Route path="orders" element={<OrderManagement />} />
                      <Route path="orders/:id" element={<AdminOrderDetails />} />
                      <Route path="stock" element={<StockControl />} />
                      <Route path="settings" element={<div className="coming-soon"><h2>Settings</h2><p>Coming soon...</p></div>} />
                    </Route>

                    {/* 404 Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer appName={appName} />
              </div>
            </Router>
          </CartProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;