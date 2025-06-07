// Modules Registry - Ensures all services and components are properly detected by Angular's tree-shaking
// This file explicitly imports all modules to ensure they're included in the dependency graph

// Services
import { PackagesService } from './components/packages/packages.service';
import { NotificationService } from './components/notification/notification.service';
import { TaskManagerService } from './components/task-manager/task-manager.service';
import { OsInteractService } from './components/task-manager/os-interact.service';
import { SystemStatusService } from './components/system-status/system-status.service';
import { KernelsService } from './components/kernels/kernels.service';
import { LanguagePacksService } from './components/language-packs/language-packs.service';
import { LocalesService } from './components/locales/locales.service';
import { GamingService } from './components/gaming/gaming.service';
import { LoadingService } from './components/loading-indicator/loading-indicator.service';
import { ConfigService } from './components/config/config.service';
import { LanguageManagerService } from './components/language-manager/language-manager.service';
import { ThemeService } from './components/theme-service/theme-service';

// Components
import { HomeComponent } from './components/home/home.component';
import { MaintenanceComponent } from './components/maintenance/maintenance.component';
import { SystemToolsComponent } from './components/system-tools/system-tools.component';
import { GamingComponent } from './components/gaming/gaming.component';
import { DiagnosticsComponent } from './components/diagnostics/diagnostics.component';
import { SettingsComponent } from './components/settings/settings.component';
import { PackagesComponent } from './components/packages/packages.component';
import { SystemComponentsComponent } from './components/system-components/system-components.component';
import { SystemSettingsComponent } from './components/system-settings/system-settings.component';
import { SystemStatusComponent } from './components/system-status/system-status.component';
import { SystemdServicesComponent } from './components/systemd-services/systemd-services.component';
import { TerminalComponent } from './components/terminal/terminal.component';
import { OperationManagerComponent } from './components/operation-manager/operation-manager.component';

// Electron Services
import './components/electron-services';

// Utilities and Types
import './components/logging/logging';
import './components/logging/interfaces';
import './theme';
import './transloco-loader';
import './types/shell';
import './components/privatebin/types';
import './components/privatebin/api';
import './components/privatebin/crypto';
import './components/privatebin/privatebin';

// Shell Components
import { ShellComponent } from './components/shell';
import { ShellBarStartDirective } from './components/shell';
import { ShellBarEndDirective } from './components/shell';
import { ShellBarLinkDirective } from './components/shell';

// Registry of all modules for tree-shaking optimization
export const MODULES_REGISTRY = {
  // Services
  services: [
    PackagesService,
    NotificationService,
    TaskManagerService,
    OsInteractService,
    SystemStatusService,
    KernelsService,
    LanguagePacksService,
    LocalesService,
    GamingService,
    LoadingService,
    ConfigService,
    LanguageManagerService,
    ThemeService,
  ],

  // Components
  components: [
    HomeComponent,
    MaintenanceComponent,
    SystemToolsComponent,
    GamingComponent,
    DiagnosticsComponent,
    SettingsComponent,
    PackagesComponent,
    SystemComponentsComponent,
    SystemSettingsComponent,
    SystemStatusComponent,
    SystemdServicesComponent,
    TerminalComponent,
    OperationManagerComponent,
    ShellComponent,
  ],

  // Directives
  directives: [ShellBarStartDirective, ShellBarEndDirective, ShellBarLinkDirective],
};

// Ensure all modules are registered
export function registerModules(): void {
  // This function ensures all imports are evaluated
  console.debug('Modules registry loaded:', {
    services: MODULES_REGISTRY.services.length,
    components: MODULES_REGISTRY.components.length,
    directives: MODULES_REGISTRY.directives.length,
  });
}
