import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => {
          // Map frontend API paths to backend paths
          if (path === '/api/login') {
            return '/auth/login'
          }
          if (path === '/api/register') {
            return '/auth/register'
          }
          if (path === '/api/me') {
            return '/me'
          }
          if (path.startsWith('/api/caches')) {
            return path.replace('/api/caches', '/caches')
          }
          if (path === '/api/logs') {
            return '/logs'
          }
          if (path === '/api/finds') {
            return '/logs'
          }
          if (path === '/api/leaderboard') {
            return '/leaderboard'
          }
          // For other /api paths, remove /api prefix
          return path.replace(/^\/api/, '')
        },
      },
    },
  },
})

