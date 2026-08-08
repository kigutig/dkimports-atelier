import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

/**
 * Vite plugin that patches @tanstack/start-client-core's createCsrfMiddleware.js
 * to inline the real createMiddleware implementation, preventing it from being
 * replaced with a stub during SSR bundling on Vercel/Node.js environments.
 */
function patchTanStackCsrfMiddleware(): Plugin {
  return {
    name: "patch-tanstack-csrf-middleware",
    enforce: "pre",
    transform(code: string, id: string) {
      // Target the exact file that imports createMiddleware as a relative import
      if (
        id.includes("@tanstack/start-client-core") &&
        id.includes("createCsrfMiddleware")
      ) {
        // Replace the relative import with an inlined real implementation
        // so it can never be undefined/stub at runtime
        const patched = code.replace(
          /import\s*\{\s*createMiddleware\s*\}\s*from\s*["']\.\/createMiddleware\.js["'];?/,
          `var createMiddleware = (options, __opts) => {
  const resolvedOptions = { type: "request", ...(__opts || options) };
  const setValidator = (v) => createMiddleware({}, Object.assign(resolvedOptions, { validator: v, inputValidator: v }));
  return {
    options: resolvedOptions,
    middleware: (m) => createMiddleware({}, Object.assign(resolvedOptions, { middleware: m })),
    validator: setValidator,
    inputValidator: setValidator,
    client: (c) => createMiddleware({}, Object.assign(resolvedOptions, { client: c })),
    server: (s) => createMiddleware({}, Object.assign(resolvedOptions, { server: s })),
  };
};`,
        );
        if (patched !== code) {
          return { code: patched, map: null };
        }
      }
    },
  };
}

export default defineConfig({
  nitro: {
    preset: "vercel",
  },
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [patchTanStackCsrfMiddleware()],
  },
});
