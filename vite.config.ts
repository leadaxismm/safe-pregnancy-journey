import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const withPwa = process.env.VITE_DISABLE_PWA !== 'true';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    withPwa && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'رحلة الحمل الآمن | Safe Pregnancy Journey',
        short_name: 'رحلة الحمل الآمن',
        description: 'منصة تثقيف صحي للحوامل — تجمع حفر الباطن الصحي',
        lang: 'ar',
        dir: 'rtl',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f5f8fc',
        theme_color: '#1d6fb8',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // admin-only chunks are not precached for patients
        globIgnores: ['**/xlsx-*.js', '**/supabase-*.js', '**/Admin-*.js', '**/browser-*.js'],
        navigateFallbackDenylist: [/^\/admin/]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: { supabase: ['@supabase/supabase-js'] }
      }
    }
  },
  test: { environment: 'node' }
} as any);
