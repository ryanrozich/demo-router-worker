import { defineConfig } from "vitest/config";
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineConfig({
  test: {
    poolOptions: {
      workers: defineWorkersConfig({
        wrangler: { configPath: "./wrangler.toml" },
        miniflare: {
          // Mock R2 and KV bindings for testing
          r2Buckets: ["DEMO_ASSETS"],
          kvNamespaces: ["DEMO_CONFIG"],
        },
      }),
    },
  },
});
