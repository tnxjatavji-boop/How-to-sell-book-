#!/bin/bash
echo "1. Setting up Single File Vite config..."
cat << 'VITE_EOF' > vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), viteSingleFile()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      cssCodeSplit: false,
      assetsInlineLimit: 100000000,
      chunkSizeWarningLimit: 100000000,
    }
  };
});
VITE_EOF

echo "2. Building single HTML file..."
npm run build

echo "3. Copying to public folder..."
cp dist/index.html public/TradeXora_Full_App.html

echo "4. Restoring original Vite config..."
cat << 'VITE_EOF2' > vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
VITE_EOF2

echo "5. Building normal version..."
npm run build
echo "Done!"
