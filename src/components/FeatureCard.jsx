import { motion } from 'framer-motion';
import { accentMap } from '../data/appContent.js';

export default function FeatureCard({ title, body, icon: Icon, accent = 'cyan' }) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      className={`glass-card rounded-2xl bg-gradient-to-br p-6 ${accentMap[accent]}`}
    >
      <div className="mb-5 inline-flex rounded-2xl border border-white/10 bg-black/20 p-3">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
    </motion.div>
  );
}
