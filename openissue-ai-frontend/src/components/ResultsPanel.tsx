import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tag, AlertCircle, Cpu, Copy, Check, ChevronRight, Clock, 
  GitCommit, Bot, ExternalLink, MessageSquare, Code2, FileText,
  Layers, Zap, AlertTriangle, Info, Search, Globe, BookOpen, Terminal
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const ICON_MAP: Record<string, any> = {
  extract: FileText,
  trace: AlertTriangle,
  code: Code2,
  text: FileText,
  classify: Tag,
  priority: Zap,
  vector: Layers,
};

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; border: string; badge: string }> = {
  Critical: { color: "#f85149", bg: "rgba(248,81,73,0.1)", border: "rgba(248,81,73,0.3)", badge: "badge-red" },
  High: { color: "#ffa657", bg: "rgba(255,166,87,0.1)", border: "rgba(255,166,87,0.3)", badge: "badge-orange" },
  Medium: { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.3)", badge: "badge-orange" },
  Low: { color: "#3fb950", bg: "rgba(63,185,80,0.1)", border: "rgba(63,185,80,0.3)", badge: "badge-green" },
};

const TYPE_CONFIG: Record<string, { color: string; badge: string }> = {
  Bug: { color: "#f85149", badge: "badge-red" },
  Feature: { color: "#2f81f7", badge: "badge-blue" },
  Question: { color: "#a371f7", badge: "badge-purple" },
};

export function ResultsPanel({ data }: { data: any }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'suggestions' | 'reply'>('pipeline');

  const handleCopy = () => {
    navigator.clipboard.writeText(data.suggested_reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const priority = data.priority?.level || 'Low';
  const type = data.classification?.type || 'Question';
  const priorityCfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG['Low'];
  const typeCfg = TYPE_CONFIG[type] || TYPE_CONFIG['Question'];
  const confidence = Math.round((data.confidence_overall || 0) * 100);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, duration: 0.3 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-5xl"
    >
      {/* Issue Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="mt-1 shrink-0">
            <div className="w-2 h-2 rounded-full bg-[#3fb950] shadow-[0_0_8px_rgba(63,185,80,0.5)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f0f6fc] leading-tight mb-2">
              {data.issue_title || "Analyzed Issue"}
            </h2>
            <div className="flex flex-wrap gap-2 items-center">
              <span className={clsx("badge", typeCfg.badge)}>{type}</span>
              <span className={clsx("badge")} style={{ background: priorityCfg.bg, borderColor: priorityCfg.border, color: priorityCfg.color }}>
                Priority: {priority}
              </span>
              <span className="badge badge-blue font-mono">
                Score: {data.priority?.score ?? 0}/100
              </span>
              <span className="badge badge-purple font-mono">
                Confidence: {confidence}%
              </span>
              <span className="flex items-center gap-1 text-xs text-[#484f58] font-mono ml-auto">
                <Clock className="w-3 h-3" /> {data.processing_time_ms}ms
              </span>
            </div>
          </div>
        </div>

        {/* NLP Signals row */}
        {data.nlp_signals && (
          <div className="flex flex-wrap gap-2 mt-3">
            {data.nlp_signals.has_stack_trace && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#ffa657] bg-[#ffa657]/10 border border-[#ffa657]/20 rounded px-2 py-0.5">
                <AlertTriangle className="w-3 h-3" /> Stack Trace
              </span>
            )}
            {data.nlp_signals.has_code && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#2f81f7] bg-[#2f81f7]/10 border border-[#2f81f7]/20 rounded px-2 py-0.5">
                <Code2 className="w-3 h-3" /> Code Block
              </span>
            )}
            {data.nlp_signals.word_count > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#7d8590] bg-[#161b22] border border-[#30363d] rounded px-2 py-0.5">
                <FileText className="w-3 h-3" /> {data.nlp_signals.word_count} tokens
              </span>
            )}
            {data.nlp_signals.entities?.slice(0, 4).map((ent: string) => (
              <span key={ent} className="inline-flex items-center text-[10px] font-mono text-[#8b949e] bg-[#161b22] border border-[#30363d] rounded px-2 py-0.5">
                {ent}
              </span>
            ))}
          </div>
        )}

        {/* Suggested Labels */}
        {data.suggested_labels?.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] text-[#484f58] uppercase tracking-widest font-semibold">Suggested labels →</span>
            {data.suggested_labels.map((label: string) => (
              <span key={label} className="text-[10px] font-mono text-[#7d8590] bg-[#0d1117] border border-[#30363d] rounded-full px-2 py-0.5 cursor-pointer hover:border-[#2f81f7]/40 hover:text-[#2f81f7] transition-colors">
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Confidence bar */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-[#484f58] font-mono shrink-0">AI Confidence</span>
          <div className="flex-1 h-1.5 rounded-full bg-[#21262d] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, #2f81f7, #a371f7)` }}
            />
          </div>
          <span className="text-xs font-bold font-mono text-[#f0f6fc] shrink-0">{confidence}%</span>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={itemVariants} className="flex gap-1 border-b border-[#30363d] mb-6 overflow-x-auto">
        {[
          { id: 'pipeline', label: 'Analysis Pipeline', icon: Cpu, count: data.reasoning_steps?.length },
          { id: 'suggestions', label: 'Web Suggestions', icon: Search, count: data.web_suggestions?.length },
          { id: 'reply', label: 'Auto-Reply', icon: Bot, count: null },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "border-[#2f81f7] text-[#f0f6fc]"
                : "border-transparent text-[#7d8590] hover:text-[#c9d1d9] hover:border-[#30363d]"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.count != null && (
              <span className="ml-1 text-[10px] bg-[#161b22] border border-[#30363d] rounded-full px-1.5 py-0.5 text-[#7d8590]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ===== AI PIPELINE TAB ===== */}
        {activeTab === 'pipeline' && (
          <motion.div
            key="pipeline"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Reasoning Steps */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Terminal className="w-4 h-4 text-[#2f81f7]" />
                <h3 className="text-sm font-semibold text-[#f0f6fc]">AI Reasoning Trace</h3>
                <span className="text-[10px] font-mono text-[#484f58] ml-auto">5-stage pipeline</span>
              </div>
              <div className="space-y-1">
                {(data.reasoning_steps || data.explanation?.map((e: string, i: number) => ({ step: `Step ${i+1}`, icon: 'text', detail: e })) || []).map((step: any, idx: number) => {
                  const IconComp = ICON_MAP[step.icon] || ChevronRight;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="pipeline-step pb-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-[#2f81f7]/20 border border-[#2f81f7]/40 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#2f81f7]" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#2f81f7] uppercase tracking-widest block mb-1">{step.step}</span>
                          <p className="text-sm text-[#8b949e] font-mono leading-relaxed">{step.detail}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Similar Issues + quick stats */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#f0f6fc] mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#a371f7]" /> Vector Similarity Search
                </h3>
                {data.similar_issues?.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-[#484f58] font-mono">No duplicates detected.</p>
                    <p className="text-xs text-[#30363d] mt-1">Cosine threshold: 0.50</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.similar_issues?.map((issue: any, idx: number) => (
                      <motion.div
                        key={idx}
                        whileHover={{ x: 3 }}
                        className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3 hover:border-[#a371f7]/40 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#a371f7] font-mono">{issue.id}</span>
                          <span className="text-[10px] font-bold text-[#7d8590]">{(issue.similarity * 100).toFixed(0)}% MATCH</span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-[#21262d] overflow-hidden">
                          <div className="h-full bg-[#a371f7] rounded-full" style={{ width: `${issue.similarity * 100}%` }} />
                        </div>
                        <p className="text-xs text-[#c9d1d9] mt-2 line-clamp-2">{issue.title}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#f0f6fc] mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#ffa657]" /> Issue Signals
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Type", value: type, color: typeCfg.color },
                    { label: "Priority", value: priority, color: priorityCfg.color },
                    { label: "Priority Score", value: `${data.priority?.score ?? 0}/100`, color: "#8b949e" },
                    { label: "Stack Trace", value: data.nlp_signals?.has_stack_trace ? "Detected" : "Not found", color: data.nlp_signals?.has_stack_trace ? "#ffa657" : "#484f58" },
                    { label: "Code Blocks", value: data.nlp_signals?.has_code ? "Present" : "Absent", color: data.nlp_signals?.has_code ? "#2f81f7" : "#484f58" },
                    { label: "Token Count", value: data.nlp_signals?.word_count ?? "N/A", color: "#7d8590" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between items-center text-sm">
                      <span className="text-[#7d8590] font-mono text-xs">{label}</span>
                      <span className="text-xs font-bold font-mono" style={{ color }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== WEB SUGGESTIONS TAB ===== */}
        {activeTab === 'suggestions' && (
          <motion.div
            key="suggestions"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-2 p-4 rounded-lg bg-[#0d1117] border border-[#30363d]">
              <Globe className="w-4 h-4 text-[#2f81f7] shrink-0" />
              <p className="text-sm text-[#8b949e]">
                Found <span className="text-[#f0f6fc] font-medium">{data.web_suggestions?.length || 0}</span> relevant resources matching issue keywords and technology signals.
              </p>
            </div>

            {data.web_suggestions?.length ? data.web_suggestions.map((suggestion: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl overflow-hidden"
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-[#30363d] flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-[#f0f6fc] mb-1">{suggestion.title}</h3>
                    <span className="text-[10px] font-mono text-[#7d8590] bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded">
                      {suggestion.source}
                    </span>
                  </div>
                  <a
                    href={suggestion.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 text-xs text-[#2f81f7] hover:text-[#79c0ff] font-medium transition-colors"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Advice */}
                <div className="px-5 py-4">
                  <div className="flex items-start gap-2 mb-4">
                    <MessageSquare className="w-4 h-4 text-[#2f81f7] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#c9d1d9] leading-relaxed">{suggestion.advice}</p>
                  </div>

                  {/* Search query */}
                  {suggestion.search_query && (
                    <div className="mb-4 font-mono text-xs text-[#484f58] bg-[#0d1117] border border-[#21262d] rounded px-3 py-2">
                      <span className="text-[#238636]">$</span> search: <span className="text-[#7d8590]">{suggestion.search_query}</span>
                    </div>
                  )}

                  {/* Related Articles */}
                  {suggestion.articles?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-3">
                        <BookOpen className="w-3.5 h-3.5 text-[#484f58]" />
                        <span className="text-[10px] uppercase tracking-widest text-[#484f58] font-semibold">Related Articles</span>
                      </div>
                      <div className="grid gap-2">
                        {suggestion.articles.map((article: any, ai: number) => (
                          <motion.a
                            key={ai}
                            href={article.url}
                            target="_blank"
                            rel="noreferrer"
                            whileHover={{ x: 3 }}
                            className="article-card flex items-center justify-between group"
                          >
                            <div className="min-w-0">
                              <p className="text-sm text-[#c9d1d9] group-hover:text-[#f0f6fc] transition-colors truncate">{article.title}</p>
                              <span className="text-[10px] font-mono text-[#484f58]">{article.domain}</span>
                            </div>
                            <ExternalLink className="w-3 h-3 text-[#484f58] group-hover:text-[#2f81f7] transition-colors shrink-0 ml-3" />
                          </motion.a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )) : (
              <div className="p-12 text-center border border-dashed border-[#30363d] rounded-xl">
                <Search className="w-8 h-8 text-[#30363d] mx-auto mb-3" />
                <p className="text-[#484f58]">No specific resources were found for this issue pattern.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ===== AUTO-REPLY TAB ===== */}
        {activeTab === 'reply' && (
          <motion.div
            key="reply"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#30363d] bg-[#0d1117] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#8b949e]" />
                  <h3 className="text-sm font-medium text-[#f0f6fc]">Webhook Auto-Comment</h3>
                  <span className="badge badge-green text-[9px] font-bold tracking-wide">ACTIVE</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#f0f6fc] transition-colors btn-ghost px-3 py-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <div className="p-5 flex items-start gap-4">
                <div className="mt-1 h-8 w-8 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center shrink-0">
                  <GitCommit className="w-4 h-4 text-[#8b949e]" />
                </div>
                <div className="flex-1 rounded-lg border border-[#30363d] overflow-hidden">
                  <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d]">
                    <span className="text-xs font-semibold text-[#c9d1d9]">openissue-bot <span className="font-normal text-[#7d8590]">commented via webhook</span></span>
                  </div>
                  <div className="p-4 bg-[#0d1117]">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#c9d1d9] font-mono">
                      {data.suggested_reply}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
