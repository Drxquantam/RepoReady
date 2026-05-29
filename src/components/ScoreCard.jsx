import { motion } from 'framer-motion';
import ProgressBar from './ProgressBar.jsx';

export default function ScoreCard({ label, value, display, accent = 'cyan', inverse = false }) {
  const visibleValue = display || `${value}/100`;
  const explanation = {
    'Overall Project Readiness': 'Weighted view of repo polish, safety, docs, deployability, and resume value.',
    'GitHub Readiness': 'How cleanly the project reads for reviewers browsing your repository.',
    'Deployment Readiness': 'Likelihood that the project runs correctly outside localhost.',
    'Resume Readiness': 'How clearly the work can be translated into recruiter-facing impact.',
  }[label] || 'Category-level readiness signal for this project.';

  return (
    <motion.div whileHover={{ y: -4 }} className="glass-card rounded-2xl p-5 transition hover:border-cyan-300/25 hover:shadow-glow">
      <div className="flex items-center justify-between gap-4">
        <p className="max-w-36 text-sm font-semibold text-slate-300">{label}</p>
        <p className={`text-2xl font-black ${inverse ? 'text-rose-300' : 'text-white'}`}>{visibleValue}</p>
      </div>
      <div className="mt-5">
        <ProgressBar value={value} accent={accent} />
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">{explanation}</p>
    </motion.div>
  );
}
