const colors = {
  cyan: 'bg-cyan-300',
  violet: 'bg-violet-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-300',
  rose: 'bg-rose-400',
};

export default function ProgressBar({ value, accent = 'cyan' }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full ${colors[accent] || colors.cyan}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}
