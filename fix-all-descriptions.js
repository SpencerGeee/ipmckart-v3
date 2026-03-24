require('dotenv').config();
const xlsx = require('xlsx');
const Product = require('./models/Product');

const EXCEL_FILES = [
  { path: 'Product Discription (UPS).xlsx', name: 'UPS Products' },
  { path: 'assets/js/Product Discription (printers).xlsx', name: 'Printer Products' },
  { path: 'Product Discription.xlsx', name: 'General Products' }
];

async function fixAllDescriptions() {
  console.log('='.repeat(80));
  console.log('BULK PRODUCT DESCRIPTION FIXER');
  console.log('='.repeat(80));
  
  console.log('\nConnecting to database...');
  await require('./db')();

  const normalizeString = (str) => String(str || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const allProducts = await Product.find({}).lean();
  console.log(`📦 Total products in DB: ${allProducts.length}\n`);

  let totalUpdated = 0;
  let totalMatched = 0;
  let totalNotFound = [];

  for (const file of EXCEL_FILES) {
    console.log('\n' + '='.repeat(80));
    console.log(`📂 Processing: ${file.name} (${file.path})`);
    console.log('='.repeat(80));

    try {
      const workbook = xlsx.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const excelData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

      console.log(`   Rows in Excel: ${excelData.length}`);
      console.log(`   Columns: ${Object.keys(excelData[0] || {})}`);

      let fileUpdated = 0;
      let fileMatched = 0;
      let fileNotFound = [];

      for (const [index, row] of excelData.entries()) {
        const excelProductName = row['PRODUCT'];
        const excelKeySpecs = row['KEY SPECS'];
        const excelDescription = row['DISCRIPTION'];

        if (!excelProductName) continue;

        // Find product with flexible matching
        let product = allProducts.find(p => normalizeString(p.name) === normalizeString(excelProductName));

        if (!product) {
          product = allProducts.find(p => {
            const dbNorm = normalizeString(p.name);
            const exNorm = normalizeString(excelProductName);
            if (!exNorm || !dbNorm) return false;
            return dbNorm.includes(exNorm) || exNorm.includes(dbNorm);
          });
        }

        if (product) {
          fileMatched++;
          const updateData = {};
          let shouldUpdate = false;

          const cleanKeySpecs = (excelKeySpecs || '').replace(/\r\n/g, '\n').trim();
          const cleanDescription = (excelDescription || '').replace(/\r\n/g, '\n').trim();
          const currentFullDesc = (product.fullDescription || '').replace(/\r\n/g, '\n').trim();
          const currentDesc = (product.description || '').replace(/\r\n/g, '\n').trim();

          // Update fullDescription if KEY SPECS is different
          if (cleanKeySpecs && currentFullDesc !== cleanKeySpecs) {
            updateData.fullDescription = cleanKeySpecs;
            shouldUpdate = true;
          }

          // Update description if different
          if (cleanDescription && currentDesc !== cleanDescription) {
            updateData.description = cleanDescription;
            shouldUpdate = true;
          }

          if (shouldUpdate) {
            await Product.findByIdAndUpdate(product._id, updateData);
            fileUpdated++;
            totalUpdated++;
            console.log(`   ✅ [${index + 2}] "${excelProductName.substring(0, 40)}..." - UPDATED`);
          }
        } else {
          fileNotFound.push({ product: excelProductName, row: index + 2 });
          console.log(`   ❌ [${index + 2}] "${excelProductName.substring(0, 40)}..." - NOT FOUND`);
        }
      }

      totalMatched += fileMatched;
      totalNotFound = [...totalNotFound, ...fileNotFound];

      console.log(`\n📊 ${file.name} Summary:`);
      console.log(`   Matched: ${fileMatched}`);
      console.log(`   Updated: ${fileUpdated}`);
      console.log(`   Not Found: ${fileNotFound.length}`);

    } catch (err) {
      console.log(`   ⚠️  Error reading file: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Total products matched: ${totalMatched}`);
  console.log(`✅ Total products updated: ${totalUpdated}`);
  console.log(`❌ Total products not found: ${totalNotFound.length}`);

  if (totalNotFound.length > 0) {
    console.log('\n📋 Not Found Products:');
    totalNotFound.forEach(item => {
      console.log(`   - "${item.product}" (Row ${item.row})`);
    });
  }

  console.log('\n✨ All descriptions have been synchronized!');
  process.exit(0);
}

fixAllDescriptions().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
