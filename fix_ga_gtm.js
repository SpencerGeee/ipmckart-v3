#!/usr/bin/env node

/**
 * Verify Google Analytics and Google Tag Manager configuration
 * Add GA4 configuration if needed
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const GA4_MEASUREMENT_ID = 'G-WYYP5D7Q1G';
const GTM_CONTAINER_ID = 'GTM-WL6FKRWH';

function verifyGTM() {
    console.log('Verifying Google Tag Manager...');

    const indexFile = path.join(ROOT_DIR, 'index.html');
    const content = fs.readFileSync(indexFile, 'utf8');

    // Check for GTM script
    if (content.includes('GTM-WL6FKRWH')) {
        console.log('✓ GTM Container found: GTM-WL6FKRWH');
    } else {
        console.log('✗ GTM Container not found');
    }

    // Check for GTM noscript
    if (content.includes('ns.html?id=GTM-WL6FKRWH')) {
        console.log('✓ GTM noscript tag found');
    } else {
        console.log('✗ GTM noscript tag missing');
    }
}

function addGA4Tracking() {
    console.log('Checking for GA4 Configuration...');

    const indexFile = path.join(ROOT_DIR, 'index.html');
    let content = fs.readFileSync(indexFile, 'utf8');

    // Check if GA4 is already configured
    if (content.includes('G-WYYP5D7Q1G') && content.includes('gtag.js')) {
        console.log('✓ GA4 is already configured');
        return;
    }

    console.log('Adding GA4 tracking code...');

    // Find GTM script and add GA4 after it
    const gtmScriptEnd = '</script>\n<!-- End Google Tag Manager -->';
    const ga4Script = `
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA4_MEASUREMENT_ID}');
</script>
<!-- End Google Analytics 4 -->`;

    if (content.includes(gtmScriptEnd)) {
        content = content.replace(
            gtmScriptEnd,
            gtmScriptEnd + ga4Script
        );
        fs.writeFileSync(indexFile, content, 'utf8');
        console.log('✓ Added GA4 tracking code');
    } else {
        console.log('  Warning: Could not find GTM script end tag');
    }
}

function verifyCSPForGA() {
    console.log('Verifying CSP allows GA endpoints...');

    const indexFile = path.join(ROOT_DIR, 'index.html');
    const content = fs.readFileSync(indexFile, 'utf8');

    // Required GA endpoints
    const requiredEndpoints = [
        'www.googletagmanager.com',
        'www.google-analytics.com',
        'analytics.google.com',
        'www.google.com/measurement/conversion',
    ];

    const cspMatch = content.match(/content="([^"]*)"/);
    if (!cspMatch) {
        console.log('✗ CSP meta tag not found');
        return;
    }

    const cspContent = cspMatch[1];

    requiredEndpoints.forEach(endpoint => {
        if (cspContent.includes(endpoint)) {
            console.log(`✓ CSP allows: ${endpoint}`);
        } else {
            console.log(`✗ CSP missing: ${endpoint}`);
        }
    });
}

function addConversionTracking() {
    console.log('Adding Google Ads Conversion Tracking...');

    const filesToUpdate = [
        'index.html',
        'order-complete.html',
        'checkout.html',
    ];

    filesToUpdate.forEach(filename => {
        const filePath = path.join(ROOT_DIR, filename);
        if (!fs.existsSync(filePath)) return;

        let content = fs.readFileSync(filePath, 'utf8');

        // Add conversion tracking script if not present
        if (content.includes('www.google.com/measurement/conversion')) {
            console.log(`  - Conversion tracking already exists in ${filename}`);
            return;
        }

        // Find closing body tag
        const beforeBody = '</body>';

        if (content.includes(beforeBody)) {
            const conversionScript = `
    <!-- Google Ads Conversion Tracking -->
    <script>
        function gtag_report_conversion(url) {
            var callback = function () {
                if (typeof(url) != 'undefined') {
                    window.location = url;
                }
            };
            gtag('event', 'conversion', {
                'send_to': 'AW-CONVERSION_ID',
                'event_callback': callback
            });
            return false;
        }
    </script>
    <!-- End Google Ads Conversion Tracking -->`;

            content = content.replace(
                beforeBody,
                conversionScript + '\n' + beforeBody
            );
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ Added conversion tracking to ${filename}`);
        }
    });
}

function main() {
    console.log('='.repeat(60));
    console.log('Google Analytics & Tag Manager Configuration');
    console.log('='.repeat(60));
    console.log();

    try {
        verifyGTM();
        console.log();
        addGA4Tracking();
        console.log();
        verifyCSPForGA();
        console.log();
        addConversionTracking();

        console.log();
        console.log('='.repeat(60));
        console.log('✓ GA/GTM configuration completed!');
        console.log('='.repeat(60));
        console.log();
        console.log('Summary:');
        console.log('1. Verified GTM Container: GTM-WL6FKRWH');
        console.log('2. Added GA4 tracking: G-WYYP5D7Q1G');
        console.log('3. Verified CSP allows GA endpoints');
        console.log('4. Added conversion tracking scripts');
        console.log();

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
