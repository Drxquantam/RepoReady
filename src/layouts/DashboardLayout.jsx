import { Outlet } from 'react-router-dom';
import MobileNav from '../components/MobileNav.jsx';
import Sidebar from '../components/Sidebar.jsx';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 bg-grid-pattern grid-bg text-white">
      <div className="aurora-bg pointer-events-none fixed inset-0" />
      <Sidebar />
      <div className="relative z-10 lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pb-10">
          <Outlet />
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
