#!/usr/bin/env node

/**
 * Add CSP meta tag to all HTML files in root
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const CSP_META = '\n    <meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' https://www.googletagmanager.com https://www.google-analytics.com https://google-analytics.com https://ssl.google-analytics.com https://analytics.google.com https://www.google.com https://elfsightcdn.com https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; font-src \'self\' https://fonts.gstatic.com https://fonts.googleapis.com data:; img-src \'self\' data: https: http:; connect-src \'self\' https://www.google-analytics.com https://analytics.google.com https://www.google.com/measurement/conversion https://region1.google-analytics.com https://www.googletagmanager.com; frame-src \'self\' https://www.googletagmanager.com https://elfsightcdn.com; object-src \'none\';">';

function addCSPToFile(filePath) {
    const filename = path.basename(filePath);
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if CSP already exists
    if (content.includes('http-equiv="Content-Security-Policy"')) {
        return false;
    }

    // Find X-UA-Compatible meta tag
    const xuaCompatible = '<meta http-equiv="X-UA-Compatible" content="IE=edge">';

    if (content.includes(xuaCompatible)) {
        content = content.replace(xuaCompatible, xuaCompatible + CSP_META);
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }

    return false;
}

function main() {
    console.log('Adding CSP meta tags to HTML files...\n');

    const htmlFiles = [
        'about.html',
        'contact.html',
        'wishlist.html',
        'login.html',
        'register.html',
        'cart.html',
        'checkout.html',
        'product.html',
        'category1.html',
        'category-page.html',
        'blog.html',
        'privacy-policy.html',
        'order-complete.html',
        'dashboard.html',
        'forgot-password.html',
    ];

    let fixedCount = 0;

    htmlFiles.forEach(filename => {
        const filePath = path.join(ROOT_DIR, filename);
        if (!fs.existsSync(filePath)) {
            console.log('  - File not found:', filename);
            return;
        }

        try {
            if (addCSPToFile(filePath)) {
                console.log('✓ Added CSP to:', filename);
                fixedCount++;
            } else {
                console.log('  - CSP already exists or tag not found:', filename);
            }
        } catch (error) {
            console.error('✗ Error:', filename, error.message);
        }
    });

    console.log(`\nTotal files updated: ${fixedCount}`);
}

main();
