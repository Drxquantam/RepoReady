import { BookOpen, FileText, Gauge, GraduationCap, PlusCircle, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const links = [
  { href: '/dashboard', icon: Gauge, label: 'Dashboard' },
  { href: '/new-audit', icon: PlusCircle, label: 'Audit' },
  { href: '/report/latest', icon: FileText, label: 'Report' },
  { href: '/readme-generator', icon: BookOpen, label: 'README' },
  { href: '/resume-pack', icon: GraduationCap, label: 'Resume' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function MobileNav() {
  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 grid grid-cols-6 rounded-2xl border border-white/10 bg-slate-950/90 p-2 backdrop-blur-xl lg:hidden">
      {links.map(({ href, icon: Icon, label }) => (
        <NavLink key={href} to={href} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-xl p-2 text-[10px] font-bold ${isActive ? 'bg-cyan-300/10 text-cyan-100' : 'text-slate-500'}`}>
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
