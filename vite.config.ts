import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
const ERPNEXT_TARGET = process.env.ERPNEXT_URL || "http://192.168.101.172:8003";

export default defineConfig({
  base: '/',
  plugins: [inspectAttr(), react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: ERPNEXT_TARGET,
        changeOrigin: true,
        secure: false,
      },
      "/login": {
        target: ERPNEXT_TARGET,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
