import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Zap, 
  Plus,
  X, 
  Save, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Hash,
  Tag,
  FlaskConical,
  Bot,
  Send,
  Code,
  CheckCircle,
  XCircle,
  ChevronRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

interface WebhookConfig {
  mode: string;
  keyword_triggers: string[];
  label_triggers: string[];
  skip_bots: boolean;
  repo_allowlist: string[];
}

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000';

export function WebhookSettings() {
  const [config, setConfig] = useState<WebhookConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeKeyword, setActiveKeyword] = useState('');
  const [activeLabel, setActiveLabel] = useState('');

  // Simulation State
  const [simTitle, setSimTitle] = useState('Critical crash in main production build');
  const [simBody, setSimBody] = useState('The server is returning 500 errors for all users since the last deploy. Need help fixing this panic.');
  const [simAuthor, setSimAuthor] = useState('developer-jane');
  const [simLabels, setSimLabels] = useState<string[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [activeSimLabel, setActiveSimLabel] = useState('');

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/webhook/config`);
      const data = await response.json();
      setConfig(data);
    } catch (err) {
      toast.error("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/webhook/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (response.ok) {
        toast.success("Settings saved successfully");
      } else {
        throw new Error("Failed to save");
      }
    } catch (err) {
      toast.error("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    if (activeKeyword.trim() && config && !config.keyword_triggers.includes(activeKeyword.trim())) {
      setConfig({
        ...config,
        keyword_triggers: [...config.keyword_triggers, activeKeyword.trim().toLowerCase()]
      });
      setActiveKeyword('');
    }
  };

  const removeKeyword = (kw: string) => {
    if (config) {
      setConfig({
        ...config,
        keyword_triggers: config.keyword_triggers.filter(k => k !== kw)
      });
    }
  };

  const addLabel = () => {
    if (activeLabel.trim() && config && !config.label_triggers.includes(activeLabel.trim())) {
      setConfig({
        ...config,
        label_triggers: [...config.label_triggers, activeLabel.trim().toLowerCase()]
      });
      setActiveLabel('');
    }
  };

  const removeLabel = (lbl: string) => {
    if (config) {
      setConfig({
        ...config,
        label_triggers: config.label_triggers.filter(l => l !== lbl)
      });
    }
  };

  const runSimulation = async (isFull: boolean) => {
    setSimulating(true);
    setSimulationResult(null);
    try {
      const response = await fetch(`${API_BASE}/api/webhook/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: simTitle,
          body: simBody,
          author: simAuthor,
          labels: simLabels,
          real_run: isFull
        })
      });
      const data = await response.json();
      setSimulationResult(data);
      if (data.would_trigger) {
        toast.success("Simulation triggered!");
      } else {
        toast.error("Simulation skipped");
      }
    } catch (err) {
      toast.error("Simulation failed to run");
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
        <p className="text-sm font-medium text-[var(--color-secondary)]">Loading configuration...</p>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm flex items-center justify-center">
            <Settings className="w-6 h-6 text-[var(--color-accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-primary)]">Webhook Configuration</h1>
            <p className="text-sm text-[var(--color-secondary)]">Fine-tune when the AI pipeline triggers for incoming issues.</p>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-6 py-2.5 flex items-center gap-2 text-sm shadow-md"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Mode Selector */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-6 h-full">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary-muted)] mb-6 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Engine Mode
            </h3>
            
            <div className="space-y-3">
              {[
                { id: 'auto', label: 'Auto (Always Triggers)', desc: 'Processes every issue' },
                { id: 'precursor', label: 'Precursor (Filtered)', desc: 'Uses trigger logic below' }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setConfig({...config, mode: mode.id})}
                  className={clsx(
                    "w-full p-4 rounded-xl text-left border transition-all duration-300",
                    config.mode === mode.id 
                      ? "bg-[var(--color-surface-2)] border-[var(--color-accent)] shadow-sm" 
                      : "bg-transparent border-[var(--color-border)] hover:border-[var(--color-accent-light)]"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={clsx("text-sm font-bold", config.mode === mode.id ? "text-[var(--color-accent)]" : "text-[var(--color-primary)]")}>
                      {mode.label}
                    </span>
                    {config.mode === mode.id && <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" />}
                  </div>
                  <p className="text-xs text-[var(--color-secondary)]">{mode.desc}</p>
                </button>
              ))}
            </div>

            <div className="mt-8 p-4 rounded-xl bg-[#ecfdf5] border border-[#d1fae5] flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-[#10b981] mt-0.5" />
              <p className="text-[11px] text-[#065f46] leading-relaxed">
                <strong>Pro Tip:</strong> Use 'Precursor' mode in large repositories to save up to 90% on LLM API costs.
              </p>
            </div>
          </div>
        </div>

        {/* Triggers Editor */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Keyword Triggers */}
          <div className={clsx("glass-card p-6 transition-opacity", config.mode !== 'precursor' && "opacity-50 pointer-events-none")}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary-muted)] flex items-center gap-2">
                <Hash className="w-3.5 h-3.5" /> Keyword Precursors
              </h3>
              <span className="text-[10px] bg-[var(--color-surface-2)] px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-secondary)]">
                {config.keyword_triggers.length} Active
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <AnimatePresence>
                {config.keyword_triggers.map(kw => (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={kw}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f3ff] border border-[#ede9fe] text-[#8b5cf6] text-xs font-medium group"
                  >
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="hover:text-[#6d28d9] transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>

            <div className="relative group">
              <input 
                type="text"
                value={activeKeyword}
                onChange={e => setActiveKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addKeyword()}
                placeholder="Add keyword (e.g. crash, breaking)..."
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl pl-4 pr-12 py-3 text-sm focus:border-[var(--color-accent)] outline-none transition-all placeholder-[var(--color-secondary)]/50"
              />
              <button 
                onClick={addKeyword}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <Plus className="w-4 h-4 text-[var(--color-accent)]" />
              </button>
            </div>
          </div>

          {/* Label Triggers */}
          <div className={clsx("glass-card p-6 transition-opacity", config.mode !== 'precursor' && "opacity-50 pointer-events-none")}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary-muted)] flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" /> Label Precursors
              </h3>
              <span className="text-[10px] bg-[var(--color-surface-2)] px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-secondary)]">
                {config.label_triggers.length} Active
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <AnimatePresence>
                {config.label_triggers.map(lbl => (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={lbl}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eff6ff] border border-[#dbeafe] text-[#3b82f6] text-xs font-medium group"
                  >
                    {lbl}
                    <button onClick={() => removeLabel(lbl)} className="hover:text-[#1d4ed8] transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>

            <div className="relative group">
              <input 
                type="text"
                value={activeLabel}
                onChange={e => setActiveLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addLabel()}
                placeholder="Add label (e.g. bug, priority: high)..."
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl pl-4 pr-12 py-3 text-sm focus:border-[var(--color-accent)] outline-none transition-all placeholder-[var(--color-secondary)]/50"
              />
              <button 
                onClick={addLabel}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <Plus className="w-4 h-4 text-[var(--color-accent)]" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-6 p-6 glass border-dashed">
             <div className="flex items-center gap-4">
                <div className={clsx("w-3 h-3 rounded-full", config.skip_bots ? "bg-[var(--color-success)]" : "bg-[var(--color-border)]")} />
                <div>
                   <h4 className="text-sm font-bold text-[var(--color-primary)]">Ignore Bot Activity</h4>
                   <p className="text-[11px] text-[var(--color-secondary)]">Do not trigger AI triage for issues created by GitHub Apps or Bots.</p>
                </div>
             </div>
             <button 
               onClick={() => setConfig({...config, skip_bots: !config.skip_bots})}
               className={clsx(
                 "w-12 h-6 rounded-full relative transition-colors duration-300",
                 config.skip_bots ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"
               )}
             >
               <motion.div 
                 animate={{ x: config.skip_bots ? 26 : 2 }}
                 className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-sm"
               />
             </button>
          </div>

        </div>
      </div>

      {/* --- Simulation Laboratory (Playground) --- */}
      <div className="mt-12 pt-12 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#f5f3ff] border border-[#ddd6fe] flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-[#8b5cf6]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--color-primary)]">Webhook Laboratory</h2>
            <p className="text-sm text-[var(--color-secondary)]">Simulate real triage cycles to test your trigger configuration.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lab Inputs */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-secondary)] mb-4">Simulated Issue Content</label>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-primary)] mb-1.5 ml-1">Title</label>
                  <input 
                    type="text" 
                    value={simTitle}
                    onChange={(e) => setSimTitle(e.target.value)}
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-primary)] mb-1.5 ml-1">Body / Description</label>
                  <textarea 
                    rows={4}
                    value={simBody}
                    onChange={(e) => setSimBody(e.target.value)}
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] transition-all resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-primary)] mb-1.5 ml-1">Author</label>
                    <input 
                      type="text" 
                      value={simAuthor}
                      onChange={(e) => setSimAuthor(e.target.value)}
                      className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-primary)] mb-1.5 ml-1">Mock Labels</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={activeSimLabel}
                        placeholder="Add tag..."
                        onChange={(e) => setActiveSimLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && activeSimLabel) {
                            setSimLabels([...simLabels, activeSimLabel]);
                            setActiveSimLabel('');
                          }
                        }}
                        className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] transition-all"
                      />
                      <button 
                        onClick={() => {
                          if (activeSimLabel) {
                            setSimLabels([...simLabels, activeSimLabel]);
                            setActiveSimLabel('');
                          }
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:text-[var(--color-accent)]"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                {simLabels.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {simLabels.map(l => (
                      <span key={l} className="px-2 py-0.5 bg-[var(--color-surface-3)] text-[10px] font-mono rounded-md border border-[var(--color-border)] flex items-center gap-1">
                        {l}
                        <button onClick={() => setSimLabels(simLabels.filter(x => x !== l))}><X className="w-2.5 h-2.5" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => runSimulation(false)}
                  disabled={simulating}
                  className="flex-1 btn-ghost py-3 text-xs font-bold"
                >
                  Quick Test
                </button>
                <button 
                  onClick={() => runSimulation(true)}
                  disabled={simulating}
                  className="flex-[2] btn-primary py-3 text-xs font-bold flex items-center justify-center gap-2"
                >
                  {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  Run Full AI Simulation
                </button>
              </div>
            </div>
          </div>

          {/* Simulation Output */}
          <div className="space-y-6">
            {!simulationResult ? (
              <div className="glass-card p-12 h-full flex flex-col items-center justify-center border-dashed text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-6">
                  <FlaskConical className="w-8 h-8 text-[var(--color-border)]" />
                </div>
                <h4 className="text-sm font-bold text-[var(--color-primary-muted)] mb-2">No Simulation Active</h4>
                <p className="text-xs text-[var(--color-secondary)] max-w-[240px]">Configure your mock issue and run a test to see the AI triage engine in action.</p>
              </div>
            ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Precursor Check Status */}
                  <div className={clsx(
                    "p-4 rounded-xl border flex items-start gap-4",
                    simulationResult.would_trigger ? "bg-[#ecfdf5] border-[#d1fae5] text-[#065f46]" : "bg-[#fef2f2] border-[#fee2e2] text-[#991b1b]"
                  )}>
                    {simulationResult.would_trigger ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                    <div>
                      <h4 className="text-sm font-bold">{simulationResult.would_trigger ? "Trigger Match Found" : "Issue Skipped"}</h4>
                      <p className="text-xs opacity-80 mt-1">
                        {simulationResult.would_trigger 
                          ? `This issue would have passed the filters: ${simulationResult.reasons.join(', ')}`
                          : `The AI pipeline would not trigger: ${simulationResult.skipped_reasons.join(', ')}`
                        }
                      </p>
                    </div>
                  </div>

                  {/* AI Results Preview */}
                  {simulationResult.simulation && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="glass-card overflow-hidden"
                    >
                      <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-[var(--color-accent)]" />
                          <span className="text-xs font-bold text-[var(--color-primary)]">Proposed Bot Response</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 rounded bg-white border border-[var(--color-border)] text-[9px] font-bold text-[var(--color-secondary)]">SIMULATED</span>
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-6">
                        <div className="flex flex-wrap gap-2">
                          {simulationResult.simulation.suggested_labels.map((l: string) => (
                             <span key={l} className="px-2 py-0.5 rounded bg-[#eff6ff] border border-[#dbeafe] text-[#3b82f6] text-[10px] font-bold">
                                {l}
                             </span>
                          ))}
                        </div>

                        <div className="p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] prose prose-sm max-w-none">
                           <ReactMarkdown>
                              {simulationResult.simulation.bot_comment_preview}
                           </ReactMarkdown>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <div className="text-center px-4 py-2 bg-[var(--color-surface-2)] rounded-lg border border-[var(--color-border)] flex-1">
                             <p className="text-[9px] uppercase tracking-widest text-[var(--color-secondary)] font-bold mb-0.5">Classification</p>
                             <p className="text-xs font-bold text-[var(--color-accent)]">{simulationResult.simulation.classification}</p>
                          </div>
                          <div className="text-center px-4 py-2 bg-[var(--color-surface-2)] rounded-lg border border-[var(--color-border)] flex-1">
                             <p className="text-[9px] uppercase tracking-widest text-[var(--color-secondary)] font-bold mb-0.5">Priority</p>
                             <p className="text-xs font-bold text-[var(--color-orange)]">{simulationResult.simulation.priority}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
