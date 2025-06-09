import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';
import installer from 'electron-devtools-installer';

const { default: installExtension } = installer;

const extensionsDictionary = {} as const;

export class ChromeDevToolsExtension implements AppModule {
  readonly #extension: keyof typeof extensionsDictionary;

  constructor({ extension }: { readonly extension: keyof typeof extensionsDictionary }) {
    this.#extension = extension;
  }

  async enable({ app }: ModuleContext): Promise<void> {
    await app.whenReady();
    await installExtension(extensionsDictionary[this.#extension]);
  }
}

export function chromeDevToolsExtension(...args: ConstructorParameters<typeof ChromeDevToolsExtension>) {
  return new ChromeDevToolsExtension(...args);
}
