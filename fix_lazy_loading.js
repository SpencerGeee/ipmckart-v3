#!/usr/bin/env node

/**
 * Fix lazy loading issues in HTML files
 * - Add proper image attributes
 * - Ensure placeholders are set correctly
 * - Fix missing link tags
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;

// Fix lazy loading in index.html
function fixLazyLoadingInIndex() {
    console.log('Fixing lazy loading in index.html...');

    const indexFile = path.join(ROOT_DIR, 'index.html');
    let content = fs.readFileSync(indexFile, 'utf8');

    // Fix missing opening <a> tag before cart product image
    // Looking for pattern: <figure class="product-image-container">\n\n\n\n                                                    <img
    const badPattern1 = /<figure class="product-image-container">\s+<img/g;
    const goodPattern1 = '<figure class="product-image-container">\n                                                    <a href="#">\n                                                        <img';

    content = content.replace(badPattern1, goodPattern1);

    // Fix images with loading="lazy" that might need fetchpriority
    // Add fetchpriority="low" to lazy-loaded images below the fold
    content = content.replace(
        /(<img\s+[^>]*loading="lazy"[^>]*)(>)/g,
        '$1 fetchpriority="low" decoding="async"$2'
    );

    // Ensure all lazy images have alt attributes
    content = content.replace(
        /<img\s+([^>]*?)loading="lazy"([^>]*?)(?:>|\/>)/g,
        (match, before, after) => {
            if (!before.includes('alt=') && !after.includes('alt=')) {
                return `<img ${before}alt=""${after}>`;
            }
            return match;
        }
    );

    fs.writeFileSync(indexFile, content, 'utf8');
    console.log('✓ Fixed lazy loading issues in index.html');
}

// Add lazy loading to other images that should have it
function addLazyLoadingToImages() {
    console.log('Adding lazy loading to images...');

    const filesToFix = [
        'about.html',
        'contact.html',
        'category1.html',
        'category-page.html',
        'blog.html',
        'checkout.html',
    ];

    filesToFix.forEach(filename => {
        const filePath = path.join(ROOT_DIR, filename);
        if (!fs.existsSync(filePath)) return;

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Find all img tags that don't have loading attribute
        content = content.replace(
            /<img\s+([^>]*?)(?:(?:loading|fetchpriority|decoding)=["'][^"']*["'])?([^>]*?)(?:>|\/>)/g,
            (match, before, after) => {
                // Skip if already has loading attribute
                if (before.includes('loading=') || after.includes('loading=')) {
                    return match;
                }

                // Skip images that should load immediately (logos, hero images)
                if (
                    before.includes('logo') ||
                    before.includes('banner') ||
                    before.includes('favicon') ||
                    before.includes('srcset') ||
                    match.includes('fetchpriority="high"')
                ) {
                    return match;
                }

                modified = true;
                return `<img ${before}${after} loading="lazy" fetchpriority="low" decoding="async">`;
            }
        );

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('✓ Added lazy loading to:', filename);
        }
    });
}

// Fix critical image paths
function fixCriticalImagePaths() {
    console.log('Fixing critical image paths...');

    const indexFile = path.join(ROOT_DIR, 'index.html');
    let content = fs.readFileSync(indexFile, 'utf8');

    // Fix any double .webp extensions
    content = content.replace(/\.webp\.webp/g, '.webp');

    // Fix missing image paths in demo21 sections
    content = content.replace(
        /src="assets\/images\/demoes\/demo21\/banners\/blend\.webp"/g,
        'src="assets/images/demoes/demo21/products/blend.webp"'
    );

    // Fix any other common issues
    content = content.replace(/srcset="([^"]*?)\.webppng([^"]*?)"/g, 'srcset="$1.webp$2"');

    fs.writeFileSync(indexFile, content, 'utf8');
    console.log('✓ Fixed critical image paths in index.html');
}

function main() {
    console.log('='.repeat(60));
    console.log('Fixing Lazy Loading and Image Issues');
    console.log('='.repeat(60));
    console.log();

    try {
        fixLazyLoadingInIndex();
        addLazyLoadingToImages();
        fixCriticalImagePaths();

        console.log();
        console.log('='.repeat(60));
        console.log('✓ All lazy loading fixes completed!');
        console.log('='.repeat(60));
        console.log();
        console.log('Summary:');
        console.log('1. Fixed missing link tags in product images');
        console.log('2. Added fetchpriority and decoding attributes');
        console.log('3. Ensured all lazy images have alt attributes');
        console.log('4. Fixed double .webp extensions');
        console.log('5. Added lazy loading to appropriate images');
        console.log();

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
