import { Injectable, signal } from '@angular/core';
import { appSplashComplete } from '../../electron-services/electron-api-utils';

@Injectable({
  providedIn: 'root',
})
export class SplashService {
  readonly isVisible = signal(true);
  readonly progress = signal(0);
  readonly message = signal('Initializing application...');

  /**
   * Create the splash service and set up an effect to log progress changes.
   * @param progress Progress percentage (0-100)
   * @param message Status message
   */
  updateStep(progress: number, message: string): void {
    this.progress.set(Math.min(100, Math.max(0, progress)));
    this.message.set(message);

    this.adjustProgress(progress, message);
  }

  /**
   * Show the splash screen. This should be called very early in the app lifecycle, before Angular is fully loaded.
   */
  show(): void {
    this.isVisible.set(true);
    this.progress.set(20);
    this.message.set('Initializing application...');
  }

  /**
   * Hide the splash screen and signal the main process that the splash is complete.
   */
  async hide(): Promise<void> {
    this.isVisible.set(false);

    document.body.classList.add('angular-loaded');
    const staticSplash = document.getElementById('initial-splash');
    if (staticSplash) {
      staticSplash.style.display = 'none';
    }

    // Signal main process that splash is complete when hiding
    try {
      await appSplashComplete();
      console.log('Splash completion signaled to main process');
    } catch (error) {
      console.error('Failed to signal splash completion:', error);
    }
  }

  /**
   * Adjust the progress bar and status text in the splash screen. Elements are plain HTML in index.html
   * not Angular components, so we manipulate them directly. This should be shown before Angular is even laoded.
   * @param value 0-100
   * @param status Status text to display
   */
  private adjustProgress(value: number, status: string): void {
    const progressText: HTMLElement | null = document.getElementById('progress-text');
    if (progressText) {
      progressText.innerText = `${value}%`;
    }
    const progressBar: HTMLElement | null = document.getElementById('progress-bar');
    if (progressBar) {
      progressBar.style.width = `${value}%`;
    }

    const statusText: HTMLElement | null = document.getElementById('status-text');
    if (statusText) {
      statusText.innerText = status;
    }
  }
}
