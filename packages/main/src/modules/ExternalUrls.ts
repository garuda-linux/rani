import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';
import { shell } from 'electron';
import { URL } from 'node:url';
import { Logger } from '../logging/logging.js';

export class ExternalUrls implements AppModule {
  readonly #externalUrls: Set<string>;

  private readonly logger = Logger.getInstance();

  constructor(externalUrls: Set<string>) {
    this.#externalUrls = externalUrls;
  }

  enable({ app }: ModuleContext): Promise<void> | void {
    app.on('web-contents-created', (_, contents) => {
      contents.setWindowOpenHandler(({ url }) => {
        const { origin } = new URL(url);

        if (this.#externalUrls.has(origin)) {
          shell.openExternal(url).catch(this.logger.error);
        } else if (import.meta.env.DEV) {
          this.logger.warn(`Blocked the opening of a disallowed external origin: ${origin}`);
        }

        // Prevent creating a new window.
        return { action: 'deny' };
      });
    });
  }
}

export function allowExternalUrls(...args: ConstructorParameters<typeof ExternalUrls>) {
  return new ExternalUrls(...args);
}
