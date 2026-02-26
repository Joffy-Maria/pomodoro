import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { SocketProvider } from './context/SocketContext';

import IntroPage from './pages/Intro';
import HomePage from './pages/Home';
import RoomPage from './pages/Room';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<IntroPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <div className="w-full min-h-screen bg-dark-bg text-white overflow-x-hidden relative">
          <AnimatedRoutes />
        </div>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
