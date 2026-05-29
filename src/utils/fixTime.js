const severityMinutes = {
  Critical: 35,
  High: 25,
  Medium: 15,
  Suggestion: 10,
};

export function estimateIssueTime(issue) {
  return `${severityMinutes[issue?.severity] || 10} min`;
}

export function estimateFixTime(issues = []) {
  const minutes = issues.reduce((total, issue) => total + (severityMinutes[issue?.severity] || 10), 0);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.round(minutes / 30) / 2} hrs`;
}
