export interface ShellEntry {
  name: string;
  defaultSettings?: string;
  hint?: string;
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

export interface DnsProvider {
  name: string;
  description: string;
  ips: string[];
}

export const dnsProviders: DnsProvider[] = [
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
];
export type DnsProviderName = (typeof dnsProviders)[number]['name'];
