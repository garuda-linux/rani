import { execSync } from 'node:child_process';
import { gamingPackageLists } from '../src/app/gaming/package-lists';

const inRepo: string[] = execSync('pacman -Ssq').toString().split('\n');
const inAur: string[] = execSync('paru -Slaq', { maxBuffer: 10240000 }).toString().split('\n');

console.log(`In total ${inRepo.length} packages were found in the repositories`);
console.log(`In total ${inAur.length} packages were found in the AUR\n`);

const missing: string[] = [];
const missingAur: string[] = [];
let total: number = 0;
let totalAur: number = 0;

for (const tab of gamingPackageLists) {
  console.log(`Checking tab: ${tab.name}`);
  if (tab.name === 'gaming.aur') {
    for (const section of tab.sections) {
      if (!inAur.includes(section.pkgname[0])) {
        missingAur.push(section.pkgname[0]);
      }
      totalAur++;
    }
  } else {
    for (const section of tab.sections) {
      if (!inRepo.includes(section.pkgname[0])) {
        missing.push(section.pkgname[0]);
      }
      total++;
    }
  }
}

console.log(`\n${missing.length} packages of ${total} are missing from the repositories`);
console.log(missing.join('\n'));

console.log(`${missingAur.length} packages of ${totalAur} are missing from the AUR`);
console.log(missingAur.join('\n'));

if (missing.length > 0 || missingAur.length > 0) process.exit(1);
