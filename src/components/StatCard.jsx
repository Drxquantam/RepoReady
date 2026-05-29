import { motion } from 'framer-motion';
import { accentMap } from '../data/appContent.js';

export default function StatCard({ label, value, delta, icon: Icon, accent = 'cyan' }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`glass-card rounded-2xl bg-gradient-to-br p-5 ${accentMap[accent]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-black text-white">{value}</p>
          <p className="mt-2 text-xs font-semibold text-slate-400">{delta}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
