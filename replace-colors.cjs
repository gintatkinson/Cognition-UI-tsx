const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /bg-zinc-950(\/\d+)?/g, getReplacement: (match, p1) => `bg-background${p1 || ''}` },
  { regex: /bg-zinc-900(\/\d+)?/g, getReplacement: (match, p1) => `bg-muted${p1 || ''}` },
  { regex: /bg-zinc-800(\/\d+)?/g, getReplacement: (match, p1) => `bg-muted${p1 || ''}` },
  { regex: /border-zinc-800(\/\d+)?/g, getReplacement: (match, p1) => `border-border${p1 || ''}` },
  { regex: /border-zinc-900(\/\d+)?/g, getReplacement: (match, p1) => `border-border/50` }, // Simplified
  { regex: /text-zinc-100/g, getReplacement: () => `text-foreground` },
  { regex: /text-zinc-200/g, getReplacement: () => `text-foreground/90` },
  { regex: /text-zinc-300/g, getReplacement: () => `text-foreground/80` },
  { regex: /text-zinc-400/g, getReplacement: () => `text-muted-foreground` },
  { regex: /text-zinc-500/g, getReplacement: () => `text-muted-foreground` },
  { regex: /text-zinc-600/g, getReplacement: () => `text-muted-foreground/80` },
  { regex: /text-zinc-700/g, getReplacement: () => `text-muted-foreground/60` },
  // specific tailwind forms
  { regex: /hover:bg-zinc-900(\/\d+)?/g, getReplacement: (match, p1) => `hover:bg-muted${p1 || ''}` },
  { regex: /hover:bg-zinc-800(\/\d+)?/g, getReplacement: (match, p1) => `hover:bg-muted${p1 || ''}` },
  { regex: /hover:text-zinc-200/g, getReplacement: () => `hover:text-foreground` },
  { regex: /hover:text-zinc-300/g, getReplacement: () => `hover:text-foreground/90` },
  { regex: /hover:border-zinc-700/g, getReplacement: () => `hover:border-border/80` },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      replacements.forEach(({ regex, getReplacement }) => {
        content = content.replace(regex, getReplacement);
      });
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
console.log('done replacing zinc colors');
