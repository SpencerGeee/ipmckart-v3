const fs = require('fs');
const zlib = require('zlib');

function gzipCompress(inputPath, outputPath) {
  const input = fs.readFileSync(inputPath);
  const compressed = zlib.gzipSync(input, { level: 9 });
  fs.writeFileSync(outputPath, compressed);
  console.log(`✓ Gzipped: ${inputPath} → ${outputPath}`);
  console.log(`  Original: ${(input.length / 1024).toFixed(1)}KB → Compressed: ${(compressed.length / 1024).toFixed(1)}KB`);
  return compressed.length;
}

function brotliCompress(inputPath, outputPath) {
  try {
    const input = fs.readFileSync(inputPath);
    const compressed = zlib.brotliCompressSync(input, { quality: 11 });
    fs.writeFileSync(outputPath, compressed);
    console.log(`✓ Brotli: ${inputPath} → ${outputPath}`);
    console.log(`  Original: ${(input.length / 1024).toFixed(1)}KB → Compressed: ${(compressed.length / 1024).toFixed(1)}KB`);
    return compressed.length;
  } catch (e) {
    console.log(`✗ Brotli not available: ${e.message}`);
    return null;
  }
}

function main() {
  console.log('Compressing static assets...\n');

  const assets = [
    'assets/css/demo21.min.c1b82ef2.css',
    'assets/css/bootstrap.min.7b4ce378.css',
    'assets/js/common.bundle.min.fc8e2cc1.js',
    'assets/js/main.min.a419bb81.js',
    'products.grouped2.json'
  ];

  let totalOriginal = 0;
  let totalGzipped = 0;

  for (const asset of assets) {
    if (fs.existsSync(asset)) {
      const gzPath = asset + '.gz';
      const brPath = asset + '.br';
      
      const gzSize = gzipCompress(asset, gzPath);
      totalOriginal += fs.statSync(asset).size;
      totalGzipped += gzSize;

      try {
        brotliCompress(asset, brPath);
      } catch (e) {}
    }
  }

  console.log(`\nTotal: ${(totalOriginal / 1024).toFixed(1)}KB → ${(totalGzipped / 1024).toFixed(1)}KB (gzipped)`);
  console.log(`Compression ratio: ${((1 - totalGzipped / totalOriginal) * 100).toFixed(1)}%`);
}

main();