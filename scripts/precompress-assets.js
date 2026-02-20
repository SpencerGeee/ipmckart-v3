const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const brotliCompress = promisify(zlib.brotliCompress);

const directoriesToCompress = [
  'assets/js',
  'assets/css',
  'assets/vendor',
  '.'
];

const extensionsToCompress = ['.js', '.css', '.json', '.html', '.svg', '.txt', '.xml'];

async function compressFile(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    if (!extensionsToCompress.includes(ext)) {
      return { file: filePath, status: 'skipped (extension)' };
    }
    
    const stats = fs.statSync(filePath);
    const originalSize = stats.size;
    
    // Skip small files (< 1KB)
    if (originalSize < 1024) {
      return { file: filePath, status: 'skipped (small)' };
    }
    
    // Skip already compressed files
    if (filePath.endsWith('.br') || filePath.endsWith('.gz')) {
      return { file: filePath, status: 'skipped (already compressed)' };
    }
    
    // Create Gzip
    const gzipped = await gzip(content, { level: 6 });
    const gzipPath = filePath + '.gz';
    fs.writeFileSync(gzipPath, gzipped);
    
    // Create Brotli
    const brotlied = await brotliCompress(content, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 6
      }
    });
    const brotliPath = filePath + '.br';
    fs.writeFileSync(brotliPath, brotlied);
    
    const gzipSavings = ((1 - gzipped.length / originalSize) * 100).toFixed(1);
    const brotliSavings = ((1 - brotlied.length / originalSize) * 100).toFixed(1);
    
    return {
      file: path.relative(process.cwd(), filePath),
      original: `${(originalSize / 1024).toFixed(1)} KB`,
      gzip: `${(gzipped.length / 1024).toFixed(1)} KB (${gzipSavings}%)`,
      brotli: `${(brotlied.length / 1024).toFixed(1)} KB (${brotliSavings}%)`,
      status: 'compressed'
    };
    
  } catch (error) {
    return { file: filePath, status: `error: ${error.message}` };
  }
}

async function walkDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      // Skip node_modules
      if (file === 'node_modules' || file === '.git') {
        continue;
      }
      await walkDirectory(filePath, fileList);
    } else if (stats.isFile()) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

async function precompressAssets() {
  console.log('🗜️  Pre-compressing static assets with Brotli and Gzip...\n');
  
  let allFiles = [];
  for (const dir of directoriesToCompress) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      await walkDirectory(dirPath, allFiles);
    }
  }
  
  console.log(`Found ${allFiles.length} files to process...\n`);
  
  const results = await Promise.all(allFiles.map(compressFile));
  
  // Print summary
  const compressed = results.filter(r => r.status === 'compressed');
  const skipped = results.filter(r => r.status.startsWith('skipped'));
  const errors = results.filter(r => r.status.startsWith('error'));
  
  console.log('\n📊 Compression Summary:');
  console.log(`   ✅ Compressed: ${compressed.length} files`);
  console.log(`   ⏭️  Skipped: ${skipped.length} files`);
  console.log(`   ❌ Errors: ${errors.length} files`);
  
  if (compressed.length > 0) {
    console.log('\n📁 Compressed Files (sample):');
    compressed.slice(0, 10).forEach(result => {
      console.log(`   ${result.file}`);
      console.log(`      Original: ${result.original}`);
      console.log(`      Gzip:    ${result.gzip}`);
      console.log(`      Brotli:   ${result.brotli}`);
    });
    
    if (compressed.length > 10) {
      console.log(`   ... and ${compressed.length - 10} more files`);
    }
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(e => console.log(`   ${e.file}: ${e.status}`));
  }
  
  console.log('\n✅ Pre-compression complete!');
  console.log('💡 Tip: Run this script after building assets for production.');
}

precompressAssets();