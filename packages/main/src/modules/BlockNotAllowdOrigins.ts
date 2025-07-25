import { AbstractSecurityRule } from './AbstractSecurityModule.js';
import { URL } from 'node:url';
import type { WebContents } from 'electron';
import { Logger } from '../logging/logging.js';

/**
 * Block navigation to origins not on the allowlist.
 *
 * Navigation exploits are quite common. If an attacker can convince the app to navigate away from its current page,
 * they can possibly force the app to open arbitrary web resources/websites on the web.
 *
 * @see https://www.electronjs.org/docs/latest/tutorial/security#13-disable-or-limit-navigation
 */
export class BlockNotAllowedOrigins extends AbstractSecurityRule {
  readonly #allowedOrigins: Set<string>;
  private readonly logger = Logger.getInstance();

  constructor(allowedOrigins = new Set<string>()) {
    super();
    this.#allowedOrigins = structuredClone(allowedOrigins);
  }

  applyRule(contents: WebContents): Promise<void> | void {
    contents.on('will-navigate', (event, url) => {
      const { origin } = new URL(url);
      if (this.#allowedOrigins.has(origin)) {
        return;
      }

      // Prevent navigation
      event.preventDefault();

      if (import.meta.env.DEV) {
        this.logger.warn(`Blocked navigating to disallowed origin: ${origin}`);
      }
    });
  }
}

export function allowInternalOrigins(
  ...args: ConstructorParameters<typeof BlockNotAllowedOrigins>
): BlockNotAllowedOrigins {
  return new BlockNotAllowedOrigins(...args);
}
