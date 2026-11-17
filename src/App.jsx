import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { Layout } from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Entry Pages
import Register from './pages/Register';
import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';
import { useAuth } from './context/AuthContext';

// Protected App Pages
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
import { Invoices } from './pages/Invoices';
import { Products } from './pages/Products';
import { Customers } from './pages/Customers';
import Coupons from './pages/Coupons';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

// Root Entry: Opens directly to Sign In, or redirects to Dashboard if already authenticated
const RootEntry = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <ThemeProvider>
            <CartProvider>
              <Routes>
                {/* Direct Authentication Entry Flow (No promotional landing page) */}
                <Route path="/" element={<RootEntry />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signin" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/signup" element={<Register />} />
                <Route path="/auth/callback" element={<OAuthCallback />} />

                {/* Protected POS Application */}
                <Route
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/pos" element={<POS />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/coupons" element={<Coupons />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </CartProvider>
          </ThemeProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
