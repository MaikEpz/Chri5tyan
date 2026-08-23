import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "three-core",
              test: /node_modules[\\/]three[\\/]/,
              priority: 30,
              maxSize: 450 * 1024,
            },
            {
              name: "react-three",
              test: /node_modules[\\/]@react-three[\\/]/,
              priority: 20,
            },
            {
              name: "three-stdlib",
              test: /node_modules[\\/]three-stdlib[\\/]/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 4173,
  },
});
