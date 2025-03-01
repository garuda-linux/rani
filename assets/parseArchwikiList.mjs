import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// Read the list of racing games from the file
// This is supposed to taken from the Arch wiki source, e.g.
// https://wiki.archlinux.org/index.php?title=List_of_games&action=edit
const entries = readFileSync('./games.txt', 'utf8').split('\n');

function parseAppEntry(entryString) {
  if (!entryString.includes('{{App|') || !entryString.endsWith('}}')) {
    return null;
  }

  // Replace all links to Wikipedia ([[Wikipedia:Article|Article]]) with just the article name
  const noWikipedia = entryString.replace(/\[\[Wikipedia:(.*?)\|(.*?)]]/g, '$2');
  const content = noWikipedia.split(/^.*\{\{App/)[1];

  const parts = content.split('|');
  if (parts.length < 3) {
    return null;
  }

  const appData = {};

  appData.name = parts[1].replace('[[', '').replace(']]', '');
  appData.description = parts[2].replace('{{Grp|kde-games}}', 'Part of KDE Games');
  appData.url = parts[3].replace('http://', 'https://');
  appData.icon = 'generic.png';

  const packageInfoStr = parts[4];
  appData.type = packageInfoStr.split('|')[0].replace('{{', '');
  appData.pkgname = [parts[5].replace('}}}}', '')];

  return appData;
}

const allEntries = [];
for (const entry of entries) {
  const parsedData = parseAppEntry(entry);
  if (parsedData) {
    console.log(`Parsed Entry: ${entry}`);
    console.log('-'.repeat(30));
    allEntries.push(parsedData);
  } else {
    console.log(`Failed to parse entry: ${entry}`);
    console.log('-'.repeat(30));
  }
}

console.log(`Parsed ${allEntries.length} entries`);

let toDisplay = [];
let inAur = [];

// Get a list of all packages in repo and compare with AUR packages
let aurPkg = allEntries.filter((game) => game.type === 'AUR');
const inRepo = execSync('pacman -Ssq').toString().split('\n');
for (const entry of aurPkg) {
  if (inRepo.includes(entry.pkgname[0])) {
    toDisplay.push(entry);
  } else {
    entry.aur = true;
    inAur.push(entry);
  }
}

// Add all Arch packages
let archPkg = allEntries.filter((game) => game.type === 'Pkg');
toDisplay.push(...archPkg);

// Cleanup the data
toDisplay = toDisplay.map((entry) => delete entry.type && entry);
inAur = inAur.map((entry) => delete entry.type && entry);

// Sort and write the data to files
writeFileSync('./repo.json', JSON.stringify(toDisplay.sort((a, b) => a.name.localeCompare(b.name))));
writeFileSync('./aur.json', JSON.stringify(inAur.sort((a, b) => a.name.localeCompare(b.name))));
