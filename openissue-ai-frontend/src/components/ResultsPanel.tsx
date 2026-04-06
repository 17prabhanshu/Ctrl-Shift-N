import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Copy, Check, Clock, 
  GitCommit, Bot, ExternalLink, MessageSquare, Code2, FileText,
  Layers, Zap, AlertTriangle, Info, Search, Globe, BookOpen, Terminal,
  TrendingUp, Shield, Hash, Sparkles, ArrowUpRight
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';
import { Sidebar, type Channel } from './Sidebar';

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; border: string; badge: string }> = {
  Critical: { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)", badge: "badge-red" },
  High: { color: "#fb923c", bg: "rgba(251,146,60,0.1)", border: "rgba(251,146,60,0.25)", badge: "badge-orange" },
  Medium: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.25)", badge: "badge-orange" },
  Low: { color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.25)", badge: "badge-green" },
};

const TYPE_CONFIG: Record<string, { color: string; badge: string }> = {
  Bug: { color: "#f87171", badge: "badge-red" },
  Feature: { color: "#6366f1", badge: "badge-blue" },
  Question: { color: "#a78bfa", badge: "badge-purple" },
  Query: { color: "#34d399", badge: "badge-green" },
  Procedure: { color: "#fb923c", badge: "badge-orange" },
  Method: { color: "#818cf8", badge: "badge-blue" },
};

// Markdown code block renderer
const MarkdownComponents = {
  code({ inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter
        style={oneDark}
        language={match[1]}
        PreTag="div"
        customStyle={{ background: 'var(--color-surface)', borderRadius: '10px', border: '1px solid var(--color-border)' }}
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>{children}</code>
    );
  }
};

export function ResultsPanel({ data }: { data: any }) {
  const [copied, setCopied] = useState(false);
  const [activeChannel, setActiveChannel] = useState<Channel>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.suggested_reply);
    setCopied(true);
    toast.success('Copied to clipboard!', { 
      style: { background: '#18181f', color: '#f0f0f8', border: '1px solid #2a2a3a' },
      iconTheme: { primary: '#34d399', secondary: '#18181f' }
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const priority = data.priority?.level || 'Low';
  const type = data.classification?.type || 'Question';
  const priorityCfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG['Low'];
  const typeCfg = TYPE_CONFIG[type] || TYPE_CONFIG['Question'];
  const confidence = Math.round((data.confidence_overall || 0) * 100);

  const contentVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2 } }
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Discord-style Sidebar */}
      <Sidebar
        activeChannel={activeChannel}
        onChannelChange={setActiveChannel}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        counts={{
          reasoning: data.reasoning_steps?.length || 0,
          suggestions: data.web_suggestions?.length || 0,
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-6">
        <AnimatePresence mode="wait">

          {/* ===== #overview ===== */}
          {activeChannel === 'overview' && (
            <motion.div key="overview" {...contentVariants} className="max-w-4xl space-y-6">
              {/* Issue Title */}
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="mt-2 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ background: typeCfg.color }} />
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--color-primary)] leading-tight">
                    {data.issue_title || "Analyzed Issue"}
                  </h2>
                </div>

                {/* Badge Row */}
                <div className="flex flex-wrap gap-2 items-center mb-4">
                  <span className={clsx("badge", typeCfg.badge)}><Hash className="w-3 h-3" />{type}</span>
                  <span className="badge" style={{ background: priorityCfg.bg, borderColor: priorityCfg.border, color: priorityCfg.color }}>
                    <TrendingUp className="w-3 h-3" />Priority: {priority}
                  </span>
                  <span className="badge badge-blue font-mono">Score: {data.priority?.score ?? 0}/100</span>
                  <span className="badge badge-purple font-mono">
                    <Sparkles className="w-3 h-3" />{confidence}%
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[var(--color-secondary)] font-mono ml-auto">
                    <Clock className="w-3 h-3" /> {data.processing_time_ms}ms
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Classification', value: type, color: typeCfg.color, icon: Cpu },
                  { label: 'Priority Level', value: priority, color: priorityCfg.color, icon: TrendingUp },
                  { label: 'AI Confidence', value: `${confidence}%`, color: '#a78bfa', icon: Sparkles },
                  { label: 'Processing', value: `${data.processing_time_ms}ms`, color: '#22d3ee', icon: Zap },
                ].map(stat => (
                  <div key={stat.label} className="glass-card p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                      <span className="text-[10px] uppercase tracking-widest text-[var(--color-secondary)] font-semibold">{stat.label}</span>
                    </div>
                    <span className="text-xl font-bold font-mono" style={{ color: stat.color }}>{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Confidence Bar */}
              <div className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--color-secondary)] font-mono shrink-0">Model Confidence</span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${confidence}%` }}
                      transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, #6366f1, #a78bfa, #22d3ee)` }}
                    />
                  </div>
                  <span className="text-sm font-bold font-mono text-[var(--color-primary)] shrink-0">{confidence}%</span>
                </div>
              </div>

              {/* NLP Signals Row */}
              {data.nlp_signals && (
                <div className="flex flex-wrap gap-2">
                  {data.nlp_signals.has_stack_trace && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#fb923c] bg-[rgba(251,146,60,0.08)] border border-[rgba(251,146,60,0.15)] rounded-lg px-2.5 py-1">
                      <AlertTriangle className="w-3 h-3" /> Stack Trace Detected
                    </span>
                  )}
                  {data.nlp_signals.has_code && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#6366f1] bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.15)] rounded-lg px-2.5 py-1">
                      <Code2 className="w-3 h-3" /> Code Block
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--color-primary-muted)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-2.5 py-1">
                    <FileText className="w-3 h-3" /> {data.nlp_signals.word_count || 0} tokens
                  </span>
                  {data.nlp_signals.entities?.slice(0, 5).map((ent: string) => (
                    <span key={ent} className="inline-flex items-center text-[10px] font-mono text-[var(--color-primary-muted)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-2.5 py-1">
                      {ent}
                    </span>
                  ))}
                </div>
              )}

              {/* Suggested Labels */}
              {data.suggested_labels?.length > 0 && (
                <div className="glass-card p-4">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--color-secondary)] font-semibold mb-3">Suggested Labels</p>
                  <div className="flex flex-wrap gap-2">
                    {data.suggested_labels.map((label: string) => (
                      <span key={label} className="text-xs font-mono text-[var(--color-primary-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 cursor-pointer hover:border-[var(--color-accent)] hover:text-[var(--color-accent-light)] transition-all">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== #reasoning ===== */}
          {activeChannel === 'reasoning' && (
            <motion.div key="reasoning" {...contentVariants} className="max-w-4xl space-y-6">
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Terminal className="w-4 h-4 text-[var(--color-accent)]" />
                  <h3 className="text-sm font-bold text-[var(--color-primary)]">AI Reasoning Trace</h3>
                  <span className="text-[10px] font-mono text-[var(--color-secondary)] ml-auto badge badge-blue">
                    {data.reasoning_steps?.length || 0}-stage pipeline
                  </span>
                </div>
                <div className="space-y-1">
                  {(data.reasoning_steps || data.explanation?.map((e: string, i: number) => ({ step: `Step ${i+1}`, icon: 'text', detail: e })) || []).map((step: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      className="pipeline-step pb-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-[rgba(99,102,241,0.15)] border border-[rgba(99,102,241,0.3)] flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[var(--color-accent-light)] uppercase tracking-widest block mb-1">{step.step}</span>
                          <p className="text-sm text-[var(--color-primary-muted)] font-mono leading-relaxed">{step.detail}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== #suggestions (PREMIUM) ===== */}
          {activeChannel === 'suggestions' && (
            <motion.div key="suggestions" {...contentVariants} className="max-w-4xl space-y-5">
              {/* Header Banner */}
              <div className="glass-card p-5 flex items-center gap-4 border-l-2 border-l-[var(--color-accent)]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#22d3ee] flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-primary)]">Knowledge Hub</h3>
                  <p className="text-xs text-[var(--color-secondary)]">
                    Found <span className="text-[var(--color-accent-light)] font-semibold">{data.web_suggestions?.length || 0}</span> relevant resources matching issue keywords and technology signals.
                  </p>
                </div>
              </div>

              {data.web_suggestions?.length ? data.web_suggestions.map((suggestion: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="suggestion-card"
                >
                  {/* Suggestion Header */}
                  <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-8 h-8 rounded-lg bg-gradient-to-br from-[rgba(99,102,241,0.15)] to-[rgba(167,139,250,0.1)] border border-[rgba(99,102,241,0.15)] flex items-center justify-center shrink-0">
                        <Search className="w-4 h-4 text-[var(--color-accent-light)]" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[var(--color-primary)] mb-1">{suggestion.title}</h3>
                        <span className="text-[10px] font-mono text-[var(--color-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 rounded-md">
                          {suggestion.source}
                        </span>
                      </div>
                    </div>
                    {suggestion.url && (
                      <a
                        href={suggestion.url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 inline-flex items-center gap-1.5 text-xs text-[var(--color-accent-light)] hover:text-white font-medium transition-colors btn-ghost px-2.5 py-1.5"
                      >
                        Open <ArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Suggestion Body */}
                  <div className="px-5 py-4">
                    <div className="flex items-start gap-3 mb-4">
                      <MessageSquare className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
                      <p className="text-sm text-[#c9c9d8] leading-relaxed">{suggestion.advice}</p>
                    </div>

                    {suggestion.search_query && (
                      <div className="mb-4 font-mono text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 flex items-center gap-2">
                        <span className="text-[var(--color-success)]">$</span>
                        <span className="text-[var(--color-secondary)]">search:</span>
                        <span className="text-[var(--color-primary-muted)]">{suggestion.search_query}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(suggestion.search_query);
                            toast.success('Search query copied!', {
                              style: { background: '#18181f', color: '#f0f0f8', border: '1px solid #2a2a3a' },
                            });
                          }}
                          className="ml-auto text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {suggestion.articles?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-3">
                          <BookOpen className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                          <span className="text-[10px] uppercase tracking-widest text-[var(--color-secondary)] font-semibold">Related Articles</span>
                        </div>
                        <div className="grid gap-2">
                          {suggestion.articles.map((article: any, ai: number) => (
                            <motion.a
                              key={ai}
                              href={article.url}
                              target="_blank"
                              rel="noreferrer"
                              whileHover={{ x: 4 }}
                              className="article-card flex items-center justify-between group"
                            >
                              <div className="min-w-0">
                                <p className="text-sm text-[#c9c9d8] group-hover:text-[var(--color-primary)] transition-colors truncate">{article.title}</p>
                                <span className="text-[10px] font-mono text-[var(--color-secondary)]">{article.domain}</span>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-[var(--color-secondary)] group-hover:text-[var(--color-accent-light)] transition-colors shrink-0 ml-3" />
                            </motion.a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )) : (
                <div className="glass-card p-12 text-center">
                  <Search className="w-10 h-10 text-[var(--color-border)] mx-auto mb-3" />
                  <p className="text-[var(--color-secondary)] text-sm">No specific resources were found for this issue pattern.</p>
                  <p className="text-[10px] text-[var(--color-border)] mt-2 font-mono">Domain lock: no matching tech pattern</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== #reply ===== */}
          {activeChannel === 'reply' && (
            <motion.div key="reply" {...contentVariants} className="max-w-4xl">
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[var(--color-primary-muted)]" />
                    <h3 className="text-sm font-bold text-[var(--color-primary)]">Webhook Auto-Comment</h3>
                    <span className="badge badge-green text-[9px] font-bold tracking-wide"><Zap className="w-2.5 h-2.5" />ACTIVE</span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-[var(--color-primary-muted)] hover:text-[var(--color-primary)] transition-colors btn-ghost px-3 py-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[var(--color-success)]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                <div className="p-5 flex items-start gap-4">
                  <div className="mt-1 h-9 w-9 rounded-full bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-surface-3)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                    <GitCommit className="w-4 h-4 text-[var(--color-primary-muted)]" />
                  </div>
                  <div className="flex-1 rounded-xl border border-[var(--color-border)] overflow-hidden">
                    <div className="bg-[var(--color-surface-2)] px-4 py-2.5 border-b border-[var(--color-border)] flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#c9c9d8]">openissue-bot <span className="font-normal text-[var(--color-secondary)]">commented</span></span>
                      {data.is_llm_generated && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-[var(--color-success)] bg-[rgba(52,211,153,0.08)] border border-[rgba(52,211,153,0.15)] px-2 py-0.5 rounded-md">
                          <Sparkles className="w-2.5 h-2.5" /> GENERATED BY AI
                        </span>
                      )}
                    </div>
                    <div className="p-5 bg-[var(--color-surface)] markdown-body">
                      <ReactMarkdown components={MarkdownComponents}>
                        {data.suggested_reply || 'No automated reply available.'}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== #signals ===== */}
          {activeChannel === 'signals' && (
            <motion.div key="signals" {...contentVariants} className="max-w-4xl space-y-5">
              {/* NLP Signal Report */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-sm font-bold text-[var(--color-primary)] mb-5 flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#fb923c]" /> spaCy NLP Signal Report
                  <span className="badge badge-purple text-[9px] ml-auto">en_core_web_sm</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Classification", value: type, color: typeCfg.color },
                    { label: "Priority", value: priority, color: priorityCfg.color },
                    { label: "Score", value: `${data.priority?.score ?? 0}/100`, color: "#818cf8" },
                    { label: "Stack Trace", value: data.nlp_signals?.has_stack_trace ? "Detected" : "Not found", color: data.nlp_signals?.has_stack_trace ? "#fb923c" : "var(--color-secondary)" },
                    { label: "Code Blocks", value: data.nlp_signals?.has_code ? `${data.nlp_signals?.code_block_count || 1} found` : "Absent", color: data.nlp_signals?.has_code ? "#6366f1" : "var(--color-secondary)" },
                    { label: "Token Count", value: data.nlp_signals?.word_count ?? "N/A", color: "var(--color-primary-muted)" },
                    { label: "Sentences", value: data.nlp_signals?.sentence_count ?? "N/A", color: "var(--color-primary-muted)" },
                    { label: "Questions", value: data.nlp_signals?.question_count ?? 0, color: data.nlp_signals?.question_count > 0 ? "#22d3ee" : "var(--color-secondary)" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 flex justify-between items-center">
                      <span className="text-[var(--color-secondary)] font-mono text-xs">{label}</span>
                      <span className="text-xs font-bold font-mono" style={{ color }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report Quality Score */}
              {data.nlp_signals?.quality_score != null && (
                <div className="glass-card rounded-xl p-6">
                  <h3 className="text-sm font-bold text-[var(--color-primary)] mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[var(--color-success)]" /> Issue Report Quality
                  </h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 h-3 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${data.nlp_signals.quality_score}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full rounded-full"
                        style={{ background: data.nlp_signals.quality_score >= 70 ? 'linear-gradient(90deg, #34d399, #22d3ee)' : data.nlp_signals.quality_score >= 40 ? 'linear-gradient(90deg, #fbbf24, #fb923c)' : 'linear-gradient(90deg, #f87171, #fb923c)' }}
                      />
                    </div>
                    <span className="text-lg font-bold font-mono" style={{ color: data.nlp_signals.quality_score >= 70 ? '#34d399' : data.nlp_signals.quality_score >= 40 ? '#fbbf24' : '#f87171' }}>
                      {data.nlp_signals.quality_score}/100
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.nlp_signals.has_reproduction_steps && <span className="badge badge-green">✓ Reproduction Steps</span>}
                    {data.nlp_signals.has_expected_behavior && <span className="badge badge-green">✓ Expected Behavior</span>}
                    {data.nlp_signals.has_environment_info && <span className="badge badge-green">✓ Environment Info</span>}
                    {data.nlp_signals.has_code && <span className="badge badge-blue">✓ Code Provided</span>}
                    {!data.nlp_signals.has_reproduction_steps && <span className="badge badge-red">✗ No Repro Steps</span>}
                    {!data.nlp_signals.has_expected_behavior && <span className="badge badge-red">✗ No Expected Behavior</span>}
                  </div>
                </div>
              )}

              {/* Named Entities & Key Phrases */}
              {(data.nlp_signals?.entities?.length > 0 || data.nlp_signals?.noun_phrases?.length > 0 || data.nlp_signals?.tech_terms?.length > 0) && (
                <div className="glass-card rounded-xl p-6">
                  <h3 className="text-sm font-bold text-[var(--color-primary)] mb-4 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#22d3ee]" /> NLP Entity Extraction
                    <span className="badge badge-cyan text-[9px] ml-auto">spaCy NER + POS</span>
                  </h3>
                  
                  {data.nlp_signals.entities?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] uppercase tracking-widest text-[var(--color-secondary)] font-semibold mb-2">Named Entities</p>
                      <div className="flex flex-wrap gap-1.5">
                        {data.nlp_signals.entities.map((ent: string) => (
                          <span key={ent} className="text-xs font-mono text-[var(--color-cyan)] bg-[rgba(34,211,238,0.08)] border border-[rgba(34,211,238,0.15)] rounded-md px-2 py-0.5">{ent}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {data.nlp_signals.noun_phrases?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] uppercase tracking-widest text-[var(--color-secondary)] font-semibold mb-2">Key Noun Phrases</p>
                      <div className="flex flex-wrap gap-1.5">
                        {data.nlp_signals.noun_phrases.slice(0, 10).map((np: string) => (
                          <span key={np} className="text-xs font-mono text-[var(--color-purple)] bg-[rgba(167,139,250,0.08)] border border-[rgba(167,139,250,0.15)] rounded-md px-2 py-0.5">{np}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {data.nlp_signals.tech_terms?.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[var(--color-secondary)] font-semibold mb-2">Detected Technology Terms</p>
                      <div className="flex flex-wrap gap-1.5">
                        {data.nlp_signals.tech_terms.map((term: string) => (
                          <span key={term} className="text-xs font-mono text-[var(--color-accent-light)] bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.15)] rounded-md px-2 py-0.5">{term}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Processing Metadata */}
              {data.processing_metadata && (
                <div className="glass-card rounded-xl p-6">
                  <h3 className="text-sm font-bold text-[var(--color-primary)] mb-4 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[var(--color-accent)]" /> Processing Engine
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 text-center">
                      <p className="text-[10px] text-[var(--color-secondary)] font-mono mb-1">Engine</p>
                      <p className="text-xs font-bold" style={{ color: data.processing_metadata.engine === 'llm' ? '#34d399' : '#fb923c' }}>
                        {data.processing_metadata.engine === 'llm' ? 'Gemini LLM' : 'Heuristic'}
                      </p>
                    </div>
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 text-center">
                      <p className="text-[10px] text-[var(--color-secondary)] font-mono mb-1">Model</p>
                      <p className="text-xs font-bold text-[var(--color-primary-muted)]">{data.processing_metadata.model}</p>
                    </div>
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 text-center">
                      <p className="text-[10px] text-[var(--color-secondary)] font-mono mb-1">Tech Domain</p>
                      <p className="text-xs font-bold text-[var(--color-accent-light)]">{data.processing_metadata.tech_domain || 'General'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Vector Similarity Search */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-sm font-bold text-[var(--color-primary)] mb-5 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#a78bfa]" /> Vector Similarity Search
                  <span className="badge badge-cyan text-[9px] ml-auto">FAISS ANN · all-MiniLM-L6-v2</span>
                </h3>
                {data.similar_issues?.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="w-8 h-8 text-[var(--color-border)] mx-auto mb-3" />
                    <p className="text-sm text-[var(--color-secondary)] font-mono">No duplicate issues detected.</p>
                    <p className="text-xs text-[var(--color-border)] mt-1">Cosine similarity threshold: 0.50 · 384-dim embeddings</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.similar_issues?.map((issue: any, idx: number) => (
                      <motion.div
                        key={idx}
                        whileHover={{ x: 3 }}
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[rgba(167,139,250,0.3)] transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-[#a78bfa] font-mono font-semibold">{issue.id}</span>
                          <span className="text-[10px] font-bold text-[var(--color-primary-muted)]">{(issue.similarity * 100).toFixed(0)}% MATCH</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-3)] overflow-hidden mb-2">
                          <div className="h-full bg-gradient-to-r from-[#a78bfa] to-[#6366f1] rounded-full" style={{ width: `${issue.similarity * 100}%` }} />
                        </div>
                        <p className="text-xs text-[#c9c9d8] line-clamp-2">{issue.title}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
