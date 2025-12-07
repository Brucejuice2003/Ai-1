import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AudioProvider, useAudio } from './audio/AudioContext';
import { useAuth } from './context/AuthContext';

// Layout Components
import { Sidebar } from './components/layout/Sidebar';
import { MobileNavDock } from './components/layout/MobileNav';

// Page Components
import Dashboard from './components/Dashboard';
import KeyFinderModule from './components/KeyFinderModule';
import AuthScreen from './components/AuthScreen';
import PricingScreen from './components/PricingScreen';
import SettingsPage from './components/SettingsPage';
import HistoryPage from './components/HistoryPage';

// UI Components
import { cn } from './lib/utils';

// Layout wrapper for authenticated pages
function AppLayout({ user, logout, updatePlan, isPremium }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { stopListening, isListening } = useAudio();

  // Stop listening when navigating away from dashboard
  useEffect(() => {
    if (location.pathname !== '/dashboard' && isListening) {
      stopListening();
    }
  }, [location.pathname, isListening, stopListening]);

  return (
    <div className="min-h-screen text-white selection:bg-primary/30 font-sans">
      {/* Subtle noise overlay */}
      <div className="noise-bg" />

      {/* Desktop Sidebar */}
      <Sidebar
        user={user}
        isPremium={isPremium}
        onLogout={logout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          // Padding for sidebar on desktop
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[240px]',
          // Padding for mobile nav
          'pb-24 lg:pb-8'
        )}
      >
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/key-finder"
              element={
                isPremium ? (
                  <KeyFinderModule />
                ) : (
                  <LockedFeatureScreen onUpgrade={() => updatePlan(null)} />
                )
              }
            />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage user={user} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNavDock isPremium={isPremium} />
    </div>
  );
}

// Locked feature screen component
function LockedFeatureScreen({ onUpgrade }) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="card-elevated p-8 max-w-md w-full">
        <div className="w-20 h-20 bg-surface-3 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Pro Feature</h2>
        <p className="text-text-secondary mb-8">
          The Key Finder & File Analysis tools are available exclusively for{' '}
          <span className="text-primary font-semibold">Pro</span> members.
        </p>

        <button
          onClick={onUpgrade}
          className="btn btn-primary btn-lg w-full"
        >
          Upgrade to Pro - $9.99
        </button>
      </div>
    </div>
  );
}

// Loading screen
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-1">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-surface-4 border-t-primary rounded-full animate-spin" />
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    </div>
  );
}

// Main App with Auth Flow
function AppWithAuth() {
  const { user, loading, logout, updatePlan } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Not logged in - show auth screen
  if (!user) {
    return (
      <div className="min-h-screen text-white selection:bg-primary/30 font-sans relative">
        <div className="noise-bg" />
        <AuthScreen />
      </div>
    );
  }

  // No plan selected - show pricing
  if (!user.plan) {
    return (
      <div className="min-h-screen text-white selection:bg-primary/30 font-sans relative">
        <div className="noise-bg" />
        <PricingScreen />
      </div>
    );
  }

  // Authenticated with plan - show main app
  const isPremium = user.plan === 'premium';

  return (
    <AudioProvider>
      <AppLayout
        user={user}
        logout={logout}
        updatePlan={updatePlan}
        isPremium={isPremium}
      />
    </AudioProvider>
  );
}

// DEV MODE App - bypasses auth for testing
function AppDevMode() {
  const devUser = {
    email: 'dev@test.com',
    plan: 'premium',
    stageName: 'Developer',
  };

  const logout = () => console.log('Dev mode - logout disabled');
  const updatePlan = () => console.log('Dev mode - plan update disabled');
  const isPremium = true;

  return (
    <AudioProvider>
      <BrowserRouter>
        <AppLayout
          user={devUser}
          logout={logout}
          updatePlan={updatePlan}
          isPremium={isPremium}
        />
      </BrowserRouter>
    </AudioProvider>
  );
}

// Production App with Auth
function AppProduction() {
  return (
    <BrowserRouter>
      <AppWithAuth />
    </BrowserRouter>
  );
}

// Toggle between dev mode and production
const DEV_MODE = true; // Set to false for production

function App() {
  return DEV_MODE ? <AppDevMode /> : <AppProduction />;
}

export default App;
