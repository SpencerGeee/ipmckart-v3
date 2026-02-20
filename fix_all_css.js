#!/usr/bin/env node

/**
 * Fix corrupted font paths in ALL CSS files
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const CSS_DIR = path.join(ROOT_DIR, 'assets/css');

// Get all CSS files
function getAllCssFiles() {
    const files = fs.readdirSync(CSS_DIR)
        .filter(file => file.endsWith('.css'))
        .map(file => path.join(CSS_DIR, file));

    // Also check for Font Awesome CSS
    const faCssFile = path.join(ROOT_DIR, 'assets/vendor/fontawesome-free/css/all.min.css');
    if (fs.existsSync(faCssFile)) {
        files.push(faCssFile);
    }

    return files;
}

// Fix corrupted paths in a single file
function fixFilePaths(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalLength = content.length;

    // Fix all corrupted font file paths
    const replacements = [
        [/\.webpeot/g, '.eot'],
        [/\.webpwoff2/g, '.woff2'],
        [/\.webpwoff/g, '.woff'],
        [/\.webpttf/g, '.ttf'],
        [/\.webpsvg/g, '.svg'],
        [/flags\.webppng/g, 'flags.webp'],
        [/close\.webpsvg/g, 'close.svg'],
    ];

    replacements.forEach(([pattern, replacement]) => {
        content = content.replace(pattern, replacement);
    });

    // Only write if changes were made
    if (content.length !== originalLength) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    return false;
}

// Main execution
function main() {
    console.log('Fixing corrupted paths in ALL CSS files...\n');

    const cssFiles = getAllCssFiles();
    let fixedCount = 0;

    cssFiles.forEach(filePath => {
        const filename = path.basename(filePath);
        try {
            if (fixFilePaths(filePath)) {
                console.log('✓ Fixed:', filename);
                fixedCount++;
            } else {
                console.log('  - No changes needed:', filename);
            }
        } catch (error) {
            console.error('✗ Error processing:', filename, error.message);
        }
    });

    console.log(`\nTotal files fixed: ${fixedCount}/${cssFiles.length}`);
}

main();
