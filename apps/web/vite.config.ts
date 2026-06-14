import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5174,
    host: true,
  },
  build: {
    // Целевой Safari 14+ — gen ES2022, не таскаем легаси полифилы.
    target: "es2022",
    // chunk size в KB до warning: повышаем, потому что recharts честно крупный.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Делим вендоры на стабильные чанки — каждый кэшируется отдельно.
        // При обновлении одной либы клиент не перекачивает всё остальное.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-router")) return "router";
          if (
            id.includes("react-dom") ||
            id.match(/\/react\//) ||
            id.includes("scheduler")
          )
            return "react-core";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("i18next") || id.includes("react-i18next"))
            return "i18n";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("zustand")) return "state";
          // Всё остальное — общий vendor.
          return "vendor";
        },
      },
    },
  },
});
