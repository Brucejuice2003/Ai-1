import { useState } from 'react';
import { AudioProvider } from './audio/AudioContext';
import Dashboard from './components/Dashboard';
import KeyFinderModule from './components/KeyFinderModule';
import { Mic2, Music, Search } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'keyfinder'

  return (
    <AudioProvider>
      <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">

        {/* Navigation Bar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold neon-text tracking-tighter">SINGERS DREAMS</h1>

          <div className="flex bg-gray-900 rounded-full p-1 border border-white/10">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all duration-300
                    ${activeTab === 'dashboard' ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]' : 'text-gray-400 hover:text-white'}`}
            >
              <Mic2 className="w-4 h-4" />
              Live Analysis
            </button>
            <button
              onClick={() => setActiveTab('keyfinder')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all duration-300
                    ${activeTab === 'keyfinder' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' : 'text-gray-400 hover:text-white'}`}
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
