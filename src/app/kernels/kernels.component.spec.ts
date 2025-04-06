import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KernelsComponent } from './kernels.component';
import type { DkmsModules, Kernel } from './types';
import { TaskManagerService } from '../task-manager/task-manager.service';
import { OsInteractService } from '../task-manager/os-interact.service';
import { ConfigService } from '../config/config.service';
import { KernelsService } from './kernels.service';
import { TranslocoService } from '@jsverse/transloco';

const mockKernelsService = {
  kernels: vi.fn(),
  dkmsModules: vi.fn(),
};

const mockOsInteractService = {
  togglePackage: vi.fn(),
};

const mockTaskManagerService = {
  createTask: vi.fn(),
  scheduleTask: vi.fn(),
};

const mockTranslocoService = {
  translate: vi.fn((key: string) => key),
};

const mockConfigService = {
  getConfig: vi.fn(() => ({
    system: {
      kernel: {
        dkms: true,
      },
    },
  })),
};

const sampleKernels: Kernel[] = [
  {
    pkgname: ['linux', 'linux-headers'],
    version: '6.14.0-4-cachyos',
    description: 'The CachyOS Linux kernel',
    selected: true,
    headersSelected: true,
    initialState: true,
    dkmsModulesMissing: [],
    repo: '',
  },
  {
    pkgname: ['linux-lts', 'linux-lts-headers'],
    version: '6.12.9-1-cachyos',
    description: 'The CachyOS LTS Linux kernel',
    selected: true,
    headersSelected: false,
    initialState: true,
    dkmsModulesMissing: [],
    repo: '',
  },
  {
    pkgname: ['linux-zen', 'linux-zen-headers'],
    version: '6.13.8.zen1-1',
    description: 'The Zen Linux kernel',
    selected: false,
    headersSelected: false,
    initialState: false,
    dkmsModulesMissing: [],
    repo: '',
  },
];

const sampleDkmsModules: DkmsModules = [
  {
    moduleName: 'acpi_call',
    moduleVersion: '1.2.2',
    kernelVersion: '6.14.0-4-cachyos',

    status: 'installed',
  },
  {
    moduleName: 'vboxhost',
    moduleVersion: '7.1.6_OSE',
    kernelVersion: '6.12.9-1-cachyos',

    status: 'broken',
  },
  {
    moduleName: 'vboxhost',
    moduleVersion: '7.1.6_OSE',
    kernelVersion: '6.14.0-4-cachyos',
    status: 'installed',
  },
  {
    moduleName: 'acpi_call',
    moduleVersion: '1.2.2',
    kernelVersion: '',
    status: 'installed',
  },
];

describe('KernelsComponent', () => {
  let component: KernelsComponent;
  let fixture: ComponentFixture<KernelsComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetAllMocks();

    await TestBed.configureTestingModule({
      imports: [KernelsComponent],
      providers: [
        { provide: KernelsService, useValue: mockKernelsService },
        { provide: OsInteractService, useValue: mockOsInteractService },
        { provide: TaskManagerService, useValue: mockTaskManagerService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: TranslocoService, useValue: mockTranslocoService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KernelsComponent);
    component = fixture.componentInstance;

    mockKernelsService.kernels.mockReturnValue([...sampleKernels]);
    mockKernelsService.dkmsModules.mockReturnValue([...sampleDkmsModules]);
    mockTaskManagerService.createTask.mockImplementation((p, n, s, t, i, c) => ({
      priority: p,
      name: n,
      silent: s,
      translation: t,
      icon: i,
      command: c,
      status: 'pending',
      output: [],
      isRunning: false,
      ran: false,
      error: false,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('togglePackage should toggle both packages if initially installed and selected=false, headersSelected=true', () => {
    const kernelToToggle: Kernel = { ...sampleKernels[0], selected: false, headersSelected: true, initialState: true };
    component.togglePackage(kernelToToggle);
    expect(mockOsInteractService.togglePackage).toHaveBeenCalledTimes(2);
    expect(mockOsInteractService.togglePackage).toHaveBeenCalledWith(kernelToToggle.pkgname[0]);
    expect(mockOsInteractService.togglePackage).toHaveBeenCalledWith(kernelToToggle.pkgname[1]);
  });

  it('togglePackage should toggle only base package if initially installed kernel without headers is deselected', () => {
    const kernelToToggle: Kernel = { ...sampleKernels[1], selected: false, headersSelected: false, initialState: true };
    component.togglePackage(kernelToToggle);
    expect(mockOsInteractService.togglePackage).toHaveBeenCalledTimes(1);
    expect(mockOsInteractService.togglePackage).toHaveBeenCalledWith(kernelToToggle.pkgname[0]);
  });

  it('togglePackage should toggle both packages if not initially installed', () => {
    const kernelToToggle: Kernel = { ...sampleKernels[2], selected: true, initialState: false };
    component.togglePackage(kernelToToggle);
    expect(mockOsInteractService.togglePackage).toHaveBeenCalledTimes(2);
    expect(mockOsInteractService.togglePackage).toHaveBeenCalledWith(kernelToToggle.pkgname[0]);
    expect(mockOsInteractService.togglePackage).toHaveBeenCalledWith(kernelToToggle.pkgname[1]);
  });

  it('togglePackage should toggle both packages if initially installed and selected=true', () => {
    const kernelToToggle: Kernel = { ...sampleKernels[0], selected: true, initialState: true };
    component.togglePackage(kernelToToggle);
    expect(mockOsInteractService.togglePackage).toHaveBeenCalledTimes(2);
    expect(mockOsInteractService.togglePackage).toHaveBeenCalledWith(kernelToToggle.pkgname[0]);
    expect(mockOsInteractService.togglePackage).toHaveBeenCalledWith(kernelToToggle.pkgname[1]);
  });

  it('installMissingHeaders(true) should toggle headers for selected kernels missing them', () => {
    mockKernelsService.kernels.mockReturnValue([...sampleKernels]);
    component.installMissingHeaders(true);
    expect(mockOsInteractService.togglePackage).toHaveBeenCalledTimes(1);
    expect(mockOsInteractService.togglePackage).toHaveBeenCalledWith(sampleKernels[1].pkgname[1]);
  });

  it('installMissingHeaders(true) should not toggle headers if none are missing', () => {
    const kernelsAllHeaders: Kernel[] = [{ ...sampleKernels[0], selected: true, headersSelected: true }];
    mockKernelsService.kernels.mockReturnValue(kernelsAllHeaders);

    component.installMissingHeaders(true);
    expect(mockOsInteractService.togglePackage).not.toHaveBeenCalled();
  });

  it('installMissingHeaders(kernel) should toggle headers for the specific kernel', () => {
    const kernelToInstallHeaders: Kernel = sampleKernels[1];
    component.installMissingHeaders(kernelToInstallHeaders);
    expect(mockOsInteractService.togglePackage).toHaveBeenCalledTimes(1);
    expect(mockOsInteractService.togglePackage).toHaveBeenCalledWith(kernelToInstallHeaders.pkgname[1]);
  });

  it('reinstallDkmsModules(true, "broken") should create task to reinstall all broken modules', () => {
    mockKernelsService.kernels.mockReturnValue([...sampleKernels]);
    mockKernelsService.dkmsModules.mockReturnValue([...sampleDkmsModules]);
    const expectedCmd = `dkms install --no-depmod ${sampleDkmsModules[1].moduleName}/${sampleDkmsModules[1].moduleVersion} -k ${sampleDkmsModules[1].kernelVersion}; `;
    component.reinstallDkmsModules(true, 'broken');

    expect(mockTaskManagerService.createTask).toHaveBeenCalledWith(
      10,
      'reinstallDkmsModules',
      true,
      'maintenance.reinstallDkmsModules',
      'pi pi-cog',
      expectedCmd,
    );
    expect(mockTaskManagerService.scheduleTask).toHaveBeenCalledOnce();
  });

  it('reinstallDkmsModules(true, "missing") should create task to install missing modules for selected kernels', () => {
    const kernelsForTest: Kernel[] = [
      { ...sampleKernels[0], dkmsModulesMissing: ['acpi_call'] },
      { ...sampleKernels[1] },
      { ...sampleKernels[2], dkmsModulesMissing: ['acpi_call'] },
    ];

    mockKernelsService.kernels.mockReturnValue(kernelsForTest);
    mockKernelsService.dkmsModules.mockReturnValue([...sampleDkmsModules]);

    const acpiModule = sampleDkmsModules.find((m) => m.moduleName === 'acpi_call' && m.kernelVersion !== '');
    const zenModule = sampleDkmsModules.find((m) => m.moduleName === 'acpi_call' && m.kernelVersion === '');

    const expectedCmd = `dkms install --no-depmod ${acpiModule?.moduleName}/${acpiModule?.moduleVersion} -k ${kernelsForTest[0].version}; dkms install --no-depmod ${acpiModule?.moduleName}/${acpiModule?.moduleVersion} -k ${kernelsForTest[2].version}-zen; `;

    component.reinstallDkmsModules(true, 'missing');

    expect(mockTaskManagerService.createTask).toHaveBeenCalledWith(
      10,
      'reinstallDkmsModules',
      true,
      'maintenance.reinstallDkmsModules',
      'pi pi-cog',
      expectedCmd,
    );
    expect(mockTaskManagerService.scheduleTask).toHaveBeenCalledOnce();
  });

  it('reinstallDkmsModules(kernel, "broken") should create task for specific kernel\'s broken modules', () => {
    const kernelWithBroken: Kernel = sampleKernels[1];
    const brokenModuleDefinition = sampleDkmsModules[1];

    const dummyModulesForTest: DkmsModules = [
      ...sampleDkmsModules,
      { moduleName: 'linux-lts', moduleVersion: 'dummy', kernelVersion: '6.12.9-1-cachyos', status: 'broken' },
    ];

    mockKernelsService.dkmsModules.mockReturnValue(dummyModulesForTest);
    mockKernelsService.kernels.mockReturnValue([...sampleKernels]);

    const foundDummyModule = dummyModulesForTest[dummyModulesForTest.length - 1];
    const expectedCmd = `dkms install --no-depmod ${foundDummyModule.moduleName}/${foundDummyModule.moduleVersion} -k ${foundDummyModule.kernelVersion}; `;

    component.reinstallDkmsModules(kernelWithBroken, 'broken');

    expect(mockTaskManagerService.createTask).toHaveBeenCalledWith(
      10,
      'reinstallDkmsModules',
      true,
      'maintenance.reinstallDkmsModules',
      'pi pi-cog',
      expectedCmd,
    );
    expect(mockTaskManagerService.scheduleTask).toHaveBeenCalledOnce();
  });

  it('reinstallDkmsModules(kernel, "missing") should create task for specific kernel\'s missing modules (standard linux)', () => {
    const kernelWithMissing: Kernel = {
      ...sampleKernels[0],
      dkmsModulesMissing: ['vboxhost'],
      version: '6.14.0',
    };

    mockKernelsService.kernels.mockReturnValue([{ ...kernelWithMissing }]);
    mockKernelsService.dkmsModules.mockReturnValue([...sampleDkmsModules]);

    const moduleObject =
      sampleDkmsModules.find(
        (m) => m.moduleName === 'vboxhost' && m.kernelVersion.startsWith(kernelWithMissing.version),
      ) ?? sampleDkmsModules.find((m) => m.moduleName === 'vboxhost' && m.kernelVersion === '');

    const expectedCmd = `dkms install --no-depmod ${moduleObject?.moduleName}/${moduleObject?.moduleVersion} -k ${kernelWithMissing.version}; `;

    component.reinstallDkmsModules(kernelWithMissing, 'missing');

    expect(mockTaskManagerService.createTask).toHaveBeenCalledWith(
      10,
      'reinstallDkmsModules',
      true,
      'maintenance.reinstallDkmsModules',
      'pi pi-cog',
      expectedCmd,
    );
    expect(mockTaskManagerService.scheduleTask).toHaveBeenCalledOnce();
  });

  it('reinstallDkmsModules(kernel, "missing") should create task for specific kernel\'s missing modules (non-linux)', () => {
    const kernelWithMissing: Kernel = {
      ...sampleKernels[2],
      dkmsModulesMissing: ['acpi_call'],
      version: '6.13.8',
    };
    const missingModuleName = 'acpi_call';
    const moduleObject = sampleDkmsModules.find((m) => m.moduleName === missingModuleName && m.kernelVersion === '');
    const expectedCmd = `dkms install --no-depmod ${moduleObject?.moduleName}/${moduleObject?.moduleVersion} -k ${kernelWithMissing.version}-zen; `;

    mockKernelsService.kernels.mockReturnValue([{ ...kernelWithMissing }]);
    mockKernelsService.dkmsModules.mockReturnValue([...sampleDkmsModules]);

    component.reinstallDkmsModules(kernelWithMissing, 'missing');

    expect(mockTaskManagerService.createTask).toHaveBeenCalledWith(
      10,
      'reinstallDkmsModules',
      true,
      'maintenance.reinstallDkmsModules',
      'pi pi-cog',
      expectedCmd,
    );
    expect(mockTaskManagerService.scheduleTask).toHaveBeenCalledOnce();
  });

  it('reinstallDkmsModules should handle missing module object gracefully when installing missing', () => {
    const kernelWithMissing: Kernel = { ...sampleKernels[0], dkmsModulesMissing: ['non-existent-module'] };
    mockKernelsService.kernels.mockReturnValue([{ ...kernelWithMissing }]);
    mockKernelsService.dkmsModules.mockReturnValue([...sampleDkmsModules]);

    component.reinstallDkmsModules(kernelWithMissing, 'missing');

    expect(mockTaskManagerService.createTask).toHaveBeenCalledWith(
      10,
      'reinstallDkmsModules',
      true,
      'maintenance.reinstallDkmsModules',
      'pi pi-cog',
      '',
    );
    expect(mockTaskManagerService.scheduleTask).toHaveBeenCalledOnce();
  });

  it('counterArray should return an array of the specified length', () => {
    const length = 5;
    const result = component.counterArray(length);
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(length);
  });

  it('counterArray should return an empty array for length 0', () => {
    const length = 0;
    const result = component.counterArray(length);
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(length);
  });
});
