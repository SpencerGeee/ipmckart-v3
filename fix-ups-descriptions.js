require('dotenv').config();
const xlsx = require('xlsx');
const Product = require('./models/Product');

async function fixUPSDescriptions() {
  console.log('Connecting to database...');
  await require('./db')();

  console.log('Reading UPS Excel file...');
  const workbook = xlsx.readFile('/var/www/ipmckart/Product Discription (UPS).xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const excelData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

  console.log(`\n📊 Excel Data Summary:`);
  console.log(`   Total rows in Excel: ${excelData.length}`);
  console.log(`   Columns: ${Object.keys(excelData[0] || {})}`);

  const normalizeString = (str) => String(str || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const allProducts = await Product.find({}).lean();
  console.log(`\n📦 Database Summary:`);
  console.log(`   Total products in DB: ${allProducts.length}`);

  console.log('\n' + '='.repeat(80));
  console.log('COMPARISON RESULTS');
  console.log('='.repeat(80));

  let updatedCount = 0;
  let matchedCount = 0;
  let notFound = [];
  let noChangeNeeded = 0;

  for (const [index, row] of excelData.entries()) {
    const excelProductName = row['PRODUCT'];
    const excelKeySpecs = row['KEY SPECS'];
    const excelDescription = row['DISCRIPTION'];

    if (!excelProductName) {
      console.log(`⚠️  Skipping row ${index + 2}: No product name`);
      continue;
    }

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
      matchedCount++;
      const updateData = {};
      let shouldUpdate = false;
      const changes = [];

      // Clean up inputs
      const cleanKeySpecs = (excelKeySpecs || '').replace(/\r\n/g, '\n').trim();
      const cleanDescription = (excelDescription || '').replace(/\r\n/g, '\n').trim();
      const currentFullDesc = (product.fullDescription || '').replace(/\r\n/g, '\n').trim();
      const currentDesc = (product.description || '').replace(/\r\n/g, '\n').trim();

      console.log(`\n📋 Product: "${excelProductName}"`);
      console.log(`   DB Product Name: "${product.name}"`);

      // Compare KEY SPECS with fullDescription
      if (cleanKeySpecs && currentFullDesc !== cleanKeySpecs) {
        updateData.fullDescription = cleanKeySpecs;
        shouldUpdate = true;
        changes.push(`KEY SPECS mismatch`);
        console.log(`   ⚠️  KEY SPECS differs from DB fullDescription`);
        console.log(`      Excel KEY SPECS length: ${cleanKeySpecs.length}`);
        console.log(`      DB fullDescription length: ${currentFullDesc.length}`);
        if (currentFullDesc) {
          console.log(`      DB current (first 100 chars): ${currentFullDesc.substring(0, 100)}...`);
        } else {
          console.log(`      DB current: (empty)`);
        }
      } else if (cleanKeySpecs) {
        console.log(`   ✅ KEY SPECS matches DB fullDescription`);
      }

      // Compare DISCRIPTION with description
      if (cleanDescription && currentDesc !== cleanDescription) {
        updateData.description = cleanDescription;
        shouldUpdate = true;
        changes.push(`DESCRIPTION mismatch`);
        console.log(`   ⚠️  DISCRIPTION differs from DB description`);
        console.log(`      Excel DISCRIPTION length: ${cleanDescription.length}`);
        console.log(`      DB description length: ${currentDesc.length}`);
      } else if (cleanDescription) {
        console.log(`   ✅ DISCRIPTION matches DB description`);
      }

      if (shouldUpdate) {
        await Product.findByIdAndUpdate(product._id, updateData);
        updatedCount++;
        console.log(`   ✅ UPDATED: ${changes.join(', ')}`);
      } else {
        noChangeNeeded++;
        console.log(`   ℹ️  No update needed`);
      }
    } else {
      notFound.push({ product: excelProductName, row: index + 2 });
      console.log(`\n❌ NOT FOUND: "${excelProductName}" (Row ${index + 2})`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Products matched from Excel: ${matchedCount}`);
  console.log(`✅ Products updated: ${updatedCount}`);
  console.log(`ℹ️  Products with no changes needed: ${noChangeNeeded}`);
  console.log(`❌ Products not found in DB: ${notFound.length}`);

  if (notFound.length > 0) {
    console.log('\n📋 Not Found Products:');
    notFound.forEach(item => {
      console.log(`   - "${item.product}" (Row ${item.row})`);
    });
  }

  process.exit(0);
}

fixUPSDescriptions().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
