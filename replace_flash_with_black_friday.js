const fs = require('fs');
const path = require('path');

// Configuration
const replacements = [
    {
        find: /flash-sales\.html/g,
        replace: 'black-friday.html'
    },
    {
        find: /⚡︎ Flash Sales/g,
        replace: '🖤 Black Friday'
    },
    {
        find: /⚡ Flash Sales/g,
        replace: '🖤 Black Friday'
    },
    {
        find: /Flash Sales/g,
        replace: 'Black Friday'
    }
];

// Files to exclude from replacement
const excludeFiles = [
    'flash-sales.html',
    'flash-sales.js',
    'flash-sales.json',
    'replace_flash_with_black_friday.js',
    'node_modules',
    '.git',
    'package.json',
    'package-lock.json'
];

// Function to check if file should be processed
function shouldProcessFile(filePath) {
    const fileName = path.basename(filePath);
    const fileExtension = path.extname(filePath);
    
    // Only process HTML files
    if (fileExtension !== '.html') {
        return false;
    }
    
    // Skip excluded files
    if (excludeFiles.includes(fileName)) {
        return false;
    }
    
    return true;
}

// Function to process a single file
function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Apply all replacements
        replacements.forEach(replacement => {
            if (replacement.find.test(content)) {
                content = content.replace(replacement.find, replacement.replace);
                modified = true;
            }
        });
        
        // Write back if modified
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Updated: ${filePath}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Function to recursively process directory
function processDirectory(dirPath) {
    let processedCount = 0;
    
    try {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
                // Skip excluded directories
                if (!excludeFiles.includes(item)) {
                    processedCount += processDirectory(fullPath);
                }
            } else if (stats.isFile() && shouldProcessFile(fullPath)) {
                if (processFile(fullPath)) {
                    processedCount++;
                }
            }
        }
    } catch (error) {
        console.error(`❌ Error reading directory ${dirPath}:`, error.message);
    }
    
    return processedCount;
}

// Main execution
function main() {
    console.log('🚀 Starting Flash Sales to Black Friday replacement...\n');
    
    const startTime = Date.now();
    const currentDir = process.cwd();
    
    console.log(`📁 Processing directory: ${currentDir}`);
    console.log(`🎯 Looking for HTML files to update...\n`);
    
    const processedCount = processDirectory(currentDir);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`\n🎉 Replacement complete!`);
    console.log(`📊 Files updated: ${processedCount}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    
    if (processedCount > 0) {
        console.log(`\n📋 Summary of changes made:`);
        console.log(`   - flash-sales.html → black-friday.html`);
        console.log(`   - ⚡︎ Flash Sales → 🖤 Black Friday`);
        console.log(`   - ⚡ Flash Sales → 🖤 Black Friday`);
        console.log(`   - Flash Sales → Black Friday`);
        console.log(`\n⚠️  Note: The original flash-sales.html file was preserved.`);
    } else {
        console.log(`\n ℹ️ No files needed updating.`);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { processFile, processDirectory, shouldProcessFile };