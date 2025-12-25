
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/Landing.jsx';
import BuilderPage from './pages/Builder.jsx';
import DashboardPage from './pages/Dashboard.jsx';
import { Toaster } from 'react-hot-toast';

const App = () => {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">AdBuilder<span className="text-blue-600">.ai</span></span>
            </div>
            <nav className="flex gap-4">
               {/* Simple nav placeholders if needed */}
            </nav>
          </div>
        </header>

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
        
        <Toaster position="bottom-center" />
      </div>
    </HashRouter>
  );
};

export default App;
