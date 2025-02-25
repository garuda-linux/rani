import { Component, inject, OnInit, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { AppService } from '../app.service';
import { debug } from '@tauri-apps/plugin-log';
import { SystemdServicesComponent } from '../systemd-services/systemd-services.component';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { TranslocoDirective } from '@jsverse/transloco';
import { SystemComponentsComponent } from '../system-components/system-components.component';
import { SystemSettingsComponent } from '../system-settings/system-settings.component';

@Component({
  selector: 'app-system-tools',
  imports: [
    TableModule,
    SystemdServicesComponent,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    TranslocoDirective,
    SystemComponentsComponent,
    SystemSettingsComponent,
  ],
  templateUrl: './system-tools.component.html',
  styleUrl: './system-tools.component.css',
})
export class SystemToolsComponent implements OnInit {
  tabIndex = signal<number>(0);

  private readonly appService = inject(AppService);

  async ngOnInit() {
    void debug('Initializing system tools');

    void debug('System tools initialized');
  }
}
