import { appConfig } from "@kivao/config/vite";
import { defineConfig, mergeConfig } from "vite";
const base = appConfig("ADMIN_PORT", 5174);
export default defineConfig(async (env) =>
  mergeConfig(typeof base === "function" ? await base(env) : await base, {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("/node_modules/zod/")) return "validation";
          },
        },
      },
    },
  }),
);
