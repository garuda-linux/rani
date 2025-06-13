import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { MaintenanceComponent } from './components/maintenance/maintenance.component';
import { SystemToolsComponent } from './components/system-tools/system-tools.component';
import { GamingComponent } from './components/gaming/gaming.component';
import { DiagnosticsComponent } from './components/diagnostics/diagnostics.component';
import { SettingsComponent } from './components/settings/settings.component';

export const routes: Routes = [
  {
    title: 'Garuda Rani',
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
