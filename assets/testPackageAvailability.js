'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var node_child_process_1 = require('node:child_process');
var package_lists_1 = require('../src/app/gaming/package-lists');
var inRepo = (0, node_child_process_1.execSync)('pacman -Ssq').toString().split('\n');
console.log('In total '.concat(inRepo.length, ' packages were found in the repositories\n'));
for (var _i = 0, gamingPackageLists_1 = package_lists_1.gamingPackageLists; _i < gamingPackageLists_1.length; _i++) {
  var tab = gamingPackageLists_1[_i];
  if (tab.name === 'gaming.aur') continue;
  console.log('Checking tab: '.concat(tab.name));
  for (var _a = 0, _b = tab.sections; _a < _b.length; _a++) {
    var section = _b[_a];
    if (!inRepo.includes(section.pkgname[0])) {
      console.log('Missing package: '.concat(section.pkgname));
    }
  }
  console.log('\n');
}
