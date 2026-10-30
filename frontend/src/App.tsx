import { useState, useEffect } from 'react';
import { ParserStudio } from './components/ParserStudio';
import { SchemeCatalog } from './components/SchemeCatalog';
import { ReviewQueueView } from './components/ReviewQueueView';
import { TestRunnerView } from './components/TestRunnerView';
import { OntologyGlossary } from './components/OntologyGlossary';
import { api } from './api';
import { 
  Sparkles, 
  Layers, 
  AlertOctagon, 
  FlaskConical, 
  BookOpen, 
  ShieldCheck,
  Activity
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'STUDIO' | 'CATALOG' | 'REVIEW' | 'TESTS' | 'ONTOLOGY'>('STUDIO');
  const [healthStats, setHealthStats] = useState<{ totalSchemes: number; reviewQueueSize: number } | null>(null);

  const fetchHealth = () => {
    api.getHealth()
      .then(res => setHealthStats(res))
      .catch(console.error);
  };

  useEffect(() => {
    fetchHealth();
    const timer = setInterval(fetchHealth, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900">
      {/* Top Navigation Bar */}
      <header className="bg-slate-950 text-white sticky top-0 z-40 shadow-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Platform Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center font-black text-slate-950 shadow-md">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base tracking-tight text-white">
                    Haqdarshak
                  </h1>
                  <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                    AST NORMALIZER v1.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Government Welfare Scheme Text Normalizer & Eligibility Rule Engine
                </p>
              </div>
            </div>

            {/* Health Pill */}
            <div className="hidden md:flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-slate-400">Schemes:</span>
                <span className="font-bold text-white">{healthStats?.totalSchemes ?? 10}</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">Review Queue:</span>
                <span className="font-bold text-amber-400">{healthStats?.reviewQueueSize ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 border-t border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('STUDIO')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'STUDIO'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Parser Studio
            </button>

            <button
              onClick={() => setActiveTab('CATALOG')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'CATALOG'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              Scheme Documents
            </button>

            <button
              onClick={() => setActiveTab('REVIEW')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all relative ${
                activeTab === 'REVIEW'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              Review Queue
              {healthStats && healthStats.reviewQueueSize > 0 && (
                <span className="ml-1 bg-amber-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                  {healthStats.reviewQueueSize}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('TESTS')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'TESTS'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              Tricky Cases & Tests
            </button>

            <button
              onClick={() => setActiveTab('ONTOLOGY')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'ONTOLOGY'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Taxonomy & Concepts
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'STUDIO' && <ParserStudio />}
        {activeTab === 'CATALOG' && <SchemeCatalog />}
        {activeTab === 'REVIEW' && <ReviewQueueView />}
        {activeTab === 'TESTS' && <TestRunnerView />}
        {activeTab === 'ONTOLOGY' && <OntologyGlossary />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>Haqdarshak Eligibility Rule Engine • Zero-Guessing Policy Active • Deterministic Welfare Eligibility Synthesis</p>
      </footer>
    </div>
  );
}

export default App;
