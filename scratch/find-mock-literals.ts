import * as fs from 'fs';
import * as path from 'path';

function walkDir(dir: string, callback: (filePath: string) => void) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (stat.isFile() && /\.(tsx|ts|js|jsx|json)$/.test(file)) {
      callback(filePath);
    }
  }
}

const srcDir = path.resolve(process.cwd(), 'src');
console.log(`Scanning directory: ${srcDir}`);

const stringLiteralRegex = /(["'`])(.*?)\1/g;

walkDir(srcDir, (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    let match;
    stringLiteralRegex.lastIndex = 0; // Reset regex state
    while ((match = stringLiteralRegex.exec(line)) !== null) {
      const literalVal = match[2];
      if (/mock/i.test(literalVal)) {
        // Skip imports/require/export statements
        if (line.includes('import') || line.includes('require') || line.includes('export')) {
          continue;
        }
        const relPath = path.relative(process.cwd(), filePath);
        console.log(`[LITERAL] ${relPath}:${index + 1} -> ${match[0]}`);
      }
    }
  });
});
