import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { Package } from '../src/app/gaming/interfaces';

// Read the list of racing games from the file
// This is supposed to taken from the Arch wiki source, e.g.
// https://wiki.archlinux.org/index.php?title=List_of_games&action=edit
let sources: string[] = ['games', 'documents', 'internet', 'multimedia', 'other', 'science', 'security', 'multimedia'];

// These need to be relative to the project root
sources = sources.map((source) => `assets/sources/${source}.txt`);

type AppData = Package & { type: string; pkgname: string[]; aur?: boolean };
type CleanedAppData = Package & { pkgname: string[]; aur?: boolean };

/**
 * Parse an entry from the Arch wiki list of application / games.
 * @param entryString The entry to parse (typically a single line from the wiki).
 * @returns The parsed data or null if the entry is not valid.
 */
function parseAppEntry(entryString: string): AppData | null {
  if (!entryString.includes('{{App|') || !entryString.endsWith('}}')) {
    return null;
  }

  // Replace all links to Wikipedia ([[Wikipedia:Article|Article]]) with just the article name
  const noWikipedia: string = entryString.replace(/\[\[Wikipedia:(.*?)\|(.*?)]]/g, '$2');
  const content: string = noWikipedia.split(/^.*\{\{App/)[1];
  const parts: string[] = content.split('|');

  if (parts.length < 3) {
    return null;
  }

  const appData: AppData = {
    description: undefined,
    icon: '',
    name: '',
    pkgname: [],
    type: '',
    url: undefined,
  };

  appData.name = parts[1].replace('[[', '').replace(']]', '');
  appData.description = parts[2].replace('{{Grp|kde-games}}', 'Part of KDE Games');
  appData.url = parts[3].replace('http://', 'https://');
  appData.icon = 'generic.png';

  const packageInfoStr: string = parts[4];
  appData.type = packageInfoStr.split('|')[0].replace('{{', '');
  appData.pkgname = [parts[5]?.replace('}}}}', '')];

  return appData;
}

for (const source of sources) {
  if (!existsSync(source)) {
    console.log(`Source: ${source} not found`);
    continue;
  }
  const entries: string[] = readFileSync(source, 'utf8').split('\n');

  const allEntries: AppData[] = [];
  for (const entry of entries) {
    const parsedData: AppData | null = parseAppEntry(entry);
    if (parsedData !== null) {
      allEntries.push(parsedData);
    }
  }

  console.log(`Parsed ${allEntries.length} entries`);

  let toDisplay: AppData[] = [];
  let inAur: AppData[] = [];

  // Get a list of all packages in repo and compare with AUR packages
  const aurPkg: AppData[] = allEntries.filter((game) => game.type === 'AUR');
  const inRepo: string[] = execSync('pacman -Ssq').toString().split('\n');

  for (const entry of aurPkg) {
    if (inRepo.includes(entry.pkgname[0])) {
      toDisplay.push(entry);
    } else {
      entry.aur = true;
      inAur.push(entry);
    }
  }

  // Add all Arch packages
  let archPkg: AppData[] = allEntries.filter((game) => game.type === 'Pkg');
  toDisplay.push(...archPkg);

  // Cleanup the data
  const cleanedAppData: CleanedAppData[] = toDisplay.map((entry) => {
    return { ...entry, type: undefined };
  });
  const cleanedInAur: CleanedAppData[] = inAur.map((entry) => {
    return { ...entry, type: undefined };
  });

  console.log(`Found ${toDisplay.length} in repo and ${inAur.length} in AUR`);

  // Sort and write the data to files
  writeFileSync(
    `./assets/parsed/${source.split('.')[0].split('/')[2]}-repo.json`,
    JSON.stringify(cleanedAppData.sort((a, b) => a.name.localeCompare(b.name))),
  );
  writeFileSync(
    `./assets/parsed/${source.split('.')[0].split('/')[2]}-aur.json`,
    JSON.stringify(cleanedInAur.sort((a, b) => a.name.localeCompare(b.name))),
  );
}
