import { useState, useEffect } from 'react';
import { AudioProvider, useAudio } from './audio/AudioContext';
import Dashboard from './components/Dashboard';
import KeyFinderModule from './components/KeyFinderModule';
import { Mic2, Search, LogOut, Lock, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import PricingScreen from './components/PricingScreen';

// Separated Main Interface to allow useAudio hook usage
const MainInterface = ({ user, logout, updatePlan }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { stopListening, isListening } = useAudio();

  // Enforce Microphone Rule: Only active on Dashboard
  useEffect(() => {
    if (activeTab === 'keyfinder' && isListening) {
      stopListening();
    }
  }, [activeTab, isListening, stopListening]);

  return (
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
        {/* Plan Badge */}
        {user.plan === 'premium' && (
          <div className="bg-gradient-to-r from-neon-purple to-neon-pink text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-lg shadow-purple-500/20 animate-pulse-slow pointer-events-auto cursor-default" title="Premium Active">
            PRO
          </div>
        )}

        <button
          onClick={logout}
          className="group flex items-center gap-2 p-1.5 rounded-full hover:bg-white/10 transition-colors pointer-events-auto"
          title="Sign Out"
        >
          <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="Avatar" className="w-7 h-7 rounded-full border border-white/20" />
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
            {activeTab === 'dashboard' ? (
              <Dashboard />
            ) : (
              user.plan === 'premium' ? (
                <KeyFinderModule />
              ) : (
                // Locked Feature Screen
                <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center pt-20">
                  <div className="bg-white/5 border border-white/10 p-8 rounded-3xl max-w-md w-full backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute inset-0 bg-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Lock className="w-10 h-10 text-gray-400 group-hover:text-neon-purple transition-colors" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Pro Feature Locked</h2>
                    <p className="text-gray-400 mb-8">
                      The Key Finder & File Analysis tools are available exclusively for <span className="text-neon-purple font-bold">Pro Producer</span> members.
                    </p>

                    <button
                      onClick={() => updatePlan(null)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all transform hover:scale-[1.02]"
                    >
                      Upgrade for $9.99
                    </button>
                  </div>
                </div>
              )
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
  );
};

function App() {
  // DEV MODE: Bypass auth for testing
  const user = { email: 'dev@test.com', plan: 'premium', name: 'Developer' };
  const logout = () => console.log('Dev mode - logout disabled');
  const updatePlan = () => {};

  return (
    <AudioProvider>
      <MainInterface user={user} logout={logout} updatePlan={updatePlan} />
    </AudioProvider>
  );
}

/* ORIGINAL AUTH CODE - Uncomment to re-enable
function AppWithAuth() {
  const { user, loading, logout, updatePlan } = useAuth();

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

  if (!user.plan) {
    return (
      <div className="min-h-screen text-white selection:bg-cyan-500/30 font-sans relative">
        <div className="noise-bg" />
        <PricingScreen />
      </div>
    );
  }

  return (
    <AudioProvider>
      <MainInterface user={user} logout={logout} updatePlan={updatePlan} />
    </AudioProvider>
  );
}
*/

export default App;
