import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";
import { ipcMain, Menu, BrowserWindow, app } from "electron";
import { Logger } from "../logging/logging.js";

interface AppMenuItem {
  id?: string;
  label?: string;
  icon?: string;
  enabled?: boolean;
  visible?: boolean;
  type?: "normal" | "separator" | "submenu" | "checkbox" | "radio";
  checked?: boolean;
  accelerator?: string;
  role?: string;
  submenu?: AppMenuItem[];
  routerLink?: string;
  command?: string;
  items?: AppMenuItem[];
}

class AppMenuModule implements AppModule {
  private readonly logger = Logger.getInstance();
  private currentMenuItems: AppMenuItem[] = [];

  constructor() {
    this.logger.info("AppMenuModule constructor called");
  }

  enable(context: ModuleContext): void {
    this.logger.info("AppMenuModule enable called");

    this.preventDefaultMenu();
    this.setupMenuHandlers();
  }

  private preventDefaultMenu(): void {
    // Don't set to null immediately - we'll replace it with our custom menu
    this.logger.info("Will replace default application menu with custom menu");
  }

  private setupMenuHandlers(): void {
    const getMainWindow = (): BrowserWindow | null => {
      const windows = BrowserWindow.getAllWindows();
      return windows.length > 0 ? windows[0] : null;
    };

    // Handle menu updates from renderer
    ipcMain.handle("appMenu:update", async (_, menuItems: AppMenuItem[]) => {
      try {
        this.currentMenuItems = menuItems;

        const menu = this.buildApplicationMenu(menuItems);
        Menu.setApplicationMenu(menu);

        this.logger.info("Application menu updated successfully");
        return true;
      } catch (error: unknown) {
        this.logger.error(
          `App menu update error: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new Error(
          `Failed to update app menu: ${error instanceof Error ? error.message : error}`,
        );
      }
    });

    // Handle getting current menu items
    ipcMain.handle("appMenu:getItems", async () => {
      return this.currentMenuItems;
    });

    // Handle menu item clicks
    ipcMain.handle("appMenu:itemClicked", async (_, itemId: string) => {
      try {
        const win = getMainWindow();
        if (!win || win.isDestroyed()) {
          return false;
        }

        // Send the click event to the renderer
        win.webContents.send("appMenu:itemClicked", itemId);
        return true;
      } catch (error: unknown) {
        this.logger.error(
          `App menu item click error: ${error instanceof Error ? error.message : String(error)}`,
        );
        return false;
      }
    });
  }

  private buildApplicationMenu(items: AppMenuItem[]): Menu {
    this.logger.info(`Building application menu with items: ${items.length}`);

    const isMac = process.platform === "darwin";
    const template: Electron.MenuItemConstructorOptions[] = [
      // macOS app menu
      ...(isMac
        ? [
            {
              label: app.getName(),
              submenu: [
                { role: "about" as const },
                { type: "separator" as const },
                { role: "services" as const },
                { type: "separator" as const },
                { role: "hide" as const },
                { role: "hideOthers" as const },
                { role: "unhide" as const },
                { type: "separator" as const },
                { role: "quit" as const },
              ],
            },
          ]
        : []),

      // File menu
      ...(items.find((item) => item.id === "file")
        ? [
            {
              label: "File",
              submenu: this.createSpecialMenuItems(
                items.find((item) => item.id === "file"),
              ),
            },
          ]
        : []),

      // Modules menu
      ...(items.find((item) => item.id === "modules")
        ? [
            {
              label: "Modules",
              submenu: this.createSpecialMenuItems(
                items.find((item) => item.id === "modules"),
              ),
            },
          ]
        : []),

      // Application menu items (excluding Help, File, and Modules menus)
      ...this.createMenuTemplate(
        items.filter(
          (item) =>
            item.id !== "help" && item.id !== "file" && item.id !== "modules",
        ),
      ),

      // Standard View menu
      {
        label: "View",
        submenu: [
          { role: "reload" as const },
          { role: "forceReload" as const },
          { type: "separator" as const },
          { role: "resetZoom" as const },
          { role: "zoomIn" as const },
          { role: "zoomOut" as const },
          { type: "separator" as const },
          { role: "togglefullscreen" as const },
        ],
      },

      // Window menu
      {
        label: "Window",
        submenu: [
          { role: "minimize" as const },
          { role: "zoom" as const },
          ...(isMac
            ? [{ type: "separator" as const }, { role: "front" as const }]
            : [{ role: "close" as const }]),
        ],
      },

      // Help menu
      {
        label: "Help",
        submenu: this.createHelpMenuItems(
          items.find((item) => item.id === "help"),
        ),
      },
    ];

    return Menu.buildFromTemplate(template);
  }

  private createMenuTemplate(
    items: AppMenuItem[],
  ): Electron.MenuItemConstructorOptions[] {
    return items
      .filter((item) => item.visible !== false)
      .map((item) => this.createMenuItem(item));
  }

  private createMenuItem(
    item: AppMenuItem,
  ): Electron.MenuItemConstructorOptions {
    if (item.type === "separator") {
      return { type: "separator" };
    }

    const menuItem: Electron.MenuItemConstructorOptions = {
      id: item.id,
      label: item.label || "",
      enabled: item.enabled !== false,
      visible: item.visible !== false,
      type: item.type || "normal",
      accelerator: item.accelerator,
    };

    // Handle role-based menu items
    if (item.role) {
      menuItem.role = item.role as Electron.MenuItemConstructorOptions["role"];
    }

    // Handle checkbox and radio types
    if (item.type === "checkbox" || item.type === "radio") {
      menuItem.checked = item.checked || false;
    }

    // Handle submenu items (both submenu and items properties)
    const submenuItems = item.submenu || item.items;
    const hasSubmenu = submenuItems && submenuItems.length > 0;
    if (hasSubmenu) {
      menuItem.submenu = this.createMenuTemplate(submenuItems);
    }

    // Handle click events for non-submenu items
    if (item.id && !hasSubmenu) {
      menuItem.click = () => {
        this.logger.info(`Native menu item clicked: ${item.id}`);
        this.handleMenuItemClick(item);
      };
    }

    return menuItem;
  }

  private handleMenuItemClick(item: AppMenuItem): void {
    this.logger.info(
      `Menu item click handler called for: ${item.id || item.label}`,
    );

    const win = BrowserWindow.getAllWindows()[0];
    if (!win || win.isDestroyed()) {
      this.logger.warn("No main window available for menu item click");
      return;
    }

    const clickData = {
      id: item.id,
      routerLink: item.routerLink,
      command: item.command,
      item: item,
    };

    // Send the menu item data to renderer for handling
    win.webContents.send("appMenu:itemClicked", clickData);
  }

  private createSpecialMenuItems(
    menuItem?: AppMenuItem,
  ): Electron.MenuItemConstructorOptions[] {
    if (!menuItem || !menuItem.submenu || menuItem.submenu.length === 0) {
      return [];
    }

    return menuItem.submenu.map((item) => ({
      label: item.label || "",
      click: () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win && !win.isDestroyed()) {
          win.webContents.send("appMenu:itemClicked", {
            id: item.id,
            command: item.command,
            routerLink: item.routerLink,
            item: item,
          });
        }
      },
    }));
  }

  private createHelpMenuItems(
    helpMenuItem?: AppMenuItem,
  ): Electron.MenuItemConstructorOptions[] {
    if (
      !helpMenuItem ||
      !helpMenuItem.submenu ||
      helpMenuItem.submenu.length === 0
    ) {
      return [
        {
          label: "About",
          click: () => {
            const win = BrowserWindow.getAllWindows()[0];
            if (win && !win.isDestroyed()) {
              win.webContents.send("appMenu:itemClicked", {
                id: "help-about",
                command: "help-about",
              });
            }
          },
        },
      ];
    }

    return helpMenuItem.submenu.map((item) => ({
      label: item.label || "",
      click: () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win && !win.isDestroyed()) {
          win.webContents.send("appMenu:itemClicked", {
            id: item.id,
            command: item.command,
            item: item,
          });
        }
      },
    }));
  }
}

export function createAppMenuModule() {
  return new AppMenuModule();
}
