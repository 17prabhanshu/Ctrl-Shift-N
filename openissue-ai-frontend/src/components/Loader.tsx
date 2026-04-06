import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
const STEPS = [
  "Fetching GitHub issue via API...",
  "Running NLP extraction pipeline...",
  "Classifying issue type and priority...",
  "Searching FAISS vector index...",
  "Generating AI suggestions...",
  "Finalizing analysis report...",
];
export function Loader() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="w-14 h-14 rounded-full border-2 border-transparent border-t-[#2f81f7] border-r-[#a371f7]"
      />
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="text-sm font-mono text-[#7d8590] text-center"
        >
          {STEPS[step]}
        </motion.p>
      </AnimatePresence>
      <div className="flex gap-1.5">
        {STEPS.map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i <= step ? 'bg-[#2f81f7]' : 'bg-[#30363d]'}`} />
        ))}
      </div>
    </div>
  );
}
