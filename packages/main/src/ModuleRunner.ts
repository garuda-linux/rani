import { AppModule } from './AppModule.js';
import { ModuleContext } from './ModuleContext.js';
import { app } from 'electron';

class ModuleRunner implements PromiseLike<void> {
  #promise: Promise<void>;

  constructor() {
    this.#promise = Promise.resolve();
  }

  init(module: AppModule) {
    const p = module.enable(this.#createModuleContext());

    if (p instanceof Promise) {
      this.#promise = this.#promise.then(() => p);
    }

    return this;
  }

  #createModuleContext(): ModuleContext {
    return {
      app,
    };
  }
}

export function createModuleRunner() {
  return new ModuleRunner();
}
