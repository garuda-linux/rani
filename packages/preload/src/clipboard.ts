import { error, warn } from './logging.js';

export async function writeText(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) {
      error('Clipboard API not available');
      return false;
    }

    if (typeof text !== 'string') {
      error('Text must be a string');
      return false;
    }

    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    error(`Clipboard writeText error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function readText(): Promise<string> {
  try {
    if (!navigator.clipboard) {
      error('Clipboard API not available');
      return '';
    }

    const text = await navigator.clipboard.readText();
    return text || '';
  } catch (err) {
    error(`Clipboard readText error: ${err instanceof Error ? err.message : String(err)}`);
    return '';
  }
}

export async function clear(): Promise<boolean> {
  try {
    if (!navigator.clipboard) {
      error('Clipboard API not available');
      return false;
    }

    await navigator.clipboard.writeText('');
    return true;
  } catch (err) {
    error(`Clipboard clear error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function writeHTML(markup: string, text?: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) {
      error('Clipboard API not available');
      return false;
    }

    if (typeof markup !== 'string') {
      error('Markup must be a string');
      return false;
    }

    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([markup], { type: 'text/html' }),
      'text/plain': new Blob([text || markup.replace(/<[^>]*>/g, '')], { type: 'text/plain' }),
    });

    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (err) {
    error(`Clipboard writeHTML error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function readHTML(): Promise<string> {
  try {
    if (!navigator.clipboard) {
      error('Clipboard API not available');
      return '';
    }

    const clipboardItems = await navigator.clipboard.read();
    for (const clipboardItem of clipboardItems) {
      if (clipboardItem.types.includes('text/html')) {
        const blob = await clipboardItem.getType('text/html');
        return await blob.text();
      }
    }

    return '';
  } catch (err) {
    error(`Clipboard readHTML error: ${err instanceof Error ? err.message : String(err)}`);
    return '';
  }
}

export async function writeRTF(text: string): Promise<boolean> {
  try {
    warn('RTF clipboard operations not fully supported in web environment');
    // Fallback to plain text
    return await writeText(text);
  } catch (err) {
    error(`Clipboard writeRTF error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function readRTF(): Promise<string> {
  try {
    warn('RTF clipboard operations not fully supported in web environment');
    // Fallback to plain text
    return await readText();
  } catch (err) {
    error(`Clipboard readRTF error: ${err instanceof Error ? err.message : String(err)}`);
    return '';
  }
}

export async function writeImage(dataURL: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) {
      error('Clipboard API not available');
      return false;
    }

    if (!dataURL || typeof dataURL !== 'string') {
      error('Invalid dataURL provided');
      return false;
    }

    // Convert data URL to blob
    const response = await fetch(dataURL);
    const blob = await response.blob();

    const clipboardItem = new ClipboardItem({
      [blob.type]: blob,
    });

    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (err) {
    error(`Clipboard writeImage error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function readImage(): Promise<string> {
  try {
    if (!navigator.clipboard) {
      error('Clipboard API not available');
      return '';
    }

    const clipboardItems = await navigator.clipboard.read();
    for (const clipboardItem of clipboardItems) {
      for (const type of clipboardItem.types) {
        if (type.startsWith('image/')) {
          const blob = await clipboardItem.getType(type);
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(blob);
          });
        }
      }
    }

    return '';
  } catch (err) {
    error(`Clipboard readImage error: ${err instanceof Error ? err.message : String(err)}`);
    return '';
  }
}

export async function writeBookmark(title: string, url: string): Promise<boolean> {
  try {
    warn('Bookmark clipboard operations not fully supported in web environment');
    // Fallback to writing as HTML link
    const html = `<a href="${url}">${title}</a>`;
    return await writeHTML(html, `${title}: ${url}`);
  } catch (err) {
    error(`Clipboard writeBookmark error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function readBookmark(): Promise<{ title: string; url: string }> {
  try {
    warn('Bookmark clipboard operations not fully supported in web environment');
    const html = await readHTML();

    // Try to extract title and URL from HTML link
    const match = html.match(/<a href="([^"]*)"[^>]*>([^<]*)<\/a>/);
    if (match) {
      return {
        title: match[2] || '',
        url: match[1] || '',
      };
    }

    return { title: '', url: '' };
  } catch (err) {
    error(`Clipboard readBookmark error: ${err instanceof Error ? err.message : String(err)}`);
    return { title: '', url: '' };
  }
}

export async function availableFormats(): Promise<string[]> {
  try {
    if (!navigator.clipboard) {
      error('Clipboard API not available');
      return [];
    }

    const clipboardItems = await navigator.clipboard.read();
    const formats: string[] = [];

    for (const clipboardItem of clipboardItems) {
      formats.push(...clipboardItem.types);
    }

    return [...new Set(formats)]; // Remove duplicates
  } catch (err) {
    error(`Clipboard availableFormats error: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

export async function has(format: string): Promise<boolean> {
  try {
    const formats = await availableFormats();
    return formats.includes(format);
  } catch (err) {
    error(`Clipboard has error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function read(format: string): Promise<string> {
  try {
    if (!navigator.clipboard) {
      error('Clipboard API not available');
      return '';
    }

    const clipboardItems = await navigator.clipboard.read();
    for (const clipboardItem of clipboardItems) {
      if (clipboardItem.types.includes(format)) {
        const blob = await clipboardItem.getType(format);
        return await blob.text();
      }
    }

    return '';
  } catch (err) {
    error(`Clipboard read error: ${err instanceof Error ? err.message : String(err)}`);
    return '';
  }
}

export async function isEmpty(): Promise<boolean> {
  try {
    const text = await readText();
    const formats = await availableFormats();
    return text.length === 0 && formats.length === 0;
  } catch (err) {
    error(`Clipboard isEmpty error: ${err instanceof Error ? err.message : String(err)}`);
    return true;
  }
}

export async function hasText(): Promise<boolean> {
  try {
    return await has('text/plain');
  } catch (err) {
    error(`Clipboard hasText error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function hasImage(): Promise<boolean> {
  try {
    const formats = await availableFormats();
    return formats.some((format) => format.startsWith('image/'));
  } catch (err) {
    error(`Clipboard hasImage error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}
