const fs = require('fs');
const path = require('path');

const replacements = [
  { find: /href=["']black-friday\.html["']/g, replace: 'href="christmas-sale.html"' },
  { find: /🖤\s*Black Friday/g, replace: '🎄 Christmas Sale' },
  { find: /Black Friday/g, replace: 'Christmas Sale' },
  { find: /black-friday/g, replace: 'christmas-sale' },
];

const excludeDirs = new Set(['node_modules','.git']);

function shouldProcess(file) { return file.endsWith('.html'); }

function processFile(file) {
  let content = fs.readFileSync(file,'utf8');
  let original = content;
  for (const r of replacements) {
    content = content.replace(r.find, r.replace);
  }
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!excludeDirs.has(entry.name)) walk(p);
    } else if (entry.isFile() && shouldProcess(p)) {
      processFile(p);
    }
  }
}

if (require.main === module) {
  walk(process.cwd());
}
