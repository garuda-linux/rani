import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';

// @ts-ignore
export default defineConfig(({ mode }) => ({
  build: {
    target: ['esnext'],
    rollupOptions: {
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
  resolve: {
    mainFields: ['module'],
  },
  plugins: [
    analog({
      ssr: false,
      static: true,
      prerender: {
        routes: [],
      },
    }),
    tailwindcss(),
  ],
}));
