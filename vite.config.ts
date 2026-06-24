import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  // Served from a subpath on GitHub Pages (https://<user>.github.io/dude/).
  // The deploy workflow sets VITE_BASE=/dude/; local dev/preview stays at "/".
  const base = process.env.VITE_BASE || '/';
  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['DudeLogo.png'],
        manifest: {
          name: 'Dude',
          short_name: 'Dude',
          description:
            'Survey sites, scope manpower, and close commercial proposals — offline-first.',
          theme_color: '#9C5354',
          background_color: '#FDFAF8',
          display: 'standalone',
          start_url: base,
          scope: base,
          icons: [
            {src: 'DudeLogo.png', sizes: '512x512', type: 'image/png'},
            {src: 'DudeLogo.png', sizes: '192x192', type: 'image/png'},
            {
              src: 'DudeLogo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // App shell + assets cached for offline use; data lives in IndexedDB.
          globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          navigateFallback: `${base}index.html`,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: true,
    },
  };
});
