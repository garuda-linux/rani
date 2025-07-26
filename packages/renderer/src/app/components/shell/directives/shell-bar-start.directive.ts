import { Directive } from '@angular/core';

@Directive({
  selector: '[garudaShellBarStart]',
  host: {
    class: 'garuda-shell__bar_start',
  },
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Angular directive requires class
export class ShellBarStartDirective {}
