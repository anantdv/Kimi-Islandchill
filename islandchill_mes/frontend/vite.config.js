import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Island Chill MES",
        short_name: "IC MES",
        theme_color: "#0066cc",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/islandchill/",
        icons: [
          { src: "/assets/islandchill_mes/icon-192.png", sizes: "192x192" },
          { src: "/assets/islandchill_mes/icon-512.png", sizes: "512x512" },
        ],
      },
    }),
  ],
  build: {
    outDir: "../islandchill_mes/public/frontend",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "^/(api|assets|files|login|logout)": {
        target: "http://islandchill.local:8000",
        changeOrigin: true,
      },
    },
  },
});
