import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import Prerenderer from "@prerenderer/rollup-plugin";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && sentryVitePlugin({
      org: "ricos-tacos",
      project: "ricos-tacos",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
      sourcemaps: {
        filesToDeleteAfterUpload: ["./dist/**/*.map"],
      },
    }),
  ].filter(Boolean),
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-stripe": ["@stripe/stripe-js", "@stripe/react-stripe-js"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-tabs",
            "@radix-ui/react-label",
            "@radix-ui/react-select",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-popover",
            "@radix-ui/react-accordion",
          ],
        },
      },
      plugins: mode === "production" && !process.env.VERCEL
        ? [
            Prerenderer({
              routes: ["/", "/menu", "/location", "/catering"],
            }),
          ]
        : [],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
