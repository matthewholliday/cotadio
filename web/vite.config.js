import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';

function isBenignSocketError(err) {
  if (!err) return false;
  return (
    err.code === 'EPIPE' ||
    err.code === 'ECONNRESET' ||
    err.message?.includes('EPIPE') ||
    err.message?.includes('ECONNRESET')
  );
}

// Vite logs ws proxy EPIPE/ECONNRESET errors from its own internal proxyReqWs
// handler which runs after our configure callback and can't be patched from
// within configure. Suppress them at the logger level instead.
const logger = createLogger();
const originalLoggerError = logger.error.bind(logger);
logger.error = (msg, opts) => {
  if (isBenignSocketError(opts?.error)) return;
  originalLoggerError(msg, opts);
};

export default defineConfig({
  customLogger: logger,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3847',
      '/ws': {
        target: 'ws://localhost:3847',
        ws: true,
      },
    },
  },
});
