import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Hero } from './components/Hero';
import { ResultsPanel } from './components/ResultsPanel';
import { WebhookSettings } from './components/WebhookSettings';
import { GitBranch, Zap, ArrowLeft, WifiOff, Settings } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

type ViewState = 'idle' | 'loading' | 'results' | 'error' | 'settings';

const LOADING_STEPS = [
  { icon: "🔗", text: "Fetching GitHub issue via API..." },
  { icon: "🧠", text: "Running NLP extraction pipeline..." },
  { icon: "📊", text: "Classifying issue type & priority..." },
  { icon: "🔍", text: "Searching FAISS vector index..." },
  { icon: "💡", text: "Generating AI suggestions..." },
  { icon: "✅", text: "Finalizing analysis..." },
];

function LoaderFullscreen() {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx(i => Math.min(i + 1, LOADING_STEPS.length - 1));
    }, 700);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-[var(--color-background)] flex flex-col items-center justify-center z-50">
      {/* Animated Background Orbs */}
      <div className="orb orb-1" style={{ top: '20%', left: '30%' }} />
      <div className="orb orb-2" style={{ bottom: '20%', right: '25%' }} />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-sm w-full">
        {/* Spinner */}
        <div className="relative w-20 h-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--color-accent)] border-r-[var(--color-purple)]"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 rounded-full border-2 border-transparent border-t-[var(--color-pink)]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-7 h-7 text-[var(--color-accent)]" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-1">Analyzing Issue</h2>
          <p className="text-sm text-[var(--color-secondary)]">AI pipeline running...</p>
        </div>

        {/* Steps */}
        <div className="w-full space-y-2">
          {LOADING_STEPS.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: idx <= stepIdx ? 1 : 0.2, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all ${
                idx === stepIdx
                  ? 'bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.2)] text-[var(--color-primary)]'
                  : idx < stepIdx
                  ? 'text-[var(--color-success)]'
                  : 'text-[var(--color-border)]'
              }`}
            >
              <span className="text-base">{idx < stepIdx ? '✓' : step.icon}</span>
              <span className="font-mono text-xs">{step.text}</span>
              {idx === stepIdx && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [viewState, setViewState] = useState<ViewState>('idle');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [analyzedUrl, setAnalyzedUrl] = useState<string>('');

  const handleAnalyze = async (url: string) => {
    setViewState('loading');
    setErrorMsg('');
    setAnalyzedUrl(url);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_url: url })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to analyze URL");
      }
      
      setAnalysisResult(data);
      setViewState('results');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Could not reach backend. Make sure the server is running on port 8000.');
      setViewState('error');
    }
  };

  const reset = () => {
    setViewState('idle');
    setAnalysisResult(null);
    setAnalyzedUrl('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-[var(--color-background)] w-full font-sans text-[var(--color-primary)]">
      <Toaster position="bottom-right" />
      
      {/* Header — shown when not on landing */}
      <AnimatePresence>
        {viewState !== 'idle' && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-xl"
          >
            <button onClick={reset} className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-purple)] flex items-center justify-center">
                <GitBranch className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight text-[var(--color-primary)]">OpenIssue <span className="gradient-text-blue">AI</span></span>
            </button>
            
            {analyzedUrl && (
              <span className="hidden md:block text-xs font-mono text-[var(--color-secondary)] truncate max-w-sm">
                {analyzedUrl}
              </span>
            )}

            <div className="flex items-center gap-4">
              {viewState !== 'settings' && (
                <button
                  onClick={() => setViewState('settings')}
                  className="hidden md:flex items-center gap-2 text-xs text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors btn-ghost px-3 py-1.5 border border-transparent"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Webhook Settings
                </button>
              )}

              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-xs text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors btn-ghost px-3 py-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                New Analysis
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          
          {viewState === 'idle' && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
            >
              <Hero 
                onAnalyze={handleAnalyze} 
                onOpenSettings={() => setViewState('settings')} 
              />
            </motion.div>
          )}

          {viewState === 'loading' && (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LoaderFullscreen />
            </motion.div>
          )}

          {viewState === 'results' && analysisResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="pt-14"
            >
              <ResultsPanel data={analysisResult} />
            </motion.div>
          )}

          {viewState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="min-h-screen flex items-center justify-center p-6"
            >
              <div className="max-w-md w-full text-center glass-card p-8 rounded-2xl">
                <div className="w-14 h-14 rounded-full bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.15)] flex items-center justify-center mx-auto mb-4">
                  <WifiOff className="w-7 h-7 text-[var(--color-danger)]" />
                </div>
                <h2 className="text-xl font-bold text-[var(--color-primary)] mb-2">Analysis Failed</h2>
                <p className="text-sm text-[var(--color-secondary)] mb-6 font-mono leading-relaxed">{errorMsg}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={reset}
                    className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Try Again
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {viewState === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="pt-14"
            >
              <WebhookSettings />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer — only on idle */}
      {viewState === 'idle' && (
        <footer className="border-t border-[var(--color-border)]/50 py-8 px-6 text-center">
          <p className="text-sm text-[var(--color-secondary)]">
            Built with <span className="text-[var(--color-danger)]">♥</span> using FastAPI, spaCy, FAISS & React ·{' '}
            <span className="text-[var(--color-border)]">No data stored. Public repositories only.</span>
          </p>
        </footer>
      )}
    </div>
  );
}

export default App;
