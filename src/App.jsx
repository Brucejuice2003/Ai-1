import { useState } from 'react';
import { AudioProvider } from './audio/AudioContext';
import Dashboard from './components/Dashboard';
import KeyFinderModule from './components/KeyFinderModule';
import { Mic2, Search, LogOut, Lock, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import PricingScreen from './components/PricingScreen';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'keyfinder'
  // DEV MODE: Auth and subscription checks disabled for testing
  // const { user, loading, logout, updatePlan } = useAuth();

  // Mock user with premium access for testing
  const user = { email: 'dev@test.com', plan: 'premium', name: 'Developer' };
  const loading = false;
  const logout = () => console.log('Logout disabled in dev mode');

  /* ORIGINAL AUTH CHECKS - DISABLED FOR TESTING
  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-6 h-6 border-2 border-white/20 border-t-cyan-500 rounded-full animate-spin" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen text-white selection:bg-cyan-500/30 font-sans relative">
        <div className="noise-bg" />
        <AuthScreen />
      </div>
    );
  }

  // Force Plan Selection
  if (!user.plan) {
    return (
      <div className="min-h-screen text-white selection:bg-cyan-500/30 font-sans relative">
        <div className="noise-bg" />
        <PricingScreen />
      </div>
    );
  }
  */

  return (
    <AudioProvider>
      <div className="min-h-screen text-white selection:bg-cyan-500/30 font-sans">
        {/* Grain Overlay */}
        <div className="noise-bg" />

        {/* Top Header - iPhone Style */}
        <nav className="fixed top-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <h1 className="text-lg font-bold neon-text tracking-tighter drop-shadow-md pointer-events-auto bg-black/20 backdrop-blur-md px-4 py-1 rounded-full border border-white/5">
            SINGERS DREAMS
          </h1>
        </nav>

        {/* User Profile / Logout (Top Right) */}
        <div className="fixed top-5 right-6 z-50 flex items-center gap-3">
          {/* DEV MODE Badge */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-[10px] font-bold px-2 py-0.5 rounded-full text-black shadow-lg pointer-events-auto cursor-default" title="Dev Mode - Auth Disabled">
            DEV
          </div>

          <button
            onClick={logout}
            className="group flex items-center gap-2 p-1.5 rounded-full hover:bg-white/10 transition-colors pointer-events-auto"
            title="Sign Out"
          >
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="Avatar" className="w-7 h-7 rounded-full border border-white/20" />
          </button>
        </div>

        {/* Content Area */}
        <div className="pt-0 pb-32 min-h-screen overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }} // "Quart" ease for premium feel
              className="w-full h-full"
            >
              {/* DEV MODE: All features unlocked */}
              {activeTab === 'dashboard' ? (
                <Dashboard />
              ) : (
                <KeyFinderModule />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="w-full text-center py-6 text-[10px] text-gray-600 font-medium tracking-widest uppercase pointer-events-none opacity-50">
            &copy; {new Date().getFullYear()} Singers Dreams. All Rights Reserved.
          </div>
        </div>

        {/* Bottom Floating Dock - iOS Style with Sliding Pill */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <div className="flex bg-black/60 backdrop-blur-2xl rounded-full p-1.5 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/10 relative">

            {/* Live Tab */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className="relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full text-xs font-bold transition-all duration-300 z-10 group"
            >
              <div className={`relative z-10 flex items-center gap-2 transition-colors duration-300 ${activeTab === 'dashboard' ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                <Mic2 className="w-4 h-4" /> Live
              </div>

              {activeTab === 'dashboard' && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
            </button>

            {/* Finder Tab */}
            <button
              onClick={() => setActiveTab('keyfinder')}
              className="relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full text-xs font-bold transition-all duration-300 z-10 group"
            >
              <div className={`relative z-10 flex items-center gap-2 transition-colors duration-300 ${activeTab === 'keyfinder' ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                <Search className="w-4 h-4" /> Finder
              </div>

              {activeTab === 'keyfinder' && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full shadow-[0_0_20px_rgba(147,51,234,0.4)]"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
            </button>
          </div>
        </div>

      </div>
    </AudioProvider>
  );
}

export default App;
