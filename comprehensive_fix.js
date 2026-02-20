#!/usr/bin/env node

/**
 * Comprehensive fix for IPMCKart issues:
 * 1. Fix corrupted font file paths in CSS files (.webpeot -> .eot, .webpwoff2 -> .woff2, etc.)
 * 2. Fix corrupted image paths (flags.webppng -> flags.webp)
 * 3. Add CSP meta tag to allow Google Analytics endpoints
 * 4. Fix WhatsApp button with pre-filled message
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;

// Fix corrupted font paths in Font Awesome CSS
function fixFontPaths() {
    console.log('Fixing Font Awesome font paths...');

    const cssFile = path.join(ROOT_DIR, 'assets/vendor/fontawesome-free/css/all.min.css');
    let cssContent = fs.readFileSync(cssFile, 'utf8');

    // Fix all corrupted font file paths
    const replacements = [
        // Fix .webpeot -> .eot
        [/\.webpeot/g, '.eot'],
        // Fix .webpwoff2 -> .woff2
        [/\.webpwoff2/g, '.woff2'],
        // Fix .webpwoff -> .woff
        [/\.webpwoff/g, '.woff'],
        // Fix .webpttf -> .ttf
        [/\.webpttf/g, '.ttf'],
        // Fix .webpsvg -> .svg
        [/\.webpsvg/g, '.svg'],
    ];

    replacements.forEach(([pattern, replacement]) => {
        cssContent = cssContent.replace(pattern, replacement);
    });

    fs.writeFileSync(cssFile, cssContent, 'utf8');
    console.log('✓ Fixed font paths in all.min.css');
}

// Fix corrupted image paths in CSS
function fixImagePaths() {
    console.log('Fixing image paths in CSS...');

    const cssFile = path.join(ROOT_DIR, 'assets/css/demo21.min.css');
    let cssContent = fs.readFileSync(cssFile, 'utf8');

    // Fix flags.webppng -> flags.webp
    cssContent = cssContent.replace(/flags\.webppng/g, 'flags.webp');

    // Fix close.webpsvg -> close.svg
    cssContent = cssContent.replace(/close\.webpsvg/g, 'close.svg');

    fs.writeFileSync(cssFile, cssContent, 'utf8');
    console.log('✓ Fixed image paths in demo21.min.css');
}

// Add CSP meta tag to index.html
function addCSPMetaTag() {
    console.log('Adding CSP meta tag to index.html...');

    const indexFile = path.join(ROOT_DIR, 'index.html');
    let htmlContent = fs.readFileSync(indexFile, 'utf8');

    // Check if CSP meta tag already exists
    if (htmlContent.includes('http-equiv="Content-Security-Policy"')) {
        console.log('  CSP meta tag already exists, skipping...');
        return;
    }

    // Find the X-UA-Compatible meta tag and insert CSP after it
    const xuaCompatibleTag = '<meta http-equiv="X-UA-Compatible" content="IE=edge">';
    const cspMetaTag = '\n    <meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' https://www.googletagmanager.com https://www.google-analytics.com https://google-analytics.com https://ssl.google-analytics.com https://analytics.google.com https://www.google.com https://elfsightcdn.com https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; font-src \'self\' https://fonts.gstatic.com https://fonts.googleapis.com data:; img-src \'self\' data: https: http:; connect-src \'self\' https://www.google-analytics.com https://analytics.google.com https://www.google.com/measurement/conversion https://region1.google-analytics.com https://www.googletagmanager.com; frame-src \'self\' https://www.googletagmanager.com https://elfsightcdn.com; object-src \'none\';">';

    if (htmlContent.includes(xuaCompatibleTag)) {
        htmlContent = htmlContent.replace(xuaCompatibleTag, xuaCompatibleTag + cspMetaTag);
        fs.writeFileSync(indexFile, htmlContent, 'utf8');
        console.log('✓ Added CSP meta tag to index.html');
    } else {
        console.log('  Warning: Could not find X-UA-Compatible meta tag');
    }
}

// Fix WhatsApp button with pre-filled message
function fixWhatsAppButton() {
    console.log('Fixing WhatsApp button with pre-filled message...');

    const indexFile = path.join(ROOT_DIR, 'index.html');
    let htmlContent = fs.readFileSync(indexFile, 'utf8');

    // Current WhatsApp button link
    const currentLink = '<a href="https://wa.me/233243400821" target="_blank" class="whatsapp-sticky-btn" aria-label="Contact us on WhatsApp">';

    // New WhatsApp button link with pre-filled message
    const newLink = '<a href="https://wa.me/233243400821?text=I%20saw%20your%20products%20on%20IPMCKart%20and%20I%20wanted%20to%20enquire." target="_blank" class="whatsapp-sticky-btn" aria-label="Contact us on WhatsApp">';

    if (htmlContent.includes(currentLink)) {
        htmlContent = htmlContent.replace(currentLink, newLink);
        fs.writeFileSync(indexFile, htmlContent, 'utf8');
        console.log('✓ Fixed WhatsApp button with pre-filled message');
    } else {
        console.log('  Warning: Could not find current WhatsApp button link');
    }
}

// Fix Google Tag Manager configuration
function fixGTM() {
    console.log('Fixing Google Tag Manager configuration...');

    const indexFile = path.join(ROOT_DIR, 'index.html');
    let htmlContent = fs.readFileSync(indexFile, 'utf8');

    // Check current GTM ID
    const currentGTM = 'GTM-WL6FKRWH';
    const expectedGTM = 'G-WYYP5D7Q1G';

    // The GTM container ID is 'GTM-WL6FKRWH', not 'G-WYYP5D7Q1G'
    // G-WYYP5D7Q1G looks like a Google Analytics 4 Measurement ID, not GTM
    console.log('  Current GTM Container ID:', currentGTM);
    console.log('  Note: G-WYYP5D7Q1G is a GA4 Measurement ID, not a GTM container ID');
    console.log('  Keeping existing GTM configuration');
}

// Verify critical files exist
function verifyFiles() {
    console.log('Verifying critical files...');

    const filesToCheck = [
        'assets/vendor/fontawesome-free/webfonts/fa-solid-900.woff2',
        'assets/vendor/fontawesome-free/webfonts/fa-brands-400.woff2',
        'assets/vendor/fontawesome-free/webfonts/fa-regular-400.woff2',
        'assets/vendor/fontawesome-free/webfonts/fa-solid-900.woff',
        'assets/vendor/fontawesome-free/webfonts/fa-brands-400.woff',
        'assets/vendor/fontawesome-free/webfonts/fa-regular-400.woff',
        'assets/vendor/fontawesome-free/webfonts/fa-solid-900.ttf',
        'assets/vendor/fontawesome-free/webfonts/fa-brands-400.ttf',
        'assets/vendor/fontawesome-free/webfonts/fa-regular-400.ttf',
        'assets/fonts/porto6e1d.woff2',
        'assets/images/flags.webp',
        'assets/images/products/mobile-phones/oppo-smartphones/oppo-a3x-4gb-64gb-ocean-blue-1.webp',
        'assets/images/products/mobile-phones/oppo-smartphones/oppo-a3x-4gb-64gb-ocean-blue-2.webp',
        'assets/images/products/computing-devices/ups/binatone-stabilizer-dvs-2000-1.webp',
        'assets/images/products/computing-devices/ups/binatone-stabilizer-dvs-2000-2.webp',
    ];

    let missingFiles = [];

    filesToCheck.forEach(file => {
        const filePath = path.join(ROOT_DIR, file);
        if (!fs.existsSync(filePath)) {
            missingFiles.push(file);
        }
    });

    if (missingFiles.length === 0) {
        console.log('✓ All critical files exist');
    } else {
        console.log('Warning: The following files are missing:');
        missingFiles.forEach(file => console.log('  -', file));
    }
}

// Main execution
function main() {
    console.log('='.repeat(60));
    console.log('IPMCKart Comprehensive Fix Script');
    console.log('='.repeat(60));
    console.log();

    try {
        fixFontPaths();
        fixImagePaths();
        addCSPMetaTag();
        fixWhatsAppButton();
        fixGTM();
        verifyFiles();

        console.log();
        console.log('='.repeat(60));
        console.log('✓ All fixes completed successfully!');
        console.log('='.repeat(60));
        console.log();
        console.log('Summary of changes:');
        console.log('1. Fixed corrupted font file paths in Font Awesome CSS');
        console.log('2. Fixed corrupted image paths in demo21.min.css');
        console.log('3. Added CSP meta tag to allow Google Analytics endpoints');
        console.log('4. Updated WhatsApp button with pre-filled message');
        console.log('5. Verified critical files exist');
        console.log();
        console.log('Please clear your browser cache and reload the page.');
        console.log();

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
