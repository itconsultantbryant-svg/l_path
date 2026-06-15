import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
import PermissionRoute from './components/auth/PermissionRoute';
import StaffHomeRedirect from './components/auth/StaffHomeRedirect';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AdminLayout from './components/layouts/AdminLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import RecoverAccount from './pages/auth/RecoverAccount';
import Dashboard from './pages/user/Dashboard';
import Wallet from './pages/user/Wallet';
import Packages from './pages/user/Packages';
import Tasks from './pages/user/Tasks';
import Referrals from './pages/user/Referrals';
import Chat from './pages/user/Chat';
import Profile from './pages/user/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminDeposits from './pages/admin/Deposits';
import AdminWithdrawals from './pages/admin/Withdrawals';
import AdminPackages from './pages/admin/Packages';
import AdminTasks from './pages/admin/Tasks';
import AdminChat from './pages/admin/Chat';
import AdminSettings from './pages/admin/Settings';
import AdminReports from './pages/admin/Reports';
import StaffManagement from './pages/admin/StaffManagement';
import { HopDashboard, HomDashboard, FinanceDashboard, CsmDashboard } from './pages/admin/RoleDashboards';

// Compliance Pages
import Terms from './pages/compliance/Terms';
import Privacy from './pages/compliance/Privacy';
import Disclaimer from './pages/compliance/Disclaimer';
import About from './pages/compliance/About';

import AdminReferrals from './pages/admin/Referrals';
import AdminPromotion from './pages/admin/Promotion';

import Chatbot from './components/chatbot/Chatbot';
import FloatingWhatsApp from './components/support/FloatingWhatsApp';
import { WhatsAppProvider } from './contexts/WhatsAppContext';

function App() {
  return (
    <AuthProvider>
      <WhatsAppProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Toaster position="top-right" />
        <FloatingWhatsApp />
        <Chatbot />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="recover" element={<RecoverAccount />} />
            <Route path="terms" element={<Terms />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="disclaimer" element={<Disclaimer />} />
            <Route path="about" element={<About />} />
          </Route>

          {/* User Routes */}
          <Route path="/dashboard" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="packages" element={<Packages />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="referrals" element={<Referrals />} />
            <Route path="chat" element={<Chat />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<StaffHomeRedirect />} />
            <Route path="dashboard" element={<PermissionRoute permission="dashboard"><AdminDashboard /></PermissionRoute>} />
            <Route path="hop/dashboard" element={<PermissionRoute permission="dashboard"><HopDashboard /></PermissionRoute>} />
            <Route path="hom/dashboard" element={<PermissionRoute permission="dashboard"><HomDashboard /></PermissionRoute>} />
            <Route path="finance/dashboard" element={<PermissionRoute permission="dashboard"><FinanceDashboard /></PermissionRoute>} />
            <Route path="csm/dashboard" element={<PermissionRoute permission="dashboard"><CsmDashboard /></PermissionRoute>} />
            <Route path="staff" element={<PermissionRoute permission="staff"><StaffManagement /></PermissionRoute>} />
            <Route path="users/:userId" element={<PermissionRoute permission="users"><AdminUsers /></PermissionRoute>} />
            <Route path="users" element={<PermissionRoute permission="users"><AdminUsers /></PermissionRoute>} />
            <Route path="deposits" element={<PermissionRoute permission="deposits"><AdminDeposits /></PermissionRoute>} />
            <Route path="withdrawals" element={<PermissionRoute permission="withdrawals"><AdminWithdrawals /></PermissionRoute>} />
            <Route path="packages" element={<PermissionRoute permission="packages"><AdminPackages /></PermissionRoute>} />
            <Route path="tasks" element={<PermissionRoute permission="tasks"><AdminTasks /></PermissionRoute>} />
            <Route path="referrals" element={<PermissionRoute permission="referrals"><AdminReferrals /></PermissionRoute>} />
            <Route path="promotion" element={<PermissionRoute permission="promotion"><AdminPromotion /></PermissionRoute>} />
            <Route path="chat" element={<PermissionRoute permission="chat"><AdminChat /></PermissionRoute>} />
            <Route path="reports" element={<PermissionRoute permission="reports"><AdminReports /></PermissionRoute>} />
            <Route path="settings" element={<PermissionRoute permission="settings"><AdminSettings /></PermissionRoute>} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </WhatsAppProvider>
    </AuthProvider>
  );
}

export default App;

