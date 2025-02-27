import { PrivatebinClient, PrivatebinOptions, PrivatebinResponse } from '@pixelfactory/privatebin';
import BaseConverter from 'bs58';
import axiosTauriApiAdapter from 'axios-tauri-api-adapter';
import { Logger } from '../logging/logging';

export class GarudaBin {
  options: PrivatebinOptions = {
    textformat: 'plaintext',
    expire: '1year',
    burnafterreading: 0,
    opendiscussion: 0,
    output: 'text',
    compression: 'zlib',
  };
  instance: PrivatebinClient;
  url = 'https://bin.garudalinux.org/';

  private readonly logger = Logger.getInstance();

  constructor() {
    this.instance = new PrivatebinClient(this.url);
    this.instance.axios.defaults.adapter = axiosTauriApiAdapter;
  }

  async sendText(text: string): Promise<string> {
    this.logger.trace('Sending text to GarudaBin');
    const key: Uint8Array = crypto.getRandomValues(new Uint8Array(32));
    const paste: PrivatebinResponse = await this.instance.sendText(text, key, this.options);

    return `${this.url}${paste.url}#${BaseConverter.encode(key)}`;
  }
}
