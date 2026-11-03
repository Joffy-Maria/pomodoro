import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';

import LandingPage from './pages/Landing';
import DashboardPage from './pages/Dashboard';
import RoomPage from './pages/Room';

const AnimatedRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return (
    // Keyed on the pathname so each route gets a short CSS fade-in. No animated
    // exit on purpose: rendering must never wait for an animation to finish.
    <div key={location.pathname} className="page-fade min-h-screen w-full">
      <Routes location={location}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <div className="relative min-h-screen w-full overflow-x-hidden bg-ink-950 text-white">
          <AnimatedRoutes />
        </div>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
