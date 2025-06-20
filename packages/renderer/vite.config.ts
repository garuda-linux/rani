import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';
import type { UserConfig, Plugin } from 'vite';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
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
            console.warn(`Could not copy ${src}:`, (error as NodeJS.ErrnoException).message);
          }
        }

        copyDir(srcAssetsDir, destAssetsDir);

        // Copy favicon to root for HTML reference
        const faviconSrc = join(srcAssetsDir, 'garuda-purple.svg');
        const faviconDest = join(process.cwd(), 'dist/garuda-purple.svg');
        try {
          copyFileSync(faviconSrc, faviconDest);
        } catch (error) {
          console.warn('Could not copy favicon:', (error as NodeJS.ErrnoException).message);
        }

        console.log('Assets copied to renderer package');
      } catch (error) {
        console.warn('Could not copy assets:', (error as NodeJS.ErrnoException).message);
      }
    },
  };
}

/**
 * Transform absolute asset paths to relative paths for Electron
 */
function transformAssetPaths(): Plugin {
  return {
    name: 'transform-asset-paths',
    writeBundle(): void {
      try {
        const distDir = join(process.cwd(), 'dist');

        // Find all files to process
        const assetsDir = join(distDir, 'assets');
        const filesToProcess = [join(distDir, 'index.html'), join(distDir, 'index.js')];

        // Add assets files if assets directory exists
        try {
          const assetFiles = readdirSync(assetsDir);
          for (const file of assetFiles) {
            if (file.endsWith('.js') || file.endsWith('.css')) {
              filesToProcess.push(join(assetsDir, file));
            }
          }
        } catch {
          // Assets directory might not exist, continue
        }

        let transformedCount = 0;

        for (const filePath of filesToProcess) {
          try {
            let content = readFileSync(filePath, 'utf-8');
            const originalContent = content;

            // Transform various patterns of /assets/ to ./assets/
            content = content.replace(/(["\s(=:])\/assets\//g, '$1./assets/');
            content = content.replace(/^\/assets\//gm, './assets/');
            content = content.replace(/(src\s*=\s*["'])\/assets\//g, '$1./assets/');
            content = content.replace(/(ngSrc\s*=\s*["'])\/assets\//g, '$1./assets/');
            content = content.replace(/(href\s*=\s*["'])\/assets\//g, '$1./assets/');
            content = content.replace(/([^.])\/assets\//g, '$1./assets/');

            if (content !== originalContent) {
              writeFileSync(filePath, content);
              transformedCount++;
            }
          } catch (error) {
            console.warn(`Could not transform ${filePath}:`, (error as NodeJS.ErrnoException).message);
          }
        }

        console.log(`Asset paths transformed for Electron (${transformedCount} files)`);
      } catch (error) {
        console.warn('Could not transform asset paths:', (error as NodeJS.ErrnoException).message);
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
    chunkSizeWarningLimit: 50000,
  },
  resolve: {
    mainFields: ['module'],
  },

  plugins: [
    analog({
      disableTypeChecking: true, // PrimeNG designer is not properly typed at all. What the fuck.
      liveReload: true,
      prerender: {
        routes: [],
      },
      ssr: false,
      static: true,
    }),
    copyAssets(),
    transformAssetPaths(),
    tailwindcss(),
  ],
};

export default defineConfig(viteConfig);
