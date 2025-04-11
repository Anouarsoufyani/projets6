import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

import dotenv from "dotenv"

dotenv.config()
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "https://projets6.onrender.com",
        changeOrigin: true,
      },
    },
  },
})
