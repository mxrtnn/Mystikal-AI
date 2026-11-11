import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LocalHome from './LocalHome';
import { IS_LOCAL_STUDIO } from './services/runtime';
import LocalStudio from './LocalStudio';
import Login from './pages/Login';
import Profile from './pages/Profile';
import WebProfile from './pages/WebProfile';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<LocalHome />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/demo" element={<LocalStudio demo />} />
    <Route path="/generate" element={<ProtectedRoute>{IS_LOCAL_STUDIO ? <LocalStudio /> : <LocalStudio demo />}</ProtectedRoute>} />
    <Route path="/images" element={<ProtectedRoute>{IS_LOCAL_STUDIO ? <LocalStudio /> : <LocalStudio demo />}</ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute>{IS_LOCAL_STUDIO ? <Profile /> : <WebProfile />}</ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><Navigate to="/profile" replace /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>;
}
