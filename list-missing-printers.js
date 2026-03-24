const mongoose = require('mongoose');
const Product = require('./models/Product');
const xlsx = require('xlsx');
require('dotenv').config();

async function run() {
    await require('./db')();
    
    const workbook = xlsx.readFile('/var/www/ipmckart/assets/js/Product Discription (printers).xlsx');
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    
    const excelNames = data.map(r => r['PRODUCT']).filter(n => n && n !== 'PRODUCT');
    
    const products = await Product.find({}).lean();
    
    const missed = [];
    
    for (const exName of excelNames) {
        // Let's see if this product has the 'fixed-printers' in its image URL. If not, it was missed.
        const exNameNorm = exName.toLowerCase().replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
        const exWords = exNameNorm.split(' ').filter(w => w.length > 2);
        
        const matches = products.filter(p => {
            const dbFull = (p.name + ' ' + p.slug).toLowerCase();
            return exWords.every(w => dbFull.includes(w));
        });
        
        if (matches.length > 0) {
            const p = matches[0];
            const hasFixedImage = p.images && p.images.some(img => img.includes('fixed-printers') || img.includes('-fixed-'));
            if (!hasFixedImage) {
                missed.push(p.name);
            }
        }
    }
    
    console.log("MISSING PRODUCTS TO UPDATE:");
    console.log(missed.join('\n'));
    
    mongoose.connection.close();
}
run().catch(console.error);
