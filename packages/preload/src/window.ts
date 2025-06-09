import { error, warn } from './logging.js';

export function close(): boolean {
  try {
    // In preload context, we can trigger window close
    window.close();
    return true;
  } catch (err) {
    error(`Window close error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function requestClose(): boolean {
  try {
    // Same as close in preload context
    window.close();
    return true;
  } catch (err) {
    error(`Window requestClose error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function minimize(): boolean {
  try {
    // Cannot minimize from preload context without main process
    warn('Window minimize not available in preload context');
    return false;
  } catch (err) {
    error(`Window minimize error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function maximize(): boolean {
  try {
    // Cannot maximize from preload context without main process
    warn('Window maximize not available in preload context');
    return false;
  } catch (err) {
    error(`Window maximize error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function hide(): boolean {
  try {
    // Cannot hide from preload context without main process
    warn('Window hide not available in preload context');
    return false;
  } catch (err) {
    error(`Window hide error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function show(): boolean {
  try {
    // Focus is closest equivalent in preload context
    window.focus();
    return true;
  } catch (err) {
    error(`Window show error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function focus(): boolean {
  try {
    window.focus();
    return true;
  } catch (err) {
    error(`Window focus error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function isMaximized(): boolean {
  try {
    // Check if window matches screen size (approximation)
    return window.outerWidth >= window.screen.availWidth && window.outerHeight >= window.screen.availHeight;
  } catch (err) {
    error(`Window isMaximized error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function isMinimized(): boolean {
  try {
    // Check document visibility as approximation
    return document.hidden || document.visibilityState === 'hidden';
  } catch (err) {
    error(`Window isMinimized error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function isVisible(): boolean {
  try {
    return !document.hidden && document.visibilityState === 'visible';
  } catch (err) {
    error(`Window isVisible error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function setTitle(title: string): boolean {
  try {
    if (!title || typeof title !== 'string') {
      error('Invalid title provided');
      return false;
    }
    document.title = title;
    return true;
  } catch (err) {
    error(`Window setTitle error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function getTitle(): string {
  try {
    return document.title || '';
  } catch (err) {
    error(`Window getTitle error: ${err instanceof Error ? err.message : String(err)}`);
    return '';
  }
}

export function setSize(width: number, height: number): boolean {
  try {
    if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
      error('Invalid size parameters');
      return false;
    }
    window.resizeTo(width, height);
    return true;
  } catch (err) {
    error(`Window setSize error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function getSize(): { width: number; height: number } {
  try {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  } catch (err) {
    error(`Window getSize error: ${err instanceof Error ? err.message : String(err)}`);
    return { width: 0, height: 0 };
  }
}

export function setPosition(x: number, y: number): boolean {
  try {
    if (typeof x !== 'number' || typeof y !== 'number') {
      error('Invalid position parameters');
      return false;
    }
    window.moveTo(x, y);
    return true;
  } catch (err) {
    error(`Window setPosition error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function getPosition(): { x: number; y: number } {
  try {
    return {
      x: window.screenX,
      y: window.screenY,
    };
  } catch (err) {
    error(`Window getPosition error: ${err instanceof Error ? err.message : String(err)}`);
    return { x: 0, y: 0 };
  }
}
