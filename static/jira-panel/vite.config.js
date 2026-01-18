import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
      // Ensure shared components use this app's node_modules
      'mermaid': path.resolve(__dirname, 'node_modules/mermaid'),
      'dompurify': path.resolve(__dirname, 'node_modules/dompurify'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
    },
    dedupe: ['react', 'react-dom', 'mermaid', 'dompurify']
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      input: 'index.html'
    }
  }
});
