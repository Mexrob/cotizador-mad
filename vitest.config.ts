import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [], // Podemos añadir setup files si necesitamos mocks globales de prisma, etc.
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
