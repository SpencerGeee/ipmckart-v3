require('dotenv').config();
const Product = require('./models/Product');
const path = require('path');
const fs = require('fs').promises;

// Category ID to Name mapping
const CATEGORY_NAMES = {
  'tech-accessories': 'Tech Accessories',
  'computing-devices': 'Computing Devices',
  'printers-scanners': 'Printers & Scanners',
  'ups': 'UPS',
  'uncategorized': 'Uncategorized',
  'mobile-phones': 'Mobile Phones',
  'home-appliances': 'Home Appliances',
  'kitchen-appliances': 'Kitchen Appliances',
  'keys-clicks': 'Keys & Clicks',
  'samsung-smartphones': 'Samsung Smartphones',
  'apple-iphone': 'Apple iPhone',
  'tablet-laptop-sleeves': 'Tablet & Laptop Sleeves',
  'wireless-sound': 'Wireless Sound',
  'headsets-earphones': 'Headsets & Earphones',
  'power-solutions': 'Power Solutions',
  'cctv-cameras': 'CCTV Cameras',
  'network-switches': 'Network Switches',
  'starlink': 'Starlink',
  'storage-devices': 'Storage Devices',
  'playhub': 'PlayHub',
  'samsung': 'Samsung',
  'apple': 'Apple',
  'irons': 'Irons',
  'blenders': 'Blenders',
  'dishwashers': 'Dishwashers',
  'all-in-one-computers': 'All-in-One Computers',
  'laptops': 'Laptops',
  'keys-clicks': 'Keys & Clicks',
  'oppo-smartphones': 'Oppo Smartphones',
  'itel-phones': 'Itel Phones',
  'workstations': 'Workstations',
  'shredders': 'Shredders'
};

// Subcategory ID to Name mapping (based on typical patterns)
const SUBCATEGORY_NAMES = {
  'uncategorized': 'Uncategorized',
  'misc': 'Miscellaneous',
  'storage-devices': 'Storage Devices',
  'power-banks': 'Power Banks',
  'adapters': 'Adapters',
  'cables': 'Cables',
  'charging-accessories': 'Charging Accessories',
  'all-in-one-computers': 'All-in-One Computers',
  'laptops': 'Laptops',
  'monitors': 'Monitors',
  'printers': 'Printers',
  'scanners': 'Scanners',
  'toners': 'Toners',
  'ink-cartridges': 'Ink Cartridges',
  'single-phase': 'Single Phase',
  'three-phase': 'Three Phase',
  'smartphones': 'Smartphones',
  'tablets': 'Tablets',
  'blenders': 'Blenders',
  'rice-cookers': 'Rice Cookers',
  'kettles': 'Kettles',
  'microwaves': 'Microwaves',
  'toasters': 'Toasters',
  'irons': 'Irons',
  'keyboards': 'Keyboards',
  'mice': 'Mice',
  'headsets': 'Headsets',
  'earphones': 'Earphones',
  'speakers': 'Speakers',
  'power-banks': 'Power Banks',
  'chargers': 'Chargers',
  'cctv-cameras': 'CCTV Cameras',
  'switches': 'Switches',
  'routers': 'Routers',
  'access-points': 'Access Points'
};

function normalizeProduct(p) {
  const images = Array.isArray(p.images) ? p.images : (typeof p.images === 'string' ? p.images.split(',').map(s => s.trim()) : []);
  
  // Convert all .jpg images to .webp
  const webpImages = images.map(img => {
    if (typeof img === 'string') {
      return img.replace(/\.jpg(\?[^"]*)?$/gi, '.webp');
    }
    return img;
  });
  
  return {
    id: p.slug,
    slug: p.slug,
    categoryId: p.category || '',
    categoryName: CATEGORY_NAMES[p.category] || p.category || '',
    subcategoryId: p.subcategory || '',
    subcategoryName: SUBCATEGORY_NAMES[p.subcategory] || '',
    brand: p.brand || '',
    name: p.name,
    price: Number(p.price) || 0,
    stock: Number(p.stock) || 0,
    rating: Number(p.rating) || 0,
    images: webpImages,
    description: (p.description || '').replace(/[\n\r\t]/g, ' ').trim(),
    fullDescription: (p.fullDescription || '').replace(/[\n\r\t]/g, ' ').trim(),
    active: p.active !== false,
    isFlashSale: p.isFlashSale || false,
    flashSalePrice: Number(p.flashSalePrice) || 0,
    flashSaleStock: Number(p.flashSaleStock) || 0,
    flashSaleSold: Number(p.flashSaleSold) || 0,
    flashSaleImage: (Array.isArray(p.flashSaleImage) && p.flashSaleImage[0]) || (typeof p.flashSaleImage === 'string' && p.flashSaleImage) || (webpImages[0] || ''),
    isBlackFriday: p.isBlackFriday || false,
    blackFridayPrice: Number(p.blackFridayPrice) || 0,
    blackFridayStock: Number(p.blackFridayStock) || 0,
    blackFridaySold: Number(p.blackFridaySold) || 0,
    isChristmas: p.isChristmas || false,
    christmasSalePrice: Number(p.christmasSalePrice) || 0,
    christmasSaleStock: Number(p.christmasSaleStock) || 0,
    christmasSaleSold: Number(p.christmasSaleSold) || 0,
    christmasSaleImage: (Array.isArray(p.christmasSaleImage) && p.christmasSaleImage[0]) || (typeof p.christmasSaleImage === 'string' && p.christmasSaleImage) || (webpImages[0] || ''),
    isBackToSchool: p.isBackToSchool || false,
    backToSchoolPrice: Number(p.backToSchoolPrice) || 0,
    isTopSelling: p.isTopSelling || false
  };
}

async function regenerateWithCorrectStructure() {
  console.log('Connecting to database...');
  await require('./db')();

  console.log('Fetching all products from database...');
  const allProducts = await Product.find({}).lean();
  const activeProducts = allProducts.filter(p => p.active !== false);
  
  console.log(`Total products in DB: ${allProducts.length}`);
  console.log(`Active products: ${activeProducts.length}`);
  console.log('\n' + '='.repeat(70));
  console.log('REGENERATING WITH CORRECT STRUCTURE');
  console.log('='.repeat(70));

  // Group by category and subcategory
  const categoryMap = {};
  
  activeProducts.forEach(p => {
    const catId = p.category || 'uncategorized';
    const subId = p.subcategory || 'uncategorized';
    
    if (!categoryMap[catId]) {
      categoryMap[catId] = {
        id: catId,
        name: CATEGORY_NAMES[catId] || catId,
        subcategories: {}
      };
    }
    
    if (!categoryMap[catId].subcategories[subId]) {
      categoryMap[catId].subcategories[subId] = {
        id: subId,
        name: SUBCATEGORY_NAMES[subId] || subId,
        products: []
      };
    }
    
    categoryMap[catId].subcategories[subId].products.push(normalizeProduct(p));
  });

  // Convert to categories array format
  const categories = Object.values(categoryMap);

  console.log(`\n✓ Created ${categories.length} categories`);
  let totalProducts = 0;
  categories.forEach(cat => {
    Object.values(cat.subcategories).forEach(sub => {
      totalProducts += sub.products.length;
    });
  });
  console.log(`✓ Total products in structure: ${totalProducts}`);

  // 1. Generate products.grouped2.json with correct structure
  console.log('\n[1/12] Generating products.grouped2.json with correct structure...');
  const structuredData = { categories };
  await writeFileSafe('products.grouped2.json', JSON.stringify(structuredData, null, 2));
  console.log(`   ✅ Written with categories array structure`);

  // 2. Also create flat grouped version for compatibility
  const groupedFlat = {};
  categories.forEach(cat => {
    Object.values(cat.subcategories).forEach(sub => {
      const catSubId = `${cat.id}-${sub.id}`;
      if (!groupedFlat[catSubId]) {
        groupedFlat[catSubId] = [];
      }
      groupedFlat[catSubId].push(...sub.products);
    });
  });
  await writeFileSafe('products.grouped.json', JSON.stringify(groupedFlat, null, 2));
  console.log(`   ✅ Created grouped flat version`);

  // 3. Generate products.flat2.json
  console.log('[2/12] Generating products.flat2.json...');
  const flatArray = activeProducts.map(normalizeProduct);
  await writeFileSafe('products.flat2.json', JSON.stringify(flatArray, null, 2));
  console.log(`   ✅ Written ${flatArray.length} products`);

  // 4. Generate flash-sales.json
  console.log('[3/12] Generating flash-sales.json...');
  const flashSales = activeProducts.filter(p => p.isFlashSale && p.active !== false).map(normalizeProduct);
  await writeFileSafe('flash-sales.json', JSON.stringify({ flashSales }, null, 2));
  console.log(`   ✅ Written ${flashSales.length} flash sale products`);

  // 5. Generate black-friday.json
  console.log('[4/12] Generating black-friday.json...');
  const blackFriday = activeProducts.filter(p => p.isBlackFriday && p.active !== false).map(normalizeProduct);
  await writeFileSafe('black-friday.json', JSON.stringify({ blackFriday }, null, 2));
  console.log(`   ✅ Written ${blackFriday.length} black friday products`);

  // 6. Generate christmas-sale.json
  console.log('[5/12] Generating christmas-sale.json...');
  const christmasSale = activeProducts.filter(p => p.isChristmas && p.active !== false).map(normalizeProduct);
  await writeFileSafe('christmas-sale.json', JSON.stringify({ christmasSale }, null, 2));
  console.log(`   ✅ Written ${christmasSale.length} christmas sale products`);

  // 7. Generate back-to-school.json
  console.log('[6/12] Generating back-to-school.json...');
  const backToSchool = activeProducts.filter(p => p.isBackToSchool && p.active !== false).map(normalizeProduct);
  await writeFileSafe('back-to-school.json', JSON.stringify({ backToSchool }, null, 2));
  console.log(`   ✅ Written ${backToSchool.length} back to school products`);

  // 8. Generate top-selling.json
  console.log('[7/12] Generating top-selling.json...');
  const topSelling = activeProducts.filter(p => p.isTopSelling && p.active !== false).map(normalizeProduct);
  await writeFileSafe('top-selling.json', JSON.stringify({ topSelling }, null, 2));
  console.log(`   ✅ Written ${topSelling.length} top selling products`);

  // 9. Generate raw-products.json
  console.log('[8/12] Generating raw-products.json...');
  const rawProducts = allProducts.map(normalizeProduct);
  await writeFileSafe('raw-products.json', JSON.stringify(rawProducts, null, 2));
  console.log(`   ✅ Written ${rawProducts.length} raw products`);

  // 10. Generate db-products-export.json
  console.log('[9/12] Generating db-products-export.json...');
  await writeFileSafe('db-products-export.json', JSON.stringify(rawProducts, null, 2));
  console.log(`   ✅ Written ${rawProducts.length} products`);

  // 11. Generate assets/data files
  console.log('[10/12] Generating assets/data files...');
  const assetsDir = path.join(__dirname, 'assets', 'data');
  
  try {
    await fs.mkdir(assetsDir, { recursive: true });
  } catch (err) {
    // Directory exists, ignore
  }
  
  await fs.writeFile(path.join(assetsDir, 'products.grouped2.json'), JSON.stringify(structuredData, null, 2));
  await fs.writeFile(path.join(assetsDir, 'products.flat2.json'), JSON.stringify(flatArray, null, 2));
  console.log(`   ✅ Written assets/data files`);

  // 12. Generate config directory files
  console.log('[11/12] Generating config directory files...');
  const configDir = path.join(__dirname, 'config');
  
  try {
    await fs.mkdir(configDir, { recursive: true });
  } catch (err) {
    // Directory exists, ignore
  }
  
  await fs.writeFile(path.join(configDir, 'products.grouped.json'), JSON.stringify(groupedFlat, null, 2));
  await fs.writeFile(path.join(configDir, 'products.flat.json'), JSON.stringify(flatArray, null, 2));
  console.log(`   ✅ Written config files`);

  // Verification
  console.log('\n[12/12] Verifying structure...');
  const testRead = JSON.parse(await fs.readFile('products.grouped2.json', 'utf8'));
  if (testRead.categories && Array.isArray(testRead.categories)) {
    console.log(`   ✅ Verified: categories array exists with ${testRead.categories.length} categories`);
  } else {
    console.log(`   ❌ ERROR: categories array not found!`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('JSON FILES REGENERATED SUCCESSFULLY');
  console.log('='.repeat(70));
  console.log('\nKey Changes:');
  console.log('  ✓ Restored original structure with categories array');
  console.log('  ✓ Converted all .jpg images to .webp');
  console.log('  ✓ Updated prices from database');
  console.log('\n✅ All files regenerated with correct structure!');
  
  process.exit(0);
}

async function writeFileSafe(filename, content) {
  const filepath = path.join(__dirname, filename);
  await fs.writeFile(filepath, content, 'utf8');
}

regenerateWithCorrectStructure().catch(err => {
  console.error('\n❌ Fatal error:', err);
  console.error(err.stack);
  process.exit(1);
});