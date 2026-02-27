import React, { useState, useEffect } from "react";
import apiFetch, { setToken, loadToken } from "@/lib/apiClient";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Tickets from "./pages/Tickets";
import RaiseTicket from "./pages/RaiseTicket";
import VacatingForm from "./pages/VacatingForm";
import ExchangeForm from "./pages/ExchangeForm";
import NotFound from "./pages/NotFound";
import UserLayout from "./components/UserLayout";
import AdminLayout from "./components/AdminLayout";
import SuperAdminLayout from "./components/SuperAdminLayout";

// Super Admin Pages
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import HostelList from "./pages/superadmin/HostelList";
import HostelDetail from "./pages/superadmin/HostelDetail";
import AdminManagement from "./pages/superadmin/AdminManagement";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import TenantManagement from "./pages/admin/TenantManagement";
import PaymentTracking from "./pages/admin/PaymentTracking";
import PaymentTicketDetail from "./pages/admin/PaymentTicketDetail";
import AddNewTicket from "./pages/admin/AddNewTicket";
import ReportsAnalytics from "./pages/admin/ReportsAnalytics";
import RoomOccupancy from "./pages/admin/RoomOccupancy";
import Settings from "./pages/admin/Settings";
import AdminTickets from "./pages/admin/AdminTickets";
import FormRequests from "./pages/admin/FormRequests";
import ExpensesManagement from "./pages/admin/ExpensesManagement"; // Expenses Management
import StaffPayrollManagement from "./pages/admin/StaffPayrollManagement"; // Staff & Payroll
import AdminProfile from "./pages/admin/AdminProfile"; // Admin Profile
import VoiceAssistantPage from "./pages/admin/VoiceAssistantPage";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import TenantOnboarding from "./pages/TenantOnboarding";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState("user");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const token = loadToken();
        if (token) {
          // Validate existing token by fetching profile
          const profile = await apiFetch('/auth/profile');
          if (profile && profile.role) {
            setIsAuthenticated(true);
            if (profile.role === 'superadmin') setUserType('superadmin');
            else if (profile.role === 'admin') setUserType('admin');
            else setUserType('user');
          } else {
            // Invalid token/profile
            setToken(null);
            setIsAuthenticated(false);
            setUserType("user");
          }
        } else {
          setIsAuthenticated(false);
          setUserType("user");
        }
      } catch (error) {
        setToken(null);
        setIsAuthenticated(false);
        setUserType("user");
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleSetIsAuthenticated = (value) => {
    setIsAuthenticated(value);
  };

  const handleSetUserType = (type) => {
    setUserType(type);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserType("user");
    localStorage.clear();
    sessionStorage.clear();
  };
  
  // Ensure token is cleared when logging out
  useEffect(() => {
    if (!isAuthenticated) {
      try { setToken(null); } catch (e) { /* token cleanup failed */ }
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const getHomeRoute = () => {
    if (userType === 'superadmin') return '/superadmin/dashboard';
    if (userType === 'admin') return '/admin/dashboard';
    return '/dashboard';
  };

  return (
    <ThemeProvider>
      <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* LOGIN */}
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <Login
                  setIsAuthenticated={handleSetIsAuthenticated}
                  setUserType={handleSetUserType}
                />
              ) : (
                <Navigate to={getHomeRoute()} replace />
              )
            }
          />

          {/* FORGOT PASSWORD */}
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* RESET PASSWORD */}
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* REGISTER */}
          <Route
            path="/register"
            element={
              !isAuthenticated ? (
                <Register />
              ) : (
                <Navigate to={getHomeRoute()} replace />
              )
            }
          />

          {/* TENANT ONBOARDING */}
          <Route
            path="/onboarding"
            element={
              isAuthenticated && userType === "user" ? (
                <TenantOnboarding />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* USER DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                userType === "admin" || userType === "superadmin" ? (
                  <Navigate to={getHomeRoute()} replace />
                ) : (
                  <UserLayout onLogout={handleLogout}>
                    <Dashboard userType={userType} />
                  </UserLayout>
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* USER ROUTES */}
          <Route
            path="/invoices"
            element={
              isAuthenticated && userType === "user" ? (
                <UserLayout onLogout={handleLogout}>
                  <Invoices />
                </UserLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/profile"
            element={
              isAuthenticated && userType === "user" ? (
                <UserLayout onLogout={handleLogout}>
                  <Profile onLogout={handleLogout} />
                </UserLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/tickets"
            element={
              isAuthenticated && userType === "user" ? (
                <UserLayout onLogout={handleLogout}>
                  <Tickets />
                </UserLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/raise-ticket"
            element={
              isAuthenticated && userType === "user" ? (
                <UserLayout onLogout={handleLogout}>
                  <RaiseTicket />
                </UserLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          {/* FORM ROUTES */}
          <Route
            path="/vacating-form"
            element={
              isAuthenticated && userType === "user" ? (
                <UserLayout onLogout={handleLogout}>
                  <VacatingForm />
                </UserLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/exchange-form"
            element={
              isAuthenticated && userType === "user" ? (
                <UserLayout onLogout={handleLogout}>
                  <ExchangeForm />
                </UserLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* SUPER ADMIN ROUTES */}
          <Route
            path="/superadmin"
            element={
              isAuthenticated && userType === "superadmin" ? (
                <SuperAdminLayout onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          >
            <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="hostels" element={<HostelList />} />
            <Route path="hostels/:id" element={<HostelDetail />} />
            <Route path="admins" element={<AdminManagement />} />
          </Route>

          {/* ADMIN ROUTES */}
          <Route
            path="/admin"
            element={
              isAuthenticated && userType === "admin" ? (
                <AdminLayout onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="tenant-management" element={<TenantManagement />} />
            <Route path="payment-tracking" element={<PaymentTracking />} />
            <Route
              path="payment-ticket-detail/:ticketId"
              element={<PaymentTicketDetail />}
            />
            <Route path="add-new-ticket" element={<AddNewTicket />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="form-requests" element={<FormRequests />} />
            {/* Expenses and Staff Management Routes */}
            <Route path="expenses" element={<ExpensesManagement />} />
            <Route path="staff-payroll" element={<StaffPayrollManagement />} />
            <Route path="room-occupancy" element={<RoomOccupancy />} />
            <Route path="reports-analytics" element={<ReportsAnalytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="voice-assistant" element={<VoiceAssistantPage />} />
          </Route>

          {/* DEFAULT ROUTE */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <Navigate to={getHomeRoute()} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          
          {/* 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;