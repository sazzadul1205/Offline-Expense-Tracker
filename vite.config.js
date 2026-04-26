// vite.config.js

// Vite
import { defineConfig } from "vite";

// React
import react from "@vitejs/plugin-react";

// PWA
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon.png"],
      manifest: {
        name: "Offline Expense Tracker",
        short_name: "Expenses",
        description:
          "Track income, expenses, debts, and accounts offline with a fast and reliable experience.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#3b82f6",
        background_color: "#ffffff",
        lang: "en",
        dir: "ltr",
        categories: ["finance", "productivity"],
        icons: [
          {
            src: "/icons/icon.png",
            sizes: "72x72",
            type: "image/png",
          },
          {
            src: "/icons/icon.png",
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: "/icons/icon.png",
            sizes: "128x128",
            type: "image/png",
          },
          {
            src: "/icons/icon.png",
            sizes: "144x144",
            type: "image/png",
          },
          {
            src: "/icons/icon.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon.png",
            sizes: "256x256",
            type: "image/png",
          },
          {
            src: "/icons/icon.png",
            sizes: "384x384",
            type: "image/png",
          },
          {
            src: "/icons/icon.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],
});
