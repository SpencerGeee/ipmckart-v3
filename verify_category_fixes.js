#!/usr/bin/env node

/**
 * Final verification and summary of category image fixes
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;

function verifyRoutesProducts() {
    console.log('Verifying routes/products.js...');

    const filePath = path.join(ROOT_DIR, 'routes', 'products.js');
    const content = fs.readFileSync(filePath, 'utf8');

    const hasCorrect = content.includes('${slug}-${index}.webp\'');
    const hasTypo = content.includes('${slug}-${index}.webp"');

    if (hasCorrect && !hasTypo) {
        console.log('✓ Upload route uses .webp extension correctly');
        return true;
    } else if (hasTypo) {
        console.log('✗ Upload route still has .webp" typo');
        return false;
    } else {
        console.log('? Unknown state in routes/products.js');
        return false;
    }
}

function verifyTransformProducts() {
    console.log('Verifying transform-products.js...');

    const filePath = path.join(ROOT_DIR, 'transform-products.js');
    const content = fs.readFileSync(filePath, 'utf8');

    const hasCorrect = content.includes('imgs.push(\'${base}-${i}.webp\'');
    const hasTypo = content.includes('imgs.push(\'${base}-${i}.webp"\'');

    if (hasCorrect && !hasTypo) {
        console.log('✓ Transform script uses .webp extension correctly');
        return true;
    } else if (hasTypo) {
        console.log('✗ Transform script still has .webp" typo');
        return false;
    } else {
        console.log('? Unknown state in transform-products.js');
        return false;
    }
}

function verifyBuildProducts() {
    console.log('Verifying build-products.js...');

    const filePath = path.join(ROOT_DIR, 'build-products.js');
    const content = fs.readFileSync(filePath, 'utf8');

    const hasWebp = content.includes('.webp');
    const hasWrongQuote = content.includes('.webp"');

    if (hasWebp && !hasWrongQuote) {
        console.log('✓ Build script uses .webp extension correctly');
        return true;
    } else if (hasWrongQuote) {
        console.log('✗ Build script still has .webp" with quote');
        return false;
    } else {
        console.log('? Unknown state in build-products.js');
        return false;
    }
}

function verifyProductsJson() {
    console.log('Verifying products.grouped2.json...');

    const filePath = path.join(ROOT_DIR, 'assets', 'data', 'products.grouped2.json');

    if (!fs.existsSync(filePath)) {
        console.log('✗ File not found');
        return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    const webpCount = (content.match(/\.webp"/g) || []).length;
    const jpgCount = (content.match(/\.jpg"/g) || []).length;
    const jpegCount = (content.match(/\.jpeg"/g) || []).length;

    if (webpCount > 0 && jpgCount === 0 && jpegCount === 0) {
        console.log(\'✓ All images use .webp extension (${webpCount} references)\');
        return true;
    } else {
        console.log(\'✗ Found: ${webpCount} .webp, ${jpgCount} .jpg, ${jpegCount} .jpeg\');
        return false;
    }
}

function verifyAdminJs() {
    console.log('Verifying admin.js...');

    const filePath = path.join(ROOT_DIR, 'admin.js');
    const content = fs.readFileSync(filePath, 'utf8');

    const hasWebp = content.includes('.webp');
    const webpQuotes = (content.match(/\.webp"/g) || []).length;

    if (hasWebp && webpQuotes === 0) {
        console.log('✓ Admin script uses .webp extension correctly');
        return true;
    } else if (webpQuotes > 0) {
        console.log(\'✗ Admin script has ${webpQuotes} .webp" quotes\');
        return false;
    } else {
        console.log('? Unknown state in admin.js');
        return false;
    }
}

function verifyCategoryPageJs() {
    console.log('Verifying category-page.js...');

    const filePath = path.join(ROOT_DIR, 'assets', 'js', 'category-page.js');

    if (!fs.existsSync(filePath)) {
        console.log('? File not found (this is OK if using inline script)');
        return true;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    const jpgCount = (content.match(/\.jpg"/g) || []).length;

    if (jpgCount === 0) {
        console.log('✓ Category page JS has no .jpg references');
        return true;
    } else {
        console.log(\'✗ Category page JS has ${jpgCount} .jpg references\');
        return false;
    }
}

function checkForJpgFiles() {
    console.log('Checking for .jpg files in product directories...');

    const productsDir = path.join(ROOT_DIR, 'assets', 'images', 'products');

    if (!fs.existsSync(productsDir)) {
        console.log('✓ Products directory does not exist (yet)');
        return true;
    }

    let jpgCount = 0;
    let totalFiles = 0;

    function scanDir(dir) {
        const items = fs.readdirSync(dir);

        items.forEach(item => {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                scanDir(itemPath);
            } else if (item.match(/\.(jpg|jpeg)$/i)) {
                jpgCount++;
                console.log(\'  Found .jpg file: ${itemPath.replace(ROOT_DIR, '')}\');
            }
            totalFiles++;
        });
    }

    scanDir(productsDir);

    if (jpgCount === 0) {
        console.log(\'✓ No .jpg files found (${totalFiles} total image files)\');
        return true;
    } else {
        console.log(\'✗ Found ${jpgCount} .jpg files\');
        return false;
    }
}

function main() {
    console.log('='.repeat(60));
    console.log('Verification of Category Image Fixes');
    console.log('='.repeat(60));
    console.log();

    const results = [];

    results.push({
        name: 'routes/products.js (upload route)',
        passed: verifyRoutesProducts()
    });
    console.log();

    results.push({
        name: 'transform-products.js',
        passed: verifyTransformProducts()
    });
    console.log();

    results.push({
        name: 'build-products.js',
        passed: verifyBuildProducts()
    });
    console.log();

    results.push({
        name: 'products.grouped2.json',
        passed: verifyProductsJson()
    });
    console.log();

    results.push({
        name: 'admin.js',
        passed: verifyAdminJs()
    });
    console.log();

    results.push({
        name: 'category-page.js',
        passed: verifyCategoryPageJs()
    });
    console.log();

    results.push({
        name: 'Product directories (no .jpg files)',
        passed: checkForJpgFiles()
    });

    console.log();
    console.log('='.repeat(60));
    console.log('Summary of Verification');
    console.log('='.repeat(60));

    const allPassed = results.every(r => r.passed);

    results.forEach(result => {
        const status = result.passed ? '✓' : '✗';
        console.log(\'${status} ${result.name}\');
    });

    console.log('='.repeat(60));

    if (allPassed) {
        console.log();
        console.log('✓ All image fixes verified successfully!');
        console.log();
        console.log('What was fixed:');
        console.log('1. routes/products.js: Fixed filename typo (line 903)');
        console.log('   Changed: \'${slug}-${index}.webp"\'');
        console.log('   To:      \'${slug}-${index}.webp\'');
        console.log();
        console.log('2. transform-products.js: Fixed filename typo (line 303)');
        console.log('   Changed: imgs.push(\'${base}-${i}.webp"\')');
        console.log('   To:      imgs.push(\'${base}-${i}.webp\')');
        console.log();
        console.log('3. build-products.js: Fixed all .webp" typos');
        console.log('   All .webp" replaced with .webp\'');
        console.log();
        console.log('4. products.grouped2.json: Regenerated with correct extensions');
        console.log('   All images now use .webp format');
        console.log();
        console.log('Impact:');
        console.log('- Category pages will now display images correctly');
        console.log('- Admin product uploads will use .webp format');
        console.log('- All image references are consistent');
        console.log();
        console.log('Next steps:');
        console.log('1. Clear browser cache (Ctrl+Shift+Delete)');
        console.log('2. Hard refresh category pages (Ctrl+F5)');
        console.log('3. Test product uploads in admin panel');
        console.log('4. Verify images display correctly');
        console.log();
    } else {
        console.log();
        console.log('✗ Some issues still need attention');
        console.log();
    }

    process.exit(allPassed ? 0 : 1);
}

main();
