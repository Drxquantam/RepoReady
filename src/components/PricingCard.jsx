import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function PricingCard({ name, price, features, highlighted }) {
  const [showMessage, setShowMessage] = useState(false);
  const [typedText, setTypedText] = useState('');
  const message = 'Coming soon...';

  useEffect(() => {
    if (!showMessage) {
      setTypedText('');
      return undefined;
    }

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTypedText(message.slice(0, index));
      if (index >= message.length) window.clearInterval(timer);
    }, 55);

    const hideTimer = window.setTimeout(() => setShowMessage(false), 2600);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(hideTimer);
    };
  }, [showMessage]);

  const showComingSoon = () => {
    setShowMessage(false);
    window.setTimeout(() => setShowMessage(true), 20);
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      className={`glass-card relative overflow-hidden rounded-2xl p-6 ${highlighted ? 'border-cyan-300/30 shadow-glow' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-black text-white">{name}</h3>
          <button
            type="button"
            onClick={showComingSoon}
            className="mt-2 text-left text-3xl font-black text-white transition hover:text-cyan-100"
            aria-label={`${name} pricing coming soon`}
          >
            {price}
          </button>
        </div>
        {highlighted && <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">Popular</span>}
      </div>
      <div className="mt-6 space-y-3">
        {features.map((item) => (
          <div key={item} className="flex gap-3 text-sm text-slate-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            <span>{item}</span>
          </div>
        ))}
      </div>
      <button
        onClick={showComingSoon}
        className="mt-7 w-full rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-100"
      >
        Choose {name}
      </button>
      {showMessage && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 font-mono text-sm font-bold text-cyan-100"
        >
          <span>{typedText}</span>
          <span className="ml-0.5 inline-block h-4 w-2 animate-pulse border-r border-cyan-100 align-[-2px]" />
        </motion.div>
      )}
    </motion.div>
  );
}
