require('dotenv').config();
const Product = require('./models/Product');
const path = require('path');
const fs = require('fs').promises;

// Mapping of category IDs to human-readable names
const CATEGORY_LABELS = {
    'printers-scanners': 'Printers & Scanners',
    'computing-devices': 'Computing Devices',
    'home-appliances': 'Home Appliances',
    'kitchen-appliances': 'Kitchen Appliances',
    'tech-accessories': 'Tech Accessories',
    'mobile-phones': 'Mobile Phones',
    'ups': 'UPS',
    'shredders': 'Shredders'
};

const SUBCATEGORY_LABELS = {
    'toners': 'Toners',
    'laptops': 'Laptops',
    'tablets': 'Tablets',
    'monitors': 'Monitors',
    'workstations': 'Workstations',
    'all-in-one-computers': 'All-in-One Computers',
    'keys-clicks': 'Keys & Clicks',
    'washing-machines': 'Washing Machines',
    'refrigerators': 'Refrigerators',
    'irons': 'Irons',
    'vacuum-cleaners': 'Vacuum Cleaners',
    'televisions': 'Televisions',
    'air-conditioners': 'Air Conditioners',
    'fans': 'Fans',
    'air-purifiers': 'Air Purifiers',
    'dishwashers': 'Dishwashers',
    'microwaves': 'Microwaves',
    'stoves': 'Stoves',
    'rice-cooker': 'Rice Cooker',
    'blenders': 'Blenders',
    'air-fryers': 'Air Fryers',
    'toasters': 'Toasters',
    'kettles': 'Kettles',
    'storage-devices': 'Storage Devices',
    'headsets-earphones': 'Headsets & Earphones',
    'playhub': 'PlayHub',
    'wireless-sound': 'Wireless Sound',
    'cctv-cameras': 'CCTV Cameras',
    'network-switches': 'Network Switches',
    'wifi-extenders': 'WiFi Extenders',
    'tablet-laptop-sleeves': 'Tablet & Laptop Sleeves',
    'power-solutions': 'Power Solutions',
    'smart-watches': 'Smart Watches',
    'apple-iphone': 'Apple iPhone',
    'samsung-smartphones': 'Samsung Smartphones',
    'tecno-phones': 'TECNO Phones',
    'itel-phones': 'itel Phones',
    'infinix-smartphones': 'Infinix Smartphones',
    'oppo-smartphones': 'OPPO Smartphones',
    'realme-smartphones': 'realme Smartphones'
};

async function regenerateAllJsonFiles() {
  console.log('Connecting to database...');
  await require('./db')();

  console.log('Fetching all products from database...');
  const allProducts = await Product.find({}).lean();
  const activeProducts = allProducts.filter(p => p.active !== false);
  
  console.log(`Total products in DB: ${allProducts.length}`);
  console.log(`Active products: ${activeProducts.length}`);

  const normalizeProduct = (p) => {
    const images = Array.isArray(p.images) ? p.images : (typeof p.images === 'string' ? p.images.split(',').map(s => s.trim()) : []);
    return {
      id: p.slug,
      slug: p.slug,
      categoryId: p.category || '',
      categoryName: CATEGORY_LABELS[p.category] || p.category || '',
      subcategoryId: p.subcategory || '',
      subcategoryName: SUBCATEGORY_LABELS[p.subcategory] || p.subcategory || '',
      brand: p.brand || '',
      name: p.name,
      price: Number(p.price) || 0,
      stock: Number(p.stock) || 0,
      rating: Number(p.rating) || 0,
      images: images,
      description: (p.description || '').replace(/[\n\r\t]/g, ' ').trim(),
      fullDescription: (p.fullDescription || '').trim(),
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
      christmasSalePrice: Number(p.christmasPrice) || 0,
      christmasSaleStock: Number(p.christmasSaleStock) || 0,
      christmasSaleSold: Number(p.christmasSaleSold) || 0,
      christmasSaleImage: (Array.isArray(p.christmasSaleImage) && p.christmasSaleImage[0]) || (typeof p.christmasSaleImage === 'string' && p.christmasSaleImage) || (images[0] || ''),
      isBackToSchool: p.isBackToSchool || false,
      backToSchoolPrice: Number(p.backToSchoolPrice) || 0,
      isTopSelling: p.isTopSelling || false,
      isNewYear: p.isNewYear || false,
      newYearPrice: Number(p.newYearPrice) || 0,
      isValentines: p.isValentines || false,
      valentinesPrice: Number(p.valentinesPrice) || 0,
      valentinesImage: p.valentinesImage || '',
      isComboDeals: p.isComboDeals || false,
      comboDealsPrice: Number(p.comboDealsPrice) || 0
    };
  };

  console.log('\n[1/10] Generating products.grouped2.json...');
  const catMap = {};
  activeProducts.forEach(p => {
      const catId = p.category || 'uncategorized';
      const subId = p.subcategory || 'misc';
      if (!catMap[catId]) {
          catMap[catId] = {
              id: catId,
              name: CATEGORY_LABELS[catId] || catId,
              subcategories: {}
          };
      }
      if (!catMap[catId].subcategories[subId]) {
          catMap[catId].subcategories[subId] = {
              id: subId,
              name: SUBCATEGORY_LABELS[subId] || subId,
              products: []
          };
      }
      catMap[catId].subcategories[subId].products.push(normalizeProduct(p));
  });

  const nestedGrouped = {
      categories: Object.values(catMap).map(cat => ({
          ...cat,
          subcategories: Object.values(cat.subcategories)
      }))
  };

  const writeFileSafe = async (filename, content) => {
    const filepath = path.join(__dirname, filename);
    await fs.writeFile(filepath, content, 'utf8');
  };

  await writeFileSafe('products.grouped2.json', JSON.stringify(nestedGrouped, null, 2));
  console.log(`   ✅ Written ${activeProducts.length} products in NESTED format`);

  console.log('[2/10] Generating products.flat2.json...');
  const flatArray = activeProducts.map(normalizeProduct);
  await writeFileSafe('products.flat2.json', JSON.stringify(flatArray, null, 2));
  
  console.log('[3/10] Generating flash-sales.json...');
  const flashSales = activeProducts.filter(p => p.isFlashSale).map(normalizeProduct);
  await writeFileSafe('flash-sales.json', JSON.stringify({ flashSales }, null, 2));

  console.log('[4/10] Generating black-friday.json...');
  const blackFriday = activeProducts.filter(p => p.isBlackFriday).map(normalizeProduct);
  await writeFileSafe('black-friday.json', JSON.stringify({ blackFriday }, null, 2));

  console.log('[5/10] Generating christmas-sale.json...');
  const christmasSale = activeProducts.filter(p => p.isChristmas).map(normalizeProduct);
  await writeFileSafe('christmas-sale.json', JSON.stringify({ christmasSale }, null, 2));

  console.log('[6/10] Generating back-to-school.json...');
  const backToSchool = activeProducts.filter(p => p.isBackToSchool).map(normalizeProduct);
  await writeFileSafe('back-to-school.json', JSON.stringify({ backToSchool }, null, 2));

  console.log('[7/10] Generating top-selling.json...');
  const topSelling = activeProducts.filter(p => p.isTopSelling).map(normalizeProduct);
  await writeFileSafe('top-selling.json', JSON.stringify({ topSelling }, null, 2));

  console.log('[7.5/10] Generating combo-offers.json...');
  const combos = activeProducts.filter(p => p.isComboDeals).map(p => {
      const norm = normalizeProduct(p);
      return { ...norm, comboPrice: p.comboDealsPrice || norm.price };
  });
  await writeFileSafe('combo-offers-v2.json', JSON.stringify({ combos }, null, 2));

  console.log('[8/10] Generating raw-products.json...');
  const rawProducts = allProducts.map(normalizeProduct);
  await writeFileSafe('raw-products.json', JSON.stringify(rawProducts, null, 2));

  console.log('[10/10] Syncing with assets/data...');
  const assetsDir = path.join(__dirname, 'assets', 'data');
  await fs.mkdir(assetsDir, { recursive: true });
  await fs.writeFile(path.join(assetsDir, 'products.grouped2.json'), JSON.stringify(nestedGrouped, null, 2));
  await fs.writeFile(path.join(assetsDir, 'products.flat2.json'), JSON.stringify(flatArray, null, 2));
  await fs.writeFile(path.join(assetsDir, 'combo-offers-v2.json'), JSON.stringify({ combos }, null, 2));

  console.log('[11/11] Syncing with config...');
  const configDir = path.join(__dirname, 'config');
  await fs.mkdir(configDir, { recursive: true });
  await fs.writeFile(path.join(configDir, 'products.grouped.json'), JSON.stringify(nestedGrouped, null, 2));
  await fs.writeFile(path.join(configDir, 'products.flat.json'), JSON.stringify(flatArray, null, 2));

  console.log('\n✅ All JSON files regenerated correctly!');
  process.exit(0);
}

regenerateAllJsonFiles().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
