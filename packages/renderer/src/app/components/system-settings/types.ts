export interface ShellEntry {
  name: string;
  defaultSettings?: string;
  hint?: string;
  path?: string;
}

export const shells: ShellEntry[] = [
  {
    name: 'bash',
    defaultSettings: 'garuda-bash-settings',
  },
  {
    name: 'zsh',
    defaultSettings: 'garuda-zsh-settings',
  },
  {
    name: 'fish',
    defaultSettings: 'garuda-fish-settings',
    hint: 'shells.fish.hint',
  },
  {
    name: 'sh',
  },
];
export type Shell = (typeof shells)[number];
export type ShellName = Shell['name'];

export interface DnsProviderEntry {
  name: string;
  description: string;
  ips: string[];
}

export const defaultDnsProvider: DnsProvider = {
  name: 'Default',
  description: 'Default DNS provided by your ISP',
  ips: ['0.0.0.0'],
};

export const dnsProviders: DnsProviderEntry[] = [
  {
    name: 'Google',
    description: 'Google Public DNS',
    ips: ['8.8.8.8'],
  },
  {
    name: 'Cloudflare',
    description: 'Cloudflare Public DNS',
    ips: ['1.1.1.1'],
  },
  {
    name: 'Quad9',
    description: 'Quad9 Public DNS',
    ips: ['9.9.9.9'],
  },
  defaultDnsProvider,
];
export type DnsProvider = (typeof dnsProviders)[number];
export type DnsProviderName = DnsProvider['name'];
