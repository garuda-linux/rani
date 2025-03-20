import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { SystemdServicesComponent } from '../systemd-services/systemd-services.component';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { TranslocoDirective } from '@jsverse/transloco';
import { SystemSettingsComponent } from '../system-settings/system-settings.component';
import { SystemComponentsComponent } from '../system-components/system-components.component';
import { PackagesComponent } from '../packages/packages.component';
import { KernelsComponent } from '../kernels/kernels.component';
import { LanguagePacksComponent } from '../language-packs/language-packs.component';

@Component({
  selector: 'rani-system-tools',
  imports: [
    TableModule,
    SystemdServicesComponent,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    TranslocoDirective,
    SystemSettingsComponent,
    SystemComponentsComponent,
    PackagesComponent,
    KernelsComponent,
    LanguagePacksComponent,
  ],
  templateUrl: './system-tools.component.html',
  styleUrl: './system-tools.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemToolsComponent {
  tabIndex = signal<number>(0);
}
