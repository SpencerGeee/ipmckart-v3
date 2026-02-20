const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IMAGE_THRESHOLD_KB = 200;
const IMAGE_QUALITY = 80;

function optimizeImage(filePath) {
  const stats = fs.statSync(filePath);
  const sizeKB = stats.size / 1024;
  
  if (sizeKB < IMAGE_THRESHOLD_KB) {
    return { skipped: true, sizeKB };
  }
  
  const tempPath = filePath + '.optimized.webp';
  
  try {
    execSync(`cwebp -q ${IMAGE_QUALITY} "${filePath}" -o "${tempPath}"`, { stdio: 'pipe' });
    
    const tempStats = fs.statSync(tempPath);
    const tempSizeKB = tempStats.size / 1024;
    
    if (tempSizeKB < sizeKB) {
      fs.unlinkSync(filePath);
      fs.renameSync(tempPath, filePath);
      console.log(`✓ Optimized: ${filePath} (${sizeKB.toFixed(1)}KB → ${tempSizeKB.toFixed(1)}KB)`);
      return { optimized: true, originalSize: sizeKB, newSize: tempSizeKB, saved: sizeKB - tempSizeKB };
    } else {
      fs.unlinkSync(tempPath);
      console.log(`- No improvement: ${filePath} (${sizeKB.toFixed(1)}KB)`);
      return { noImprovement: true, sizeKB };
    }
  } catch (error) {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    console.error(`✗ Failed to optimize: ${filePath}`, error.message);
    return { error: true, sizeKB };
  }
}

function findImages(dir) {
  const images = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      images.push(...findImages(filePath));
    } else if (file.endsWith('.webp') && !file.includes('.optimized.') && !dir.includes('node_modules')) {
      images.push(filePath);
    }
  }
  
  return images;
}

function main() {
  console.log('Starting WebP image optimization...\n');
  
  const images = findImages(process.cwd());
  console.log(`Found ${images.length} WebP images\n`);
  
  let optimized = 0;
  let skipped = 0;
  let totalSaved = 0;
  
  for (const imagePath of images) {
    const result = optimizeImage(imagePath);
    
    if (result.optimized) {
      optimized++;
      totalSaved += result.saved;
    } else if (result.skipped) {
      skipped++;
    }
  }
  
  console.log(`\nOptimization complete!`);
  console.log(`- Optimized: ${optimized} images`);
  console.log(`- Skipped: ${skipped} images (under ${IMAGE_THRESHOLD_KB}KB threshold)`);
  console.log(`- Total saved: ${totalSaved.toFixed(1)}KB (${(totalSaved / 1024).toFixed(2)}MB)`);
}

main();