#!/usr/bin/env node

/**
 * Final verification of all fixes
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;

// Check if file paths are correct
function checkFontPaths() {
    console.log('Checking Font Awesome font paths...');

    const cssFile = path.join(ROOT_DIR, 'assets/vendor/fontawesome-free/css/all.min.css');
    const content = fs.readFileSync(cssFile, 'utf8');

    // Check for corrupted paths
    const corruptedPaths = [
        '.webpeot',
        '.webpwoff2',
        '.webpwoff',
        '.webpttf',
        '.webpsvg',
    ];

    let hasCorrupted = false;
    corruptedPaths.forEach(corrupted => {
        if (content.includes(corrupted)) {
            console.log('✗ Found corrupted path:', corrupted);
            hasCorrupted = true;
        }
    });

    if (!hasCorrupted) {
        console.log('✓ All font paths are correct');
    }

    return !hasCorrupted;
}

function checkImagePaths() {
    console.log('Checking image paths...');

    const cssFile = path.join(ROOT_DIR, 'assets/css/demo21.min.css');
    const content = fs.readFileSync(cssFile, 'utf8');

    // Check for corrupted paths
    const corruptedPaths = ['flags.webppng', 'close.webpsvg'];

    let hasCorrupted = false;
    corruptedPaths.forEach(corrupted => {
        if (content.includes(corrupted)) {
            console.log('✗ Found corrupted path:', corrupted);
            hasCorrupted = true;
        }
    });

    if (!hasCorrupted) {
        console.log('✓ All image paths are correct');
    }

    return !hasCorrupted;
}

function checkCSP() {
    console.log('Checking CSP meta tags...');

    const files = [
        'index.html',
        'about.html',
        'contact.html',
        'product.html',
        'checkout.html',
    ];

    let allHaveCSP = true;

    files.forEach(filename => {
        const filePath = path.join(ROOT_DIR, filename);
        if (!fs.existsSync(filePath)) return;

        const content = fs.readFileSync(filePath, 'utf8');
        const hasCSP = content.includes('Content-Security-Policy');

        if (hasCSP) {
            console.log(`✓ ${filename}: CSP present`);
        } else {
            console.log(`✗ ${filename}: CSP missing`);
            allHaveCSP = false;
        }
    });

    return allHaveCSP;
}

function checkWhatsApp() {
    console.log('Checking WhatsApp button...');

    const indexFile = path.join(ROOT_DIR, 'index.html');
    const content = fs.readFileSync(indexFile, 'utf8');

    // Check for pre-filled message
    const preFilledURL = 'wa.me/233243400821?text=I%20saw%20your%20products%20on%20IPMCKart%20and%20I%20wanted%20to%20enquire.';

    if (content.includes(preFilledURL)) {
        console.log('✓ WhatsApp button has pre-filled message');
        return true;
    } else {
        console.log('✗ WhatsApp button missing pre-filled message');
        return false;
    }
}

function checkGA4() {
    console.log('Checking GA4 configuration...');

    const indexFile = path.join(ROOT_DIR, 'index.html');
    const content = fs.readFileSync(indexFile, 'utf8');

    // Check for GA4 script
    const hasGA4 = content.includes('G-WYYP5D7Q1G') && content.includes('gtag/js?id=');

    if (hasGA4) {
        console.log('✓ GA4 tracking code present (G-WYYP5D7Q1G)');
    } else {
        console.log('✗ GA4 tracking code missing');
    }

    // Check for GTM
    const hasGTM = content.includes('GTM-WL6FKRWH');

    if (hasGTM) {
        console.log('✓ GTM Container present (GTM-WL6FKRWH)');
    } else {
        console.log('✗ GTM Container missing');
    }

    return hasGA4 && hasGTM;
}

function checkCSPEndpoints() {
    console.log('Checking CSP allows required endpoints...');

    const indexFile = path.join(ROOT_DIR, 'index.html');
    const content = fs.readFileSync(indexFile, 'utf8');

    const cspMatch = content.match(/http-equiv="Content-Security-Policy"\s+content="([^"]*)"/);
    if (!cspMatch) {
        console.log('✗ CSP meta tag not found');
        return false;
    }

    const cspContent = cspMatch[1];

    const requiredEndpoints = [
        { name: 'googletagmanager.com', search: 'googletagmanager.com' },
        { name: 'google-analytics.com', search: 'google-analytics.com' },
        { name: 'analytics.google.com', search: 'analytics.google.com' },
        { name: 'www.google.com/measurement/conversion', search: 'www.google.com/measurement/conversion' },
    ];

    let allPresent = true;

    requiredEndpoints.forEach(({name, search}) => {
        if (cspContent.includes(search)) {
            console.log(`✓ CSP allows: ${name}`);
        } else {
            console.log(`✗ CSP missing: ${name}`);
            allPresent = false;
        }
    });

    return allPresent;
}

function checkFilesExist() {
    console.log('Checking critical files exist...');

    const files = [
        'assets/vendor/fontawesome-free/webfonts/fa-solid-900.woff2',
        'assets/vendor/fontawesome-free/webfonts/fa-brands-400.woff2',
        'assets/vendor/fontawesome-free/webfonts/fa-regular-400.woff2',
        'assets/fonts/porto6e1d.woff2',
        'assets/images/flags.webp',
        'assets/images/products/mobile-phones/oppo-smartphones/oppo-a3x-4gb-64gb-ocean-blue-1.webp',
        'assets/images/products/computing-devices/ups/binatone-stabilizer-dvs-2000-1.webp',
    ];

    let allExist = true;

    files.forEach(file => {
        const filePath = path.join(ROOT_DIR, file);
        if (fs.existsSync(filePath)) {
            console.log(`✓ ${file}`);
        } else {
            console.log(`✗ ${file} - MISSING`);
            allExist = false;
        }
    });

    return allExist;
}

function main() {
    console.log('='.repeat(60));
    console.log('Final Verification of All Fixes');
    console.log('='.repeat(60));
    console.log();

    const results = [];

    results.push({
        name: 'Font Paths',
        passed: checkFontPaths()
    });
    console.log();

    results.push({
        name: 'Image Paths',
        passed: checkImagePaths()
    });
    console.log();

    results.push({
        name: 'CSP Meta Tags',
        passed: checkCSP()
    });
    console.log();

    results.push({
        name: 'WhatsApp Button',
        passed: checkWhatsApp()
    });
    console.log();

    results.push({
        name: 'GA4 & GTM Configuration',
        passed: checkGA4()
    });
    console.log();

    results.push({
        name: 'CSP Endpoints',
        passed: checkCSPEndpoints()
    });
    console.log();

    results.push({
        name: 'Critical Files',
        passed: checkFilesExist()
    });

    console.log();
    console.log('='.repeat(60));
    console.log('Summary of Verification');
    console.log('='.repeat(60));

    const allPassed = results.every(r => r.passed);

    results.forEach(result => {
        const status = result.passed ? '✓' : '✗';
        console.log(`${status} ${result.name}`);
    });

    console.log('='.repeat(60));

    if (allPassed) {
        console.log();
        console.log('✓ All fixes verified successfully!');
        console.log();
        console.log('Next steps:');
        console.log('1. Clear your browser cache');
        console.log('2. Reload the page');
        console.log('3. Check browser console for any errors');
        console.log('4. Test WhatsApp button functionality');
        console.log();
    } else {
        console.log();
        console.log('✗ Some issues still need attention');
        console.log();
    }

    process.exit(allPassed ? 0 : 1);
}

main();
