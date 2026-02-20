/**
 * transform-products.js
 * * Usage:
 * node transform-products.js <input.json> [outDir]
 * * Defaults:
 * input.json = raw-products.json
 * outDir     = .
 * * Outputs:
 * - products.flat.json
 * - products.grouped.json
 */

const fs = require('fs');
const path = require('path');

// ---------- Configurable defaults ----------
const DEFAULT_STOCK = 10;
const DEFAULT_RATING = 0;
const IMAGES_PER_PRODUCT = 2;

// ---------- Category mapping (canonical names and IDs) ----------
// ===== REVISED V3: Corrected structure based on screenshot =====
const CATEGORY_MAP = {
  'printers & scanners': {
    id: 'printers-scanners',
    name: 'Printers & Scanners',
    subs: {
      'printers & scanners': { id: 'printers-scanners', name: 'Printers & Scanners' },
      'toners': { id: 'toners', name: 'Toners' },
      'ink cartridges': { id: 'ink-cartridges', name: 'Ink Cartridges' },
      'ink catridges': { id: 'ink-cartridges', name: 'Ink Cartridges' }, // ADDED: Key from image to catch typo
      'printing consumables': { id: 'printing-consumables', name: 'Printing Consumables' },
    },
  },
  'computing devices': {
    id: 'computing-devices',
    name: 'Computing Devices',
    subs: {
      'workstations': { id: 'workstations', name: 'Workstations' },
      'laptops': { id: 'laptops', name: 'Laptops' },
      'tablets': { id: 'tablets', name: 'Tablets' },
      'monitors': { id: 'monitors', name: 'Monitors' },
      'all-in-one computers': { id: 'all-in-one-computers', name: 'All-in-One Computers' },
      'all-in-one-computers': { id: 'all-in-one-computers', name: 'All-in-One Computers' },
      'keys & clicks': { id: 'keys-clicks', name: 'Keys & Clicks' }, // For Mice, Keyboards
      // 'shredders': { id: 'shredders', name: 'Shredders' }, // REMOVED: This is a top-level category per image
      'starlink': { id: 'starlink', name: 'Starlink' }
    },
  },
  'home appliances': {
    id: 'home-appliances',
    name: 'Home Appliances',
    subs: {
      'washing machines': { id: 'washing-machines', name: 'Washing Machines' },
      'refrigerators': { id: 'refrigerators', name: 'Refrigerators' },
      'refridgerators': { id: 'refrigerators', name: 'Refrigerators' }, // Typo from image
      'irons': { id: 'irons', name: 'Irons' },
      'vacuum cleaners': { id: 'vacuum-cleaners', name: 'Vacuum Cleaners' },
      'televisions': { id: 'televisions', name: 'Televisions' },
      'air conditioners': { id: 'air-conditioners', name: 'Air Conditioners' },
      'fans': { id: 'fans', name: 'Fans' },
      'air purifiers': { id: 'air-purifiers', name: 'Air Purifiers' },
    },
  },
  'kitchen appliances': {
    id: 'kitchen-appliances',
    name: 'Kitchen Appliances',
    subs: {
      'dishwashers': { id: 'dishwashers', name: 'Dishwashers' },
      'microwaves': { id: 'microwaves', name: 'Microwaves' },
      'stoves': { id: 'stoves', name: 'Stoves' },
      'rice cooker': { id: 'rice-cooker', name: 'Rice Cooker' },
      'blenders': { id: 'blenders', name: 'Blenders' },
      'air fryers': { id: 'air-fryers', name: 'Air Fryers' },
      'toasters': { id: 'toasters', name: 'Toasters' },
      'kettles': { id: 'kettles', name: 'Kettles' },
    },
  },
  'tech accessories': {
    id: 'tech-accessories',
    name: 'Tech Accessories',
    subs: {
      'storage devices': { id: 'storage-devices', name: 'Storage Devices' },
      'headsets & earphones': { id: 'headsets-earphones', name: 'Headsets & Earphones' },
      'playhub': { id: 'playhub', name: 'PlayHub' },
      'wireless sound': { id: 'wireless-sound', name: 'Wireless Sound' },
      'cctv cameras': { id: 'cctv-cameras', name: 'CCTV Cameras' },
      'network switches': { id: 'network-switches', name: 'Network Switches' },
      'wifi extenders': { id: 'wifi-extenders', name: 'WiFi Extenders' },
      'tablet & laptop sleeves': { id: 'tablet-laptop-sleeves', name: 'Tablet & Laptop Sleeves' },
      'power solutions': { id: 'power-solutions', name: 'Power Solutions' },
      'smart watches': { id: 'smart-watches', name: 'Smart Watches' },
    },
  },
  'mobile phones': {
    id: 'mobile-phones',
    name: 'Mobile Phones',
    subs: {
      'apple iphone': { id: 'apple-iphone', name: 'Apple iPhone' },
      'samsung smartphones': { id: 'samsung-smartphones', name: 'Samsung Smartphones' },
      'tecno phones': { id: 'tecno-phones', name: 'TECNO Phones' },
      'itel phones': { id: 'itel-phones', name: 'itel Phones' },
      'infinix smartphones': { id: 'infinix-smartphones', name: 'Infinix Smartphones' },
      'oppo smartphones': { id: 'oppo-smartphones', name: 'OPPO Smartphones' },
      'realme smartphones': { id: 'realme-smartphones', name: 'realme Smartphones' },
    },
  },
  'ups': {
    id: 'ups',
    name: 'UPS',
    subs: {
      'ups': { id: 'ups', name: 'UPS' }
    }
  },
  // ADDED: New top-level category based on screenshot
  'shredders': {
    id: 'shredders',
    name: 'Shredders',
    subs: {
      'shredders': { id: 'shredders', name: 'Shredders' }
    }
  }
};

// ===== NEW: Global map for robust subcategory lookups =====
const SUBCATEGORY_TO_CATEGORY_MAP = {};
for (const catKey in CATEGORY_MAP) {
    const category = CATEGORY_MAP[catKey];
    for (const subKey in category.subs) {
        if (!SUBCATEGORY_TO_CATEGORY_MAP[subKey]) {
            SUBCATEGORY_TO_CATEGORY_MAP[subKey] = {
                category: { id: category.id, name: category.name },
                subcategory: category.subs[subKey]
            };
        }
    }
}


// ---------- Helpers ----------
const INPUT = process.argv[2] || 'raw-products.json';
const OUT_DIR = process.argv[3] || '.';

function readJSON(file) {
  const str = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(str);
  } catch (e) {
    const lines = str.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    return lines.map(JSON.parse);
  }
}

function writeJSON(file, data) {
  const full = path.join(OUT_DIR, file);
  fs.writeFileSync(full, JSON.stringify(data, null, 2), 'utf8');
  return full;
}

function slugify(s) {
  return String(s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function cleanToken(token) {
  if (!token) return '';
  return String(token)
    .replace(/-+\s*Main Category/i, '')
    .replace(/\bGhana\b/ig, '')
    .replace(/\s*>\s*/g, ' > ')
    .replace(/\s+/g, ' ')
    .trim();
}

function htmlToText(html) {
  if (!html) return '';
  return String(html)
    .replace(/<li[^>]*>/gi, ' • ')
    .replace(/<\/li>/gi, '')
    .replace(/<\/p>|<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function makeTeaser(html, maxLen = 150) {
  const text = htmlToText(html);
  if (!text) return '';
  const sentenceMatch = text.match(/^(.+?[.!?])(\s|$)/);
  let teaser = sentenceMatch ? sentenceMatch[1].trim() : text.slice(0, maxLen).trim();
  if (teaser.length < 40 && text.length > maxLen) {
    teaser = text.slice(0, maxLen).trim();
    const lastSpace = teaser.lastIndexOf(' ');
    if (lastSpace > 60) teaser = teaser.slice(0, lastSpace) + '...';
  }
  return teaser;
}

function parseNumber(n) {
  if (n === null || n === undefined) return NaN;
  if (typeof n === 'number') return n;
  const s = String(n).replace(/[, ]/g, '').trim();
  if (s === '' || s.toLowerCase() === 'nan') return NaN;
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : NaN;
}

function findCategory(catToken) {
  if (!catToken) return null;
  const key = catToken.toLowerCase();
  return CATEGORY_MAP[key] || null;
}

function findSubcategory(categoryEntry, subTokenRaw) {
  if (!categoryEntry || !subTokenRaw) return null;
  const key = subTokenRaw.toLowerCase();
  if (categoryEntry.subs[key]) return categoryEntry.subs[key];

  const variants = new Set([
    key,
    key.replace(/s\b/, ''),
    key.endsWith('es') ? key.slice(0, -2) : key,
    key.replace(/-/g, ' '),
    key.replace(/ and /g, ' & '),
    key.replace(/ & /g, ' and '),
  ]);
  for (const v of variants) {
    if (categoryEntry.subs[v]) return categoryEntry.subs[v];
  }
  return null;
}

function parseCategoriesField(raw) {
  if (!raw) return null;

  const tokens = String(raw).split(/,|>|\//).map(p => cleanToken(p).toLowerCase()).filter(Boolean);
  
  for (const token of tokens) {
    if (SUBCATEGORY_TO_CATEGORY_MAP[token]) {
      return SUBCATEGORY_TO_CATEGORY_MAP[token];
    }
  }

  const parts = String(raw).split(',').map(p => cleanToken(p));
  for (const part of parts) {
    if (part.includes('>')) {
      const [catTok, subTok] = part.split('>').map(t => t.trim());
      const catEntry = findCategory(catTok);
      if (catEntry) {
        const subEntry = findSubcategory(catEntry, subTok);
        if (subEntry) {
          return { category: catEntry, subcategory: subEntry };
        }
      }
    }
  }

  for (const part of parts) {
    if (!part.includes('>')) {
      const catEntry = findCategory(part);
      if (catEntry) {
        // Find the most relevant subcategory if possible, otherwise default to a generic one
        const primarySub = catEntry.subs[Object.keys(catEntry.subs)[0]];
        return {
          category: catEntry,
          subcategory: primarySub || { id: 'misc', name: 'Misc' },
        };
      }
    }
  }

  return null;
}

const idCounters = new Map();
function nextIdNumber(catId, subId) {
  const key = `${catId}/${subId}`;
  const n = (idCounters.get(key) || 0) + 1;
  idCounters.set(key, n);
  return String(n).padStart(3, '0');
}

function extractBrand(name) {
  if (!name) return '';
  const token = String(name).trim().split(/\s|–|-|:/)[0] || '';
  return token.replace(/[^A-Za-z0-9+]/g, '').trim();
}

function buildImages(categoryId, subcategoryId, slug) {
  const base = `assets/images/products/${categoryId}/${subcategoryId}/${slug}`;
  const imgs = [];
  for (let i = 1; i <= IMAGES_PER_PRODUCT; i++) {
    imgs.push(`${base}-${i}.webp`);
  }
  return imgs;
}

// ===== NEW: Keyword-based mapping for items with no category data =====
// ===== REVISED V3: Extensively expanded for better fallback =====
const KEYWORD_MAP = {
  'mobile-phones': {
      'infinix': { category: 'mobile-phones', subcategory: 'infinix-smartphones' },
      'tecno': { category: 'mobile-phones', subcategory: 'tecno-phones' },
      'itel': { category: 'mobile-phones', subcategory: 'itel-phones' },
      'samsung': { category: 'mobile-phones', subcategory: 'samsung-smartphones' },
      'iphone': { category: 'mobile-phones', subcategory: 'apple-iphone' },
      'oppo': { category: 'mobile-phones', subcategory: 'oppo-smartphones' },
      'realme': { category: 'mobile-phones', subcategory: 'realme-smartphones' },
  },
  'tech-accessories': {
      // Headsets & Earphones
      'headset': { category: 'tech-accessories', subcategory: 'headsets-earphones' },
      'earphone': { category: 'tech-accessories', subcategory: 'headsets-earphones' },
      'earpod': { category: 'tech-accessories', subcategory: 'headsets-earphones' },
      'airpod': { category: 'tech-accessories', subcategory: 'headsets-earphones' },
      'earbuds': { category: 'tech-accessories', subcategory: 'headsets-earphones' },
      // Power Solutions
      'adapter': { category: 'tech-accessories', subcategory: 'power-solutions' },
      'cable': { category: 'tech-accessories', subcategory: 'power-solutions' },
      'charger': { category: 'tech-accessories', subcategory: 'power-solutions' },
      'power bank': { category: 'tech-accessories', subcategory: 'power-solutions' },
      'powerbank': { category: 'tech-accessories', subcategory: 'power-solutions' },
      'surge protector': { category: 'tech-accessories', subcategory: 'power-solutions' },
      'extension cord': { category: 'tech-accessories', subcategory: 'power-solutions' },
      // Storage Devices
      'flash drive': { category: 'tech-accessories', subcategory: 'storage-devices' },
      'thumb drive': { category: 'tech-accessories', subcategory: 'storage-devices' },
      'hard drive': { category: 'tech-accessories', subcategory: 'storage-devices' },
      'ssd': { category: 'tech-accessories', subcategory: 'storage-devices' },
      'memory card': { category: 'tech-accessories', subcategory: 'storage-devices' },
      // Wireless Sound
      'speaker': { category: 'tech-accessories', subcategory: 'wireless-sound' },
      'soundbar': { category: 'tech-accessories', subcategory: 'wireless-sound' },
      'bluetooth speaker': { category: 'tech-accessories', subcategory: 'wireless-sound' },
      // Smart Watches
      'smartwatch': { category: 'tech-accessories', subcategory: 'smart-watches' },
      'smart watch': { category: 'tech-accessories', subcategory: 'smart-watches' },
      'fitness tracker': { category: 'tech-accessories', subcategory: 'smart-watches' },
      // CCTV
      'cctv': { category: 'tech-accessories', subcategory: 'cctv-cameras' },
      'security camera': { category: 'tech-accessories', subcategory: 'cctv-cameras' },
      'ip camera': { category: 'tech-accessories', subcategory: 'cctv-cameras' },
      // Networking
      'network switch': { category: 'tech-accessories', subcategory: 'network-switches' },
      'ethernet switch': { category: 'tech-accessories', subcategory: 'network-switches' },
      'wifi extender': { category: 'tech-accessories', subcategory: 'wifi-extenders' },
      'wifi repeater': { category: 'tech-accessories', subcategory: 'wifi-extenders' },
      'router': { category: 'tech-accessories', subcategory: 'wifi-extenders' }, // Assuming routers fit here
      // Sleeves
      'laptop sleeve': { category: 'tech-accessories', subcategory: 'tablet-laptop-sleeves' },
      'tablet sleeve': { category: 'tech-accessories', subcategory: 'tablet-laptop-sleeves' },
      'laptop case': { category: 'tech-accessories', subcategory: 'tablet-laptop-sleeves' },
  },
  'computing-devices': {
      'mouse': { category: 'computing-devices', subcategory: 'keys-clicks' },
      'keyboard': { category: 'computing-devices', subcategory: 'keys-clicks' },
      'laptop': { category: 'computing-devices', subcategory: 'laptops' },
      'monitor': { category: 'computing-devices', subcategory: 'monitors' },
      'tablet': { category: 'computing-devices', subcategory: 'tablets' },
      'workstation': { category: 'computing-devices', subcategory: 'workstations' },
      'all-in-one': { category: 'computing-devices', subcategory: 'all-in-one-computers' },
      // 'shredder': { ... } // MOVED
  },
  'home-appliances': {
      'ac': { category: 'home-appliances', subcategory: 'air-conditioners' },
      'air conditioner': { category: 'home-appliances', subcategory: 'air-conditioners' },
      'television': { category: 'home-appliances', subcategory: 'televisions' },
      'tv': { category: 'home-appliances', subcategory: 'televisions' },
      'fan': { category: 'home-appliances', subcategory: 'fans' },
      'air purifier': { category: 'home-appliances', subcategory: 'air-purifiers' },
      'washing machine': { category: 'home-appliances', subcategory: 'washing-machines' },
      'refrigerator': { category: 'home-appliances', subcategory: 'refrigerators' },
      'fridge': { category: 'home-appliances', subcategory: 'refrigerators' },
      'iron': { category: 'home-appliances', subcategory: 'irons' },
      'vacuum': { category: 'home-appliances', subcategory: 'vacuum-cleaners' },
  },
  'kitchen-appliances': {
      'blender': { category: 'kitchen-appliances', subcategory: 'blenders' },
      'rice cooker': { category: 'kitchen-appliances', subcategory: 'rice-cooker' },
      'air fryer': { category: 'kitchen-appliances', subcategory: 'air-fryers' },
      'airfryer': { category: 'kitchen-appliances', subcategory: 'air-fryers' },
      'toaster': { category: 'kitchen-appliances', subcategory: 'toasters' },
      'kettle': { category: 'kitchen-appliances', subcategory: 'kettles' },
      'microwave': { category: 'kitchen-appliances', subcategory: 'microwaves' },
      'dishwasher': { category: 'kitchen-appliances', subcategory: 'dishwashers' },
      'stove': { category: 'kitchen-appliances', subcategory: 'stoves' },
  },
  'printers & scanners': {
      'printer': { category: 'printers-scanners', subcategory: 'printers-scanners' },
      'scanner': { category: 'printers-scanners', subcategory: 'printers-scanners' },
      'toner': { category: 'printers-scanners', subcategory: 'toners' },
      'cartridge': { category: 'printers-scanners', subcategory: 'ink-cartridges' },
  },
  // ADDED: Moved from computing-devices to its own category
  'shredders': {
      'shredder': { category: 'shredders', subcategory: 'shredders' }
  },
  'ups': {
      'ups': { category: 'ups', subcategory: 'ups' },
      'uninterruptible power supply': { category: 'ups', subcategory: 'ups' }
  }
};


function findCategoryByKeyword(name) {
    const nameLower = name.toLowerCase();
    for (const catId in KEYWORD_MAP) {
        for (const keyword in KEYWORD_MAP[catId]) {
            if (nameLower.includes(keyword)) {
                const mapping = KEYWORD_MAP[catId][keyword];
                const category = Object.values(CATEGORY_MAP).find(c => c.id === mapping.category);
                const subcategory = category.subs[Object.keys(category.subs).find(sk => category.subs[sk].id === mapping.subcategory)];
                return { category, subcategory };
            }
        }
    }
    return null;
}


// ---------- Main transform ----------
function transformRecord(raw) {
  const name = String(raw['Name'] || raw['Product Name'] || '').trim();
  const fullDescription = String(raw['Description'] || raw['description'] || '').trim();
  const sale = parseNumber(raw['Sale price']);
  const regular = parseNumber(raw['Regular price']);
  let cats = parseCategoriesField(raw['Categories'] || raw['Category']);

  // --- NEW: Keyword fallback logic ---
  if (!cats) {
      cats = findCategoryByKeyword(name);
  }

  // Price logic
  let price = Number.isFinite(sale) && sale > 0 ? sale
            : Number.isFinite(regular) && regular > 0 ? regular
            : 0;

  // Category/subcategory resolution
  let categoryId = 'uncategorized';
  let categoryName = 'Uncategorized';
  let subcategoryId = 'misc';
  let subcategoryName = 'Misc';
  if (cats && cats.category && cats.subcategory) {
    categoryId = cats.category.id;
    categoryName = cats.category.name;
    subcategoryId = cats.subcategory.id;
    subcategoryName = cats.subcategory.name;
  }

  // Slug and ID
  const nameSlug = slugify(name);
  const seq = nextIdNumber(categoryId, subcategoryId);
  const id = `${subcategoryId}-${seq}-${nameSlug || 'product'}`;
  const slug = id;

  const brand = extractBrand(name);
  const description = makeTeaser(fullDescription, 150);
  const images = buildImages(categoryId, subcategoryId, nameSlug || 'product');

  const product = {
    id,
    slug,
    categoryId,
    categoryName,
    subcategoryId,
    subcategoryName,
    brand,
    name,
    price,
    stock: DEFAULT_STOCK,
    rating: DEFAULT_RATING,
    images,
    description,
    fullDescription,
    active: true,
  };

  return product;
}

// ---------- Grouping utility ----------
function groupByCategory(products) {
  const categories = {};

  for (const p of products) {
    if (!categories[p.categoryId]) {
      categories[p.categoryId] = {
        id: p.categoryId,
        name: p.categoryName,
        subcategories: {},
      };
    }
    const cat = categories[p.categoryId];

    if (!cat.subcategories[p.subcategoryId]) {
      cat.subcategories[p.subcategoryId] = {
        id: p.subcategoryId,
        name: p.subcategoryName,
        products: [],
      };
    }
    // Prevent adding to a 'misc' subcategory if other subcategories exist for that category
    const hasRealSubcategories = Object.keys(cat.subcategories).some(key => key !== 'misc');
    if (p.subcategoryId === 'misc' && hasRealSubcategories && p.categoryId !== 'uncategorized') {
        // This case should be rare with the new logic, but as a safeguard:
        console.warn(`[INFO] Product "${p.name}" fell into a 'misc' bucket for category "${p.categoryName}" which has proper subcategories. Review keywords.`);
    }
    cat.subcategories[p.subcategoryId].products.push(p);
  }

  // Convert nested maps to arrays
  const result = {
    categories: Object.values(categories).map(cat => ({
      id: cat.id,
      name: cat.name,
      subcategories: Object.values(cat.subcategories),
    })),
  };

  return result;
}

// ---------- Run ----------
(function main() {
  const inputPath = INPUT;
  const outDir = OUT_DIR;

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const rawData = readJSON(inputPath);
  if (!Array.isArray(rawData)) {
    console.error('Input JSON must be an array of product records.');
    process.exit(1);
  }

  let unmappedCount = 0;
  const products = rawData.map((rec, idx) => {
    const prod = transformRecord(rec);
    if (prod.categoryId === 'uncategorized') {
      unmappedCount++;
      console.warn(
        `[warn] Unmapped category for record #${idx + 1} (${prod.name}). Categories field: ${rec['Categories']}`
      );
    }
    return prod;
  });

  const flatOut = writeJSON('products.flat2.json', products);
  const grouped = groupByCategory(products);
  const groupedOut = writeJSON('products.grouped2.json', grouped);

  // In main(), after groupedOut
  const numFlash = Math.floor(Math.random() * 6) + 5;  // Random 5-10
  const flashProducts = [];
  const usedIndices = new Set();
  while (flashProducts.length < numFlash) {
    const idx = Math.floor(Math.random() * products.length);
    if (!usedIndices.has(idx)) {
      usedIndices.add(idx);
      const p = { ...products[idx] };  // Copy
      const discount = Math.random() * 0.4 + 0.1;
      p.isFlashSale = true;
      p.flashSalePrice = Math.round(p.price * (1 - discount) * 100) / 100;
      p.flashSaleImage = p.images[0] || '';
      p.flashSaleStock = Math.floor(Math.random() * 151) + 50;
      flashProducts.push(p);
    }
  }
  const flashOut = writeJSON('flash-sales.json', { flashSales: flashProducts });
  console.log(` - ${flashOut}`);

  console.log(`Transformed ${products.length} records.`);
  if (unmappedCount > 0) {
    console.log(`Note: ${unmappedCount} record(s) could not be mapped to known categories and were placed under "Uncategorized > Misc".`);
  }
  console.log(`Wrote:\n - ${flatOut}\n - ${groupedOut}`);
})();