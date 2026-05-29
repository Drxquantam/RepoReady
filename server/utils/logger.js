export function logInfo(message, meta = {}) {
  console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date().toISOString() }));
}

export function logError(message, error, meta = {}) {
  console.error(JSON.stringify({
    level: 'error',
    message,
    error: error?.message || String(error),
    ...meta,
    timestamp: new Date().toISOString(),
  }));
}

export function requestLogger(req, res, next) {
  const started = Date.now();
  res.on('finish', () => {
    logInfo('http_request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - started,
    });
  });
  next();
}
