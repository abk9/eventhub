import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Participants from './pages/Participants';
import AdminUsers from './pages/AdminUsers';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute><Events /></ProtectedRoute>
          } />
          <Route path="/events/:id" element={
            <ProtectedRoute><EventDetail /></ProtectedRoute>
          } />
          <Route path="/participants" element={
            <ProtectedRoute><Participants /></ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute><AdminUsers /></AdminRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
