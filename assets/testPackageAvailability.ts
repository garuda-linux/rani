import { execSync } from 'node:child_process';
import { gamingPackageLists } from '../src/app/gaming/package-lists';

const inRepo: string[] = execSync('pacman -Ssq').toString().split('\n');
console.log(`In total ${inRepo.length} packages were found in the repositories\n`);

const missing: string[] = [];
let total = 0;

for (const tab of gamingPackageLists) {
  if (tab.name === 'gaming.aur') continue;
  console.log(`Checking tab: ${tab.name}`);

  for (const section of tab.sections) {
    if (!inRepo.includes(section.pkgname[0])) {
      missing.push(section.pkgname[0]);
    }
    total++;
  }
}

console.log(`\n${missing.length} packages of ${total} are missing from the repositories`);
console.log(missing.join('\n'));
