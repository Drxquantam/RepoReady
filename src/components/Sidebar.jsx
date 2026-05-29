import { BookOpen, FileText, Gauge, GraduationCap, PlusCircle, Settings, ShieldCheck } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const links = [
  { label: 'Dashboard', href: '/dashboard', icon: Gauge },
  { label: 'New Audit', href: '/new-audit', icon: PlusCircle },
  { label: 'Reports', href: '/report/latest', icon: FileText },
  { label: 'README Generator', href: '/readme-generator', icon: BookOpen },
  { label: 'Resume Pack', href: '/resume-pack', icon: GraduationCap },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-slate-950/80 p-5 backdrop-blur-2xl lg:block">
      <a href="/" className="flex items-center gap-3">
        <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200 shadow-glow">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <div>
          <p className="text-xl font-black text-white">RepoReady</p>
          <p className="text-xs font-semibold text-slate-500">Portfolio audit studio</p>
        </div>
      </a>
      <nav className="mt-10 space-y-2">
        {links.map(({ label, href, icon: Icon }) => (
          <NavLink
            key={href}
            to={href}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                isActive ? 'bg-cyan-300/10 text-cyan-100 shadow-glow' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-bold text-white">Local workspace</p>
        <p className="mt-2 text-xs leading-5 text-slate-400">Audits, settings, and generated packs are saved in this browser.</p>
      </div>
    </aside>
  );
}
