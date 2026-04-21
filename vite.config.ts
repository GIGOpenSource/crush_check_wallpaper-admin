import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// http://192.168.77.46:8002/
const MARK_WALLPAPERS_ORIGIN = 'https://www.markwallpapers.com'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176,
    strictPort: true,
    host: true,
    // 开发时浏览器直连 markwallpapers.com 会触发 CORS；走本地同源 /api 由 Vite 转发
    proxy: {
      '/api': {
        target: MARK_WALLPAPERS_ORIGIN,
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
