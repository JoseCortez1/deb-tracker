import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['deb-tracker.educortez.com'],
  },
  preview: {
    allowedHosts: ['deb-tracker.educortez.com'],
  },
});
