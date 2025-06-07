import { Injectable } from "@angular/core";
import type { ContextMenuItem } from "./electron-types";

@Injectable({
  providedIn: "root",
})
export class ElectronContextMenuService {
  private readonly menuClickHandlers = new Map<
    string,
    () => void | Promise<void>
  >();

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Show a native Electron context menu at the specified position
   * @param items The menu items to display
   * @param x Optional X coordinate (defaults to cursor position)
   * @param y Optional Y coordinate (defaults to cursor position)
   * @returns Promise that resolves when the menu is shown
   */
  async showContextMenu(
    items: ContextMenuItem[],
    x?: number,
    y?: number,
  ): Promise<boolean> {
    if (!window.electronAPI?.contextMenu) {
      console.warn("Context menu API not available");
      return false;
    }

    try {
      // Register click handlers for menu items
      this.registerMenuItemHandlers(items);

      return await window.electronAPI.contextMenu.show(items, x, y);
    } catch (error) {
      console.error("Failed to show context menu:", error);
      return false;
    }
  }

  /**
   * Create a context menu item
   * @param options The menu item configuration
   * @returns The configured menu item
   */
  createMenuItem(options: {
    id: string;
    label: string;
    icon?: string;
    enabled?: boolean;
    visible?: boolean;
    type?: "normal" | "separator" | "submenu" | "checkbox" | "radio";
    checked?: boolean;
    accelerator?: string;
    onClick?: () => void | Promise<void>;
    submenu?: ContextMenuItem[];
  }): ContextMenuItem {
    const item: ContextMenuItem = {
      id: options.id,
      label: options.label,
      icon: options.icon,
      enabled: options.enabled,
      visible: options.visible,
      type: options.type || "normal",
      checked: options.checked,
      accelerator: options.accelerator,
      submenu: options.submenu,
    };

    // Register the click handler if provided
    if (options.onClick) {
      this.menuClickHandlers.set(options.id, options.onClick);
    }

    return item;
  }

  /**
   * Create a separator menu item
   * @returns A separator menu item
   */
  createSeparator(): ContextMenuItem {
    return { type: "separator" };
  }

  /**
   * Register click handlers for menu items and their submenus
   * @param items The menu items to register handlers for
   * @private
   */
  private registerMenuItemHandlers(items: ContextMenuItem[]): void {
    for (const item of items) {
      if (item.submenu) {
        this.registerMenuItemHandlers(item.submenu);
      }
    }
  }

  /**
   * Set up event listeners for context menu item clicks
   * @private
   */
  private setupEventListeners(): void {
    if (!window.electronAPI?.events) {
      return;
    }

    window.electronAPI.events.on(
      "contextMenu:itemClicked",
      (itemId: string) => {
        const handler = this.menuClickHandlers.get(itemId);
        if (handler) {
          try {
            const result = handler();
            if (result instanceof Promise) {
              result.catch((error) => {
                console.error(
                  `Error executing menu item handler for ${itemId}:`,
                  error,
                );
              });
            }
          } catch (error) {
            console.error(
              `Error executing menu item handler for ${itemId}:`,
              error,
            );
          }
        } else {
          console.warn(`No handler found for menu item: ${itemId}`);
        }
      },
    );
  }

  /**
   * Clear all registered menu item handlers
   */
  clearHandlers(): void {
    this.menuClickHandlers.clear();
  }

  /**
   * Remove a specific menu item handler
   * @param itemId The ID of the menu item handler to remove
   */
  removeHandler(itemId: string): void {
    this.menuClickHandlers.delete(itemId);
  }
}
