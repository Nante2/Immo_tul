import path from "path"
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),    
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    globals: true,
  },
})
