// PrivatebinClient parts sourced from: https://github.com/pixelfactoryio/privatebin-cli
import BaseConverter from 'bs58';
import { Logger } from '../logging/logging';
import pako from 'pako';

import type {
  PrivatebinAdata,
  PrivatebinOptions,
  PrivatebinPaste,
  PrivatebinPasteRequest,
  PrivatebinResponse,
} from './types';
import { Api, type ApiConfig, type ApiResponse } from './api';
import { decrypt, encrypt, stringToUint8Array, uint8ArrayToString } from './crypto';

/**
 * Encrypt a text to a Privatebin paste.
 * @param text The text to encrypt.
 * @param key The key to encrypt the text.
 * @param options The options for the paste.
 */
export async function encryptText(
  text: string,
  key: Uint8Array,
  options: PrivatebinOptions,
): Promise<PrivatebinPasteRequest> {
  const { burnafterreading, opendiscussion, compression, textformat } = options;
  const spec = {
    algo: 'aes',
    mode: 'gcm',
    ks: 256,
    ts: 128,
    iter: 100000,
    textformat,
    compression,
    burnafterreading,
    opendiscussion,
  };

  let buf = stringToUint8Array(JSON.stringify({ paste: text }));
  if (compression === 'zlib') {
    buf = pako.deflateRaw(buf);
  }

  return encrypt(buf, key, spec);
}

/**
 * Decrypt a Privatebin paste.
 * @param ct The cipher text.
 * @param key The key to decrypt the text.
 * @param adata The additional data.
 */
export async function decryptText(ct: string, key: Uint8Array, adata: PrivatebinAdata): Promise<PrivatebinPaste> {
  const buf: Uint8Array = await decrypt(ct, key, adata);
  if (adata[0][7] === 'zlib') {
    return JSON.parse(pako.inflateRaw(buf, { to: 'string' }));
  }

  return JSON.parse(uint8ArrayToString(buf));
}

export class PrivatebinClient extends Api {
  constructor(baseURL = 'https://privatebin.net') {
    const apiConfig: ApiConfig = {
      baseURL: baseURL,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'JSONHttpRequest',
      },
    };

    super(apiConfig);
  }

  public async sendText(text: string, key: Uint8Array, options: PrivatebinOptions): Promise<PrivatebinResponse> {
    const payload = await encryptText(text, key, options);
    return this.postPaste(payload, options);
  }

  public async getText(id: string, key: Uint8Array): Promise<PrivatebinPaste> {
    const { status, message, ct, adata } = await this.getPaste(id);
    if (status === 0) {
      return decryptText(ct, key, adata);
    }
    throw new Error(message);
  }

  private async getPaste(id: string): Promise<PrivatebinPasteRequest> {
    const response = await this.get<PrivatebinPasteRequest, ApiResponse<PrivatebinPasteRequest>>(`/?pasteid=${id}`);
    return this.success(response);
  }

  private async postPaste(
    PrivatebinPasteRequest: PrivatebinPasteRequest,
    options: PrivatebinOptions,
  ): Promise<PrivatebinResponse> {
    const { expire } = options;
    const { ct, adata } = PrivatebinPasteRequest;

    const response = await this.post<PrivatebinResponse, PrivatebinPasteRequest, ApiResponse<PrivatebinResponse>>('/', {
      v: 2,
      ct,
      adata,
      meta: { expire },
    });
    return this.success(response);
  }
}

export class GarudaBin {
  private readonly instance: PrivatebinClient;
  private readonly logger = Logger.getInstance();
  private readonly options: PrivatebinOptions = {
    textformat: 'plaintext',
    expire: '1year',
    burnafterreading: 0,
    opendiscussion: 0,
    output: 'text',
    compression: 'zlib',
  };
  private readonly url = 'https://bin.garudalinux.org';

  constructor() {
    this.instance = new PrivatebinClient(this.url);
  }

  /**
   * Send text to GarudaBin and return the URL to the paste.
   * @param text The text to send.
   * @returns The URL to the paste.
   */
  async sendText(text: string): Promise<string> {
    try {
      this.logger.trace('Sending text to GarudaBin');
      const key: Uint8Array = crypto.getRandomValues(new Uint8Array(32));
      const paste: PrivatebinResponse = await this.instance.sendText(text, key, this.options);

      return `${this.url}${paste.url}#${BaseConverter.encode(key)}`;
    } catch (error) {
      this.logger.error(`Failed to send text to GarudaBin: ${error}`);
      throw error;
    }
  }
}
