require('dotenv').config();
const xlsx = require('xlsx');
const Product = require('./models/Product');

async function updatePrices() {
  console.log('Connecting to database...');
  await require('./db')();

  console.log('Reading Excel file...');
  const workbook = xlsx.readFile('/var/www/ipmckart/complete_product_mapping.xlsx');
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
  let invalidPrices = [];

  console.log('\nProcessing ALL MAPPED rows (including duplicates)...');
  
  for (const [index, row] of data.entries()) {
    // Only process MAPPED rows
    if (row['Mapping Status'] !== 'MAPPED') continue;

    const dbProductName = row['Database Product Name'];
    const newPrice = parseFloat(row['New Price']);
    const category = row['Category'];

    if (!dbProductName) continue;

    // Validate price
    if (isNaN(newPrice) || newPrice <= 0) {
      invalidPrices.push({ product: dbProductName, providedPrice: row['New Price'] });
      console.log(`❌ INVALID PRICE (Row ${index + 2}): "${dbProductName.substring(0, 50)}" - Price: ${row['New Price']}`);
      continue;
    }

    // Find product by exact name match
    const product = allProducts.find(p => normalizeString(p.name) === normalizeString(dbProductName));

    if (product) {
      const currentPrice = product.price;
      
      // Always update if price is different, even by small amount
      if (Math.abs(currentPrice - newPrice) >= 0.01) {
        await Product.findByIdAndUpdate(product._id, { price: Number(newPrice) });
        updated++;
        
        const diff = newPrice - currentPrice;
        const percentChange = currentPrice > 0 ? ((newPrice - currentPrice) / currentPrice * 100).toFixed(2) : 0;
        const diffSign = diff > 0 ? '+' : '';
        
        console.log(`✅ UPDATED #${updated} (Row ${index + 2}): "${dbProductName.substring(0, 45)}..."`);
        console.log(`   Slug: ${product.slug}`);
        console.log(`   Price: ${currentPrice} → ${newPrice} (${diffSign}${diff.toFixed(2)}, ${diffSign}${percentChange}%)`);
        console.log('');
      }
    } else {
      notFound.push({ product: dbProductName, row: index + 2 });
      console.log(`❌ NOT FOUND (Row ${index + 2}): "${dbProductName.substring(0, 50)}..."`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully updated: ${updated} products`);
  console.log(`❌ Products not found: ${notFound.length}`);
  console.log(`⚠️  Invalid prices: ${invalidPrices.length}`);

  if (notFound.length > 0) {
    console.log('\nProducts NOT FOUND:');
    notFound.forEach(n => {
      console.log(`  Row ${n.row}: ${n.product.substring(0, 60)}`);
    });
  }

  if (invalidPrices.length > 0) {
    console.log('\nProducts with INVALID PRICES:');
    invalidPrices.forEach(n => {
      console.log(`  Row ${n.row || '?'}: ${n.product.substring(0, 50)}: ${n.providedPrice}`);
    });
  }

  // Trigger product JSON regeneration
  console.log('\nRegenerating products.grouped2.json...');
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const products = await Product.find({ active: true }).lean();
    const grouped = {};
    
    products.forEach(p => {
      if (!grouped[p.category]) {
        grouped[p.category] = [];
      }
      grouped[p.category].push({
        id: p.slug,
        slug: p.slug,
        categoryId: p.category,
        categoryName: '',
        subcategoryId: p.subcategory || '',
        subcategoryName: '',
        brand: p.brand || '',
        name: p.name,
        price: p.price,
        stock: p.stock || 0,
        rating: p.rating || 0,
        images: Array.isArray(p.images) ? p.images : [],
        description: p.description || '',
        fullDescription: p.fullDescription || '',
        active: p.active !== false
      });
    });

    await fs.writeFile(
      path.join(__dirname, 'products.grouped2.json'),
      JSON.stringify(grouped, null, 2)
    );
    console.log('✅ products.grouped2.json regenerated');
  } catch (err) {
    console.error('❌ Error regenerating products.grouped2.json:', err.message);
  }

  console.log('\n✅ Price update complete!');
  process.exit(0);
}

updatePrices().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});