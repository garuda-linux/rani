import { Directive } from '@angular/core';

@Directive({
  selector: 'a[garudaShellBarLink]',
  host: {
    class: 'p-menubar-item-link garuda-shell__bar-link',
  },
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Angular directive requires class
export class ShellBarLinkDirective {}
