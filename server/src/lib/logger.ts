import * as dotenv from 'dotenv';
dotenv.config();

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

const isProd = process.env.NODE_ENV === 'production';

const COLORS = {
  INFO: '\x1b[36m',   // Cyan
  WARN: '\x1b[33m',   // Yellow
  ERROR: '\x1b[31m',  // Red
  DEBUG: '\x1b[90m',  // Gray
  RESET: '\x1b[0m',
  DIM: '\x1b[2m',
  BOLD: '\x1b[1m',
  GREEN: '\x1b[32m',
};

function formatTimestamp(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, context: string, message: string, meta?: Record<string, any>) {
  // In production, output structured JSON for log aggregation
  if (isProd) {
    const entry = {
      timestamp: formatTimestamp(),
      level,
      context,
      message,
      ...(meta && { meta }),
    };
    const output = JSON.stringify(entry);
    if (level === 'ERROR') console.error(output);
    else if (level === 'WARN') console.warn(output);
    else console.log(output);
    return;
  }

  // In development, output human-readable colored logs
  const color = COLORS[level];
  const ts = COLORS.DIM + formatTimestamp() + COLORS.RESET;
  const lvl = color + COLORS.BOLD + level.padEnd(5) + COLORS.RESET;
  const ctx = COLORS.DIM + `[${context}]` + COLORS.RESET;
  const msg = color + message + COLORS.RESET;

  let line = `${ts} ${lvl} ${ctx} ${msg}`;
  if (meta) {
    line += ' ' + COLORS.DIM + JSON.stringify(meta) + COLORS.RESET;
  }

  if (level === 'ERROR') console.error(line);
  else if (level === 'WARN') console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (context: string, message: string, meta?: Record<string, any>) => log('INFO', context, message, meta),
  warn: (context: string, message: string, meta?: Record<string, any>) => log('WARN', context, message, meta),
  error: (context: string, message: string, meta?: Record<string, any>) => log('ERROR', context, message, meta),
  debug: (context: string, message: string, meta?: Record<string, any>) => {
    if (!isProd) log('DEBUG', context, message, meta);
  },

  // Convenience: log a startup banner
  banner: (appName: string, port: string | number, env: string) => {
    if (isProd) {
      log('INFO', 'Server', `${appName} started`, { port, env });
    } else {
      console.log('');
      console.log(`  ${COLORS.BOLD}${COLORS.GREEN}✓ ${appName}${COLORS.RESET}`);
      console.log(`  ${COLORS.DIM}├─ Port:  ${COLORS.RESET}${port}`);
      console.log(`  ${COLORS.DIM}├─ Env:   ${COLORS.RESET}${env}`);
      console.log(`  ${COLORS.DIM}└─ Time:  ${COLORS.RESET}${formatTimestamp()}`);
      console.log('');
    }
  },
};
