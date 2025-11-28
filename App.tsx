import React, { useState } from 'react';
import { VeoStudio } from './components/VeoStudio';
import { AuthVisualizer } from './components/AuthVisualizer';
import { AppView } from './types';
import { Video, Network } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.VEO_STUDIO);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            {currentView === AppView.VEO_STUDIO ? <Video className="w-5 h-5 text-white" /> : <Network className="w-5 h-5 text-white" />}
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            VeoAuth Studio
          </h1>
        </div>

        <nav className="flex gap-2 bg-slate-800/50 p-1 rounded-xl">
          <button
            onClick={() => setCurrentView(AppView.VEO_STUDIO)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              currentView === AppView.VEO_STUDIO
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Video className="w-4 h-4" />
            Veo Animator
          </button>
          <button
            onClick={() => setCurrentView(AppView.AUTH_VISUALIZER)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              currentView === AppView.AUTH_VISUALIZER
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Network className="w-4 h-4" />
            Auth Flow
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {currentView === AppView.VEO_STUDIO ? (
          <div className="h-full p-4 lg:p-8 max-w-7xl mx-auto">
             <VeoStudio />
          </div>
        ) : (
          <AuthVisualizer />
        )}
      </main>
    </div>
  );
};

export default App;