import { AnimatePresence } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Landing from './pages/Landing.jsx';
import NewAudit from './pages/NewAudit.jsx';
import ReadmeGenerator from './pages/ReadmeGenerator.jsx';
import Report from './pages/Report.jsx';
import ResumePack from './pages/ResumePack.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new-audit" element={<NewAudit />} />
          <Route path="/report/:id" element={<Report />} />
          <Route path="/report/latest" element={<Report />} />
          <Route path="/readme-generator" element={<ReadmeGenerator />} />
          <Route path="/resume-pack" element={<ResumePack />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
