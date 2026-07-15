import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useVaultStore from './store/useVaultStore';

import AuthPage               from './pages/AuthPage';
import Dashboard              from './pages/Dashboard';
import TransferPage           from './pages/TransferPage';
import CardVaultPage          from './pages/CardVaultPage';
import TransactionDetailPage  from './pages/TransactionDetailPage';
import OnboardingPage         from './pages/OnboardingPage';
import QRPaymentPage          from './pages/QRPaymentPage';
import AnalyticsPage          from './pages/AnalyticsPage';
import RequestMoneyPage       from './pages/RequestMoneyPage';
import NotificationCenterPage from './pages/NotificationCenterPage';
import SecurityCenterPage     from './pages/SecurityCenterPage';

function Protected({ children }) {
  const auth = useVaultStore(s => s.isAuthenticated);
  return auth ? children : <Navigate to="/auth" replace />;
}
function Public({ children }) {
  const auth = useVaultStore(s => s.isAuthenticated);
  return !auth ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { isAuthenticated, accessToken, connectSocket } = useVaultStore();
  useEffect(() => { if (isAuthenticated && accessToken) connectSocket(accessToken); }, [isAuthenticated]);

  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{
        duration: 4000,
        style: {
          background: '#0D1117', border: '1px solid rgba(0,212,255,0.12)',
          color: '#F0F4FF', fontFamily: 'Rajdhani, sans-serif',
          fontSize: '0.95rem', fontWeight: 500, borderRadius: '12px'
        }
      }} />
      <Routes>
        <Route path="/"             element={<Navigate to="/dashboard" replace />} />
        <Route path="/auth"         element={<Public><AuthPage /></Public>} />
        <Route path="/onboarding"   element={<Protected><OnboardingPage /></Protected>} />
        <Route path="/dashboard"    element={<Protected><Dashboard /></Protected>} />
        <Route path="/transfer"     element={<Protected><TransferPage /></Protected>} />
        <Route path="/vault"        element={<Protected><CardVaultPage /></Protected>} />
        <Route path="/tx/:txId"     element={<Protected><TransactionDetailPage /></Protected>} />
        <Route path="/qr"           element={<Protected><QRPaymentPage /></Protected>} />
        <Route path="/analytics"    element={<Protected><AnalyticsPage /></Protected>} />
        <Route path="/requests"     element={<Protected><RequestMoneyPage /></Protected>} />
        <Route path="/notifications"element={<Protected><NotificationCenterPage /></Protected>} />
        <Route path="/security"     element={<Protected><SecurityCenterPage /></Protected>} />
        <Route path="*"             element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
