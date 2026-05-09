import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import Prerenderer from "@prerenderer/rollup-plugin";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { imagetools } from "vite-imagetools";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    imagetools({
      defaultDirectives: (url) => {
        // Auto-convert all menu JPGs to WebP — menu images are displayed as thumbnails
        // (max ~300px wide on screen), so cap at 600px for 2× retina and compress at q=72.
        // Cuts payload from 13MB JPG → ~3MB WebP with no perceptible quality loss.
        if (url.pathname.includes('/menu/') && /\.jpe?g$/i.test(url.pathname)) {
          return new URLSearchParams('format=webp&quality=72&w=600');
        }
        return new URLSearchParams();
      },
    }),
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
