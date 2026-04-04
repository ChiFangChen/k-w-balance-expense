import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/k-w-balance-expense/',
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'KW Balance',
        short_name: 'KW Balance',
        description: 'Kiki & Wayne 共同記帳',
        theme_color: '#f1f5f9',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/k-w-balance-expense/',
        start_url: '/k-w-balance-expense/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
