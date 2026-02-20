const terser = require('terser');
const fs = require('fs');
const path = require('path');

// Define paths
const assetsJsPath = path.join(__dirname, '..', 'assets', 'js');
const outputFile = path.join(assetsJsPath, 'common.bundle.min.js');

// List of common JS files to be bundled and minified
// The order is important for dependencies (e.g., jQuery first)
const commonScripts = [
    // Core libraries
    'jquery.min.js',
    'bootstrap.bundle.min.js',
    
    // Plugins (assuming plugins.min.js contains multiple plugins)
    'plugins.min.js', 
    'jquery.appear.min.js',
    'jquery.plugin.min.js',
    'jquery.countdown.min.js',

    // Main application logic
    'main.min.js',
    'utils.js',
    'accessibility.js',
    
    // E-commerce features
    'cart.js',
    '../cart-manager.js', // This is in the root, so go up one level
    '../search-preview.js', // This is in the root
    'dynamic-purchase-popup.js',
    'wishlist-dynamic.js',
    'quick-view.js',
    
    // Page-specific logic that is common
    'index-animations.js',
    
    // Initialization scripts
    'page-init.js',
    'webfont-config.js',
    'webfont.js'
];

async function minifyAndBundle() {
    try {
        console.log('Starting script bundling and minification...');

        // 1. Read and concatenate all script files
        let concatenatedCode = '';
        for (const script of commonScripts) {
            const scriptPath = path.join(assetsJsPath, '..', script); // Adjust path to be relative to project root from `scripts` folder
             // Special handling for files in root
            if (script.startsWith('../')) {
                 const rootScriptPath = path.join(__dirname, '..', script.substring(3));
                 if (fs.existsSync(rootScriptPath)) {
                    console.log(`- Adding ${script}`);
                    concatenatedCode += fs.readFileSync(rootScriptPath, 'utf8') + '\n';
                } else {
                    console.warn(`- WARNING: Could not find ${rootScriptPath}. Skipping.`);
                }
            } else {
                 const fullPath = path.join(assetsJsPath, script);
                 if (fs.existsSync(fullPath)) {
                    console.log(`- Adding ${script}`);
                    concatenatedCode += fs.readFileSync(fullPath, 'utf8') + '\n';
                } else {
                    console.warn(`- WARNING: Could not find ${fullPath}. Skipping.`);
                }
            }
        }
        
        console.log('\nConcatenation complete. Total size:', concatenatedCode.length, 'bytes');
        
        // 2. Minify the concatenated code using Terser
        console.log('Minifying code with Terser...');
        const minifiedResult = await terser.minify(concatenatedCode, {
            mangle: {
                keep_fnames: true // Keep function names to avoid breaking some libraries
            },
            compress: {
                drop_console: true // Remove console.log statements
            }
        });

        if (minifiedResult.error) {
            throw new Error(minifiedResult.error);
        }

        console.log('Minification successful. Minified size:', minifiedResult.code.length, 'bytes');

        // 3. Write the final bundled and minified file
        fs.writeFileSync(outputFile, minifiedResult.code, 'utf8');
        console.log(`\nSuccessfully created bundle at: ${outputFile}`);
        
    } catch (error) {
        console.error('An error occurred during minification:', error);
        process.exit(1);
    }
}

minifyAndBundle();
