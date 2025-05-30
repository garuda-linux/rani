import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';
import { ipcMain, clipboard, nativeImage } from 'electron';

class ClipboardModule implements AppModule {
  enable({ app: _app }: ModuleContext): void {
    this.setupClipboardHandlers();
  }

  private setupClipboardHandlers(): void {
    // Basic clipboard operations
    ipcMain.handle('clipboard:writeText', async (_, text: string) => {
      try {
        if (typeof text !== 'string') {
          throw new Error('Text must be a string');
        }
        clipboard.writeText(text);
        return true;
      } catch (error) {
        console.error('Clipboard writeText error:', error);
        throw new Error(
          `Failed to write text to clipboard: ${error instanceof Error ? error.message : error}`,
        );
      }
    });

    ipcMain.handle('clipboard:readText', async () => {
      try {
        return clipboard.readText();
      } catch (error) {
        console.error('Clipboard readText error:', error);
        throw new Error(
          `Failed to read text from clipboard: ${error instanceof Error ? error.message : error}`,
        );
      }
    });

    ipcMain.handle('clipboard:clear', async () => {
      try {
        clipboard.clear();
        return true;
      } catch (error) {
        console.error('Clipboard clear error:', error);
        throw new Error(
          `Failed to clear clipboard: ${error instanceof Error ? error.message : error}`,
        );
      }
    });

    // HTML operations
    ipcMain.handle(
      'clipboard:writeHTML',
      async (_, markup: string, text?: string) => {
        try {
          if (typeof markup !== 'string') {
            throw new Error('Markup must be a string');
          }
          clipboard.writeHTML(markup);
          return true;
        } catch (error) {
          console.error('Clipboard writeHTML error:', error);
          throw new Error(
            `Failed to write HTML to clipboard: ${error instanceof Error ? error.message : error}`,
          );
        }
      },
    );

    ipcMain.handle('clipboard:readHTML', async () => {
      try {
        return clipboard.readHTML();
      } catch (error) {
        console.error('Clipboard readHTML error:', error);
        throw new Error(
          `Failed to read HTML from clipboard: ${error instanceof Error ? error.message : error}`,
        );
      }
    });

    // RTF operations
    ipcMain.handle('clipboard:writeRTF', async (_, text: string) => {
      try {
        if (typeof text !== 'string') {
          throw new Error('RTF text must be a string');
        }
        clipboard.writeRTF(text);
        return true;
      } catch (error) {
        console.error('Clipboard writeRTF error:', error);
        throw new Error(
          `Failed to write RTF to clipboard: ${error instanceof Error ? error.message : error}`,
        );
      }
    });

    ipcMain.handle('clipboard:readRTF', async () => {
      try {
        return clipboard.readRTF();
      } catch (error) {
        console.error('Clipboard readRTF error:', error);
        throw new Error(
          `Failed to read RTF from clipboard: ${error instanceof Error ? error.message : error}`,
        );
      }
    });

    // Image operations
    ipcMain.handle('clipboard:writeImage', async (_, dataURL: string) => {
      try {
        if (typeof dataURL !== 'string') {
          throw new Error('Image data URL must be a string');
        }

        const image = nativeImage.createFromDataURL(dataURL);
        if (image.isEmpty()) {
          throw new Error('Invalid image data');
        }

        clipboard.writeImage(image);
        return true;
      } catch (error) {
        console.error('Clipboard writeImage error:', error);
        throw new Error(
          `Failed to write image to clipboard: ${error instanceof Error ? error.message : error}`,
        );
      }
    });

    ipcMain.handle('clipboard:readImage', async () => {
      try {
        const image = clipboard.readImage();
        if (image.isEmpty()) {
          return null;
        }
        return image.toDataURL();
      } catch (error) {
        console.error('Clipboard readImage error:', error);
        throw new Error(
          `Failed to read image from clipboard: ${error instanceof Error ? error.message : error}`,
        );
      }
    });

    // Bookmark operations (macOS only)
    ipcMain.handle(
      'clipboard:writeBookmark',
      async (_, title: string, url: string) => {
        try {
          if (process.platform !== 'darwin') {
            console.warn('Bookmark operations are only supported on macOS');
            return false;
          }

          if (typeof title !== 'string' || typeof url !== 'string') {
            throw new Error('Title and URL must be strings');
          }

          clipboard.writeBookmark(title, url);
          return true;
        } catch (error) {
          console.error('Clipboard writeBookmark error:', error);
          throw new Error(
            `Failed to write bookmark to clipboard: ${error instanceof Error ? error.message : error}`,
          );
        }
      },
    );

    ipcMain.handle('clipboard:readBookmark', async () => {
      try {
        if (process.platform !== 'darwin') {
          console.warn('Bookmark operations are only supported on macOS');
          return null;
        }

        return clipboard.readBookmark();
      } catch (error) {
        console.error('Clipboard readBookmark error:', error);
        throw new Error(
          `Failed to read bookmark from clipboard: ${error instanceof Error ? error.message : error}`,
        );
      }
    });

    // Advanced operations
    ipcMain.handle('clipboard:availableFormats', async () => {
      try {
        return clipboard.availableFormats();
      } catch (error) {
        console.error('Clipboard availableFormats error:', error);
        throw new Error(
          `Failed to get available clipboard formats: ${error instanceof Error ? error.message : error}`,
        );
      }
    });

    ipcMain.handle('clipboard:has', async (_, format: string) => {
      try {
        if (typeof format !== 'string') {
          throw new Error('Format must be a string');
        }
        return clipboard.has(format);
      } catch (error) {
        console.error('Clipboard has error:', error);
        throw new Error(
          `Failed to check clipboard format: ${error instanceof Error ? error.message : error}`,
        );
      }
    });

    ipcMain.handle('clipboard:read', async (_, format: string) => {
      try {
        if (typeof format !== 'string') {
          throw new Error('Format must be a string');
        }
        return clipboard.read(format);
      } catch (error) {
        console.error('Clipboard read error:', error);
        throw new Error(
          `Failed to read clipboard format: ${error instanceof Error ? error.message : error}`,
        );
      }
    });

    // Utility functions
    ipcMain.handle('clipboard:isEmpty', async () => {
      try {
        const formats = clipboard.availableFormats();
        return formats.length === 0;
      } catch (error) {
        console.error('Clipboard isEmpty error:', error);
        throw new Error(
          `Failed to check if clipboard is empty: ${error instanceof Error ? error.message : error}`,
        );
      }
    });

    ipcMain.handle('clipboard:hasText', async () => {
      try {
        const text = clipboard.readText();
        return text.length > 0;
      } catch (error) {
        console.error('Clipboard hasText error:', error);
        throw new Error(
          `Failed to check if clipboard has text: ${error instanceof Error ? error.message : error}`,
        );
      }
    });

    ipcMain.handle('clipboard:hasImage', async () => {
      try {
        const image = clipboard.readImage();
        return !image.isEmpty();
      } catch (error) {
        console.error('Clipboard hasImage error:', error);
        throw new Error(
          `Failed to check if clipboard has image: ${error instanceof Error ? error.message : error}`,
        );
      }
    });
  }
}

export function createClipboardModule() {
  return new ClipboardModule();
}
