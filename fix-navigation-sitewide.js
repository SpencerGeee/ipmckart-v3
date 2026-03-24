const fs = require('fs');
const path = require('path');

const directoryPath = '/var/www/ipmckart';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        if (f === 'node_modules' || f === '.git' || f === 'assets' || f === 'vendor') return;
    let dirPath = path.join(dir, f);
        try {
            let stat = fs.statSync(dirPath);
        if (stat.isDirectory()) {
                walkDir(dirPath, callback);
        } else {
                callback(dirPath);
    }
        } catch (e) {}
    });
}

const targetFiles = [];
walkDir(directoryPath, (filePath) => {
    if (filePath.endsWith('.html')) {
        targetFiles.push(filePath);
    }
});

console.log(`Processing ${targetFiles.length} HTML files...`);

const replacements = [
    {
        pattern: /href="valentines-sale\.html"/g,
        replacement: 'href="independence-day.html"'
    },
    {
        pattern: /href="newyear-sale\.html"/g,
        replacement: 'href="independence-day.html"'
    },
    {
        pattern: /💝 Valentine's Sales/g,
        replacement: '🇬🇭 Independence Day Sales'
    },
    {
        pattern: /Valentine's Day Sale/g,
        replacement: 'Independence Day Sale'
    },
    {
        pattern: /🎉 New Year Sale <span class="tip tip-hot">Hot!<\/span>/g,
        replacement: '🇬🇭 Independence Day Sale <span class="tip tip-hot">Hot!</span>'
    },
    {
        pattern: /🎉 New Year Sale/g,
        replacement: '🇬🇭 Independence Day Sale'
    }
];

let totalUpdated = 0;

targetFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    replacements.forEach(rep => {
        content = content.replace(rep.pattern, rep.replacement);
    });

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`✓ Updated: ${file}`);
        totalUpdated++;
    }
});

console.log(`\nCompleted! Updated ${totalUpdated} files.`);
