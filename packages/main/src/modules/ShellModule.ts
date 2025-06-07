import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';
import { ipcMain, shell } from 'electron';
import { spawn } from 'node:child_process';
import * as path from 'node:path';
import { Client, ConnectConfig } from 'ssh2';
import { readFileSync } from 'node:fs';

class ShellModule implements AppModule {
  private readonly isDevelopment: boolean;
  private readonly sshConfig?: ConnectConfig;

  constructor(isDevelopment = false) {
    this.isDevelopment = isDevelopment;
    if (this.isDevelopment) {
      try {
        this.sshConfig = {
          host: '10.0.0.158',
          port: 22,
          username: 'alarm',
          privateKey: readFileSync('/Users/nijen/.ssh/dev_vm'),
        };
      } catch (error) {
        console.warn(
          'SSH key not found, SSH functionality will be disabled:',
          error,
        );
      }
    }
  }

  enable({ app: _app }: ModuleContext): void {
    this.setupShellHandlers();
    this.setupStreamingHandlers();
  }

  private setupShellHandlers(): void {
    // Shell Operations
    ipcMain.handle('shell:open', async (_, url: string) => {
      try {
        // Validate URL for security
        const urlPattern = /^(https?:\/\/)|(file:\/\/)|(mailto:)|(tel:)/;
        if (!urlPattern.test(url)) {
          throw new Error('Invalid URL protocol');
        }
        await shell.openExternal(url);
        return true;
      } catch (error) {
        console.error('Shell open error:', error);
        throw new Error(
          `Failed to open URL: ${error instanceof Error ? error.message : error}`,
        );
      }
    });

    // Command validation for security
    const validateCommand = (command: string, args: string[]): boolean => {
      // In development mode, allow all commands for flexibility
      if (this.isDevelopment) {
        console.log(
          `[DEV MODE] Allowing command: ${command} ${args.join(' ')}`,
        );
        return true;
      }

      // Expanded whitelist of allowed commands for system management
      const allowedCommands = [
        // Package managers
        'pacman',
        'yay',
        'paru',
        'pamac',
        'apt',
        'apt-get',
        'dnf',
        'zypper',
        'emerge',
        // System administration
        'sudo',
        'systemctl',
        'localectl',
        'timedatectl',
        'hostnamectl',
        'hostname',
        'lsb_release',
        'journalctl',
        'grub-install',
        'grub-mkconfig',
        'update-grub',
        'dkms',
        'modprobe',
        'rmmod',
        // File operations
        'ls',
        'cat',
        'head',
        'tail',
        'less',
        'more',
        'file',
        'stat',
        'du',
        'df',
        'find',
        'locate',
        'which',
        'whereis',
        'type',
        'readlink',
        'realpath',
        'mkdir',
        'rmdir',
        'touch',
        'cp',
        'mv',
        'ln',
        'chmod',
        'chown',
        'chgrp',
        // Text processing
        'grep',
        'egrep',
        'fgrep',
        'awk',
        'sed',
        'sort',
        'uniq',
        'cut',
        'tr',
        'wc',
        'diff',
        'cmp',
        'comm',
        'join',
        'paste',
        'column',
        'tee',
        // System information
        'uname',
        'whoami',
        'id',
        'groups',
        'w',
        'who',
        'last',
        'lastlog',
        'uptime',
        'free',
        'vmstat',
        'iostat',
        'top',
        'htop',
        'ps',
        'pstree',
        'jobs',
        'fg',
        'bg',
        'lscpu',
        'lsmem',
        'lsblk',
        'lsusb',
        'lspci',
        'lsmod',
        'dmesg',
        'dmidecode',
        'fdisk',
        'parted',
        'blkid',
        'mount',
        'umount',
        'lsof',
        'fuser',
        // Network
        'ping',
        'ping6',
        'traceroute',
        'tracepath',
        'nslookup',
        'dig',
        'host',
        'netstat',
        'ss',
        'ip',
        'route',
        'arp',
        'iwconfig',
        'iwlist',
        'nmcli',
        'curl',
        'wget',
        'nc',
        'netcat',
        'telnet',
        'ssh',
        'scp',
        'rsync',
        // Process management
        'kill',
        'killall',
        'pkill',
        'pgrep',
        'nohup',
        'timeout',
        'sleep',
        // Archive operations
        'tar',
        'gzip',
        'gunzip',
        'zip',
        'unzip',
        'bzip2',
        'bunzip2',
        'xz',
        'unxz',
        '7z',
        'rar',
        'unrar',
        // Development tools
        'git',
        'make',
        'gcc',
        'g++',
        'python',
        'python3',
        'node',
        'npm',
        'yarn',
        'java',
        'javac',
        'ruby',
        'perl',
        'php',
        'go',
        'rustc',
        'cargo',
        // Text editors
        'nano',
        'vim',
        'vi',
        'emacs',
        'gedit',
        'kate',
        // System configuration
        'locale',
        'locale-gen',
        'dpkg-reconfigure',
        'update-alternatives',
        'alternatives',
        'eselect',
        'rc-update',
        'rc-service',
        // Hardware/drivers
        'lshw',
        'hwinfo',
        'inxi',
        'sensors',
        'nvidia-smi',
        'glxinfo',
        'xrandr',
        // Environment
        'env',
        'printenv',
        'export',
        'set',
        'unset',
        'alias',
        'unalias',
        'history',
        'fc',
        'hash',
        'command',
        'builtin',
        // Date/time
        'date',
        'cal',
        'timedatectl',
        'hwclock',
        // Misc utilities
        'echo',
        'printf',
        'test',
        'expr',
        'bc',
        'seq',
        'yes',
        'true',
        'false',
        'basename',
        'dirname',
        'pathchk',
        'mktemp',
        'shuf',
        'factor',
        'base64',
        'od',
        'hexdump',
        'xxd',
        'strings',
        'iconv',
        'split',
        'csplit',
        // Shells
        'bash',
        'sh',
      ];

      const baseCommand = path.basename(command);
      if (!allowedCommands.includes(baseCommand)) {
        console.warn(`Blocked unauthorized command: ${command}`);
        return false;
      }

      // Check for dangerous argument patterns
      const dangerousPatterns = [
        // Destructive file operations
        /rm\s+-rf\s+\/[^/]/, // rm -rf on root directories
        /del\s+\//,
        /format\s+/,
        /mkfs/,
        /dd\s+if=.*of=\/dev\/[sh]d/, // dd to disk devices
        // System control
        /shutdown/,
        /reboot/,
        /halt/,
        /init\s+[06]/,
        /systemctl\s+(poweroff|reboot|halt)/,
        // Dangerous sudo operations
        /sudo\s+rm\s+-rf\s+\/[^/]/,
        // Kernel modules that could be dangerous
        /modprobe.*-r.*essential/,
      ];

      const fullCommand = [command, ...args].join(' ');
      const isDangerous = dangerousPatterns.some((pattern) =>
        pattern.test(fullCommand),
      );

      if (isDangerous) {
        console.warn(`Blocked dangerous command pattern: ${fullCommand}`);
        return false;
      }

      return true;
    };

    ipcMain.handle(
      'shell:execute',
      async (
        _,
        command: string,
        args: string[] = [],
        options: Record<string, unknown> = {},
      ) => {
        try {
          if (!validateCommand(command, args)) {
            const errorMsg = this.isDevelopment
              ? 'Command validation failed (this should not happen in dev mode)'
              : `Command not allowed for security reasons: ${command}`;
            throw new Error(errorMsg);
          }

          const isSpawn = options.spawn === true;
          const timeout = (options.timeout as number) || 30000; // 30 second default timeout

          if (process.platform === 'darwin') {
            return await this.executeViaSsh(
              command,
              args,
              options,
              timeout,
              isSpawn,
            );
          }

          return await this.executeLocally(
            command,
            args,
            options,
            timeout,
            isSpawn,
          );
        } catch (error) {
          console.error('Shell execute error:', error);
          throw error;
        }
      },
    );
  }

  private async executeViaSsh(
    command: string,
    args: string[] = [],
    options: Record<string, unknown> = {},
    timeout: number,
    isSpawn: boolean,
  ): Promise<any> {
    let fullCommand;
    if (
      (command.includes('bash') || command.includes('sh')) &&
      args.includes('-c')
    ) {
      fullCommand = `${args.slice(1).join(' ')}`;
    } else {
      fullCommand = [command, ...args].join(' ');
    }

    let stdout = '';
    let stderr = '';

    return new Promise((resolve, reject) => {
      const client = new Client();
      client.connect(this.sshConfig as ConnectConfig);
      let isResolved = false;

      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          client.end();
          reject(new Error('SSH command execution timed out'));
        }
      }, timeout);

      const cleanup = () => {
        clearTimeout(timeoutId);
        try {
          client.destroy();
        } catch (error) {
          console.error('SSH client destroy error:', error);
        }
      };

      if (isSpawn) {
        client.on('ready', () => {
          client.exec(fullCommand, (err, stream) => {
            if (err) {
              console.error('SSH exec error:', err);
              cleanup();
              if (!isResolved) {
                isResolved = true;
                reject(new Error(`SSH exec error: ${err.message}`));
              }
              return;
            }

            if (!isResolved) {
              isResolved = true;
              console.log('SSH Stream ready', stream, stream.stderr);
              resolve({
                pid: `ssh-${Date.now()}`, // Fake PID for SSH processes
                kill: () => {
                  stream.destroy();
                  client.end();
                },
                stdout: stream,
                stderr: stream.stderr,
              });
            }
          });
        });
      } else {
        client.on('ready', () => {
          client.exec(fullCommand, (err, stream) => {
            if (err) reject(new Error(`SSH exec error: ${err.message}`));
            stream
              .on('close', (code: number) => {
                resolve({
                  code,
                  stdout: stdout.substring(0, 1024 * 1024), // Limit output to 1MB
                  stderr: stderr.substring(0, 1024 * 1024),
                  success: code === 0,
                });
                client.end();
              })
              .stdout.on('data', (data: string) => {
                stdout += data;
              })
              .stderr.on('data', (data) => {
                stderr += data;
              });
          });
        });
      }

      client.on('error', (err) => {
        console.error('SSH connection error:', err);
        cleanup();
        if (!isResolved) {
          isResolved = true;
          reject(new Error(`SSH connection error: ${err.message}`));
        }
      });
    });
  }

  private async executeLocally(
    command: string,
    args: string[] = [],
    options: Record<string, unknown> = {},
    timeout: number,
    isSpawn: boolean,
  ): Promise<any> {
    if (isSpawn) {
      // For spawned processes, return the child process handle immediately
      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout,
        ...options,
      });

      return {
        pid: child.pid,
        kill: () => child.kill(),
        stdout: child.stdout,
        stderr: child.stderr,
      };
    }

    // For executed commands, wait for completion with timeout
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout,
        ...options,
      });

      let stdout = '';
      let stderr = '';
      const timeoutId: NodeJS.Timeout = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('Command execution timed out'));
      }, timeout);

      const cleanup = () => {
        clearTimeout(timeoutId);
      };

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        cleanup();
        resolve({
          code,
          stdout: stdout.substring(0, 1024 * 1024), // Limit output to 1MB
          stderr: stderr.substring(0, 1024 * 1024),
          success: code === 0,
        });
      });

      child.on('error', (error) => {
        cleanup();
        console.error('Command execution error:', error);
        reject(new Error(`Command execution failed: ${error.message}`));
      });
    });
  }

  private setupStreamingHandlers(): void {
    // Handle streaming shell events from preload
    ipcMain.on('shell:stdout', (event, data) => {
      console.log(
        '[MAIN] Received shell:stdout:',
        data.processId,
        data.data?.substring(0, 100),
      );
      try {
        console.log('[MAIN] Forwarding shell:stdout to renderer');
        event.sender.send('shell:stdout', data);
        console.log('[MAIN] Successfully forwarded shell:stdout');
      } catch (error) {
        console.error('[MAIN] Failed to forward shell:stdout:', error);
      }
    });

    ipcMain.on('shell:stderr', (event, data) => {
      console.log(
        '[MAIN] Received shell:stderr:',
        data.processId,
        data.data?.substring(0, 100),
      );
      try {
        console.log('[MAIN] Forwarding shell:stderr to renderer');
        event.sender.send('shell:stderr', data);
        console.log('[MAIN] Successfully forwarded shell:stderr');
      } catch (error) {
        console.error('[MAIN] Failed to forward shell:stderr:', error);
      }
    });

    ipcMain.on('shell:close', (event, data) => {
      console.log(
        '[MAIN] Received shell:close:',
        data.processId,
        'code:',
        data.code,
      );
      try {
        console.log('[MAIN] Forwarding shell:close to renderer');
        event.sender.send('shell:close', data);
        console.log('[MAIN] Successfully forwarded shell:close');
      } catch (error) {
        console.error('[MAIN] Failed to forward shell:close:', error);
      }
    });

    ipcMain.on('shell:error', (event, data) => {
      console.log(
        '[MAIN] Received shell:error:',
        data.processId,
        data.error?.message,
      );
      try {
        console.log('[MAIN] Forwarding shell:error to renderer');
        event.sender.send('shell:error', data);
        console.log('[MAIN] Successfully forwarded shell:error');
      } catch (error) {
        console.error('[MAIN] Failed to forward shell:error:', error);
      }
    });
  }
}

export function createShellModule(isDevelopment = false) {
  return new ShellModule(isDevelopment);
}
