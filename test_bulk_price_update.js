const xlsx = require('xlsx');
const { MongoClient } = require('mongodb');

// Import matching functions from admin.js
function normalizeString(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractModelNumber(str) {
  const patterns = [
    /([A-Z]+-\d+[A-Z]*\d*)/g,
    /([A-Z]{2,5}-\d{0,2}[A-Z]*)/g,
    /([A-Z]{2,6}\d{2,4})/g,
    /([A-Z]+\d+[-\s][A-Z]{0,2}\d*)/g,
  ];

  const models = [];
  for (const pattern of patterns) {
    const matches = str.match(pattern);
    if (matches) models.push(...matches);
  }

  return models.length > 0 ? [...new Set(models.filter(m => m.length >= 3))] : null;
}

function extractKeywords(str) {
  const normalized = normalizeString(str);
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'with', 'for', 'of', 'in', 'to', 'on', 'at', 'inch', 'screen', 'display', 'fhd', 'hd', 'ram', 'gb', 'tb', 'ssd', 'hdd', 'core', 'generation', 'windows', 'pro', 'home', 'plus', 'system'];

  const words = normalized.split(' ');
  return words
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .filter(word => !/^\d+$/.test(word));
}

const CATEGORY_MAPPING = {
  'laptop': 'computing-devices',
  'all in one pc': 'computing-devices',
  'all-in-one pc': 'computing-devices',
  'printer': 'printers-scanners',
  'scanner': 'printers-scanners',
  'ups': 'power-solutions',
  'access point': 'networking',
  'switch': 'networking',
  'router': 'networking',
  'monitor': 'computing-devices',
  'mobile phone': 'mobile-devices',
  'tablet': 'computing-devices',
  'headset': 'accessories',
  'headphone': 'accessories',
  'mouse': 'accessories',
  'keyboard': 'accessories',
  'speaker': 'audio-video',
  'cctv camera': 'security',
  'projector': 'audio-video',
  'television': 'audio-video',
  'desktop': 'computing-devices',
  'workstation': 'computing-devices',
  'server': 'computing-devices',
  'toners': 'printers-scanners',
  'adapter': 'accessories',
  'cable': 'accessories',
  'charger': 'accessories',
  'power bank': 'power-solutions',
  'earpods': 'accessories',
  'ear pods': 'accessories',
  'smart watches': 'mobile-devices',
  'ssd': 'storage',
  'usb drive': 'storage',
  'blender': 'home-appliances',
  'iron': 'home-appliances',
  'rice cooker': 'home-appliances',
  'kettle': 'home-appliances',
  'microwave': 'home-appliances',
  'toaster': 'home-appliances',
  'stove': 'home-appliances',
  'refrigerator': 'home-appliances',
  'backpack': 'accessories',
  'laptop bag': 'accessories'
};

function mapCategory(excelCategory) {
  if (!excelCategory) return null;
  const normalized = normalizeString(excelCategory);
  return CATEGORY_MAPPING[normalized] || null;
}

function calculateSimilarity(str1, str2) {
  const keywords1 = extractKeywords(str1);
  const keywords2 = extractKeywords(str2);

  if (keywords1.length === 0 || keywords2.length === 0) return 0;

  let exactMatches = 0;
  let partialMatches = 0;

  for (const k1 of keywords1) {
    for (const k2 of keywords2) {
      if (k1 === k2) {
        exactMatches++;
        break;
      } else if (k1.includes(k2) || k2.includes(k1)) {
        partialMatches++;
        break;
      }
    }
  }

  const matchRatio = (2 * (exactMatches + partialMatches * 0.5)) / (keywords1.length + keywords2.length);
  const lengthRatio = Math.min(keywords1.length, keywords2.length) / Math.max(keywords1.length, keywords2.length);

  return (matchRatio * 0.7) + (lengthRatio * 0.3);
}

function findBestMatch(searchName, category, allProducts, threshold = 0.3) {
  const searchNormalized = normalizeString(searchName);
  const searchModels = extractModelNumber(searchName);
  let bestMatch = null;
  let bestScore = 0;

  for (const product of allProducts) {
    const productName = product.name || '';
    const productCategory = product.category || '';
    const productNormalized = normalizeString(productName);

    // Strategy 1: Check for exact normalized name match first (highest priority)
    if (searchNormalized === productNormalized) {
      return { product, score: 1.0, matchType: 'exact-name' };
    }

    // Strategy 2: Check for model number match
    let modelBoost = 0;
    if (searchModels) {
      const productModels = extractModelNumber(productName);
      for (const searchModel of searchModels) {
        for (const productModel of (productModels || [])) {
          if (searchModel === productModel ||
              searchModel.includes(productModel) ||
              productModel.includes(searchModel)) {
            modelBoost = 0.25;
            break;
          }
        }
        if (modelBoost > 0) break;
      }
    }

    // Strategy 2: Category filtering with mapping
    if (category) {
      const mappedCategory = mapCategory(category);
      const dbCategory = product.category || '';

      let catMatch = false;

      if (mappedCategory) {
        catMatch = dbCategory === mappedCategory ||
                   dbCategory.includes(mappedCategory) ||
                   mappedCategory.includes(dbCategory);
      } else {
        const catNormalized1 = normalizeString(category);
        const catNormalized2 = normalizeString(dbCategory);
        catMatch = catNormalized1 === catNormalized2 ||
                   catNormalized1.includes(catNormalized2) ||
                   catNormalized2.includes(catNormalized1);
      }

      if (!catMatch) continue;
    }

    // Strategy 4: Calculate fuzzy similarity and apply model boost
    const score = calculateSimilarity(searchName, productName) + modelBoost;

    // Strategy 5: Brand match boost
    if (score < 0.6 && modelBoost > 0) {
      return { product, score: Math.max(score + 0.2, 0.6), matchType: 'brand-boost' };
    }

    // Strategy 6: Order-insensitive word match
    if (score < 0.5) {
      const searchWords = extractKeywords(searchName);
      const productWords = extractKeywords(productName);

      const matches = searchWords.filter(word =>
        productWords.some(pWord =>
          word === pWord || word.includes(pWord) || pWord.includes(word)
        )
      );

      const matchRatio = matches.length / Math.max(searchWords.length, productWords.length);

      if (matchRatio >= 0.5) {
        return { product, score: Math.max(score, matchRatio), matchType: 'word-order-match' };
      }
    }

    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = { product, score, matchType: score > 0.8 ? 'fuzzy-high' : 'fuzzy-low' };
    }
  }

  return bestMatch;
}

async function testBulkPriceUpdate() {
  console.log('Starting bulk price update test...\n');

  // Load Excel file
  const workbook = xlsx.readFile('./complete_product_mapping.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

  console.log(`Total rows in Excel: ${data.length}`);
  console.log(`Columns: ${Object.keys(data[0] || {}).join(', ')}\n`);

  // Connect to MongoDB
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ipmckart';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('ipmckart');
    const products = await db.collection('products').find({ active: true }).toArray();

    console.log(`Total active products in DB: ${products.length}\n`);

    // Test matching
    let matched = 0;
    let notFound = 0;
    const matches = [];

    for (const row of data) {
      const excelName = row['Excel Product Name'] || '';
      const dbName = row['Database Product Name'] || '';
      const category = row['Category'] || '';
      const newPrice = parseFloat(row['New Price']);
      const mappingStatus = row['Mapping Status'] || '';

      if (!excelName || isNaN(newPrice)) continue;

      // Priority 1: Try exact match with Database Product Name
      let product = null;
      let matchMethod = '';

      if (dbName) {
        const searchNormalized = normalizeString(dbName);
        product = products.find(p => normalizeString(p.name) === searchNormalized);
        if (product) {
          matchMethod = 'exact-db-name';
          console.log(`✓ EXACT DB MATCH: "${excelName.substring(0, 50)}" -> "${product.name.substring(0, 50)}"`);
        }
      }

      // Priority 2: Try exact match with Excel Product Name
      if (!product && excelName) {
        const searchNormalized = normalizeString(excelName);
        product = products.find(p => normalizeString(p.name) === searchNormalized);
        if (product) {
          matchMethod = 'exact-excel-name';
          console.log(`✓ EXCEL MATCH: "${excelName.substring(0, 50)}" -> "${product.name.substring(0, 50)}"`);
        }
      }

      // Priority 3: Try slug match
      if (!product) {
        const slug = excelName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        product = products.find(p => p.slug === slug);
        if (product) {
          matchMethod = 'slug';
          console.log(`✓ SLUG MATCH: "${excelName.substring(0, 50)}" -> "${product.name.substring(0, 50)}"`);
        }
      }

      // Priority 4: Try fuzzy match with category
      if (!product) {
        const mappedCategory = mapCategory(category);
        let candidateProducts = products;
        if (mappedCategory) {
          candidateProducts = products.filter(p => {
            const dbCat = p.category || '';
            return dbCat === mappedCategory;
          });
        }

        if (candidateProducts.length > 0 && candidateProducts.length <= 100) {
          const bestMatch = findBestMatch(excelName, mappedCategory, candidateProducts, 0.75);
          if (bestMatch && bestMatch.score >= 0.75) {
            product = bestMatch.product;
            matchMethod = `${bestMatch.matchType} (${(bestMatch.score * 100).toFixed(0)}%)`;
            console.log(`✓ FUZZY MATCH: "${excelName.substring(0, 50)}" -> "${product.name.substring(0, 50)}" [${matchMethod}]`);
          }
        }
      }

      if (product) {
        matched++;
        matches.push({
          excelName,
          matchedName: product.name,
          slug: product.slug,
          currentPrice: product.price,
          newPrice,
          matchMethod
        });
      } else {
        notFound++;
        console.log(`✗ NOT FOUND: "${excelName.substring(0, 50)}" (Category: ${category})`);
      }
    }

    console.log(`\n\n=== RESULTS ===`);
    console.log(`Total Excel rows: ${data.length}`);
    console.log(`Matched: ${matched} (${((matched / data.length) * 100).toFixed(1)}%)`);
    console.log(`Not Found: ${notFound} (${((notFound / data.length) * 100).toFixed(1)}%)`);

    console.log(`\n=== SAMPLE MATCHES ===`);
    matches.slice(0, 10).forEach(m => {
      console.log(`${m.matchMethod}: "${m.excelName.substring(0, 40)}" -> ${m.slug}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

testBulkPriceUpdate();
