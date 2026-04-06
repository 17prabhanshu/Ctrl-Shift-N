import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Terminal, Globe, Bot, Activity, 
  ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import clsx from 'clsx';

export type Channel = 'overview' | 'reasoning' | 'suggestions' | 'reply' | 'signals';

interface SidebarProps {
  activeChannel: Channel;
  onChannelChange: (channel: Channel) => void;
  collapsed: boolean;
  onToggle: () => void;
  counts?: {
    reasoning?: number;
    suggestions?: number;
  };
}

const CHANNELS: { id: Channel; label: string; icon: any; section: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, section: 'Analysis' },
  { id: 'reasoning', label: 'AI Reasoning', icon: Terminal, section: 'Analysis' },
  { id: 'suggestions', label: 'Web Suggestions', icon: Globe, section: 'Intelligence' },
  { id: 'reply', label: 'Assistant Bot', icon: Bot, section: 'Intelligence' },
  { id: 'signals', label: 'NLP Signals', icon: Activity, section: 'Data' },
];

export function Sidebar({ activeChannel, onChannelChange, collapsed, onToggle, counts }: SidebarProps) {
  const sections = [...new Set(CHANNELS.map(c => c.section))];

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={clsx(
        "glass-sidebar h-full flex flex-col transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Header */}
      <div className="px-3 pt-4 pb-2 flex items-center justify-between">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#a78bfa] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-bold text-[var(--color-primary)] tracking-tight">CHANNELS</span>
          </motion.div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-[rgba(99,102,241,0.08)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-all"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Channels */}
      <nav className="flex-1 px-2 py-2 space-y-4 overflow-y-auto">
        {sections.map(section => (
          <div key={section}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--color-secondary)]">
                {section}
              </p>
            )}
            <div className="space-y-0.5">
              {CHANNELS.filter(c => c.section === section).map(channel => {
                const Icon = channel.icon;
                const isActive = activeChannel === channel.id;
                const count = channel.id === 'reasoning' ? counts?.reasoning : 
                              channel.id === 'suggestions' ? counts?.suggestions : undefined;

                return (
                  <button
                    key={channel.id}
                    onClick={() => onChannelChange(channel.id)}
                    className={clsx("channel-item w-full", isActive && "active")}
                    title={collapsed ? channel.label : undefined}
                  >
                    <Icon className={clsx("w-4 h-4 shrink-0", isActive ? "text-[var(--color-accent-light)]" : "")} />
                    {!collapsed && (
                      <>
                        <span className="truncate">{channel.label}</span>
                        {count != null && count > 0 && (
                          <span className="ml-auto text-[9px] font-bold bg-[rgba(99,102,241,0.15)] text-[var(--color-accent-light)] rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                            {count}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-success)] shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
            <span className="text-[10px] text-[var(--color-secondary)] font-mono">v2.0 · AI Engine Active</span>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
