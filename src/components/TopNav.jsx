import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TopNav() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-slate-950/55 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-300/10 p-2 text-cyan-200">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span className="text-lg font-black text-white">RepoReady</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-bold text-slate-300 md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#how" className="hover:text-white">How it works</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="hidden rounded-xl px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/5 sm:inline-flex">Login</Link>
          <Link to="/new-audit" className="rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-100">Get Started</Link>
        </div>
      </div>
    </header>
  );
}
