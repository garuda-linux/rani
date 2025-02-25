import { AppComponent } from './app.component';

export async function globalKeyHandler(this: AppComponent, event: KeyboardEvent): Promise<void> {
  switch (event.key) {
    case 'F4':
      this.appService.terminalVisible.set(!this.appService.terminalVisible());
      break;
    case 'F5':
      this.appService.currentAction.set('Reloading');
      break;
    case 'F10':
      this.appService.drawerVisible.set(!this.appService.drawerVisible());
      break;
    case 'F11':
      await this.appWindow.toggleMaximize();
      break;
  }
}
