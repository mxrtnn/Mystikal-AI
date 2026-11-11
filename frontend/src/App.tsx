import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LocalHome from './LocalHome';
import LocalAccess from './pages/LocalAccess';
import { IS_LOCAL_STUDIO } from './services/runtime';
import LocalStudio from './LocalStudio';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<LocalHome />} />
    <Route path="/login" element={IS_LOCAL_STUDIO ? <Login /> : <LocalAccess />} />
    <Route path="/register" element={IS_LOCAL_STUDIO ? <Register /> : <LocalAccess />} />
    <Route path="/generate" element={IS_LOCAL_STUDIO ? <ProtectedRoute><LocalStudio /></ProtectedRoute> : <LocalAccess />} />
    <Route path="/images" element={IS_LOCAL_STUDIO ? <ProtectedRoute><LocalStudio /></ProtectedRoute> : <LocalAccess />} />
    <Route path="/profile" element={IS_LOCAL_STUDIO ? <ProtectedRoute><Profile /></ProtectedRoute> : <LocalAccess />} />
    <Route path="/dashboard" element={IS_LOCAL_STUDIO ? <ProtectedRoute><Navigate to="/generate" replace /></ProtectedRoute> : <LocalAccess />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>;
}
