import '@analogjs/vitest-angular/setup-snapshots';
import { NgModule, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { getTestBed } from '@angular/core/testing';

@NgModule({
  providers: [provideExperimentalZonelessChangeDetection()],
})
export class ZonelessTestModule {}

getTestBed().initTestEnvironment([BrowserDynamicTestingModule, ZonelessTestModule], platformBrowserDynamicTesting());
