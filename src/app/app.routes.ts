import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { SystemToolsComponent } from './system-tools/system-tools.component';
import { GamingComponent } from './gaming/gaming.component';
import { BootToolsComponent } from './boot-tools/boot-tools.component';
import { DiagnosticsComponent } from './diagnostics/diagnostics.component';
import { SettingsComponent } from './settings/settings.component';

export const routes: Routes = [
  {
    title: 'Garuda Linux',
    path: '',
    component: HomeComponent,
  },
  {
    title: 'Maintenance',
    path: 'maintenance',
    component: MaintenanceComponent,
  },
  {
    title: 'System tools',
    path: 'system-tools',
    component: SystemToolsComponent,
  },
  {
    title: 'Gaming apps',
    path: 'gaming',
    component: GamingComponent,
  },
  {
    title: 'Boot options/repair',
    path: 'boot-tools',
    component: BootToolsComponent,
  },
  {
    title: 'Diagnostics',
    path: 'diagnostics',
    component: DiagnosticsComponent,
  },
  {
    title: 'Settings',
    path: 'settings',
    component: SettingsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
