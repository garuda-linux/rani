import { ipcRenderer } from 'electron';
import { error } from './logging.js';

export interface HttpRequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export async function httpGet<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
  try {
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    return await ipcRenderer.invoke('http:get', url, config);
  } catch (err) {
    error(`HTTP GET error: ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }
}

export async function httpPost<T = any, B = any>(
  url: string,
  body?: B,
  config?: HttpRequestConfig,
): Promise<HttpResponse<T>> {
  try {
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    return await ipcRenderer.invoke('http:post', url, body, config);
  } catch (err) {
    error(`HTTP POST error: ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }
}

export async function httpPut<T = any, B = any>(
  url: string,
  body?: B,
  config?: HttpRequestConfig,
): Promise<HttpResponse<T>> {
  try {
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    return await ipcRenderer.invoke('http:put', url, body, config);
  } catch (err) {
    error(`HTTP PUT error: ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }
}

export async function httpDelete<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
  try {
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    return await ipcRenderer.invoke('http:delete', url, config);
  } catch (err) {
    error(`HTTP DELETE error: ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }
}
