require('dotenv').config();
const xlsx = require('xlsx');
const Product = require('./models/Product');
const mongoose = require('mongoose');

async function updateDescriptions() {
    console.log('Connecting to database...');
    await require('./db')();

    console.log('Reading Excel file...');
    const workbook = xlsx.readFile('/var/www/ipmckart/Product Discription.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

    console.log(`\nTotal rows in Excel: ${data.length}`);

    const normalizeString = (str) => String(str || '')
        .toLowerCase()
        .replace(/[^\w\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const allProducts = await Product.find({}).lean();
    console.log(`Total products in DB: ${allProducts.length}`);

    let updatedCount = 0;
    let skippedCount = 0;
    let notFound = [];

    console.log('\nProcessing rows...');

    for (const [index, row] of data.entries()) {
        const excelProductName = row['PRODUCT'];
        const keySpecs = row['KEY SPECS'];
        const newDescription = row['DISCRIPTION'];

        if (!excelProductName) continue;

        const exNorm = normalizeString(excelProductName);
        const exWords = exNorm.split(' ').filter(w => w.length > 1);
        
        let matches = allProducts.filter(p => {
            const dbNorm = normalizeString(p.name);
            // Try matching only the core words (more than 2 chars) and handle 'sea'/'sky' blue synonym
            const exCoreWords = exWords.filter(w => w.length > 2);
            const dbWords = dbNorm.split(' ');
            
            let matchScore = 0;
            for (const word of exCoreWords) {
                if (dbNorm.includes(word)) {
                    matchScore++;
                } else if (word === 'sea' && dbNorm.includes('sky')) {
                    matchScore++;
                } else if (word === 'sky' && dbNorm.includes('sea')) {
                    matchScore++;
                }
            }
            
            // Require at least 70% of core words to match
            return matchScore >= exCoreWords.length * 0.7;
        });

        let product = null;

        if (matches.length === 1) {
            product = matches[0];
        } else if (matches.length > 1) {
            const ramMatch = (keySpecs || '').match(/Memory:\s*(\d+\s*GB)/i);
            const storageMatch = (keySpecs || '').match(/Storage:\s*(\d+\s*GB)/i);
            
            const ram = ramMatch ? ramMatch[1].toLowerCase().replace(/\s/g, '') : '';
            const storage = storageMatch ? storageMatch[1].toLowerCase().replace(/\s/g, '') : '';

            product = matches.find(p => {
                const dbNorm = normalizeString(p.name).replace(/\s/g, '');
                if (ram && !dbNorm.includes(ram)) return false;
                if (storage && !dbNorm.includes(storage)) return false;
                return true;
            });
            
            if (!product) {
                product = matches[0];
            }
        }

        if (product) {
            const updateData = {};
            let shouldUpdate = false;

            const cleanDesc = (newDescription || '').replace(/\r\n/g, '\n').trim();
            const cleanSpecs = (keySpecs || '').replace(/\r\n/g, '\n').trim();

            const currentDesc = (product.description || '').replace(/\r\n/g, '\n').trim();
            const currentSpecs = (product.fullDescription || '').replace(/\r\n/g, '\n').trim();

            if (cleanDesc && currentDesc !== cleanDesc) {
                updateData.description = cleanDesc;
                shouldUpdate = true;
            }

            if (cleanSpecs && currentSpecs !== cleanSpecs) {
                updateData.fullDescription = cleanSpecs;
                shouldUpdate = true;
            }

            if (shouldUpdate) {
                await Product.findByIdAndUpdate(product._id, updateData);
                updatedCount++;
                console.log(`✅ [UPDATED] Row ${index + 2}: Matched "${excelProductName}" to DB product "${product.name}"`);
            } else {
                skippedCount++;
            }
        } else {
            notFound.push({ product: excelProductName, row: index + 2 });
            console.log(`❌ [NOT FOUND] Row ${index + 2}: "${excelProductName}"`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Total updated: ${updatedCount}`);
    console.log(`ℹ️  Total skipped (no changes): ${skippedCount}`);
    console.log(`❌ Total not found: ${notFound.length}`);

    if (updatedCount > 0) {
        console.log('\nTriggering JSON regeneration...');
    }

    mongoose.connection.close();
}

updateDescriptions().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
});
