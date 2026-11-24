import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('recharts')) return 'recharts';
          if (id.includes('d3-') || id.includes('victory-vendor')) return 'd3-vendor';
          if (id.includes('react-dom') || id.includes('react/')) return 'react-vendor';
          return undefined;
        },
      },
    },
  },
});
