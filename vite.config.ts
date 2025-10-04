import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    outDir: 'build'
  },

  // Server configuration
  server: {
    port: 8080,
    host: '0.0.0.0' // Explicitly bind to all interfaces
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
