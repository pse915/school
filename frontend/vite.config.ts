import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    lib: { entry: 'src/component.tsx', formats: ['es'], fileName: () => 'timetable.js' },
    cssCodeSplit: false,
    rollupOptions: { output: { assetFileNames: 'style.[ext]' } },
    sourcemap: false,
  },
});
