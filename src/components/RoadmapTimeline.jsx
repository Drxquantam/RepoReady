export default function RoadmapTimeline({ items }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-sm font-black text-cyan-100">
              {index + 1}
            </div>
            {index < items.length - 1 && <div className="mt-2 h-full w-px bg-white/10" />}
          </div>
          <div className="glass-card flex-1 rounded-2xl p-4">
            <p className="font-semibold text-white">{item}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
