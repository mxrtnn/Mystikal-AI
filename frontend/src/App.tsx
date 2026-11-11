import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LocalHome from './LocalHome';
import LocalStudio from './LocalStudio';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<LocalHome />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/generate" element={<ProtectedRoute><LocalStudio /></ProtectedRoute>} />
    <Route path="/images" element={<ProtectedRoute><LocalStudio /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><Navigate to="/generate" replace /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>;
}
