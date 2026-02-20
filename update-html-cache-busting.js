const fs = require('fs');
const path = require('path');

console.log('=== UPDATING HTML CACHE BUSTING ===\n');

// Update index.html, category pages, and other key pages
const htmlFiles = [
  'index.html',
  'category-page.html',
  'category1.html',
  'best-iphone-16-prices-ghana.html',
  'black-friday.html',
  'christmas-sale.html',
  'flash-sales.html',
  'search-results.html'
];

let updated = 0;

htmlFiles.forEach(filename => {
  try {
    if (!fs.existsSync(filename)) return;
    
    let content = fs.readFileSync(filename, 'utf8');
    const originalContent = content;
    
    // Add cache-busting version to JSON file references
    content = content.replace(
      /products\.grouped2\.json/g,
      'products.grouped2.json?v=' + Date.now()
    );
    content = content.replace(
      /products\.flat2\.json/g,
      'products.flat2.json?v=' + Date.now()
    );
    
    // Update promo JSON files too
    content = content.replace(
      /flash-sales\.json/g,
      'flash-sales.json?v=' + Date.now()
    );
    content = content.replace(
      /christmas-sale\.json/g,
      'christmas-sale.json?v=' + Date.now()
    );
    content = content.replace(
      /black-friday\.json/g,
      'black-friday.json?v=' + Date.now()
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filename, content, 'utf8');
      console.log(`✓ Updated: ${filename}`);
      updated++;
    }
  } catch (err) {
    console.log(`✗ Error with ${filename}: ${err.message}`);
  }
});

console.log(`\n✓ Updated ${updated} HTML files with cache-busting`);
console.log('✓ Browsers will now fetch latest product prices!');
process.exit(0);