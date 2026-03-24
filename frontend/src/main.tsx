import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import PoolExplorer from './pages/PoolExplorer';
import PoolAnalysis from './pages/PoolAnalysis';
import './global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppHeader />
      <Routes>
        <Route path="/" element={<PoolExplorer />} />
        <Route path="/pool/:poolId" element={<PoolAnalysis />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
