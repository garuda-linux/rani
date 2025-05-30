import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';
import { app, session, shell } from 'electron';

class EnhancedSecurityModule implements AppModule {
  private readonly isDevelopment: boolean;

  constructor(isDevelopment = false) {
    this.isDevelopment = isDevelopment;
  }

  async enable({ app: _app }: ModuleContext): Promise<void> {
    await app.whenReady();
    this.setupSecurityHeaders();
    this.setupRequestFiltering();
    this.setupWebContentsProtection();
    this.setupAppProtection();
  }

  private setupSecurityHeaders(): void {
    // Set comprehensive security headers for production
    if (!this.isDevelopment) {
      session.defaultSession.webRequest.onHeadersReceived(
        (details, callback) => {
          callback({
            responseHeaders: {
              ...details.responseHeaders,
              'Content-Security-Policy': [
                "default-src 'self'; " +
                  "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                  "style-src 'self' 'unsafe-inline'; " +
                  "img-src 'self' data: blob:; " +
                  "font-src 'self' data:; " +
                  "connect-src 'self'; " +
                  "object-src 'none'; " +
                  "frame-src 'none'; " +
                  "base-uri 'self'; " +
                  "form-action 'self';",
              ],
              'X-Content-Type-Options': ['nosniff'],
              'X-Frame-Options': ['DENY'],
              'X-XSS-Protection': ['1; mode=block'],
              'Referrer-Policy': ['strict-origin-when-cross-origin'],
              'Permissions-Policy': [
                'geolocation=(), microphone=(), camera=(), fullscreen=(self)',
              ],
              'Strict-Transport-Security': [
                'max-age=31536000; includeSubDomains',
              ],
              'X-Download-Options': ['noopen'],
              'X-Permitted-Cross-Domain-Policies': ['none'],
            },
          });
        },
      );
    }
  }

  private setupRequestFiltering(): void {
    // Block external requests that aren't explicitly allowed (only in production)
    if (!this.isDevelopment) {
      session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
        try {
          const url = new URL(details.url);
          const allowedDomains = ['localhost', '127.0.0.1'];
          const allowedProtocols = [
            'file:',
            'data:',
            'blob:',
            'chrome-extension:',
          ];

          if (
            allowedProtocols.includes(url.protocol) ||
            allowedDomains.includes(url.hostname)
          ) {
            callback({ cancel: false });
          } else {
            console.warn(`Blocked external request to: ${details.url}`);
            callback({ cancel: true });
          }
        } catch (error) {
          console.warn(`Invalid URL blocked: ${details.url}`, error);
          callback({ cancel: true });
        }
      });
    }

    // Block potentially dangerous file downloads
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    session.defaultSession.on('will-download', (event, item, _webContents) => {
      const filename = item.getFilename();
      const dangerousExtensions = [
        '.exe',
        '.bat',
        '.cmd',
        '.com',
        '.scr',
        '.pif',
        '.vbs',
        '.js',
        '.jar',
        '.app',
        '.deb',
        '.rpm',
        '.dmg',
        '.pkg',
        '.msi',
        '.ps1',
        '.sh',
      ];

      const isDangerous = dangerousExtensions.some((ext) =>
        filename.toLowerCase().endsWith(ext),
      );

      if (isDangerous && !this.isDevelopment) {
        console.warn(`Blocked potentially dangerous download: ${filename}`);
        event.preventDefault();
      }
    });
  }

  private setupWebContentsProtection(): void {
    // Prevent new window creation with unsafe features
    app.on('web-contents-created', (event, contents) => {
      // Handle window opening
      contents.setWindowOpenHandler(({ url }) => {
        console.warn('Blocked new window creation:', url);
        // Allow external URLs to open in default browser instead
        if (url.startsWith('http://') || url.startsWith('https://')) {
          shell.openExternal(url);
        }
        return { action: 'deny' };
      });

      // Prevent webview attachment
      contents.on('will-attach-webview', (event) => {
        event.preventDefault();
        console.warn('Blocked webview attachment');
      });

      // Handle navigation security
      contents.on('will-navigate', (event, navigationUrl) => {
        try {
          const parsedUrl = new URL(navigationUrl);
          const allowedOrigins = ['http://localhost:4200'];
          const isFileProtocol = navigationUrl.startsWith('file://');

          // if (!allowedOrigins.includes(parsedUrl.origin) && !isFileProtocol) {
          //   console.warn(`Blocked navigation to: ${navigationUrl}`);
          //   event.preventDefault();
          // }
        } catch (error) {
          console.warn(
            `Invalid navigation URL blocked: ${navigationUrl}`,
            error,
          );
          event.preventDefault();
        }
      });

      // Handle frame navigation
      contents.on('will-navigate', (event, navigationUrl) => {
        try {
          const parsedUrl = new URL(navigationUrl);
          const allowedOrigins = ['http://localhost:4200'];
          const isFileProtocol = navigationUrl.startsWith('file://');

          if (!allowedOrigins.includes(parsedUrl.origin) && !isFileProtocol) {
            console.warn(`Blocked frame navigation to: ${navigationUrl}`);
            event.preventDefault();
          }
        } catch (error) {
          console.warn(
            `Invalid frame navigation URL blocked: ${navigationUrl}`,
            error,
          );
          event.preventDefault();
        }
      });

      // Prevent loading of remote content in frames
      contents.on('did-create-window', (window) => {
        window.webContents.on('will-navigate', (event, url) => {
          if (
            !url.startsWith('file://') &&
            !url.startsWith('http://localhost')
          ) {
            event.preventDefault();
            console.warn(`Blocked remote navigation in child window: ${url}`);
          }
        });
      });

      // Handle certificate errors
      contents.on(
        'certificate-error',
        (event, url, error, certificate, callback) => {
          if (this.isDevelopment) {
            // In development, you might want to allow self-signed certificates
            console.warn(`Certificate error for ${url}: ${error}`);
            // event.preventDefault();
            // callback(true);
          } else {
            console.error(`Certificate error for ${url}: ${error}`);
            callback(false);
          }
        },
      );

      // Monitor console messages for security issues
      contents.on(
        'console-message',
        (event, level, message, line, sourceId) => {
          if (level >= 2) {
            // Warning or error
            console.log(
              `Renderer console [${level}]:`,
              message,
              'at',
              sourceId,
              line,
            );
          }

          // Check for potential security issues in console messages
          const securityKeywords = ['XSS', 'injection', 'eval', 'unsafe'];
          if (
            securityKeywords.some((keyword) =>
              message.toLowerCase().includes(keyword),
            )
          ) {
            console.warn(
              `Potential security issue detected in renderer: ${message}`,
            );
          }
        },
      );
    });
  }

  private setupAppProtection(): void {
    // Set secure app settings
    app.setAppUserModelId('com.garudalinux.assistant');

    // Handle app certificate verification
    app.on(
      'certificate-error',
      (event, webContents, url, error, certificate, callback) => {
        if (this.isDevelopment) {
          console.warn(`App certificate error for ${url}: ${error}`);
          // In development, you might want to proceed anyway
          // event.preventDefault();
          // callback(true);
        } else {
          console.error(`App certificate error for ${url}: ${error}`);
          callback(false);
        }
      },
    );

    // Handle select client certificate
    app.on(
      'select-client-certificate',
      (event, webContents, url, list, callback) => {
        event.preventDefault();
        console.warn(`Client certificate request for ${url}`);
        // Don't provide any client certificate
        callback();
      },
    );

    // Handle login requests
    app.on('login', (event, webContents, details, authInfo, callback) => {
      event.preventDefault();
      console.warn(`Login request for ${details.url}`);
      // Don't provide credentials
      callback();
    });

    // Monitor for suspicious activity
    app.on(
      'accessibility-support-changed',
      (event, accessibilitySupportEnabled) => {
        console.log(
          `Accessibility support changed: ${accessibilitySupportEnabled}`,
        );
      },
    );

    // Handle GPU info update
    app.on('gpu-info-update', () => {
      console.log('GPU info updated');
    });

    // Handle renderer process crashed
    app.on('render-process-gone', (event, webContents, details) => {
      console.error('Renderer process gone:', details);
    });

    // Handle child process gone
    app.on('child-process-gone', (event, details) => {
      console.error('Child process gone:', details);
    });
  }

  // Method to update allowed origins dynamically
  updateAllowedOrigins(origins: string[]): void {
    // This could be used to update CSP or navigation rules dynamically
    console.log('Updating allowed origins:', origins);
  }

  // Method to add temporary security exceptions (for development)
  addSecurityException(type: string, value: string): void {
    if (this.isDevelopment) {
      console.warn(`Adding security exception - ${type}: ${value}`);
    } else {
      console.error('Security exceptions are not allowed in production');
    }
  }
}

export function createEnhancedSecurityModule(isDevelopment = false) {
  return new EnhancedSecurityModule(isDevelopment);
}
