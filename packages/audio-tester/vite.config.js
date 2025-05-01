import { defineConfig } from 'vite';

export default defineConfig({
  // Basic configuration
  server: {
    open: true
  },
  optimizeDeps: {
    exclude: ['tailwindcss']
  },
  plugins: []
}); 