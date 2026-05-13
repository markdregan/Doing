type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function getConfiguredLevel(): LogLevel {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // In tests, default to 'warn' to avoid cluttering test output
    if (import.meta.env.VITEST) return 'warn'
    const envLevel = import.meta.env.VITE_LOG_LEVEL as string | undefined
    if (envLevel && envLevel in LOG_LEVELS) return envLevel as LogLevel
    return import.meta.env.DEV ? 'debug' : 'warn'
  }
  return 'warn'
}

let currentLevel: LogLevel = getConfiguredLevel()

export function setLogLevel(level: LogLevel) {
  currentLevel = level
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

function formatTimestamp(): string {
  return new Date().toISOString()
}

function safeStringify(value: unknown): string {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}\n${value.stack ?? ''}`
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export interface Logger {
  debug: (op: string, meta?: Record<string, unknown>) => void
  info: (op: string, meta?: Record<string, unknown>) => void
  warn: (op: string, meta?: Record<string, unknown>) => void
  error: (op: string, err?: unknown, meta?: Record<string, unknown>) => void
  child: (staticMeta: Record<string, unknown>) => Logger
}

function createLogger(staticMeta: Record<string, unknown> = {}): Logger {
  const log = (level: LogLevel, op: string, errOrMeta?: unknown, meta?: Record<string, unknown>) => {
    if (!shouldLog(level) && level !== 'error') return

    const timestamp = formatTimestamp()
    const allMeta = { ...staticMeta, ...(meta ?? {}) }
    const hasMeta = Object.keys(allMeta).length > 0

    if (level === 'error') {
      const err = errOrMeta instanceof Error
        ? { name: errOrMeta.name, message: errOrMeta.message, stack: errOrMeta.stack }
        : errOrMeta
      const prefix = `[${timestamp}] [ERROR] [${op}]`
      if (hasMeta) {
        console.error(prefix, safeStringify(err), allMeta)
      } else {
        console.error(prefix, safeStringify(err))
      }
    } else {
      const prefix = `[${timestamp}] [${level.toUpperCase()}] [${op}]`
      if (hasMeta) {
        console.log(prefix, allMeta)
      } else {
        console.log(prefix)
      }
    }
  }

  return {
    debug: (op, meta) => log('debug', op, undefined, meta),
    info: (op, meta) => log('info', op, undefined, meta),
    warn: (op, meta) => log('warn', op, undefined, meta),
    error: (op, err, meta) => log('error', op, err, meta),
    child: (extraMeta) => createLogger({ ...staticMeta, ...extraMeta }),
  }
}

export const logger = createLogger()
