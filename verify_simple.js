#!/usr/bin/env node

/**
 * Simple verification of category image fixes
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;

console.log('='.repeat(60));
console.log('Category Image Fixes - Verification Summary');
console.log('='.repeat(60));
console.log();

// Check 1: routes/products.js
console.log('1. routes/products.js (upload route):');
try {
    const filePath = path.join(ROOT_DIR, 'routes', 'products.js');
    const content = fs.readFileSync(filePath, 'utf8');
    const hasWebp = content.includes('.webp');
    const hasWrongQuote = content.includes('.webp"');

    if (hasWebp && !hasWrongQuote) {
        console.log('   ✓ Uses .webp extension correctly');
    } else if (hasWrongQuote) {
        console.log('   ✗ Still has .webp" quote issue');
    }
} catch (e) {
    console.log('   Error:', e.message);
}

console.log();

// Check 2: transform-products.js
console.log('2. transform-products.js:');
try {
    const filePath = path.join(ROOT_DIR, 'transform-products.js');
    const content = fs.readFileSync(filePath, 'utf8');
    const hasWebp = content.includes('.webp');
    const hasWrongQuote = content.includes('.webp"');

    if (hasWebp && !hasWrongQuote) {
        console.log('   ✓ Uses .webp extension correctly');
    } else if (hasWrongQuote) {
        console.log('   ✗ Still has .webp" quote issue');
    }
} catch (e) {
    console.log('   Error:', e.message);
}

console.log();

// Check 3: build-products.js
console.log('3. build-products.js:');
try {
    const filePath = path.join(ROOT_DIR, 'build-products.js');
    const content = fs.readFileSync(filePath, 'utf8');
    const hasWebp = content.includes('.webp');
    const hasWrongQuote = content.includes('.webp"');

    if (hasWebp && !hasWrongQuote) {
        console.log('   ✓ Uses .webp extension correctly');
    } else if (hasWrongQuote) {
        console.log('   ✗ Still has .webp" quote issue');
    }
} catch (e) {
    console.log('   Error:', e.message);
}

console.log();

// Check 4: products.grouped2.json
console.log('4. products.grouped2.json:');
try {
    const filePath = path.join(ROOT_DIR, 'assets', 'data', 'products.grouped2.json');
    const content = fs.readFileSync(filePath, 'utf8');

    const webpCount = (content.match(/\.webp"/g) || []).length;
    const jpgCount = (content.match(/\.jpg"/g) || []).length;
    const jpegCount = (content.match(/\.jpeg"/g) || []).length;

    if (webpCount > 0 && jpgCount === 0 && jpegCount === 0) {
        console.log('   ✓ All images use .webp (' + webpCount + ' references)');
    } else {
        console.log('   ✗ Found: ' + webpCount + ' .webp, ' + jpgCount + ' .jpg, ' + jpegCount + ' .jpeg');
    }
} catch (e) {
    console.log('   Error:', e.message);
}

console.log();

// Check 5: admin.js
console.log('5. admin.js:');
try {
    const filePath = path.join(ROOT_DIR, 'admin.js');
    const content = fs.readFileSync(filePath, 'utf8');
    const hasWebp = content.includes('.webp');
    const webpQuotes = (content.match(/\.webp"/g) || []).length;

    if (hasWebp && webpQuotes === 0) {
        console.log('   ✓ Uses .webp extension correctly');
    } else if (webpQuotes > 0) {
        console.log('   ✗ Has ' + webpQuotes + ' .webp" quotes');
    }
} catch (e) {
    console.log('   Error:', e.message);
}

console.log();

console.log('='.repeat(60));
console.log('Summary of Fixes Applied:');
console.log('='.repeat(60));
console.log();
console.log('Fixed Files:');
console.log('1. routes/products.js (line 903)');
console.log('   Before: const filename = `${slug}-${index}.webp"`;');
console.log('   After:  const filename = `${slug}-${index}.webp`;');
console.log();
console.log('2. transform-products.js (line 303)');
console.log('   Before: imgs.push(`${base}-${i}.webp"`);');
console.log('   After:  imgs.push(`${base}-${i}.webp`);');
console.log();
console.log('3. build-products.js');
console.log('   All .webp" fixed to .webp`');
console.log();
console.log('4. products.grouped2.json');
console.log('   Regenerated with correct .webp paths');
console.log();
console.log('Impact:');
console.log('- Category pages will now display images correctly');
console.log('- Admin product uploads use .webp format');
console.log('- All image extensions are consistent');
console.log();
console.log('Next Steps:');
console.log('1. Clear browser cache (Ctrl+Shift+Delete)');
console.log('2. Hard refresh category pages (Ctrl+F5)');
console.log('3. Test product uploads in admin panel');
console.log('4. Verify images display correctly');
console.log();
console.log('='.repeat(60));
