import { BookOpen, BrainCircuit, Github, GraduationCap, KeyRound, Rocket } from 'lucide-react';

export const landingProject = {
  name: 'Portfolio Project Audit',
  type: 'React / Full-stack',
  updatedAt: 'Today',
  scores: [
    { label: 'Overall Project Readiness', value: 78, accent: 'cyan' },
    { label: 'GitHub Readiness', value: 84, accent: 'violet' },
    { label: 'Deployment Readiness', value: 71, accent: 'amber' },
    { label: 'Security Risk', value: 64, display: 'Medium', accent: 'rose', inverse: true },
    { label: 'Resume Readiness', value: 88, accent: 'emerald' },
  ],
};

export const trendData = [
  { week: 'A1', score: 62 },
  { week: 'A2', score: 69 },
  { week: 'A3', score: 73 },
  { week: 'A4', score: 78 },
];

export const issueDistribution = [
  { name: 'Security', value: 2, color: '#fb7185' },
  { name: 'Deployment', value: 3, color: '#f59e0b' },
  { name: 'Docs', value: 3, color: '#22d3ee' },
  { name: 'Structure', value: 2, color: '#8b5cf6' },
];

export const readinessBars = [
  { area: 'GitHub', value: 84 },
  { area: 'Deploy', value: 71 },
  { area: 'Security', value: 64 },
  { area: 'README', value: 79 },
  { area: 'Resume', value: 88 },
];

export const features = [
  { title: 'GitHub Readiness Check', body: 'Find missing scripts, weak repo structure, poor naming, and portfolio polish gaps.', icon: Github, accent: 'cyan' },
  { title: 'Deployment Issue Detector', body: 'Catch localhost URLs, missing start scripts, CORS traps, and platform-specific blockers.', icon: Rocket, accent: 'amber' },
  { title: 'Secret/API Key Scanner', body: 'Surface exposed keys, committed env files, and unsafe frontend provider calls.', icon: KeyRound, accent: 'rose' },
  { title: 'README Generator', body: 'Turn chaotic project notes into a recruiter-friendly GitHub README.', icon: BookOpen, accent: 'violet' },
  { title: 'Resume Bullet Generator', body: 'Convert implementation details into strong, credible placement resume bullets.', icon: GraduationCap, accent: 'emerald' },
  { title: 'Project Defense Pack', body: 'Prepare architecture, limitations, scale-up, and viva answers before interviews.', icon: BrainCircuit, accent: 'cyan' },
];

export const accentMap = {
  cyan: 'from-cyan-400/20 to-cyan-500/5 text-cyan-200 border-cyan-300/20',
  violet: 'from-violet-400/20 to-violet-500/5 text-violet-200 border-violet-300/20',
  emerald: 'from-emerald-400/20 to-emerald-500/5 text-emerald-200 border-emerald-300/20',
  amber: 'from-amber-400/20 to-amber-500/5 text-amber-200 border-amber-300/20',
  rose: 'from-rose-400/20 to-rose-500/5 text-rose-200 border-rose-300/20',
};
