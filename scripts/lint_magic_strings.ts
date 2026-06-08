import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function getFiles(dir: string): string[] {
  let results: string[] = [];
  const list = readdirSync(dir);
  list.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = getFiles('./src').filter(f => !f.includes('types.ts') && !f.includes('mock-'));
let hasErrors = false;

const MAGIC_STRINGS = [
  'L0 (Optical)',
  'L1 (Transport)',
  'L2 (Ethernet)',
  'L3 (IP/MPLS)',
  'Mobile (RAN/Core)'
];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    for (const magic of MAGIC_STRINGS) {
      if (line.includes(`'${magic}'`) || line.includes(`"${magic}"`)) {
        if (!line.trim().startsWith('*') && !line.trim().startsWith('//') && !line.includes('export type')) {
          console.error(`Error: Hardcoded layer magic string "${magic}" found in ${file}:${index + 1}: "${line.trim()}"`);
          console.error(`       Please import and use the NetworkLayer constant from types.ts instead.`);
          hasErrors = true;
        }
      }
    }
  });
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log('Magic strings check completed successfully. No hardcoded layer strings found!');
  process.exit(0);
}
