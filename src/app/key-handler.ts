import type { AppComponent } from './app.component';
import { open } from '@tauri-apps/plugin-shell';

export async function globalKeyHandler(this: AppComponent, event: KeyboardEvent): Promise<void> {
  switch (event.key) {
    case 'F1':
      void open('https://forum.garudalinux.org', '_blank');
      break;
    case 'F4':
      this.terminalComponent.visible.set(!this.terminalComponent.visible());
      break;
    case 'F11':
      await this.appWindow.toggleMaximize();
      break;
  }
}
