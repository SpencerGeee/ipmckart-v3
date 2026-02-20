const fs = require('fs');
const path = require('path');

const CRITICAL_SELECTORS = [
  'assets/banner',
  'assets/tc.webp',
  'assets/tc1.webp',
  'sli2.webp',
  'favicon',
  'apple-touch-icon',
  'logo'
];

function isCriticalImage(src) {
  if (!src) return false;
  return CRITICAL_SELECTORS.some(selector => src.includes(selector));
}

function addLazyLoadingToImages(html) {
  let modified = 0;
  
  const result = html.replace(/<img([^>]*?)>/g, (match, attrs) => {
    if (match.includes('loading=')) {
      return match;
    }
    
    const srcMatch = attrs.match(/src=["']([^"']+)["']/);
    const src = srcMatch ? srcMatch[1] : '';
    
    if (isCriticalImage(src)) {
      return match;
    }
    
    modified++;
    return match.replace('<img', '<img loading="lazy" decoding="async"');
  });
  
  return { html: result, modified };
}

function processFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const { html: optimizedHtml, modified } = addLazyLoadingToImages(html);
  
  if (modified > 0) {
    fs.writeFileSync(filePath, optimizedHtml, 'utf8');
    console.log(`✓ ${filePath}: Added lazy loading to ${modified} images`);
    return modified;
  }
  
  return 0;
}

function main() {
  const htmlFiles = fs.readdirSync(process.cwd())
    .filter(file => file.endsWith('.html'))
    .filter(file => !file.startsWith('node_modules'));
  
  console.log(`Processing ${htmlFiles.length} HTML files...\n`);
  
  let totalModified = 0;
  
  for (const file of htmlFiles) {
    totalModified += processFile(path.join(process.cwd(), file));
  }
  
  console.log(`\nTotal images with lazy loading added: ${totalModified}`);
}

main();