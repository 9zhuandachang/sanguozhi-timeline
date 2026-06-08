import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'geneva-shows-become-can.trycloudflare.com', // 允许特定的隧道地址
      '.trycloudflare.com' // 也可以使用通配符，允许所有 cloudflare 隧道地址
    ]
  }
})
