import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import PageTransition from './components/PageTransition';
import LocalHome from './LocalHome';
import { IS_LOCAL_STUDIO } from './services/runtime';
import LocalStudio from './LocalStudio';
import Login from './pages/Login';
import Profile from './pages/Profile';
import WebProfile from './pages/WebProfile';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import PublicTrial from './pages/PublicTrial';
import VisualShowcase from './pages/VisualShowcase';
function AnimatedRoutes(){
  const location=useLocation();
  return <AnimatePresence mode="wait"><PageTransition key={location.pathname} pathname={location.pathname} hash={location.hash}><Routes location={location}>
    <Route path="/" element={<LocalHome />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/demo" element={<Navigate to="/muestra-visual" replace />} />
    <Route path="/muestra-visual" element={<VisualShowcase/>} />
    <Route path="/generate" element={IS_LOCAL_STUDIO?<ProtectedRoute><LocalStudio/></ProtectedRoute>:<PublicTrial/>} />
    <Route path="/images" element={IS_LOCAL_STUDIO?<ProtectedRoute><LocalStudio/></ProtectedRoute>:<Navigate to="/generate" replace/>} />
    <Route path="/profile" element={<ProtectedRoute>{IS_LOCAL_STUDIO ? <Profile /> : <WebProfile />}</ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><Navigate to="/profile" replace /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></PageTransition></AnimatePresence>;
}
export default function App() {
  return <MotionConfig reducedMotion="user"><BrowserRouter><AnimatedRoutes/></BrowserRouter></MotionConfig>;
}
