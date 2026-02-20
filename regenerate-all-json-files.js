require('dotenv').config();
const Product = require('./models/Product');
const path = require('path');
const fs = require('fs').promises;

async function regenerateAllJsonFiles() {
  console.log('Connecting to database...');
  await require('./db')();

  console.log('Fetching all products from database...');
  const allProducts = await Product.find({}).lean();
  const activeProducts = allProducts.filter(p => p.active !== false);
  
  console.log(`Total products in DB: ${allProducts.length}`);
  console.log(`Active products: ${activeProducts.length}`);
  console.log('\n' + '='.repeat(70));
  console.log('GENERATING ALL PRODUCT JSON FILES');
  console.log('='.repeat(70));

  // Helper function to normalize product data
  const normalizeProduct = (p) => {
    const images = Array.isArray(p.images) ? p.images : (typeof p.images === 'string' ? p.images.split(',').map(s => s.trim()) : []);
    return {
      id: p.slug,
      slug: p.slug,
      categoryId: p.category || '',
      categoryName: '',
      subcategoryId: p.subcategory || '',
      subcategoryName: '',
      brand: p.brand || '',
      name: p.name,
      price: Number(p.price) || 0,
      stock: Number(p.stock) || 0,
      rating: Number(p.rating) || 0,
      images: images,
      description: (p.description || '').replace(/[\n\r\t]/g, ' ').trim(),
      fullDescription: (p.fullDescription || '').replace(/[\n\r\t]/g, ' ').trim(),
      active: p.active !== false,
      isFlashSale: p.isFlashSale || false,
      flashSalePrice: Number(p.flashSalePrice) || 0,
      flashSaleStock: Number(p.flashSaleStock) || 0,
      flashSaleSold: Number(p.flashSaleSold) || 0,
      flashSaleImage: (Array.isArray(p.flashSaleImage) && p.flashSaleImage[0]) || (typeof p.flashSaleImage === 'string' && p.flashSaleImage) || (images[0] || ''),
      isBlackFriday: p.isBlackFriday || false,
      blackFridayPrice: Number(p.blackFridayPrice) || 0,
      blackFridayStock: Number(p.blackFridayStock) || 0,
      blackFridaySold: Number(p.blackFridaySold) || 0,
      isChristmas: p.isChristmas || false,
      christmasSalePrice: Number(p.christmasSalePrice) || 0,
      christmasSaleStock: Number(p.christmasSaleStock) || 0,
      christmasSaleSold: Number(p.christmasSaleSold) || 0,
      christmasSaleImage: (Array.isArray(p.christmasSaleImage) && p.christmasSaleImage[0]) || (typeof p.christmasSaleImage === 'string' && p.christmasSaleImage) || (images[0] || ''),
      isBackToSchool: p.isBackToSchool || false,
      backToSchoolPrice: Number(p.backToSchoolPrice) || 0,
      isTopSelling: p.isTopSelling || false
    };
  };

  // 1. Generate products.grouped2.json (main products file)
  console.log('\n[1/10] Generating products.grouped2.json...');
  const grouped = {};
  activeProducts.forEach(p => {
    if (!grouped[p.category]) {
      grouped[p.category] = [];
    }
    grouped[p.category].push(normalizeProduct(p));
  });
  await writeFileSafe('products.grouped2.json', JSON.stringify(grouped, null, 2));
  console.log(`   ✅ Written ${activeProducts.length} products across ${Object.keys(grouped).length} categories`);

  // 2. Generate products.flat2.json (flat array)
  console.log('[2/10] Generating products.flat2.json...');
  const flatArray = activeProducts.map(normalizeProduct);
  await writeFileSafe('products.flat2.json', JSON.stringify(flatArray, null, 2));
  console.log(`   ✅ Written ${flatArray.length} products`);

  // 3. Generate flash-sales.json
  console.log('[3/10] Generating flash-sales.json...');
  const flashSales = activeProducts.filter(p => p.isFlashSale && p.active !== false).map(normalizeProduct);
  await writeFileSafe('flash-sales.json', JSON.stringify({ flashSales }, null, 2));
  console.log(`   ✅ Written ${flashSales.length} flash sale products`);

  // 4. Generate black-friday.json
  console.log('[4/10] Generating black-friday.json...');
  const blackFriday = activeProducts.filter(p => p.isBlackFriday && p.active !== false).map(normalizeProduct);
  await writeFileSafe('black-friday.json', JSON.stringify({ blackFriday }, null, 2));
  console.log(`   ✅ Written ${blackFriday.length} black friday products`);

  // 5. Generate christmas-sale.json
  console.log('[5/10] Generating christmas-sale.json...');
  const christmasSale = activeProducts.filter(p => p.isChristmas && p.active !== false).map(normalizeProduct);
  await writeFileSafe('christmas-sale.json', JSON.stringify({ christmasSale }, null, 2));
  console.log(`   ✅ Written ${christmasSale.length} christmas sale products`);

  // 6. Generate back-to-school.json
  console.log('[6/10] Generating back-to-school.json...');
  const backToSchool = activeProducts.filter(p => p.isBackToSchool && p.active !== false).map(normalizeProduct);
  await writeFileSafe('back-to-school.json', JSON.stringify({ backToSchool }, null, 2));
  console.log(`   ✅ Written ${backToSchool.length} back to school products`);

  // 7. Generate top-selling.json
  console.log('[7/10] Generating top-selling.json...');
  const topSelling = activeProducts.filter(p => p.isTopSelling && p.active !== false).map(normalizeProduct);
  await writeFileSafe('top-selling.json', JSON.stringify({ topSelling }, null, 2));
  console.log(`   ✅ Written ${topSelling.length} top selling products`);

  console.log('[7.5/10] Generating combo-offers.json...');
  const comboDeals = activeProducts.filter(p => p.isComboDeals && p.active !== false).map(p => {
    const norm = normalizeProduct(p);
    return {
      ...norm,
      // Map specialized combo fields
      comboPrice: (p.comboDealsPrice && Number(p.comboDealsPrice) > 0) ? Number(p.comboDealsPrice) : norm.price
    };
  });
  
  const comboData = {
    combos: comboDeals
  };
  await writeFileSafe('combo-offers-v2.json', JSON.stringify(comboData, null, 2));
  await writeFileSafe('assets/data/combo-offers-v2.json', JSON.stringify(comboData, null, 2)); // Ensure assets/data sync
  console.log(`   ✅ Written ${comboDeals.length} combo products`);

  // 8. Generate raw-products.json (all products including inactive)
  console.log('[8/10] Generating raw-products.json...');
  const rawProducts = allProducts.map(normalizeProduct);
  await writeFileSafe('raw-products.json', JSON.stringify(rawProducts, null, 2));
  console.log(`   ✅ Written ${rawProducts.length} raw products`);

  // 9. Generate db-products-export.json (database export)
  console.log('[9/10] Generating db-products-export.json...');
  await writeFileSafe('db-products-export.json', JSON.stringify(rawProducts, null, 2));
  console.log(`   ✅ Written ${rawProducts.length} products`);

  // 10. Generate assets/data products (same files for different paths)
  console.log('[10/10] Generating assets/data files...');
  const assetsDir = path.join(__dirname, 'assets', 'data');
  
  try {
    await fs.mkdir(assetsDir, { recursive: true });
  } catch (err) {
    // Directory exists, ignore
  }
  
  await fs.writeFile(path.join(assetsDir, 'products.grouped2.json'), JSON.stringify(grouped, null, 2));
  await fs.writeFile(path.join(assetsDir, 'products.flat2.json'), JSON.stringify(flatArray, null, 2));
  console.log(`   ✅ Written assets/data products files`);

  // Generate config directory files
  console.log('[11/11] Generating config directory files...');
  const configDir = path.join(__dirname, 'config');
  
  try {
    await fs.mkdir(configDir, { recursive: true });
  } catch (err) {
    // Directory exists, ignore
  }
  
  await fs.writeFile(path.join(configDir, 'products.grouped.json'), JSON.stringify(grouped, null, 2));
  await fs.writeFile(path.join(configDir, 'products.flat.json'), JSON.stringify(flatArray, null, 2));
  console.log(`   ✅ Written config files`);

  // Generate price validation report
  console.log('\nGenerating price validation report...');
  const priceReport = {
    generatedAt: new Date().toISOString(),
    totalProducts: allProducts.length,
    activeProducts: activeProducts.length,
    priceRange: {
      min: Math.min(...activeProducts.map(p => p.price)),
      max: Math.max(...activeProducts.map(p => p.price)),
      avg: activeProducts.reduce((sum, p) => sum + p.price, 0) / activeProducts.length
    },
    promoProducts: {
      flashSale: flashSales.length,
      blackFriday: blackFriday.length,
      christmasSale: christmasSale.length,
      backToSchool: backToSchool.length,
      topSelling: topSelling.length
    }
  };
  
  await writeFileSafe('products-price-report.json', JSON.stringify(priceReport, null, 2));
  console.log(`   ✅ Price report generated`);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('JSON FILES GENERATED SUCCESSFULLY');
  console.log('='.repeat(70));
  console.log('\nFiles generated:');
  console.log('  ✓ products.grouped2.json (root)');
  console.log('  ✓ products.flat2.json (root)');
  console.log('  ✓ flash-sales.json (root)');
  console.log('  ✓ black-friday.json (root)');
  console.log('  ✓ christmas-sale.json (root)');
  console.log('  ✓ back-to-school.json (root)');
  console.log('  ✓ top-selling.json (root)');
  console.log('  ✓ raw-products.json (root)');
  console.log('  ✓ db-products-export.json (root)');
  console.log('  ✓ assets/data/products.grouped2.json');
  console.log('  ✓ assets/data/products.flat2.json');
  console.log('  ✓ config/products.grouped.json');
  console.log('  ✓ config/products.flat.json');
  console.log('  ✓ products-price-report.json');
  console.log('\n✅ All JSON files regenerated with updated prices!');
  console.log('✅ Prices are now accurate across the website!');
  
  process.exit(0);
}

async function writeFileSafe(filename, content) {
  const filepath = path.join(__dirname, filename);
  await fs.writeFile(filepath, content, 'utf8');
}

regenerateAllJsonFiles().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});