// src/utils/logger.js
const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');

const LOG_DIR = process.env.LOG_DIR || 'logs';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const PRETTY = (process.env.LOG_PRETTY || 'true') === 'true';

function ensureDir(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
}
ensureDir(LOG_DIR);

const baseFormat = [
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.errors({ stack: true }),
];

const devFormat = format.combine(
  ...baseFormat,
  PRETTY
    ? format.printf(info => {
        const { timestamp, level, message, ...meta } = info;
        const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} ${level.toUpperCase()} ${message}${rest}`;
      })
    : format.json()
);

const prodFormat = format.combine(...baseFormat, format.json());

const logger = createLogger({
  level: LOG_LEVEL,
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports:
    process.env.NODE_ENV === 'production'
      ? [
          new transports.File({
            filename: path.join(LOG_DIR, 'error.log'),
            level: 'error',
            maxsize: 10 * 1024 * 1024,
            maxFiles: 3,
          }),
          new transports.File({
            filename: path.join(LOG_DIR, 'app.log'),
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
          }),
        ]
      : [new transports.Console()],
  exitOnError: false,
});

// Por si lo usas como stream (morgan u otros)
logger.stream = { write: (msg) => logger.info(msg.trim()) };

module.exports = logger;
