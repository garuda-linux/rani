import { error, warn } from './logging.js';

interface MenuItem {
  label: string;
  id?: string;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
  enabled?: boolean;
  visible?: boolean;
  checked?: boolean;
  accelerator?: string;
  submenu?: MenuItem[];
  click?: () => void;
}

let activeContextMenu: HTMLElement | null = null;

export function show(items: unknown[], x?: number, y?: number): boolean {
  try {
    // Clean up any existing context menu
    hideContextMenu();

    if (!Array.isArray(items) || items.length === 0) {
      error('Invalid menu items provided');
      return false;
    }

    // Convert unknown[] to MenuItem[]
    const menuItems = items as MenuItem[];

    // Create context menu element
    const contextMenu = createContextMenuElement(menuItems);

    // Position the menu
    const posX = x !== undefined ? x : 0;
    const posY = y !== undefined ? y : 0;

    contextMenu.style.left = `${posX}px`;
    contextMenu.style.top = `${posY}px`;

    // Add to document
    document.body.appendChild(contextMenu);
    activeContextMenu = contextMenu;

    // Add click listener to hide menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick, { once: true });
      document.addEventListener('contextmenu', handleOutsideClick, { once: true });
      document.addEventListener('keydown', handleEscapeKey, { once: true });
    }, 0);

    return true;
  } catch (err) {
    error(`Context menu show error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

function createContextMenuElement(items: MenuItem[]): HTMLElement {
  const menu = document.createElement('div');
  menu.className = 'electron-context-menu';

  // Apply styles
  Object.assign(menu.style, {
    position: 'fixed',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    padding: '4px 0',
    minWidth: '120px',
    maxWidth: '300px',
    zIndex: '10000',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    userSelect: 'none',
    cursor: 'default',
  });

  items.forEach((item, index) => {
    if (item.visible === false) {
      return;
    }

    if (item.type === 'separator') {
      const separator = document.createElement('div');
      separator.style.height = '1px';
      separator.style.backgroundColor = '#e0e0e0';
      separator.style.margin = '4px 0';
      menu.appendChild(separator);
      return;
    }

    const menuItem = document.createElement('div');
    menuItem.className = 'electron-context-menu-item';

    // Apply item styles
    Object.assign(menuItem.style, {
      padding: '6px 12px',
      cursor: item.enabled !== false ? 'pointer' : 'default',
      color: item.enabled !== false ? '#000' : '#999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    });

    // Add hover effect for enabled items
    if (item.enabled !== false) {
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.backgroundColor = '#f0f0f0';
      });

      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.backgroundColor = 'transparent';
      });
    }

    // Create label container
    const labelContainer = document.createElement('span');

    // Add checkbox/radio indicator
    if (item.type === 'checkbox' || item.type === 'radio') {
      const indicator = document.createElement('span');
      indicator.textContent = item.checked ? '✓' : ' ';
      indicator.style.marginRight = '8px';
      indicator.style.fontWeight = 'bold';
      labelContainer.appendChild(indicator);
    }

    // Add label text
    const labelText = document.createElement('span');
    labelText.textContent = item.label || '';
    labelContainer.appendChild(labelText);

    menuItem.appendChild(labelContainer);

    // Add accelerator if present
    if (item.accelerator) {
      const accelerator = document.createElement('span');
      accelerator.textContent = item.accelerator;
      accelerator.style.color = '#666';
      accelerator.style.fontSize = '12px';
      accelerator.style.marginLeft = '20px';
      menuItem.appendChild(accelerator);
    }

    // Add submenu indicator
    if (item.submenu && item.submenu.length > 0) {
      const indicator = document.createElement('span');
      indicator.textContent = '▶';
      indicator.style.color = '#666';
      indicator.style.fontSize = '10px';
      indicator.style.marginLeft = '10px';
      menuItem.appendChild(indicator);
    }

    // Add click handler
    if (item.enabled !== false && item.click && typeof item.click === 'function') {
      menuItem.addEventListener('click', (event) => {
        event.stopPropagation();
        hideContextMenu();
        try {
          item?.click?.();
        } catch (err) {
          error(`Menu item click error: ${err instanceof Error ? err.message : String(err)}`);
        }
      });
    }

    menu.appendChild(menuItem);
  });

  return menu;
}

function hideContextMenu(): void {
  if (activeContextMenu) {
    try {
      if (activeContextMenu.parentNode) {
        activeContextMenu.parentNode.removeChild(activeContextMenu);
      }
    } catch (err) {
      error(`Error removing context menu: ${err instanceof Error ? err.message : String(err)}`);
    }
    activeContextMenu = null;
  }
}

function handleOutsideClick(event: Event): void {
  if (activeContextMenu && !activeContextMenu.contains(event.target as Node)) {
    hideContextMenu();
  }
}

function handleEscapeKey(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    hideContextMenu();
  }
}

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', hideContextMenu);
}
