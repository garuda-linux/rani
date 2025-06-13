// Sourced from: https://github.com/pixelfactoryio/privatebin-cli
export interface PrivatebinPaste {
  paste: string;
}

export interface PrivatebinResponse {
  status: number;
  id: string;
  url: string;
  deletetoken: string;
}

export interface PrivatebinOutput {
  pasteId: string;
  pasteURL: string;
  deleteURL: string;
}

export interface PrivatebinSpec {
  algo: string;
  mode: string;
  ks: number;
  ts: number;
  iter: number;
  compression: string;
  burnafterreading: number;
  opendiscussion: number;
  textformat: string;
}

export type PrivatebinAdata = [
  [string, string, number, number, number, string, string, string],
  string,
  number,
  number,
];

export interface PrivatebinMeta {
  expire: string;
}

export interface PrivatebinPasteRequest {
  status?: number;
  message?: string;
  v?: 2;
  ct: string; // Cipher Text
  adata: PrivatebinAdata; // Additional data
  meta?: PrivatebinMeta;
}

export interface PrivatebinOptions {
  expire: '5min' | '10min' | '1hour' | '1day' | '1week' | '1month' | '1year' | 'never';
  burnafterreading: 0 | 1;
  opendiscussion: 0 | 1;
  output: 'text' | 'json' | 'yaml';
  compression: 'none' | 'zlib';
  textformat: 'plaintext' | 'markdown';
}
