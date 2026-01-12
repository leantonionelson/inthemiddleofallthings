import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'))

// Check if running in Capacitor (native app)
const isCapacitor = process.env.CAPACITOR === 'true' || process.env.CAPACITOR_PLATFORM

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __IS_CAPACITOR__: JSON.stringify(!!isCapacitor),
  },
  optimizeDeps: {
    // Avoid forcing pre-bundling of packages that don't expose a root "." export (e.g. firebase).
    // Vite will handle the actual subpath imports we use (firebase/app, firebase/auth, etc.).
    include: ['react', 'react-dom', 'framer-motion'],
    exclude: ['firebase'],
  },
  plugins: [
    react(),
    // Only enable PWA plugin in production and NOT in Capacitor (native apps don't use service workers)
    ...(process.env.NODE_ENV === 'production' && !isCapacitor ? [VitePWA({
      registerType: 'prompt', // Manual control via Settings button
      includeAssets: ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'logo.png'],
      manifest: {
        name: 'In the Middle of All Things',
        short_name: 'MiddleApp',
        description: 'A poetic, interactive companion to the book In the Middle of All Things',
        theme_color: '#0F0F0F',
        background_color: '#eae8e4',
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
        // Prevent users from getting stuck on an old cached build after deploys.
        // This is especially important when chunking/output changes, since stale SW caches can
        // keep serving old JS that no longer matches the new HTML/app code.
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
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
            // Explicitly cache generated audio assets under /audio/** (runtime-only, not precache)
            urlPattern: /\/audio\//i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // <== 30 days
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
    },
    // Local dev convenience:
    // If you run Netlify Functions locally on http://localhost:8888,
    // Vite can proxy /.netlify/functions/* so the browser never does a cross-origin request (no CORS issues).
    proxy: {
      '/.netlify/functions': {
        // Default to 8889 because 8888 is commonly taken (and Vite proxy errors surface as 500s).
        target: `http://localhost:${process.env.NETLIFY_FUNCTIONS_PORT || '8889'}`,
        changeOrigin: true,
        secure: false,
      },
    },
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
    // NOTE: We intentionally do NOT use aggressive manual chunking here.
    // The previous approach (splitting by /components, /services, etc.) caused cyclic chunk graphs,
    // leading to production/runtime errors like:
    // - "Cannot read properties of undefined (reading 'Component')"
    // - "Cannot access 'v' before initialization"
    // Let Vite/Rollup handle chunking defaults for stable evaluation order.
    // Increase chunk size warning limit since we're splitting properly
    chunkSizeWarningLimit: 1000,
  },
})
