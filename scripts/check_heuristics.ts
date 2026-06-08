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
    } else if (file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = getFiles('./src').filter(f => !f.includes('mock-'));
let hasErrors = false;

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('.includes(') && (line.includes("'sat'") || line.includes("'microwave'") || line.includes("'fso'"))) {
      // Flag checks that do not have any database linkType check context in the file
      if (!content.includes('dbLinkType') && !content.includes('linkType ===') && !content.includes('linkType ||')) {
        console.error(`Error: Legacy naming heuristic check on line ${index + 1} of ${file}: "${line.trim()}"`);
        console.error(`       Please prioritize database linkType checks (e.g. inventoryMappingAttributes?.linkType) first.`);
        hasErrors = true;
      }
    }
  });
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log('Heuristic checks scan completed successfully. No legacy bypasses found!');
  process.exit(0);
}
