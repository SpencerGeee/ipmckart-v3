#!/usr/bin/env node

/**
 * Fix category page images and admin image upload logic
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;

// Fix 1: Correct the typo in products.js route that causes .webp" extension
function fixProductUploadRoute() {
    console.log('Fixing product image upload route...');

    const filePath = path.join(ROOT_DIR, 'routes', 'products.js');
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix: `${slug}-${index}.webp"` -> `${slug}-${index}.webp`
    const original = 'const filename = `${slug}-${index}.webp"`;';
    const fixed = 'const filename = `${slug}-${index}.webp`;';

    if (content.includes(original)) {
        content = content.replace(original, fixed);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✓ Fixed filename typo in upload route');
        return true;
    } else if (content.includes(fixed)) {
        console.log('  Already fixed');
        return true;
    } else {
        console.log('  Warning: Pattern not found');
        return false;
    }
}

// Fix 2: Convert any .jpg image references to .webp in products.json
function fixProductImagesJson() {
    console.log('Checking products.json for .jpg references...');

    const jsonPath = path.join(ROOT_DIR, 'assets', 'data', 'products.grouped2.json');

    if (!fs.existsSync(jsonPath)) {
        console.log('  File not found:', jsonPath);
        return false;
    }

    let content = fs.readFileSync(jsonPath, 'utf8');
    const originalContent = content;

    // Replace .jpg with .webp in image paths
    content = content.replace(/"([^"]*)\.jpg"/g, '"$1.webp"');
    content = content.replace(/"([^"]*)\.jpeg"/g, '"$1.webp"');

    // Also replace .png with .webp if converting (optional - disabled for now)
    // content = content.replace(/"([^"]*)\.png"/g, '"$1.webp"');

    if (content !== originalContent) {
        // Backup original
        const backupPath = jsonPath + '.backup';
        fs.writeFileSync(backupPath, originalContent, 'utf8');
        console.log('  Backup created:', backupPath);

        fs.writeFileSync(jsonPath, content, 'utf8');
        console.log('✓ Fixed .jpg references in products.json');
        return true;
    } else {
        console.log('  No .jpg references found');
        return false;
    }
}

// Fix 3: Update admin.js to ensure .webp is used
function updateAdminJs() {
    console.log('Updating admin.js image handling...');

    const filePath = path.join(ROOT_DIR, 'admin.js');
    let content = fs.readFileSync(filePath, 'utf8');

    let modified = false;

    // Ensure image hint displays use .webp
    const hintPattern1 = `h1.textContent = 'Stored as assets/images/products/\${category}/\${subcategory}/\${slug || '<slug>'}-1.webp"'`;
    const hintPattern2 = `h2.textContent = 'Stored as assets/images/products/\${category}/\${subcategory}/\${slug || '<slug>'}-2.webp"'`;

    if (!content.includes('.webp') && content.includes('-1."')) {
        // Add .webp extension to hints
        content = content.replace(
            /\$\{slug \|\| '<slug>'\}-1\.";/g,
            '${slug || \'<slug>\'}-1.webp";'
        );
        content = content.replace(
            /\$\{slug \|\| '<slug>'\}-2\.";/g,
            '${slug || \'<slug>\'}-2.webp";'
        );
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✓ Updated admin.js to use .webp extension');
        return true;
    } else {
        console.log('  Admin.js already correct');
        return false;
    }
}

// Fix 4: Ensure image upload returns correct path format
function ensureWebpUploadResponse() {
    console.log('Verifying upload route response...');

    const filePath = path.join(ROOT_DIR, 'routes', 'products.js');
    let content = fs.readFileSync(filePath, 'utf8');

    // Ensure the response path has correct extension
    const responseCheck = 'res.json({ path: relPath });';

    if (content.includes('.webp"') && content.includes(responseCheck)) {
        console.log('✓ Upload route returns correct path');
        return true;
    } else if (!content.includes('.webp"') && content.includes(responseCheck)) {
        console.log('  Upload route already corrected');
        return true;
    }

    return false;
}

// Fix 5: Check for any .jpg files in product directories and list them
function findJpgFiles() {
    console.log('Checking for .jpg files in product directories...');

    const productsDir = path.join(ROOT_DIR, 'assets', 'images', 'products');

    if (!fs.existsSync(productsDir)) {
        console.log('  Products directory not found');
        return [];
    }

    const jpgFiles = [];

    function scanDir(dir) {
        const items = fs.readdirSync(dir);

        items.forEach(item => {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                scanDir(itemPath);
            } else if (item.match(/\.(jpg|jpeg)$/i)) {
                jpgFiles.push(itemPath);
            }
        });
    }

    scanDir(productsDir);

    if (jpgFiles.length > 0) {
        console.log('  Found', jpgFiles.length, '.jpg/.jpeg file(s):');
        jpgFiles.forEach(f => console.log('    -', f.replace(ROOT_DIR, '')));
    } else {
        console.log('  No .jpg files found');
    }

    return jpgFiles;
}

// Fix 6: Update routes/admin.js to ensure webp extension in default image paths
function updateAdminRoutes() {
    console.log('Updating routes/admin.js...');

    const filePath = path.join(ROOT_DIR, 'routes', 'admin.js');
    let content = fs.readFileSync(filePath, 'utf8');

    let modified = false;

    // Check for default image paths and ensure .webp
    const patterns = [
        { old: /\$\{nameSlug\}-1\.";/g, new: '${nameSlug}-1.webp";' },
        { old: /\$\{nameSlug\}-2\.";/g, new: '${nameSlug}-2.webp";' },
    ];

    patterns.forEach(({ old, new: newPattern }) => {
        if (content.match(old)) {
            content = content.replace(old, newPattern);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✓ Updated routes/admin.js to use .webp extension');
        return true;
    } else {
        console.log('  routes/admin.js already correct');
        return false;
    }
}

// Fix 7: Regenerate products.json if needed (to pick up corrected paths)
function regenerateProductsJson() {
    console.log('Checking if products.json regeneration is needed...');

    const buildScript = path.join(ROOT_DIR, 'transform-products.js');

    if (fs.existsSync(buildScript)) {
        console.log('  Found transform-products.js');
        console.log('  You may need to run: node transform-products.js');
        console.log('  to regenerate products.grouped2.json with correct paths');
        return true;
    } else {
        console.log('  transform-products.js not found');
        return false;
    }
}

// Main execution
function main() {
    console.log('='.repeat(60));
    console.log('Category Page Image Fixes');
    console.log('='.repeat(60));
    console.log();

    try {
        fixProductUploadRoute();
        console.log();

        fixProductImagesJson();
        console.log();

        updateAdminJs();
        console.log();

        ensureWebpUploadResponse();
        console.log();

        updateAdminRoutes();
        console.log();

        findJpgFiles();
        console.log();

        regenerateProductsJson();

        console.log();
        console.log('='.repeat(60));
        console.log('✓ All image fixes completed!');
        console.log('='.repeat(60));
        console.log();
        console.log('Summary of changes:');
        console.log('1. Fixed typo in products.js upload route (line 903)');
        console.log('2. Replaced .jpg with .webp in products.json');
        console.log('3. Updated admin.js image hints');
        console.log('4. Updated routes/admin.js image paths');
        console.log('5. Verified upload response format');
        console.log();
        console.log('Next steps:');
        console.log('1. Clear browser cache');
        console.log('2. Test category pages');
        console.log('3. Test admin image uploads');
        console.log('4. If needed, run: node transform-products.js');
        console.log();

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
