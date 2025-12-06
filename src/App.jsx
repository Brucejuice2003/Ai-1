import { useState } from 'react';
import { AudioProvider } from './audio/AudioContext';
import Dashboard from './components/Dashboard';
import KeyFinderModule from './components/KeyFinderModule';
import { Mic2, Music, Search } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'keyfinder'

  return (
    <AudioProvider>
      <div className="min-h-screen text-white selection:bg-cyan-500/30">

        {/* Navigation Bar */}
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/20 px-6 py-4 flex items-center justify-between shadow-lg">
          <h1 className="text-xl font-bold neon-text tracking-tighter">SINGERS DREAMS</h1>

          <div className="flex bg-white/5 backdrop-blur-md rounded-full p-1.5 border border-white/20 shadow-lg">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-500 transform
                    ${activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.6)] scale-105'
                  : 'text-gray-300 hover:text-white hover:bg-white/10 hover:scale-105'}`}
            >
              <Mic2 className="w-4 h-4" />
              Live Analysis
            </button>
            <button
              onClick={() => setActiveTab('keyfinder')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-500 transform
                    ${activeTab === 'keyfinder'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.6)] scale-105'
                  : 'text-gray-300 hover:text-white hover:bg-white/10 hover:scale-105'}`}
            >
              <Search className="w-4 h-4" />
              Key Finder
            </button>
          </div>
        </nav>

        {/* Content Area */}
        <div className="pt-20">
          {activeTab === 'dashboard' ? <Dashboard /> : <KeyFinderModule />}
        </div>

      </div>
    </AudioProvider>
  );
}

export default App;
