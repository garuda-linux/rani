// packages/main/src/ModuleRunner.ts
import { AppModule } from './AppModule.js';
import { ModuleContext } from './ModuleContext.js';
import { app } from 'electron';

export class ModuleRunner implements PromiseLike<void> {
  #promise: Promise<void>;

  constructor() {
    this.#promise = Promise.resolve();
  }

  init(module: AppModule): this {
    const p = module.enable(this.#createModuleContext());
    // always chain: Promise.resolve semantics handle non-promise values
    this.#promise = this.#promise.then(() => p as unknown as undefined | Promise<void>);
    return this;
  }

  #createModuleContext(): ModuleContext {
    return { app };
  }

  then<TResult1 = void, TResult2 = never>(
    onfulfilled?: (value: any) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>,
  ): PromiseLike<TResult1 | TResult2> {
    // forward to the internal promise
    return this.#promise.then(onfulfilled as any, onrejected as any);
  }
}

export function createModuleRunner() {
  return new ModuleRunner();
}
