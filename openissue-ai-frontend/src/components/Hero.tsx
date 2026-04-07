import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { GitBranch, Zap, Shield, Brain, ArrowRight, ChevronDown, Settings, CheckCircle2, Bot, Network, Search, Star, TrendingUp, Clock, Users, Terminal } from 'lucide-react';
import clsx from 'clsx';

interface HeroProps {
  onAnalyze: (url: string) => void;
  onOpenSettings: () => void;
}

const STATS = [
  { label: "Issues Triaged", value: "1.2M+", suffix: "", icon: GitBranch, color: "#6366f1", delay: 0 },
  { label: "Time Saved / Maintainer", value: "73", suffix: "%", icon: Clock, color: "#34d399", delay: 0.1 },
  { label: "Duplicate Detection Rate", value: "91", suffix: "%", icon: Shield, color: "#a78bfa", delay: 0.2 },
  { label: "Avg Analysis Time", value: "1.2", suffix: "s", icon: Zap, color: "#22d3ee", delay: 0.3 },
];

const FEATURES = [
  {
    icon: GitBranch,
    title: "Live GitHub Scraping",
    description: "Fetches issue content, labels, reactions, comments and metadata directly from the GitHub API in real-time.",
    color: "#6366f1",
    badge: "Real-time"
  },
  {
    icon: Brain,
    title: "Multi-Signal NLP",
    description: "spaCy-powered entity extraction, stack trace detection, code block parsing and semantic token analysis.",
    color: "#a78bfa",
    badge: "NLP"
  },
  {
    icon: Network,
    title: "FAISS Vector Search",
    description: "Generates sentence embeddings and runs approximate nearest-neighbor search to detect duplicate issues at scale.",
    color: "#f472b6",
    badge: "AI"
  },
  {
    icon: TrendingUp,
    title: "Priority Scoring",
    description: "Multi-factor scoring engine weighing severity keywords, labels, stack traces, community engagement and urgency signals.",
    color: "#fb923c",
    badge: "Smart"
  },
  {
    icon: Search,
    title: "AI Web Advice Engine",
    description: "Content-aware suggestion engine matching issue keywords to curated technical articles and documentation.",
    color: "#34d399",
    badge: "Insights"
  },
  {
    icon: Bot,
    title: "Auto-Reply Generator",
    description: "Generates contextual GitHub comment templates tailored to issue type, priority and duplicate status.",
    color: "#22d3ee",
    badge: "Automation"
  },
];

const CODE_SNIPPETS = [
  'curl /api/analyze -d \'{"url":"..."}\'',
  "Classification: Bug | Confidence: 87%",
  "Priority: HIGH | Score: 78/100",
  "FAISS: 3 similar issues found",
  "NLP entities: [React, Next.js, SSR]",
  "Stack trace detected → runtime crash",
  "Suggested label: priority: high",
];

function FloatingCodePanel({ snippet, style }: { snippet: string; style: React.CSSProperties }) {
  return (
    <div
      style={style}
      className="absolute font-mono text-xs text-[var(--color-accent)]/50 bg-[var(--color-surface)]/80 border border-[var(--color-border)]/40 rounded-lg px-3 py-1.5 pointer-events-none select-none backdrop-blur-sm"
    >
      <span className="text-[var(--color-success)]/60 mr-2">›</span>{snippet}
    </div>
  );
}

function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: number | string; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const isNumeric = !isNaN(Number(String(target).replace('.', '')));
  const numTarget = parseFloat(String(target));
  const isDecimal = String(target).includes('.');

  useEffect(() => {
    if (!inView || !isNumeric) return;
    let start = 0;
    const increment = numTarget / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= numTarget) {
        setCount(numTarget);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, numTarget, duration, isNumeric]);

  return (
    <span ref={ref}>
      {isNumeric 
        ? (isDecimal ? count.toFixed(1) : Math.floor(count).toString())
        : target
      }
      {suffix}
    </span>
  );
}

export function Hero({ onAnalyze, onOpenSettings }: HeroProps) {
  const [url, setUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [snippetIndex, setSnippetIndex] = useState(0);
  const featuresRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setSnippetIndex(i => (i + 1) % CODE_SNIPPETS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onAnalyze(url.trim());
  };

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  return (
    <div className="w-full">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden mesh-bg">
        
        {/* Animated Orbs */}
        <div className="orb orb-1" style={{ top: '15%', left: '20%' }} />
        <div className="orb orb-2" style={{ bottom: '15%', right: '15%' }} />
        <div className="orb orb-3" style={{ top: '50%', left: '60%' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-dots opacity-30" />

        {/* Floating code snippets */}
        <FloatingCodePanel snippet="import { IssueAnalyzer } from './ai'" style={{ top: '12%', left: '5%', animation: 'float 7s ease-in-out infinite' }} />
        <FloatingCodePanel snippet="priority: HIGH | score: 78" style={{ top: '20%', right: '4%', animation: 'float-delayed 8s ease-in-out infinite 1s' }} />
        <FloatingCodePanel snippet="FAISS similarity: 0.91" style={{ bottom: '28%', left: '3%', animation: 'float 9s ease-in-out infinite 2s' }} />
        <FloatingCodePanel snippet="type: Bug | confidence: 87%" style={{ top: '45%', right: '2%', animation: 'float-delayed 6s ease-in-out infinite 0.5s' }} />

        {/* Main hero content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 py-2 text-xs font-medium backdrop-blur-sm">
              <span className="flex items-center gap-1.5 text-[var(--color-success)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-ping" />
                LIVE
              </span>
              <span className="text-[var(--color-border)]">|</span>
              <span className="text-[var(--color-primary-muted)]">v2.0 · GitHub API · spaCy · FAISS · sentence-transformers</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="mb-6 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9]"
          >
            <span className="text-[var(--color-primary)]">Triage GitHub</span>
            <br />
            <span className="gradient-text-blue">Issues with AI</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="mb-4 max-w-2xl text-lg sm:text-xl text-[var(--color-secondary)] leading-relaxed font-light"
          >
            Analyze any GitHub issue instantly with AI. Our pipeline scrapes the live data, runs NLP classification, detects duplicates via vector search, and delivers AI-powered triage in under 2 seconds.
          </motion.p>

          {/* Live ticker */}
          <motion.div variants={itemVariants} className="mb-10">
            <AnimatePresence mode="wait">
              <motion.p
                key={snippetIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="font-mono text-sm text-[var(--color-accent)]/70"
              >
                <span className="text-[var(--color-secondary)]">›</span> {CODE_SNIPPETS[snippetIndex]}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* Input form */}
          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit}
            className={clsx(
              "relative w-full max-w-2xl flex items-center rounded-xl border bg-[var(--color-surface)] p-1.5 transition-all duration-300",
              isFocused
                ? "border-[var(--color-accent)] shadow-[0_0_0_3px_rgba(99,102,241,0.12),0_0_40px_rgba(99,102,241,0.08)]"
                : "border-[var(--color-border)] shadow-lg"
            )}
          >
            <div className="flex items-center gap-2 pl-3 shrink-0">
              <GitBranch className="w-4 h-4 text-[var(--color-secondary)]" />
            </div>
            <input
              type="text"
              className="flex-1 bg-transparent py-3.5 px-3 text-sm font-mono text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none"
              placeholder="https://github.com/facebook/react/issues/28236"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <button
              type="submit"
              disabled={!url.trim()}
              className="btn-primary flex items-center gap-2 h-11 px-6 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              <Zap className="w-4 h-4" />
              Analyze
            </button>
          </motion.form>

          {/* Settings CTA */}
          <motion.div variants={itemVariants} className="mt-6">
            <button 
              onClick={onOpenSettings}
              className="group flex items-center gap-2.5 text-xs font-bold text-[var(--color-secondary)] hover:text-[var(--color-accent)] transition-all uppercase tracking-widest"
            >
              <Settings className="w-4 h-4 transition-transform group-hover:scale-110" />
              Configure Webhook Settings
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </button>
          </motion.div>

          {/* Examples */}
          <motion.div variants={itemVariants} className="mt-4 flex flex-wrap items-center gap-2 justify-center">
            <span className="text-xs text-[var(--color-secondary)]">Try:</span>
            {[
              { label: "React bug", url: "https://github.com/facebook/react/issues/28236" },
              { label: "Next.js issue", url: "https://github.com/vercel/next.js/issues/58698" },
            ].map((ex) => (
              <button
                key={ex.url}
                onClick={() => setUrl(ex.url)}
                className="text-xs text-[var(--color-accent-light)] hover:text-white font-mono border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 rounded-lg px-2.5 py-1 transition-all"
              >
                {ex.label}
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.button
          onClick={scrollToFeatures}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--color-secondary)] hover:text-[var(--color-primary-muted)] transition-colors"
        >
          <span className="text-xs font-medium tracking-widest uppercase">Explore</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.button>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="relative py-24 border-t border-[var(--color-border)]/50 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="badge badge-blue mb-4 mx-auto">Performance Metrics</div>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--color-primary)] mb-4">
              Built for <span className="gradient-text-rainbow">maintainer velocity</span>
            </h2>
            <p className="text-[var(--color-secondary)] max-w-xl mx-auto">Real data from open source repositories using OpenIssue AI for automated triage.</p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STATS.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: stat.delay }}
                className="stat-card p-6 text-center group"
              >
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 transition-transform group-hover:scale-110"
                  style={{ background: `${stat.color}12`, border: `1px solid ${stat.color}20` }}
                >
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div className="text-4xl font-black mb-1" style={{ color: stat.color }}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-[var(--color-secondary)] font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Social proof bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 flex flex-wrap justify-center items-center gap-6 text-sm"
          >
            {[
              { icon: Star, text: "Used by 2,800+ repos" },
              { icon: Users, text: "8,000+ maintainers" },
              { icon: CheckCircle2, text: "99.9% uptime" },
              { icon: Shield, text: "No data stored" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-[var(--color-secondary)]">
                <Icon className="w-4 h-4" />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section ref={featuresRef} className="py-24 relative overflow-hidden">
        <div className="orb orb-2" style={{ top: '-10%', left: '40%' }} />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="badge badge-purple mb-4 mx-auto">AI Pipeline</div>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--color-primary)] mb-4">
              How it <span className="gradient-text-blue">works</span>
            </h2>
            <p className="text-[var(--color-secondary)] max-w-xl mx-auto">Six-stage AI pipeline that turns a raw GitHub URL into actionable intelligence.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="feature-card p-6"
              >
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                  style={{ background: `${feature.color}12`, border: `1px solid ${feature.color}18` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold text-[var(--color-primary)]">{feature.title}</h3>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: `${feature.color}12`, color: feature.color, border: `1px solid ${feature.color}18` }}
                  >
                    {feature.badge}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-secondary)] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 text-center"
          >
            <div className="animated-border inline-block">
              <div className="glass-card px-8 py-8 rounded-xl text-center">
                <Terminal className="w-8 h-8 text-[var(--color-accent)] mx-auto mb-3" />
                <h3 className="text-xl font-bold text-[var(--color-primary)] mb-2">Ready to try it?</h3>
                <p className="text-[var(--color-secondary)] text-sm mb-6">Paste any public GitHub issue URL above and get instant AI triage.</p>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm"
                >
                  Start Analysis <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
