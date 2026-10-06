const SENSITIVE_PATTERNS = [
  /bearer\s+[a-zA-Z0-9_\-\.]+/gi,
  /sb_secret_[a-zA-Z0-9_\-]+/gi,
  /password['"]?\s*[:=]\s*['"]?[^'",\s]+/gi,
  /token['"]?\s*[:=]\s*['"]?[^'",\s]+/gi,
  /apikey['"]?\s*[:=]\s*['"]?[^'",\s]+/gi
];

export function redactSecrets(message: string): string {
  let sanitized = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

export const logger = {
  info: (msg: string, ...args: unknown[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${redactSecrets(msg)}`, ...args);
  },
  warn: (msg: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${redactSecrets(msg)}`, ...args);
  },
  error: (msg: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${redactSecrets(msg)}`, ...args);
  },
  debug: (msg: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${redactSecrets(msg)}`, ...args);
    }
  }
};
