import { AudioProvider } from './audio/AudioContext';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <AudioProvider>
      <Dashboard />
    </AudioProvider>
  );
}

export default App;
