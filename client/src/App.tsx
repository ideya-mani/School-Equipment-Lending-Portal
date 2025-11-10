import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EquipmentPage from './pages/Equipment';
import BorrowingsPage from './pages/Borrowings';
import ManageRequestsPage from './pages/ManageRequests';
import UsersPage from './pages/Users';

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to="/" replace />} 
      />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/equipment"
        element={
          <PrivateRoute>
            <EquipmentPage />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/borrowings"
        element={
          <PrivateRoute>
            <BorrowingsPage />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/manage-requests"
        element={
          <PrivateRoute requiredRole="staff">
            <ManageRequestsPage />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/users"
        element={
          <PrivateRoute requiredRole="admin">
            <UsersPage />
          </PrivateRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Layout>
        <AppRoutes />
      </Layout>
    </AuthProvider>
  );
};

export default App;