export function estimateAuditTime(fileSize = 0) {
  const mb = fileSize / (1024 * 1024);
  if (!mb) return 'Usually under 30 sec';
  if (mb <= 5) return 'About 15-30 sec';
  if (mb <= 25) return 'About 30-60 sec';
  if (mb <= 75) return 'About 1-2 min';
  if (mb <= 150) return 'About 2-4 min';
  return 'About 4-6 min';
}

export function formatFileSize(fileSize = 0) {
  const mb = fileSize / (1024 * 1024);
  if (mb < 1) return `${Math.max(1, Math.round(fileSize / 1024))} KB`;
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}
