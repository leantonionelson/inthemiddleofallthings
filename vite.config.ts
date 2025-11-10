import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Only enable PWA plugin in production
    ...(process.env.NODE_ENV === 'production' ? [VitePWA({
      registerType: 'prompt', // Manual control via Settings button
      includeAssets: ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'logo.png'],
      manifest: {
        name: 'In the Middle of All Things',
        short_name: 'MiddleApp',
        description: 'A poetic, interactive companion to the book In the Middle of All Things',
        theme_color: '#0F0F0F',
        background_color: '#FAFAFA',
        display: 'standalone',
        categories: ['books', 'education', 'lifestyle'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        // Add audio-related capabilities
        related_applications: [],
        prefer_related_applications: false
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        globIgnores: ['**/media/audio/**/*.wav', '**/media/audio/**/*.mp3'],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB limit to allow video caching
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              }
            }
          },
          {
            urlPattern: /\.(wav|mp3|ogg|m4a)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // <== 30 days
              }
            }
          },
          {
            urlPattern: /\/media\/bg.*\.mp4$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'video-cache',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days - videos are integral to UI
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })] : []),
  ],
  server: {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split large dependencies
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'framer-motion';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            if (id.includes('react-router')) return 'react-vendor';
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('html2canvas')) return 'html2canvas';
            return 'vendor';
          }
          
          // Split by feature/page
          if (id.includes('/pages/')) {
            const match = id.match(/\/pages\/([^/]+)/);
            return match ? `page-${match[1]}` : 'pages';
          }
          
          if (id.includes('/features/')) {
            const match = id.match(/\/features\/([^/]+)/);
            return match ? `feature-${match[1]}` : 'features';
          }
          
          if (id.includes('/services/')) {
            return 'services';
          }
          
          if (id.includes('/components/')) {
            return 'components';
          }
        }
      }
    },
    // Increase chunk size warning limit since we're splitting properly
    chunkSizeWarningLimit: 1000,
  },
})
