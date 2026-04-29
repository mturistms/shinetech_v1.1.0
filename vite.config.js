import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: process.env.VITE_BASE_PATH || "/shinetech_v1.1.0",
    server: {
        port: process.env.NODE_PORT_BASE,

        // 👇 IMPORTANT for ngrok
        host: true,
        allowedHosts: true,

        proxy: {
            '/api': {
                target: process.env.NODE_BASE_URL,
                changeOrigin: true,
                secure: false
            }
        }
    }
})
