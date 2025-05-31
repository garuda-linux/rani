import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';
import type { UserConfig, Plugin } from 'vite';
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Copy assets from assets to dist/assets
 */
function copyAssets(): Plugin {
  return {
    name: 'copy-assets',
    writeBundle(): void {
      try {
        // Copy assets directory to main package dist
        const srcAssetsDir = join(process.cwd(), 'assets');
        const destAssetsDir = join(process.cwd(), 'dist/assets');

        function copyDir(src: string, dest: string): void {
          try {
            mkdirSync(dest, { recursive: true });
            const files = readdirSync(src, { withFileTypes: true });

            for (const file of files) {
              const srcPath = join(src, file.name);
              const destPath = join(dest, file.name);

              if (file.isDirectory()) {
                copyDir(srcPath, destPath);
              } else {
                copyFileSync(srcPath, destPath);
              }
            }
          } catch (error) {
            console.warn(
              `Could not copy ${src}:`,
              (error as NodeJS.ErrnoException).message,
            );
          }
        }

        copyDir(srcAssetsDir, destAssetsDir);
        console.log('Assets copied to renderer package');
      } catch (error) {
        console.warn(
          'Could not copy assets:',
          (error as NodeJS.ErrnoException).message,
        );
      }
    },
  };
}

const viteConfig: UserConfig = {
  base: './',
  build: {
    target: ['esnext'],
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  resolve: {
    mainFields: ['module'],
  },
  plugins: [
    // @ts-expect-error: works as expected
    analog({
      ssr: false,
      static: true,
      prerender: {
        routes: [],
      },
    }),
    copyAssets(),
    tailwindcss(),
  ],
};

export default defineConfig(viteConfig);
