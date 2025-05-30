// Sourced from: https://github.com/pixelfactoryio/privatebin-cli
// Modified to use native fetch API instead of Axios

export interface ApiConfig {
  baseURL: string;
  headers?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export class Api {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiConfig) {
    this.baseURL = config.baseURL;
    this.defaultHeaders = config.headers || {};
  }

  async get<T, R = ApiResponse<T>>(
    url: string,
    config?: { headers?: Record<string, string> },
  ): Promise<R> {
    const response = await fetch(this.baseURL + url, {
      method: 'GET',
      headers: {
        ...this.defaultHeaders,
        ...config?.headers,
      },
    });

    const data = await response.json();
    return {
      data,
      status: response.status,
      statusText: response.statusText,
    } as R;
  }

  public async post<T, B, R = ApiResponse<T>>(
    url: string,
    data?: B,
    config?: { headers?: Record<string, string> },
  ): Promise<R> {
    const response = await fetch(this.baseURL + url, {
      method: 'POST',
      headers: {
        ...this.defaultHeaders,
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseData = await response.json();
    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
    } as R;
  }

  public success<T>(response: ApiResponse<T>): T {
    return response.data;
  }
}
