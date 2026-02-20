const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const homepageFiles = [
  'cart-manager.js',
  'index-products.js',
  'flash-sales.js',
  'christmas-loader.js',
  'simple_active_state.js',
  'csp_fixes.js',
  'homepage_phase1_fixes.js',
  'homepage_special_offers.js',
  'homepage_nav_media.js',
  'homepage_new_sections.js',
  'global_product_sort.js'
];

async function bundleHomepageScripts() {
  console.log('📦 Bundling homepage JavaScript files...');
  
  try {
    let combinedContent = '';
    const basePath = path.join(__dirname, '..');
    
    for (const file of homepageFiles) {
      const filePath = path.join(basePath, file);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  File not found: ${file}`);
        continue;
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      combinedContent += `\n// === ${file} ===\n${content}\n;`;
      console.log(`✓ Added ${file}`);
    }
    
    if (!combinedContent) {
      console.error('❌ No content to bundle');
      return;
    }
    
    // Minify with Terser
    console.log('\n⚡ Minifying bundle...');
    const minified = await minify(combinedContent, {
      compress: {
        drop_console: false, // Keep console logs for debugging
        dead_code: true,
        unused: true
      },
      mangle: {
        toplevel: false,
        keep_fnames: true
      },
      output: {
        comments: false,
        beautify: false
      }
    });
    
    if (minified.error) {
      console.error('❌ Minification error:', minified.error);
      return;
    }
    
    const outputPath = path.join(basePath, 'home-scripts-bundle.min.js');
    fs.writeFileSync(outputPath, minified.code, 'utf8');
    
    const originalSize = Buffer.byteLength(combinedContent, 'utf8');
    const minifiedSize = Buffer.byteLength(minified.code, 'utf8');
    const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
    
    console.log(`\n✅ Bundle created successfully!`);
    console.log(`   Output: ${outputPath}`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`   Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
    console.log(`   Reduction: ${reduction}%`);
    console.log(`   Files combined: ${homepageFiles.length} → 1`);
    
  } catch (error) {
    console.error('❌ Error bundling scripts:', error);
    process.exit(1);
  }
}

bundleHomepageScripts();