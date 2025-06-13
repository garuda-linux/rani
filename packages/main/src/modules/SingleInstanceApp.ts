import type { AppModule } from '../AppModule.js';
import type { App } from 'electron';

class SingleInstanceApp implements AppModule {
  enable({ app }: { app: App }): void {
    const isSingleInstance = app.requestSingleInstanceLock();
    if (!isSingleInstance) {
      app.quit();
      process.exit(0);
    }
  }
}

export function disallowMultipleAppInstance(...args: ConstructorParameters<typeof SingleInstanceApp>) {
  return new SingleInstanceApp(...args);
}
