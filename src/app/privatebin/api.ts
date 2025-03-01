// Sourced from: https://github.com/pixelfactoryio/privatebin-cli
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export class Api {
  axios: AxiosInstance;

  constructor(config: AxiosRequestConfig) {
    this.axios = axios.create(config);
  }

  get<T, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R> {
    return this.axios.get(url, config);
  }

  public post<T, B, R = AxiosResponse<T>>(url: string, data?: B, config?: AxiosRequestConfig): Promise<R> {
    return this.axios.post(url, data, config);
  }

  public success<T>(response: AxiosResponse<T>): T {
    return response.data;
  }
}
