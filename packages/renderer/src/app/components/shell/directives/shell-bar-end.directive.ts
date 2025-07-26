import { Directive } from '@angular/core';

@Directive({
  selector: '[garudaShellBarEnd]',
  host: {
    class: 'garuda-shell__bar-end',
  },
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Angular directive requires class
export class ShellBarEndDirective {}
