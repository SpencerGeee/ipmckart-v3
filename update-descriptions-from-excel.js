require('dotenv').config();
const xlsx = require('xlsx');
const Product = require('./models/Product');

async function updateDescriptions() {
  console.log('Connecting to database...');
  await require('./db')();

  console.log('Reading Excel file...');
  const workbook = xlsx.readFile('/var/www/ipmckart/Product List for IPMC Kart.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

  console.log(`\nTotal rows in Excel: ${data.length}`);

  const normalizeString = (str) => String(str || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
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
    const newDescription = row['DESCRIPTION'];
    const newSpecifications = row['SPECIFICATIONS'];

    if (!excelProductName) continue;
    if (excelProductName.startsWith('Note:')) continue;

    // Finding product with more flexible matching
    let product = allProducts.find(p => normalizeString(p.name) === normalizeString(excelProductName));
    
    // Fallback: Check if excel name is contained in DB name or vice-versa if no exact match
    if (!product) {
        product = allProducts.find(p => {
            const dbNorm = normalizeString(p.name);
            const exNorm = normalizeString(excelProductName);
            if (!exNorm || !dbNorm) return false;
            return dbNorm.includes(exNorm) || exNorm.includes(dbNorm);
        });
    }

    if (product) {
        const updateData = {};
        let shouldUpdate = false;

        // Clean up inputs (remove extra carriage returns etc)
        const cleanDesc = (newDescription || '').replace(/\r\n/g, '\n').trim();
        const cleanSpecs = (newSpecifications || '').replace(/\r\n/g, '\n').trim();

        // Check if DB current values are different from Excel clean values
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

  process.exit(0);
}

updateDescriptions().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});

async function updateDescriptions() {
  console.log('Connecting to database...');
  await require('./db')();

  console.log('Reading Excel file...');
  const workbook = xlsx.readFile('/var/www/ipmckart/Product List for IPMC Kart.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

  console.log(`\nTotal rows in Excel: ${data.length}`);

  const normalizeString = (str) => String(str || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
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
    const newDescription = row['DESCRIPTION'];
    const newSpecifications = row['SPECIFICATIONS'];

    if (!excelProductName) continue;
    if (excelProductName.startsWith('Note:')) continue;

    // Finding product with more flexible matching
    let product = allProducts.find(p => normalizeString(p.name) === normalizeString(excelProductName));
    
    // Fallback: Check if excel name is contained in DB name or vice-versa if no exact match
    if (!product) {
        product = allProducts.find(p => {
            const dbNorm = normalizeString(p.name);
            const exNorm = normalizeString(excelProductName);
            if (!exNorm || !dbNorm) return false;
            return dbNorm.includes(exNorm) || exNorm.includes(dbNorm);
        });
    }

    if (product) {
        const updateData = {};
        let shouldUpdate = false;

        // Clean up inputs (remove extra carriage returns etc)
        const cleanDesc = (newDescription || '').replace(/\r\n/g, '\n').trim();
        const cleanSpecs = (newSpecifications || '').replace(/\r\n/g, '\n').trim();

        if (cleanDesc && product.description !== cleanDesc) {
            updateData.description = cleanDesc;
            shouldUpdate = true;
        }

        if (cleanSpecs && product.fullDescription !== cleanSpecs) {
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

  process.exit(0);
}

updateDescriptions().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
async function updateDescriptions() {
  console.log('Connecting to database...');
  await require('./db')();

  console.log('Reading Excel file...');
  const workbook = xlsx.readFile('/var/www/ipmckart/Product List for IPMC Kart.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

  console.log(`\nTotal rows in Excel: ${data.length}`);

  const normalizeString = (str) => String(str || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const allProducts = await Product.find({}).lean();
  console.log(`Total products in DB: ${allProducts.length}`);

  let updated = 0;
  let notFound = [];

  console.log('\nProcessing rows...');

  for (const [index, row] of data.entries()) {
    const excelProductName = row['PRODUCT'];
    const newDescription = row['DESCRIPTION'];
    const newSpecifications = row['SPECIFICATIONS'];

    if (!excelProductName || !newDescription) continue;
    
    // Skip the note row if it exists
    if (excelProductName.startsWith('Note:')) continue;

    // Find product by exact name match (normalized)
    const product = allProducts.find(p => normalizeString(p.name) === normalizeString(excelProductName));

    if (product) {
        const updateData = {};
        let shouldUpdate = false;

        if (newDescription && product.description !== newDescription) {
            updateData.description = newDescription;
            shouldUpdate = true;
        }

        if (newSpecifications && product.fullDescription !== newSpecifications) {
            updateData.fullDescription = newSpecifications;
            shouldUpdate = true;
        }

        if (shouldUpdate) {
            await Product.findByIdAndUpdate(product._id, updateData);
            updated++;
            console.log(`✅ UPDATED #${updated} (Row ${index + 2}): "${excelProductName.substring(0, 45)}..."`);
        }
    } else {
      notFound.push({ product: excelProductName, row: index + 2 });
      // console.log(`❌ NOT FOUND (Row ${index + 2}): "${excelProductName.substring(0, 50)}..."`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully updated descriptions for: ${updated} products`);
  console.log(`❌ Products not found: ${notFound.length}`);

  if (updated > 0) {
      console.log('\nTriggering JSON regeneration...');
      // We'll call the regeneration logic here directly or run the script after
  }

  process.exit(0);
}

updateDescriptions().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
