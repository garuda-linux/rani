import { error as logError, warn } from './logging.js';

export async function open(options: Record<string, unknown>): Promise<string[]> {
  try {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';

      // Set properties based on options
      if (options.multiple) {
        input.multiple = true;
      }

      if (options.filters && Array.isArray(options.filters)) {
        const acceptTypes = options.filters
          .map((filter: any) => filter.extensions?.map((ext: string) => `.${ext}`).join(','))
          .filter(Boolean)
          .join(',');
        if (acceptTypes) {
          input.accept = acceptTypes;
        }
      }

      if (options.directory) {
        input.webkitdirectory = true;
      }

      input.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        const files = Array.from(target.files || []);
        const filePaths = files.map((file) => file.name); // In web context, we only get names
        resolve(filePaths);
      };

      input.oncancel = () => {
        resolve([]);
      };

      // Trigger the file dialog
      input.click();
    });
  } catch (err) {
    logError(`Dialog open error: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

export async function save(options: Record<string, unknown>): Promise<string> {
  try {
    // In web context, we can't directly save files to arbitrary locations
    // We'll use the download approach
    warn('Save dialog in web context will trigger download');

    const fileName = (options.defaultPath as string) || 'untitled.txt';
    const content = (options.content as string) || '';

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();

    URL.revokeObjectURL(url);

    return fileName;
  } catch (err) {
    logError(`Dialog save error: ${err instanceof Error ? err.message : String(err)}`);
    return '';
  }
}

export async function message(options: Record<string, unknown>): Promise<number> {
  try {
    const message = (options.message as string) || '';
    const title = (options.title as string) || 'Message';

    // Use browser alert for message display
    alert(`${title}\n\n${message}`);

    return 0; // Return 0 for OK
  } catch (err) {
    logError(`Dialog message error: ${err instanceof Error ? err.message : String(err)}`);
    return -1;
  }
}

export async function error(title: string, content: string): Promise<boolean> {
  try {
    if (!title || !content) {
      logError('Title and content are required for error dialog');
      return false;
    }

    alert(`Error: ${title}\n\n${content}`);
    return true;
  } catch (err) {
    logError(`Dialog error error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function confirm(message: string, title?: string, detail?: string): Promise<boolean> {
  try {
    if (!message) {
      logError('Message is required for confirm dialog');
      return false;
    }

    let dialogMessage = message;
    if (title) {
      dialogMessage = `${title}\n\n${message}`;
    }
    if (detail) {
      dialogMessage += `\n\n${detail}`;
    }

    return window.confirm(dialogMessage);
  } catch (err) {
    logError(`Dialog confirm error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function warning(message: string, title?: string, detail?: string): Promise<boolean> {
  try {
    if (!message) {
      logError('Message is required for warning dialog');
      return false;
    }

    let dialogMessage = `Warning: ${message}`;
    if (title) {
      dialogMessage = `${title}\n\nWarning: ${message}`;
    }
    if (detail) {
      dialogMessage += `\n\n${detail}`;
    }

    alert(dialogMessage);
    return true;
  } catch (err) {
    logError(`Dialog warning error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function info(message: string, title?: string, detail?: string): Promise<boolean> {
  try {
    if (!message) {
      logError('Message is required for info dialog');
      return false;
    }

    let dialogMessage = message;
    if (title) {
      dialogMessage = `${title}\n\n${message}`;
    }
    if (detail) {
      dialogMessage += `\n\n${detail}`;
    }

    alert(dialogMessage);
    return true;
  } catch (err) {
    logError(`Dialog info error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}
