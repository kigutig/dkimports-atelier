import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  nitro: {
    preset: "vercel",
    alias: {
      // Force the real createMiddleware implementation into the server bundle.
      // The TanStack Start SSR build sometimes resolves the client stub
      // instead of the real function, causing "createMiddleware is not a function".
      "@tanstack/start-client-core/createMiddleware": path.resolve(
        __dirname,
        "src/shims/createMiddleware.js",
      ),
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
