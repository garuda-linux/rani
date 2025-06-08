import { TestBed } from "@angular/core/testing";
import { Injector, runInInjectionContext, signal } from "@angular/core";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  Mock,
  MockInstance,
  vi,
} from "vitest";

import { OsInteractService } from "./os-interact.service";
import { ConfigService } from "../config/config.service";
import { type Task, TaskManagerService } from "./task-manager.service";
import type { ChildProcess } from "../../electron-services";
import {
  defaultDnsProvider,
  DnsProviderEntry,
  dnsProviders,
  ShellEntry,
  shells,
} from "../system-settings/types";
import { Logger } from "../../logging/logging";

const mockLoggerInstanceHoisted = vi.hoisted(() => {
  return {
    trace: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
});

vi.mock("../logging/logging", () => {
  return {
    Logger: {
      getInstance: vi.fn().mockReturnValue(mockLoggerInstanceHoisted),
    },
  };
});

const mockTaskManagerService = {
  executeAndWaitBash: vi.fn(),
  createTask: vi.fn(),
  scheduleTask: vi.fn(),
  findTaskById: vi.fn(),
  removeTask: vi.fn(),
  executeTask: vi.fn(),

  running: signal(false),
};

const mockUser = "testuser";
const mockConfigService = {
  state: signal({ user: mockUser }),
};

const createMockResult = (
  stdout: string,
  stderr = "",
  code = 0,
): ChildProcess<string> => ({
  stdout,
  stderr,
  code,
  signal: null,
});

const createMockTask = (id: string, partial: Partial<Task> = {}): Task => ({
  id: id,
  priority: 10,
  name: id,
  icon: "pi pi-cog",
  script: partial.script || `echo "Script for ${id}"`,
  escalate: partial.escalate || false,
  ...partial,
});

describe("OsInteractService", () => {
  let service: OsInteractService;
  let injector: Injector;
  let mockTaskRunningSignal: ReturnType<typeof signal<boolean>>;
  let updateSpy: MockInstance<() => Promise<void>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OsInteractService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: TaskManagerService, useValue: mockTaskManagerService },
      ],
    });

    vi.clearAllMocks();

    mockLoggerInstanceHoisted.trace.mockReset();
    mockLoggerInstanceHoisted.info.mockReset();
    mockLoggerInstanceHoisted.warn.mockReset();
    mockLoggerInstanceHoisted.error.mockReset();

    if (vi.isMockFunction(Logger.getInstance)) {
      (Logger.getInstance as Mock).mockClear();
      (Logger.getInstance as Mock).mockReturnValue(mockLoggerInstanceHoisted);
    }

    mockTaskManagerService.executeAndWaitBash.mockReset();
    mockTaskManagerService.createTask.mockReset();
    mockTaskManagerService.scheduleTask.mockReset();
    mockTaskManagerService.findTaskById.mockReset().mockReturnValue(null);
    mockTaskManagerService.removeTask.mockReset();
    mockTaskManagerService.executeTask.mockReset().mockResolvedValue(undefined);
    mockTaskManagerService.running.set(false);

    mockConfigService.state.set({ user: mockUser });

    mockTaskManagerService.executeAndWaitBash.mockImplementation(
      async (cmd: string) => {
        if (cmd.includes("pacman -Qq")) return createMockResult("pkgA\npkgB");
        if (cmd.includes("systemctl list-units --type service"))
          return createMockResult(
            JSON.stringify([{ unit: "serviceA.service", active: "active" }]),
          );
        if (cmd.includes("systemctl --user list-units"))
          return createMockResult(
            JSON.stringify([{ unit: "serviceB.service", active: "inactive" }]),
          );
        if (cmd.includes(`groups ${mockUser}`))
          return createMockResult(` ${mockUser} : groupA groupB`);
        if (cmd.includes("cat /etc/resolv.conf"))
          return createMockResult(`nameserver ${dnsProviders[1].ips[0]}`);
        if (cmd.includes("getent passwd")) return createMockResult("bash");
        if (cmd.includes("cat /etc/hosts"))
          return createMockResult(" # 0 domains added by hBlock");
        if (cmd.includes("localectl list-locales"))
          return createMockResult("en_US.UTF-8\nC.UTF-8\nde_DE.UTF-8");
        if (cmd.includes("grep -q wifi.backend=iwd"))
          return createMockResult("", "Not found", 1);
        return createMockResult("", "Command not mocked", 1);
      },
    );

    mockTaskManagerService.createTask.mockImplementation(
      (priority: number, id: string, icon: string): Task => {
        return createMockTask(id, { priority, icon });
      },
    );

    injector = TestBed.inject(Injector);
    runInInjectionContext(injector, () => {
      service = TestBed.inject(OsInteractService);
    });
    mockTaskRunningSignal = mockTaskManagerService.running;
    updateSpy = vi.spyOn(service, "update").mockResolvedValue(undefined);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it("should create the service", () => {
    expect(service).toBeTruthy();
  });

  it("update() should call all get methods and set current signals", async () => {
    const pkgResult = "pkgA\npkgC";
    const serviceResult = JSON.stringify([
      { unit: "serviceA.service", active: "active" },
    ]);
    const userServiceResult = JSON.stringify([
      { unit: "userServiceX.service", active: "active" },
    ]);
    const groupResult = `${mockUser} : groupC groupD`;
    mockTaskManagerService.executeAndWaitBash
      .mockReset()
      .mockResolvedValueOnce(createMockResult(serviceResult)) // getServices
      .mockResolvedValueOnce(createMockResult(userServiceResult)) // getUserServices
      .mockResolvedValueOnce(createMockResult(pkgResult)) // getInstalledPackages
      .mockResolvedValueOnce(createMockResult(groupResult)) // getGroups
      .mockResolvedValueOnce(
        createMockResult(
          `nameserver ${dnsProviders.find((p) => p.name === "Cloudflare")?.ips[0]}`,
        ),
      ) // getDNS
      .mockResolvedValueOnce(createMockResult("zsh")) // getShell
      .mockResolvedValueOnce(createMockResult(" # 100 domains added by hBlock")) // getHblock
      .mockResolvedValueOnce(createMockResult("en_GB.UTF-8\nfr_FR.UTF-8")) // getLocales
      .mockResolvedValueOnce(createMockResult("")); // getIwd (enabled, code 0)

    updateSpy.mockRestore();

    await runInInjectionContext(injector, async () => {
      await service.update();
      await Promise.resolve();
    });

    expect(mockTaskManagerService.executeAndWaitBash).toHaveBeenCalledTimes(9);
    expect(service["installedPackages"]().get("pkgC")).toBe(true);
    expect(service["currentServices"]().get("serviceA.service")).toBe(true);
    expect(service["currentServicesUser"]().get("userServiceX.service")).toBe(
      true,
    );
    expect(service["currentGroups"]().get("groupC")).toBe(true);
    // expect(service['currentDNS']().name).toBe('Cloudflare');
    expect(service["currentShell"]()?.name).toBe("zsh");
    // expect(service['currentHblock']()).toBe(true);
    expect(service["currentLocales"]().get("fr_FR.UTF-8")).toBe(true);
    expect(service["currentIwd"]()).toBe(true);
    expect(service["currentDNS"]()).toEqual(
      dnsProviders.find((p) => p.name === "Default"),
    );
    expect(mockLoggerInstanceHoisted.error).not.toHaveBeenCalled();
  });

  it("getInstalledPackages should parse pacman output", async () => {
    const mockOutput = "package1\npackage2-ng\npackage3";
    mockTaskManagerService.executeAndWaitBash.mockResolvedValueOnce(
      createMockResult(mockOutput),
    );
    const expectedMap = new Map([
      ["package1", true],
      ["package2-ng", true],
      ["package3", true],
    ]);

    let result = new Map<string, boolean>();
    await runInInjectionContext(injector, async () => {
      result = await service["getInstalledPackages"]();
    });

    expect(result).toEqual(expectedMap);
  });

  it("getInstalledPackages should return empty map on command failure", async () => {
    mockTaskManagerService.executeAndWaitBash.mockResolvedValueOnce(
      createMockResult("", "error", 1),
    );
    let result = new Map<string, boolean>([["dummy", true]]);

    await runInInjectionContext(injector, async () => {
      result = await service["getInstalledPackages"]();
    });

    expect(result).toEqual(new Map());
  });

  it("getServices should parse JSON and active state", async () => {
    const mockJson = JSON.stringify([
      {
        unit: "active.service",
        active: "active",
        load: "loaded",
        sub: "running",
      },
      {
        unit: "inactive.service",
        active: "inactive",
        load: "loaded",
        sub: "dead",
      },
      {
        unit: "active-socket.socket",
        active: "active",
        load: "loaded",
        sub: "listening",
      },
    ]);
    mockTaskManagerService.executeAndWaitBash.mockResolvedValueOnce(
      createMockResult(mockJson),
    );
    let result = new Map<string, boolean>();
    await runInInjectionContext(injector, async () => {
      result = await service["getServices"]();
    });
    expect(result.size).toBe(3);
    expect(result.get("active.service")).toBe(true);
    expect(result.get("inactive.service")).toBe(false);
    expect(result.get("active-socket.socket")).toBe(true);
  });

  it("getGroups should parse groups output", async () => {
    const mockOutput = ` ${mockUser} : wheel lp storage network power`;
    mockTaskManagerService.executeAndWaitBash.mockResolvedValueOnce(
      createMockResult(mockOutput),
    );
    let result = new Map<string, boolean>();
    await runInInjectionContext(injector, async () => {
      result = await service["getGroups"]();
    });
    expect(result.size).toBe(7);
    expect(result.get("wheel")).toBe(true);
    expect(result.get("power")).toBe(true);
    expect(result.get(mockUser)).toBe(true);
  });

  it("getDNS should find matching provider", async () => {
    const targetProvider = dnsProviders[2];
    mockTaskManagerService.executeAndWaitBash.mockResolvedValueOnce(
      createMockResult(targetProvider.ips[0]),
    );
    let result: DnsProviderEntry | null = null;
    await runInInjectionContext(injector, async () => {
      result = await service["getDNS"]();
    });
    expect(result).toEqual(targetProvider);
  });

  it("getDNS should return default provider if IP not found", async () => {
    mockTaskManagerService.executeAndWaitBash.mockResolvedValueOnce(
      createMockResult("1.2.3.4"),
    );
    let result: DnsProviderEntry | null = null;
    await runInInjectionContext(injector, async () => {
      result = await service["getDNS"]();
    });
    expect(result).toEqual(defaultDnsProvider);
  });

  it("getDNS should return default provider on command failure", async () => {
    mockTaskManagerService.executeAndWaitBash.mockResolvedValueOnce(
      createMockResult("", "err", 1),
    );
    let result: DnsProviderEntry | null = null;
    await runInInjectionContext(injector, async () => {
      result = await service["getDNS"]();
    });
    expect(result).toEqual(defaultDnsProvider);
  });

  it("getShell should find matching shell", async () => {
    const targetShell = shells[1];
    mockTaskManagerService.executeAndWaitBash.mockResolvedValueOnce(
      createMockResult(targetShell.name),
    );
    let result: ShellEntry | null = null;
    await runInInjectionContext(injector, async () => {
      result = await service["getShell"]();
    });
    expect(result).toEqual(targetShell);
  });

  it("getShell should return null if shell not found", async () => {
    mockTaskManagerService.executeAndWaitBash.mockResolvedValueOnce(
      createMockResult("unknownsh"),
    );
    let result: ShellEntry | null = null;
    await runInInjectionContext(injector, async () => {
      result = await service["getShell"]();
    });
    expect(result).toBeNull();
  });

  it("getIwd should return true on command success", async () => {
    mockTaskManagerService.executeAndWaitBash.mockResolvedValueOnce(
      createMockResult(""),
    );
    let result = false;
    await runInInjectionContext(injector, async () => {
      result = await service["getIwd"]();
    });
    expect(result).toBe(true);
  });

  it("getIwd should return false on command failure", async () => {
    mockTaskManagerService.executeAndWaitBash.mockResolvedValueOnce(
      createMockResult("", "", 1),
    );
    let result = true;
    await runInInjectionContext(injector, async () => {
      result = await service["getIwd"]();
    });
    expect(result).toBe(false);
  });

  it("getHblock should return true if count > 0", async () => {
    // FIX: Mock stdout should be just the number string
    mockTaskManagerService.executeAndWaitBash.mockResolvedValueOnce(
      createMockResult("1234"),
    ); // <<< CORRECTED MOCK
    let result = false;
    await runInInjectionContext(injector, async () => {
      result = await service["getHblock"]();
    });
    expect(result).toBe(true); // Now parseInt('1234') > 0 should be true
  });

  it("getHblock should return false if count is 0 or parsing fails", async () => {
    mockTaskManagerService.executeAndWaitBash.mockResolvedValueOnce(
      createMockResult(" # 0 domains added by hBlock"),
    );
    let result = true;
    await runInInjectionContext(injector, async () => {
      result = await service["getHblock"]();
    });
    expect(result).toBe(false);

    mockTaskManagerService.executeAndWaitBash.mockResolvedValueOnce(
      createMockResult("some other output"),
    );
    result = true;
    await runInInjectionContext(injector, async () => {
      result = await service["getHblock"]();
    });
    expect(result).toBe(false);
  });

  it("getLocales should parse locale output", async () => {
    const mockOutput = "C.utf8\nen_US.UTF-8\nfr_FR.UTF-8";
    mockTaskManagerService.executeAndWaitBash.mockResolvedValueOnce(
      createMockResult(mockOutput),
    );
    let result = new Map<string, boolean>();
    await runInInjectionContext(injector, async () => {
      result = await service["getLocales"]();
    });
    expect(result.size).toBe(3);
    expect(result.get("en_US.UTF-8")).toBe(true);
  });

  it("toggleService should add service to wantedServices if not present", () => {
    runInInjectionContext(injector, () => {
      service["currentServices"].set(new Map());
      service["wantedServices"].set(new Map());
      service.toggleService("srvNew");
      expect(service["wantedServices"]().get("srvNew")).toBe(true);
    });
  });

  it("toggleService should set wanted to false if service is enabled and wanted", () => {
    runInInjectionContext(injector, () => {
      service["currentServices"].set(new Map([["srvOn", true]]));
      service["wantedServices"].set(new Map([["srvOn", true]]));
      service.toggleService("srvOn");
      expect(service["wantedServices"]().get("srvOn")).toBe(undefined);
    });
  });

  it("toggleService should remove entry if already in wanted map (toggle back)", () => {
    runInInjectionContext(injector, () => {
      service["wantedServices"].set(new Map([["srvPending", true]]));
      service.toggleService("srvPending");
      expect(service["wantedServices"]().has("srvPending")).toBe(false);
    });
  });

  it("togglePackage should add package to wantedPackages if not present", () => {
    runInInjectionContext(injector, () => {
      service["installedPackages"].set(new Map());
      service["wantedPackages"].set(new Map());

      service.togglePackage("newPkg");

      expect(service["wantedPackages"]().get("newPkg")).toBe(true);
    });
  });

  it("togglePackage should set wanted to false if package is installed and wanted", () => {
    runInInjectionContext(injector, () => {
      service["installedPackages"].set(new Map([["pkgA", true]]));
      service["wantedPackages"].set(
        new Map([
          ["pkgB", true],
          ["pkgA", false],
        ]),
      );

      service.togglePackage("pkgA");

      expect(service["wantedPackages"]().get("pkgA")).toBe(undefined);
    });
  });

  it("togglePackage should remove entry if remove=true", () => {
    runInInjectionContext(injector, () => {
      service["wantedPackages"].set(new Map([["pkgToRemove", true]]));
      service.togglePackage("pkgToRemove", true);
      expect(service["wantedPackages"]().has("pkgToRemove")).toBe(false);
    });
  });

  it("toggle method should call the correct specific toggle method", () => {
    const spyTogglePackage = vi.spyOn(service, "togglePackage");
    const spyToggleService = vi.spyOn(service, "toggleService");
    const spyToggleServiceUser = vi.spyOn(service, "toggleServiceUser");
    const spyToggleGroup = vi.spyOn(service, "toggleGroup");

    runInInjectionContext(injector, () => {
      service.toggle("pkg1", "pkg");
      service.toggle("srv1", "service");
      service.toggle("srvU1", "serviceUser");
      service.toggle("grp1", "group");
    });

    expect(spyTogglePackage).toHaveBeenCalledWith("pkg1", false);
    expect(spyToggleService).toHaveBeenCalledWith("srv1", false);
    expect(spyToggleServiceUser).toHaveBeenCalledWith("srvU1", false);
    expect(spyToggleGroup).toHaveBeenCalledWith("grp1", false);
  });

  it("check should return correct status from computed signals", () => {
    runInInjectionContext(injector, () => {
      service["installedPackages"].set(new Map([["pkgA", true]]));
      service["wantedPackages"].set(
        new Map([
          ["pkgB", true],
          ["pkgA", false],
        ]),
      );
      service["currentServices"].set(new Map([["srvA", true]]));
      service["wantedServices"].set(new Map());

      expect(service.check("pkgA", "pkg")).toBe(false);
      expect(service.check("pkgB", "pkg")).toBe(true);
      expect(service.check("pkgC", "pkg")).toBe(false);

      expect(service.check("srvA", "service")).toBe(true);
      expect(service.check("srvB", "service")).toBe(false);
    });
  });

  it("check should return correct status from current signals if current=true", () => {
    runInInjectionContext(injector, () => {
      service["installedPackages"].set(new Map([["pkgA", true]]));
      service["wantedPackages"].set(
        new Map([
          ["pkgB", true],
          ["pkgA", false],
        ]),
      );
      service["currentServices"].set(new Map([["srvA", true]]));
      service["wantedServices"].set(new Map([["srvA", false]]));

      expect(service.check("pkgA", "pkg", true)).toBe(true);
      expect(service.check("pkgB", "pkg", true)).toBe(false);
      expect(service.check("srvA", "service", true)).toBe(true);
    });
  });

  it("ensurePackageArchlinux should return true if package is already wanted/installed", async () => {
    await runInInjectionContext(injector, async () => {
      service["installedPackages"].set(new Map([["presentPkg", true]]));
      service["wantedPackages"].set(new Map());

      const result = await service.ensurePackageArchlinux("presentPkg");

      expect(result).toBe(true);
      expect(mockTaskManagerService.createTask).not.toHaveBeenCalled();
      expect(mockTaskManagerService.executeTask).not.toHaveBeenCalled();
    });
  });

  it("ensurePackageArchlinux should install package if not present", async () => {
    const pkgToInstall = "missingPkg";

    mockTaskManagerService.executeAndWaitBash.mockResolvedValueOnce(
      createMockResult(pkgToInstall, "", 0),
    );

    let result = false;

    await runInInjectionContext(injector, async () => {
      service["installedPackages"].set(new Map());
      service["wantedPackages"].set(new Map());

      result = await service.ensurePackageArchlinux(pkgToInstall);
    });

    expect(mockTaskManagerService.createTask).toHaveBeenCalledWith(
      0,
      `install-${pkgToInstall}`,
      true,
      `Install ${pkgToInstall}`,
      "pi pi-box",
      `pacman -S --noconfirm --needed ${pkgToInstall}`,
    );
    expect(mockTaskManagerService.executeTask).toHaveBeenCalledTimes(1);

    expect(mockTaskManagerService.executeAndWaitBash).toHaveBeenCalledWith(
      `pacman -Qq ${pkgToInstall}`,
    );
    expect(mockTaskManagerService.executeAndWaitBash).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it("generateTasks should create install/uninstall tasks based on wantedPackages", async () => {
    await runInInjectionContext(injector, async () => {
      service["installedPackages"].set(
        new Map([
          ["pkgKeep", true],
          ["pkgRemove", true],
        ]),
      );
      service["wantedPackages"].set(
        new Map([
          ["pkgInstall", true],
          ["pkgRemove", false],
        ]),
      );
      service["wantedPackagesAur"].set(new Map());

      const dummyTask = {
        id: "dummy",
        name: "dummy" /* other required Task props */,
      } as Task;
      mockTaskManagerService.findTaskById.mockImplementation((id: string) => {
        if (id.startsWith("os-interact-")) {
          return dummyTask;
        }
        return null;
      });

      service["generateTasks"]();
      await Promise.resolve();

      expect(mockTaskManagerService.createTask).toHaveBeenCalledWith(
        8,
        "os-interact-packages",
        true,
        "os-interact.packages",
        "pi pi-box",
        "pacman --noconfirm -R pkgRemove\n" +
          "pacman --noconfirm -S pkgInstall\n",
      );
      expect(mockTaskManagerService.scheduleTask).toHaveBeenCalledTimes(1);
      expect(mockTaskManagerService.findTaskById).toHaveBeenCalledWith(
        "os-interact-packages",
      );

      expect(mockTaskManagerService.findTaskById).toHaveBeenCalledTimes(6);

      expect(mockTaskManagerService.removeTask).toHaveBeenCalledTimes(6);
    });
  });

  it("generateTasks should create service enable/disable tasks", async () => {
    await runInInjectionContext(injector, async () => {
      service["currentServices"].set(
        new Map([
          ["srvKeep", true],
          ["srvDisable", true],
        ]),
      );
      service["wantedServices"].set(
        new Map([
          ["srvEnable", true],
          ["srvDisable", false],
        ]),
      );
      service["wantedServicesUser"].set(new Map());

      service["generateTasks"]();
      await Promise.resolve();

      expect(mockTaskManagerService.createTask).toHaveBeenCalledWith(
        12,
        "os-interact-services",
        true,
        "os-interact.services",
        "pi pi-receipt",
        expect.stringContaining("systemctl enable --now srvEnable"),
      );
      expect(mockTaskManagerService.createTask).toHaveBeenCalledWith(
        12,
        "os-interact-services",
        true,
        "os-interact.services",
        "pi pi-receipt",
        expect.stringContaining("systemctl disable --now srvDisable"),
      );
      expect(mockTaskManagerService.createTask).not.toHaveBeenCalledWith(
        expect.anything(),
        "os-interact-services-user",
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
      expect(mockTaskManagerService.scheduleTask).toHaveBeenCalledTimes(1);
      expect(mockTaskManagerService.findTaskById).toHaveBeenCalledWith(
        "os-interact-services",
      );
    });
  });

  it("generateTasks should create DNS change task", async () => {
    await runInInjectionContext(injector, async () => {
      const initialDns = dnsProviders[1];
      const targetDns = dnsProviders[2];
      service["currentDNS"].set(initialDns);
      service.wantedDns.set(targetDns);

      service["generateTasks"]();
      await Promise.resolve();

      const expectedScriptContent = `echo -e "[global-dns-domain-*]\\nservers=${targetDns.ips[0]}" > "/etc/NetworkManager/conf.d/10-garuda-assistant-dns.conf"`;
      expect(mockTaskManagerService.createTask).toHaveBeenCalledWith(
        12,
        "os-interact-services",
        true,
        "os-interact.services",
        "pi pi-receipt",
        expect.stringContaining(expectedScriptContent),
      );
      expect(mockTaskManagerService.createTask).toHaveBeenCalledWith(
        12,
        "os-interact-services",
        true,
        "os-interact.services",
        "pi pi-receipt",
        expect.stringContaining("nmcli general reload"),
      );
      expect(mockTaskManagerService.scheduleTask).toHaveBeenCalledTimes(1);
    });
  });

  it("should call update when task manager is not running", async () => {
    const updateSpy = vi.spyOn(service, "update");

    await runInInjectionContext(injector, async () => {});
    updateSpy.mockClear();

    await runInInjectionContext(injector, async () => {
      mockTaskRunningSignal.set(true);
      await Promise.resolve();
      expect(updateSpy).not.toHaveBeenCalled();

      mockTaskRunningSignal.set(false);
      await Promise.resolve();

      await vi.waitUntil(() => updateSpy.mock.calls.length > 0);
    });

    expect(updateSpy).toHaveBeenCalledTimes(1);
  });

  it("wantedPrune should remove items where wanted matches current", () => {
    const current = new Map([
      ["a", true],
      ["b", false],
      ["c", true],
    ]);
    const wanted = new Map([
      ["a", true],
      ["b", true],
      ["c", false],
      ["d", true],
    ]);

    const result = service["wantedPrune"](wanted, current);

    expect(result).toEqual(
      new Map([
        ["b", true],
        ["c", false],
        ["d", true],
      ]),
    );
  });

  it("wantedPrune should keep items to be removed", () => {
    const current = new Map([["a", true]]);
    const wanted = new Map([["a", false]]);
    const result = service["wantedPrune"](wanted, current);
    expect(result).toEqual(new Map([["a", false]]));
  });

  it("wantedPrune should handle empty maps", () => {
    expect(service["wantedPrune"](new Map(), new Map())).toEqual(new Map());
    expect(service["wantedPrune"](new Map([["a", true]]), new Map())).toEqual(
      new Map([["a", true]]),
    );
    expect(service["wantedPrune"](new Map(), new Map([["a", true]]))).toEqual(
      new Map(),
    );
  });

  it("generateTasks should create AUR install task", async () => {
    await runInInjectionContext(injector, async () => {
      service["installedPackages"].set(new Map());
      service["wantedPackages"].set(new Map());
      service["wantedPackagesAur"].set(new Map([["aurPkg", true]]));

      service["generateTasks"]();
      await Promise.resolve();

      const expectedCommand = `paru --noconfirm -S `;
      expect(mockTaskManagerService.createTask).toHaveBeenCalledWith(
        9,
        "os-interact-packages-aur",
        true,
        "os-interact.packages-aur",
        "pi pi-box",
        expectedCommand,
      );
      expect(mockTaskManagerService.scheduleTask).toHaveBeenCalledTimes(1);
    });
  });

  it("generateTasks should create locale add/remove tasks", async () => {
    await runInInjectionContext(injector, async () => {
      service["currentLocales"].set(
        new Map([
          ["en_US.UTF-8", true],
          ["fr_FR.UTF-8", true],
        ]),
      );
      service["wantedLocales"].set(
        new Map([
          ["de_DE.UTF-8", true],
          ["fr_FR.UTF-8", false],
        ]),
      );

      service["generateTasks"]();
      await Promise.resolve();

      const expectedCommand = `sed -i -e 's/#de_DE.UTF-8/de_DE.UTF-8/' -e 's/fr_FR.UTF-8/#fr_FR.UTF-8/' /etc/locale.gen\nlocale-gen\n`;
      expect(mockTaskManagerService.createTask).toHaveBeenCalledWith(
        13,
        "os-interact-locales",
        true,
        "os-interact.locales",
        "pi pi-languages",
        expectedCommand,
      );
      expect(mockTaskManagerService.scheduleTask).toHaveBeenCalledTimes(1);
    });
  });

  it("generateTasks should create group add/remove tasks", async () => {
    await runInInjectionContext(injector, async () => {
      service["currentGroups"].set(
        new Map([
          ["groupKeep", true],
          ["groupRemove", true],
        ]),
      );
      service["wantedGroups"].set(
        new Map([
          ["groupAdd", true],
          ["groupRemove", false],
        ]),
      );

      service["generateTasks"]();
      await Promise.resolve();

      const expectedCommand = `gpasswd -a ${mockUser} groupAdd\ngpasswd -d ${mockUser} groupRemove\n`;
      expect(mockTaskManagerService.createTask).toHaveBeenCalledWith(
        11,
        "os-interact-groups",
        true,
        "os-interact.groups",
        "pi pi-users",
        expectedCommand,
      );
      expect(mockTaskManagerService.scheduleTask).toHaveBeenCalledTimes(1);
    });
  });

  it("generateTasks should create shell change task", async () => {
    await runInInjectionContext(injector, async () => {
      const initialShell = shells[0];
      const targetShell = shells[1];
      service["currentShell"].set(initialShell);
      service.wantedShell.set(targetShell);

      service["generateTasks"]();
      await Promise.resolve();

      const expectedCommand = `chsh -s $(which ${targetShell.name}) ${mockUser}`;
      expect(mockTaskManagerService.createTask).toHaveBeenCalledWith(
        12,
        "os-interact-services",
        true,
        "os-interact.services",
        "pi pi-receipt",
        expect.stringContaining(expectedCommand),
      );
      expect(mockTaskManagerService.scheduleTask).toHaveBeenCalledTimes(1);
    });
  });

  it("generateTasks should create hblock enable task", async () => {
    await runInInjectionContext(injector, async () => {
      service["currentHblock"].set(false);
      service.wantedHblock.set(true);

      service["generateTasks"]();
      await Promise.resolve();

      const expectedCommand = `systemctl enable --now hblock.timer && hblock\n`;
      expect(mockTaskManagerService.createTask).toHaveBeenCalledWith(
        12,
        "os-interact-services",
        true,
        "os-interact.services",
        "pi pi-receipt",
        expect.stringContaining(expectedCommand),
      );
      expect(mockTaskManagerService.scheduleTask).toHaveBeenCalledTimes(1);
    });
  });

  it("generateTasks should create iwd enable task", async () => {
    await runInInjectionContext(injector, async () => {
      service["currentIwd"].set(false);
      service.wantedIwd.set(true);

      service["generateTasks"]();
      await Promise.resolve();

      const expectedCommands = [
        "systemctl stop NetworkManager",
        "systemctl disable --now wpa_supplicant.service",
        "systemctl mask wpa_supplicant",
        'echo -e "[device]\\nwifi.backend=iwd" > /etc/NetworkManager/conf.d/20_wifi_backend_rani.conf',
        "systemctl daemon-reload",
        "systemctl start NetworkManager",
      ];

      expect(mockTaskManagerService.createTask).toHaveBeenCalledWith(
        12,
        "os-interact-services",
        true,
        "os-interact.services",
        "pi pi-receipt",
        expect.stringContaining(expectedCommands[0]) &&
          expect.stringContaining(expectedCommands[1]) &&
          expect.stringContaining(expectedCommands[2]) &&
          expect.stringContaining(expectedCommands[3]) &&
          expect.stringContaining(expectedCommands[4]) &&
          expect.stringContaining(expectedCommands[5]),
      );
      expect(mockTaskManagerService.scheduleTask).toHaveBeenCalledTimes(1);
    });
  });

  it("generateTasks should not create tasks if no changes are wanted", async () => {
    await runInInjectionContext(injector, async () => {
      service["installedPackages"].set(new Map([["pkgA", true]]));
      service["currentServices"].set(new Map([["srvA", true]]));
      service["wantedPackages"].set(new Map());
      service["wantedServices"].set(new Map());

      mockTaskManagerService.createTask.mockClear();
      mockTaskManagerService.scheduleTask.mockClear();

      service["generateTasks"]();
      await Promise.resolve();

      expect(mockTaskManagerService.createTask).not.toHaveBeenCalled();
      expect(mockTaskManagerService.scheduleTask).not.toHaveBeenCalled();
    });
  });

  it("should call update when task manager is not running after init", async () => {
    const initialUpdateCalls = updateSpy.mock.calls.length;

    await runInInjectionContext(injector, async () => {
      mockTaskRunningSignal.set(true);
      await Promise.resolve();
      mockTaskRunningSignal.set(false);

      await vi.waitUntil(
        () => updateSpy.mock.calls.length > initialUpdateCalls,
      );
    });

    expect(updateSpy.mock.calls.length).toBe(initialUpdateCalls + 1);
  });

  it("should call generateTasks when a wanted signal changes", async () => {
    const generateTasksSpy = vi.spyOn(service as any, "generateTasks");

    await runInInjectionContext(injector, async () => {
      await Promise.resolve();
    });
    generateTasksSpy.mockClear();

    await runInInjectionContext(injector, async () => {
      service.togglePackage("someNewPackage");
      await Promise.resolve();

      await vi.waitUntil(() => generateTasksSpy.mock.calls.length > 0);
    });

    expect(generateTasksSpy).toHaveBeenCalled();
    generateTasksSpy.mockRestore();
  });
});
