// routes/products.js - OPTIMIZED with Redis Caching
const express = require('express');
const logger = require('../logger');
const Product = require('../models/Product');
const { isAuthenticated } = require('../middleware/auth');
const CacheMiddleware = require('../middleware/cacheMiddleware');
const cacheService = require('../services/cacheService');

const requireRole = (role) => (req, res, next) => {
  if (req.user && req.user.role === role) {
    next();
  } else {
    res.status(403).json({ msg: 'Access denied' });
  }
};
const { z } = require('zod');
const fs = require('fs').promises; // <-- ADDED: For file system operations
const path = require('path');       // <-- ADDED: For path joining
const multer = require('multer');   // <-- ADDED: For image upload handling

const router = express.Router();

// --- ADDED: JSON Regeneration Logic (ENHANCED) ---
const productsJsonPath = path.join(__dirname, '..', 'products.grouped2.json');
const productsJsonAssetsPath = path.join(__dirname, '..', 'assets', 'data', 'products.grouped2.json');

// Canonical category map (aligned with transform-products.js)
const CATEGORY_MAP = {
  'printers & scanners': {
    id: 'printers-scanners',
    name: 'Printers & Scanners',
    subs: {
      'printers & scanners': { id: 'printers-scanners', name: 'Printers & Scanners' },
      'toners': { id: 'toners', name: 'Toners' },
      'ink cartridges': { id: 'ink-cartridges', name: 'Ink Cartridges' },
      'ink catridges': { id: 'ink-cartridges', name: 'Ink Cartridges' },
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
      'keys & clicks': { id: 'keys-clicks', name: 'Keys & Clicks' },
      'keys': { id: 'keys-clicks', name: 'Keys & Clicks' },
      'starlink': { id: 'starlink', name: 'Starlink' }
    },
  },
  'home appliances': {
    id: 'home-appliances',
    name: 'Home Appliances',
    subs: {
      'washing machines': { id: 'washing-machines', name: 'Washing Machines' },
      'refrigerators': { id: 'refrigerators', name: 'Refrigerators' },
      'refridgerators': { id: 'refrigerators', name: 'Refrigerators' },
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
      'rice cookers': { id: 'rice-cooker', name: 'Rice Cooker' },
      'rice-cookers': { id: 'rice-cooker', name: 'Rice Cooker' },
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
  'shredders': {
    id: 'shredders',
    name: 'Shredders',
    subs: {
      'shredders': { id: 'shredders', name: 'Shredders' }
    }
  },
  'combo deals': {
    id: 'combo-deals',
    name: 'Combo Deals',
    subs: {
      'combo deals': { id: 'combo-deals', name: 'Combo Deals' }
    }
  }
};

const SUBCATEGORY_TO_CATEGORY_MAP = {};
const SUBCATEGORY_ID_TO_CATEGORY = {};
const CATEGORY_ID_MAP = {};
for (const k in CATEGORY_MAP) {
  const c = CATEGORY_MAP[k];
  CATEGORY_ID_MAP[c.id] = { id: c.id, name: c.name, subs: c.subs };
  for (const sk in c.subs) {
    if (!SUBCATEGORY_TO_CATEGORY_MAP[sk]) {
      SUBCATEGORY_TO_CATEGORY_MAP[sk] = { category: { id: c.id, name: c.name }, subcategory: c.subs[sk] };
    }
    const sub = c.subs[sk];
    SUBCATEGORY_ID_TO_CATEGORY[sub.id] = { category: { id: c.id, name: c.name }, subcategory: sub };
  }
}

function normalizeToken(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/&/g, ' & ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveExplicitCategory(catRaw, subRaw) {
  const catTok = normalizeToken(catRaw);
  const subTok = normalizeToken(subRaw);

  // 1) If subcategory is provided as ID (e.g., 'storage-devices')
  if (SUBCATEGORY_ID_TO_CATEGORY[subTok]) {
    const mapping = SUBCATEGORY_ID_TO_CATEGORY[subTok];
    return {
      categoryId: mapping.category.id,
      categoryName: mapping.category.name,
      subcategoryId: mapping.subcategory.id,
      subcategoryName: mapping.subcategory.name,
    };
  }

  // 2) If subcategory is provided as name (e.g., 'Storage Devices')
  if (subTok && SUBCATEGORY_TO_CATEGORY_MAP[subTok]) {
    const mapping = SUBCATEGORY_TO_CATEGORY_MAP[subTok];
    return {
      categoryId: mapping.category.id,
      categoryName: mapping.category.name,
      subcategoryId: mapping.subcategory.id,
      subcategoryName: mapping.subcategory.name,
    };
  }

  // 3) If category is provided as ID (e.g., 'tech-accessories'), default to first sub
  if (CATEGORY_ID_MAP[catTok]) {
    const cat = CATEGORY_ID_MAP[catTok];
    const primarySub = cat.subs[Object.keys(cat.subs)[0]];
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      subcategoryId: primarySub?.id || 'misc',
      subcategoryName: primarySub?.name || 'Misc',
    };
  }

  // 4) If category is provided as name (e.g., 'Tech Accessories')
  if (catTok && CATEGORY_MAP[catTok]) {
    const cat = CATEGORY_MAP[catTok];
    const primarySub = cat.subs[Object.keys(cat.subs)[0]];
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      subcategoryId: primarySub?.id || 'misc',
      subcategoryName: primarySub?.name || 'Misc',
    };
  }

  return null;
}

/**
 * Enhanced Product Categorization Logic
 * Uses intelligent keyword matching, brand recognition, and product analysis
 */
function intelligentCategorizeProduct(product) {
  const productName = (product.name || '').toLowerCase();
  const productDesc = (product.description || '').toLowerCase();
  const combinedText = `${productName} ${productDesc}`.toLowerCase();
  
  // Enhanced categorization rules with priority scoring
  const categoryRules = {
    // Computing Devices - Laptops
    'laptops': {
      categoryId: 'computing-devices',
      categoryName: 'Computing Devices',
      subcategoryId: 'laptops', 
      subcategoryName: 'Laptops',
      keywords: ['laptop', 'notebook', 'chromebook', 'elitebook', 'thinkpad', 'vivobook', 'ideapad', 'macbook'],
      excludeKeywords: ['all-in-one', 'aio', 'desktop', 'workstation tower', 'tablet', 'monitor', 'bag', 'backpack', 'briefcase', 'sleeve', 'case', 'pouch'],
      brands: ['dell laptop', 'hp laptop', 'lenovo laptop', 'asus laptop'],
      patterns: [/.*book.*/, /.*pad.*flex.*/],
      priority: 10
    },
    
    // Computing Devices - Tablets  
    'tablets': {
      categoryId: 'computing-devices',
      categoryName: 'Computing Devices', 
      subcategoryId: 'tablets',
      subcategoryName: 'Tablets',
      keywords: ['tablet', 'ipad', 'galaxy tab', 'tab ', 'vista tab', 'surface'],
      excludeKeywords: ['laptop', 'notebook', 'chromebook', 'phone'],
      brands: ['apple ipad', 'samsung galaxy', 'itel vista'],
      patterns: [/.*tab.*\d+/, /ipad.*/],
      priority: 10
    },
    
    // Computing Devices - Monitors
    'monitors': {
      categoryId: 'computing-devices',
      categoryName: 'Computing Devices',
      subcategoryId: 'monitors', 
      subcategoryName: 'Monitors',
      keywords: ['monitor', 'display', 'screen', 'lcd', 'led', 'oled', 'uhd display'],
      excludeKeywords: ['laptop', 'tablet', 'phone', 'tv', 'television'],
      prefixes: ['mon ', 'display '],
      patterns: [/.*display.*/, /.*monitor.*/],
      priority: 9
    },
    
    // Computing Devices - Workstations (actual workstations only)
    'workstations': {
      categoryId: 'computing-devices', 
      categoryName: 'Computing Devices',
      subcategoryId: 'workstations',
      subcategoryName: 'Workstations', 
      keywords: ['precision tower', 'z workstation', 'professional desktop', 'cad workstation'],
      strictKeywords: ['workstation'],
      excludeKeywords: ['laptop', 'tablet', 'monitor', 'all-in-one', 'printer', 'shredder', 'ipad', 'chromebook', 'elitebook'],
      patterns: [/.*precision.*tower/, /.*z.*workstation/],
      priority: 8,
      strictMatching: true
    },
    
    // Computing Devices - All-in-One Computers
    'all-in-one-computers': {
      categoryId: 'computing-devices',
      categoryName: 'Computing Devices', 
      subcategoryId: 'all-in-one-computers',
      subcategoryName: 'All-in-One Computers',
      keywords: ['all-in-one', 'aio', 'eliteone', 'thinkcentre', 'imac'],
      patterns: [/.*aio.*/, /.*all.?in.?one.*/, /.*centre.*neo.*/],
      priority: 9
    },
    
    // Computing Devices - Keys & Clicks
    'keys-clicks': {
      categoryId: 'computing-devices',
      categoryName: 'Computing Devices',
      subcategoryId: 'keys-clicks',
      subcategoryName: 'Keys & Clicks', 
      keywords: ['keyboard', 'mouse', 'trackpad', 'touchpad'],
      patterns: [/.*keyboard.*/, /.*mouse.*/],
      priority: 8
    },
    
    // Computing Devices - Starlink
    'starlink': {
      categoryId: 'computing-devices',
      categoryName: 'Computing Devices',
      subcategoryId: 'starlink', 
      subcategoryName: 'Starlink',
      keywords: ['starlink', 'satellite internet'],
      patterns: [/starlink.*/],
      priority: 10,
      strictMatching: true
    },
    
    // Mobile Phones
    'apple-iphone': {
      categoryId: 'mobile-phones',
      categoryName: 'Mobile Phones',
      subcategoryId: 'apple-iphone',
      subcategoryName: 'Apple iPhone',
      keywords: ['iphone'],
      excludeKeywords: ['tablet', 'ipad'],
      patterns: [/iphone.*/],
      priority: 10,
      strictMatching: true
    },
    
    'samsung-smartphones': {
      categoryId: 'mobile-phones', 
      categoryName: 'Mobile Phones',
      subcategoryId: 'samsung-smartphones',
      subcategoryName: 'Samsung Smartphones',
      keywords: ['galaxy'],
      excludeKeywords: ['tablet', 'tab'],
      patterns: [/galaxy.*(?!tab)/],
      priority: 9
    },
    
    // Tech Accessories
    'headsets-earphones': {
      categoryId: 'tech-accessories',
      categoryName: 'Tech Accessories',
      subcategoryId: 'headsets-earphones',
      subcategoryName: 'Headsets & Earphones',
      keywords: ['headset', 'headphone', 'earphone', 'earpod', 'airpod', 'earbuds'],
      patterns: [/.*head.*/, /.*ear.*/, /.*pod.*/],
      priority: 8
    },
    
    'power-solutions': {
      categoryId: 'tech-accessories',
      categoryName: 'Tech Accessories', 
      subcategoryId: 'power-solutions',
      subcategoryName: 'Power Solutions',
      keywords: ['adapter', 'charger', 'power bank', 'powerbank', 'cable', 'surge protector'],
      patterns: [/.*adapt.*/, /.*charg.*/, /.*power.*bank.*/, /.*cable.*/],
      priority: 7
    },
    
    'storage-devices': {
      categoryId: 'tech-accessories',
      categoryName: 'Tech Accessories',
      subcategoryId: 'storage-devices', 
      subcategoryName: 'Storage Devices',
      keywords: ['flash drive', 'thumb drive', 'hard drive', 'ssd', 'memory card'],
      patterns: [/.*drive.*/, /.*storage.*/, /.*memory.*card.*/],
      priority: 7
    },
    
    // Tech Accessories - Smart Watches
    'smart-watches': {
      categoryId: 'tech-accessories',
      categoryName: 'Tech Accessories',
      subcategoryId: 'smart-watches',
      subcategoryName: 'Smart Watches',
      keywords: ['smartwatch','smart watch','watch with display','fitness watch','wearable'],
      patterns: [/smart\s*watch/, /watch\b.*(bluetooth|call|fitness)/],
      excludeKeywords: ['monitor','tv','display'],
      priority: 10
    },

    // Tech Accessories - CCTV Cameras
    'cctv-cameras': {
      categoryId: 'tech-accessories',
      categoryName: 'Tech Accessories',
      subcategoryId: 'cctv-cameras',
      subcategoryName: 'CCTV Cameras',
      keywords: ['cctv','security camera','surveillance camera','bullet camera','dome camera','nvr','dvr','hikvision','dahua'],
      patterns: [/\b(nvr|dvr)\b/, /hikvision/i, /dahua/i, /security\s*camera/i],
      priority: 11
    },

    // Tech Accessories - Network Switches
    'network-switches': {
      categoryId: 'tech-accessories',
      categoryName: 'Tech Accessories',
      subcategoryId: 'network-switches',
      subcategoryName: 'Network Switches',
      keywords: ['network switch','switch','poe switch','gigabit switch','managed switch','unmanaged switch'],
      excludeKeywords: ['keyboard'],
      patterns: [/\b(po?e)\b.*switch/i, /\bgigabit\b.*switch/i],
      priority: 9
    },

    // Tech Accessories - WiFi Extenders
    'wifi-extenders': {
      categoryId: 'tech-accessories',
      categoryName: 'Tech Accessories',
      subcategoryId: 'wifi-extenders',
      subcategoryName: 'WiFi Extenders',
      keywords: ['wifi extender','range extender','repeater','mesh extender','signal booster'],
      patterns: [/extender/i, /repeater/i, /range\s*extender/i],
      priority: 8
    },

    // Tech Accessories - Tablet & Laptop Sleeves
    'tablet-laptop-sleeves': {
      categoryId: 'tech-accessories',
      categoryName: 'Tech Accessories',
      subcategoryId: 'tablet-laptop-sleeves',
      subcategoryName: 'Tablet & Laptop Sleeves',
      keywords: ['laptop sleeve','tablet sleeve','protective sleeve','laptop case','tablet case','sleeve', 'bag', 'backpack', 'briefcase', 'pouch'],
      patterns: [/sleeve/i, /(laptop|tablet).*case/i, /(laptop|notebook).*bag/i, /(laptop|notebook).*backpack/i],
      priority: 9
    },

    // Tech Accessories - Wireless Sound (speakers/soundbars)
    'wireless-sound': {
      categoryId: 'tech-accessories',
      categoryName: 'Tech Accessories',
      subcategoryId: 'wireless-sound',
      subcategoryName: 'Wireless Sound',
      keywords: ['bluetooth speaker','speaker','soundbar','wireless speaker'],
      excludeKeywords: ['headphone','earphone','earbud','headset'],
      patterns: [/soundbar/i, /(bluetooth|wireless).*speaker/i],
      priority: 7
    },
    
    // Home Appliances
    'washing-machines': {
      categoryId: 'home-appliances',
      categoryName: 'Home Appliances',
      subcategoryId: 'washing-machines',
      subcategoryName: 'Washing Machines',
      keywords: ['washing machine','washer','wash','front load','top load'],
      excludeKeywords: ['dishwasher'],
      patterns: [/washing\s*machine/i, /(front|top)\s*load/i],
      priority: 9
    },
    'refrigerators': {
      categoryId: 'home-appliances',
      categoryName: 'Home Appliances',
      subcategoryId: 'refrigerators',
      subcategoryName: 'Refrigerators',
      keywords: ['refrigerator','fridge','freezer','side by side','double door'],
      patterns: [/fridge/i, /refrigerator/i, /freezer/i],
      priority: 9
    },
    'irons': {
      categoryId: 'home-appliances',
      categoryName: 'Home Appliances',
      subcategoryId: 'irons',
      subcategoryName: 'Irons',
      keywords: ['steam iron','dry iron','garment steamer','iron'],
      patterns: [/iron/i, /garment\s*steam/i],
      priority: 7
    },
    'vacuum-cleaners': {
      categoryId: 'home-appliances',
      categoryName: 'Home Appliances',
      subcategoryId: 'vacuum-cleaners',
      subcategoryName: 'Vacuum Cleaners',
      keywords: ['vacuum cleaner','vacuum','stick vacuum','robot vacuum'],
      patterns: [/vacuum/i],
      priority: 7
    },
    'air-purifiers': {
      categoryId: 'home-appliances',
      categoryName: 'Home Appliances',
      subcategoryId: 'air-purifiers',
      subcategoryName: 'Air Purifiers',
      keywords: ['air purifier','purifier','hepa'],
      patterns: [/air\s*purifier/i, /hepa/i],
      priority: 6
    },
    'televisions': {
      categoryId: 'home-appliances',
      categoryName: 'Home Appliances',
      subcategoryId: 'televisions',
      subcategoryName: 'Televisions', 
      keywords: ['television', 'tv', 'smart tv'],
      excludeKeywords: ['monitor', 'display'],
      patterns: [/.*tv.*/, /.*television.*/],
      priority: 8
    },
    
    'air-conditioners': {
      categoryId: 'home-appliances',
      categoryName: 'Home Appliances',
      subcategoryId: 'air-conditioners',
      subcategoryName: 'Air Conditioners',
      keywords: ['air conditioner', 'ac unit', 'hvac', 'cooling'],
      patterns: [/.*ac.*/, /.*air.*condition.*/],
      priority: 8
    },
    
    // Printers & Scanners - Subtabs first
    'toners': {
      categoryId: 'printers-scanners',
      categoryName: 'Printers & Scanners',
      subcategoryId: 'toners',
      subcategoryName: 'Toners',
      keywords: ['toner','laser toner','drum unit','imaging unit','cf2','ce2','tn-','106r','toner cartridge'],
      patterns: [/\btn\d+/i, /\b106r\b/i, /\bce\d{2}\b/i, /\bcf\d{2}\b/i],
      priority: 12
    },
    'ink-cartridges': {
      categoryId: 'printers-scanners',
      categoryName: 'Printers & Scanners',
      subcategoryId: 'ink-cartridges',
      subcategoryName: 'Ink Cartridges',
      keywords: ['ink cartridge','ink catridge','ink','cartridge','inktank','ink bottle','003','664','650','652','003 ink'],
      patterns: [/\b\d{3}\b.*ink/i],
      excludeKeywords: ['toner'],
      priority: 11
    },
    'printing-consumables': {
      // Place many papers and maintenance supplies here
      categoryId: 'printers-scanners',
      categoryName: 'Printers & Scanners',
      subcategoryId: 'printing-consumables',
      subcategoryName: 'Printing Consumables',
      keywords: ['printing paper','photo paper','glossy paper','matte paper','ink refill','maintenance box','waste ink'],
      priority: 9
    },

    // Printers & Scanners
    'printers-scanners': {
      categoryId: 'printers-scanners',
      categoryName: 'Printers & Scanners',
      subcategoryId: 'printers-scanners',
      subcategoryName: 'Printers & Scanners', 
      keywords: ['printer', 'scanner', 'inkjet', 'laser printer'],
      excludeKeywords: ['shredder', 'computer', 'laptop'],
      patterns: [/.*print.*/, /.*scan.*/],
      priority: 8
    },
    
    // UPS Category
    'ups': {
      categoryId: 'ups',
      categoryName: 'UPS',
      subcategoryId: 'ups',
      subcategoryName: 'UPS',
      keywords: ['ups','smart-ups','line interactive ups','online ups','avr','voltage regulator','stabilizer','inverter'],
      patterns: [/\bups\b/i, /smart[- ]?ups/i, /\bkva\b/i, /voltage\s*(regulator|protector)/i, /stabilizer/i, /avr/i],
      excludeKeywords: ['printer','scanner','laptop','tablet','phone'],
      priority: 10
    },

    // Shredders (separate category)
    'shredders': {
      categoryId: 'shredders',
      categoryName: 'Shredders',
      subcategoryId: 'shredders',
      subcategoryName: 'Shredders',
      keywords: ['shredder', 'paper shredder'], 
      patterns: [/.*shred.*/],
      priority: 10,
      strictMatching: true
    }
  };
  
  // Score each rule
  let bestMatch = null;
  let bestScore = 0;
  
  for (const [ruleKey, rule] of Object.entries(categoryRules)) {
    let score = 0;
    
    // Check exclude keywords first
    if (rule.excludeKeywords) {
      let excluded = false;
      for (const excludeKeyword of rule.excludeKeywords) {
        if (combinedText.includes(excludeKeyword.toLowerCase())) {
          excluded = true;
          break;
        }
      }
      if (excluded) continue;
    }
    
    // Keyword matching
    if (rule.keywords) {
      for (const keyword of rule.keywords) {
        if (combinedText.includes(keyword.toLowerCase())) {
          score += rule.priority;
          break;
        }
      }
    }
    
    // Strict keyword matching (must match)
    if (rule.strictKeywords) {
      let strictMatch = false;
      for (const strictKeyword of rule.strictKeywords) {
        if (combinedText.includes(strictKeyword.toLowerCase())) {
          strictMatch = true;
          break;
        }
      }
      if (rule.strictMatching && !strictMatch) continue;
      if (strictMatch) score += rule.priority * 2;
    }
    
    // Pattern matching
    if (rule.patterns) {
      for (const pattern of rule.patterns) {
        if (pattern.test(combinedText)) {
          score += rule.priority * 0.8;
          break;
        }
      }
    }
    
    // Prefix matching
    if (rule.prefixes) {
      for (const prefix of rule.prefixes) {
        if (productName.startsWith(prefix.toLowerCase())) {
          score += rule.priority * 1.5;
          break;
        }
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        categoryId: rule.categoryId,
        categoryName: rule.categoryName,
        subcategoryId: rule.subcategoryId,
        subcategoryName: rule.subcategoryName
      };
    }
  }
  
  // Fallback to uncategorized
  if (!bestMatch || bestScore < 3) {
    return {
      categoryId: 'uncategorized',
      categoryName: 'Uncategorized', 
      subcategoryId: 'misc',
      subcategoryName: 'Misc'
    };
  }
  
  return bestMatch;
}

// Attach to router so external scripts can import from routes/products
// (Express router is a function object; safe to add properties)


/**
 * Enhanced regenerateProductJson function with intelligent categorization
 */
async function regenerateProductJson() {
  try {
    logger.info('Regenerating products.grouped2.json with enhanced categorization...');
    
    // Fetch all *active* products
    const dbProducts = await Product.find({ active: true }).lean().select('-__v');

    // Helpers to match transform-products.js
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
    
    const idCounters = new Map();
    function nextIdNumber(catId, subId) {
      const key = `${catId}/${subId}`;
      const n = (idCounters.get(key) || 0) + 1;
      idCounters.set(key, n);
      return String(n).padStart(3, '0');
    }

    // Transform DB products using explicit category/subcategory when provided, else intelligent categorization
    const normalized = dbProducts.map(p => {
      // Prefer admin explicit category/subcategory first; fall back to intelligent categorization if missing
      const explicit = resolveExplicitCategory(p.category, p.subcategory);
      const intel = intelligentCategorizeProduct(p);

      // Heuristic correction for obviously wrong explicit selections
      const txt = `${(p.name||'').toLowerCase()} ${(p.description||'').toLowerCase()}`;
      let categoryResult = explicit || intel; // Admin-first precedence
      // Keep safety override for Workstations if admin accidentally picked it for laptop/tablet/monitor
      const looksLikeLaptop = /(laptop|notebook|chromebook|elitebook|thinkpad|zbook|vivobook|ideapad|macbook)/.test(txt);
      const looksLikeTablet = /(tablet|ipad|galaxy\s*tab|tab\s?\d+)/.test(txt);
      const looksLikeMonitor = /(monitor|display|lcd|led|oled)/.test(txt);
      if (!explicit && explicit?.subcategoryId === 'workstations' && (looksLikeLaptop || looksLikeTablet || looksLikeMonitor)) {
        categoryResult = intel;
      }
      
      const categoryId = categoryResult.categoryId;
      const categoryName = categoryResult.categoryName;
      const subcategoryId = categoryResult.subcategoryId;
      const subcategoryName = categoryResult.subcategoryName;

      // Build transform-style id and slug
      const nameSlug = slugify(p.name);
      const seq = nextIdNumber(categoryId, subcategoryId);
      const id = `${subcategoryId}-${seq}-${nameSlug || 'product'}`;
      const slug = id;

      // Images: use db images if provided, else default 2 images per transform convention
      const images = Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : [
            `assets/images/products/${categoryId}/${subcategoryId}/${nameSlug}-1.webp`,
            `assets/images/products/${categoryId}/${subcategoryId}/${nameSlug}-2.webp`
          ];

      return {
        id,
        slug,
        categoryId,
        categoryName,
        subcategoryId,
        subcategoryName,
        brand: p.brand || '',
        name: p.name || 'Unnamed Product',
        price: Number(p.price) || 0,
        stock: Number(p.stock) || 0,
        rating: Number(p.rating) || 0,
        images,
        description: p.description || '',
        fullDescription: p.fullDescription || '',
        active: true,
        // Include combo-specific fields if available
        isComboDeals: p.category === 'combo-deals' || p.categoryId === 'combo-deals',
        comboDealsPrice: p.comboDealsPrice ? Number(p.comboDealsPrice) : null
      };
    });

    // Group like transform-products.js
    const categories = {};
    for (const p of normalized) {
      if (!categories[p.categoryId]) {
        categories[p.categoryId] = {
          id: p.categoryId,
          name: p.categoryName,
          subcategories: {}
        };
      }
      const cat = categories[p.categoryId];
      if (!cat.subcategories[p.subcategoryId]) {
        cat.subcategories[p.subcategoryId] = {
          id: p.subcategoryId,
          name: p.subcategoryName,
          products: []
        };
      }
      cat.subcategories[p.subcategoryId].products.push(p);
    }

    const finalStructure = {
      categories: Object.values(categories).map(cat => ({
        id: cat.id,
        name: cat.name,
        subcategories: Object.values(cat.subcategories)
      }))
    };

    // Write both to root and to assets/data consumed by frontend
    await fs.writeFile(productsJsonPath, JSON.stringify(finalStructure, null, 2), 'utf8');
    await fs.mkdir(path.dirname(productsJsonAssetsPath), { recursive: true });
    await fs.writeFile(productsJsonAssetsPath, JSON.stringify(finalStructure, null, 2), 'utf8');
    
    // Improved Combo Deals filtering - check ID or normalized flag
    const comboProducts = normalized.filter(p => p.isComboDeals);
    logger.info(`[Regenerate] Found ${comboProducts.length} combo deals in normalized data.`);
    if (comboProducts.length > 0) {
      const comboData = {
        combos: comboProducts.map(p => ({
          id: p.id,
          slug: p.slug,
          name: p.name || 'Combo Deal',
          price: Number(p.price) || 0,
          // Map comboPrice for frontend loader
          comboPrice: (p.comboDealsPrice && Number(p.comboDealsPrice) > 0) ? Number(p.comboDealsPrice) : (Number(p.price) || 0),
          rating: p.rating || 0,
          images: p.images || [],
          description: p.description || ''
        }))
      };
      
      const comboPath = path.join(__dirname, '..', 'combo-offers-v2.json');
      await fs.writeFile(comboPath, JSON.stringify(comboData, null, 2), 'utf8');
      
      // Also write to assets/data for consistency
      const comboAssetsPath = path.join(__dirname, '..', 'assets', 'data', 'combo-offers-v2.json');
      await fs.mkdir(path.dirname(comboAssetsPath), { recursive: true });
      await fs.writeFile(comboAssetsPath, JSON.stringify(comboData, null, 2), 'utf8');

      logger.info(`Generated combo-offers-v2.json with ${comboProducts.length} combo deals`);
    }

    logger.info('Successfully regenerated products.grouped2.json (root and assets/data) with enhanced categorization');
    
    // Log categorization summary
    const summary = {};
    for (const p of normalized) {
      const key = `${p.categoryName}/${p.subcategoryName}`;
      summary[key] = (summary[key] || 0) + 1;
    }
    logger.info('Categorization summary:', summary);

  } catch (error) {
    logger.error('Error regenerating product JSON:', error);
    // This error is logged but will not stop the API response
  }
}
// --- END ENHANCED REGENERATION ---


// GET /api/products?category=...&page=1&limit=12
router.get('/', CacheMiddleware.cacheProducts(), async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.admin !== 'true') {
      filter.active = true;
  }
  if (req.query.category) {
      filter.category = req.query.category;
  }
  if (req.query.subcategory) {
      filter.subcategory = req.query.subcategory;
  }
  // Promo assignment filters
  const promoType = String(req.query.promoType || '').toLowerCase();
  const assignedOnly = String(req.query.assignedOnly || '').toLowerCase() === 'true';
  if (assignedOnly && promoType) {
      if (promoType === 'flash-sales') {
          filter.isFlashSale = true;
      } else if (promoType === 'black-friday') {
          filter.isBlackFriday = true;
      } else if (promoType === 'christmas-sale') {
          filter.isChristmas = true;
      } else if (promoType === 'back-to-school') {
          filter.isBackToSchool = true;
      } else if (promoType === 'new-year') {
          filter.isNewYear = true;
      } else if (promoType === 'valentines') {
          filter.isValentines = true;
      } else if (promoType === 'independence-day') {
          filter.isIndependenceDay = true;
    } else if (promoType === 'top-selling') {
      filter.isTopSelling = true;
    } else if (promoType === 'combo-deals') {
      filter.isComboDeals = true;
    }
  }
  const q = (req.query.q || '').trim();
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { name: regex },
        { description: regex },
        { brand: regex },
        { slug: regex },
        { category: regex },
        { subcategory: regex }
      ];
    }

  const [items, total] = await Promise.all([
    Product.find(filter).lean().sort({ createdAt: -1 }).skip(skip).limit(limit).select('-__v'),
    Product.countDocuments(filter),
  ]);

  res.json({ 
    data: items, 
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total
    }
  });
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  const filter = { slug: req.params.slug };
  if (req.query.admin !== 'true') {
    filter.active = true;
  }

  const p = await Product.findOne(filter).lean().select('-__v');
  if (!p) return res.status(404).json({ message: 'Not found' });
  res.json(p);
});

// POST /api/products/by-ids - Fetch products by IDs
router.post('/by-ids', CacheMiddleware.invalidateProducts(), async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ message: 'Invalid request: ids must be an array' });

  const products = await Product.find({ _id: { $in: ids }, active: true }).lean().select('-__v');
  res.json(products);
});

// GET /api/products/flash-sales
router.get('/flash-sales', CacheMiddleware.cacheFlashSales(), async (req, res) => {
    try {
        const flashSaleProducts = await Product.find({ isFlashSale: true, active: true }).lean().select('-__v');

        if (!flashSaleProducts || flashSaleProducts.length === 0) {
            return res.status(404).json({ message: 'No active flash sale products found.' });
        }

        res.json(flashSaleProducts);
    } catch (error) {
        logger.error('Server Error fetching flash sale products:', error);
        res.status(500).send('Server Error');
    }
});

// --- ADDED: Multer storage (memory) and upload endpoint for product images ---

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max
const MAX_UPLOADS_PER_HOUR = 50; // Limit per admin user per hour

const uploadCounts = new Map();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    // Check MIME type, not just extension
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
    }
    
    // Additional security: Check for double extensions
    const filename = file.originalname.toLowerCase();
    if (/\.(jpe?g|png|webp|gif)\.(jpe?g|png|webp|gif)$/i.test(filename)) {
      return cb(new Error('Double file extensions are not allowed'), false);
    }
    
    cb(null, true);
  }
});

// Check upload rate limit
function checkUploadLimit(userId) {
  const key = userId || 'unknown';
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  
  let uploads = uploadCounts.get(key) || [];
  uploads = uploads.filter(time => time > oneHourAgo);
  
  if (uploads.length >= MAX_UPLOADS_PER_HOUR) {
    return false;
  }
  
  uploads.push(now);
  uploadCounts.set(key, uploads);
  return true;
}

router.options('/upload-image', (req, res) => {
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  return res.sendStatus(204);
});

router.post('/upload-image', isAuthenticated, requireRole('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    // Check upload rate limit
    if (!checkUploadLimit(req.user._id.toString())) {
      logger.warn(`Upload rate limit exceeded for user: ${req.user._id}`);
      return res.status(429).json({ message: 'Too many uploads. Please try again later.' });
    }
    
    const category = String(req.body.category || '').trim();
    const subcategory = String(req.body.subcategory || '').trim();
    const slug = String(req.body.slug || '').trim();
    const index = parseInt(String(req.body.index || '1'), 10) || 1;

    // Sanitize inputs to prevent path traversal
    const sanitizePath = (input) => {
      return input.replace(/[<>:"|?*]/g, '').replace(/\.\.+/g, '');
    };
    
    const safeCategory = sanitizePath(category);
    const safeSubcategory = sanitizePath(subcategory);
    const safeSlug = sanitizePath(slug);

    if (!safeCategory) return res.status(400).json({ message: 'Missing category' });
    if (!safeSubcategory) return res.status(400).json({ message: 'Missing subcategory' });
    if (!safeSlug) return res.status(400).json({ message: 'Missing slug' });
    if (index < 1 || index > 10) return res.status(400).json({ message: 'Index must be between 1 and 10' });

    // Normalize filename with .webp" extension by default
    const filename = `${safeSlug}-${index}.webp`;
    const relDir = path.join('assets', 'images', 'products', safeCategory, safeSubcategory);
    const relPath = path.join(relDir, filename).replace(/\\/g, '/');
    const absDir = path.join(__dirname, '..', relDir);
    const absPath = path.join(__dirname, '..', relPath);

    // Validate path doesn't escape web root
    const resolvedAbsDir = path.resolve(absDir);
    const resolvedProjectRoot = path.resolve(__dirname, '..');
    if (!resolvedAbsDir.startsWith(resolvedProjectRoot)) {
      logger.error(`Path traversal attempt detected: ${absDir}`);
      return res.status(403).json({ message: 'Invalid path' });
    }

    await fs.mkdir(absDir, { recursive: true });
    await fs.writeFile(absPath, req.file.buffer);

    logger.info(`Image uploaded successfully for product ${safeSlug} by user ${req.user._id}`);
    res.json({ path: relPath });
  } catch (err) {
    logger.error('Image upload failed:', err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Admin create/update
const productSchema = z.object({
  slug: z.string().min(1),
  category: z.string().min(1),
  subcategory: z.string().min(1),
  name: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().min(0).default(0),
  images: z.string().optional(), // Accepting a comma-separated string from the form
  description: z.string().default(''),
  fullDescription: z.string().default(''),
});

router.post('/', isAuthenticated, requireRole('admin'), CacheMiddleware.invalidateProducts(), async (req, res) => {
  try {
    // Coerce form string values to numbers before validation
    req.body.price = parseFloat(req.body.price);
    req.body.stock = parseInt(req.body.stock, 10);
    if (isNaN(req.body.price)) req.body.price = 0;
    if (isNaN(req.body.stock)) req.body.stock = 0;

    const body = productSchema.parse(req.body);

    // Process images string
    const imageArray = body.images ? body.images.split(',').map(s => s.trim()).filter(Boolean) : [];
    
    const exists = await Product.findOne({ slug: body.slug });
    if (exists) return res.status(409).json({ message: 'Slug already exists. Please change product name.' });

    const p = await Product.create({ ...body, images: imageArray });
    
    await regenerateProductJson(); // <-- ENHANCED: Call enhanced regeneration
    
    res.status(201).json(p);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    logger.error('Error creating product:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.patch('/:slug', isAuthenticated, requireRole('admin'), CacheMiddleware.invalidateProducts(), async (req, res) => {
  try {
      if (req.body.price) req.body.price = parseFloat(req.body.price);
      if (req.body.stock) req.body.stock = parseInt(req.body.stock, 10);

      const patchSchema = productSchema.omit({ slug: true }).partial();
      const data = patchSchema.parse(req.body);

      // Handle image string
      if (data.images && typeof data.images === 'string') {
        data.images = data.images.split(',').map(s => s.trim()).filter(Boolean);
      }

      const p = await Product.findOneAndUpdate({ slug: req.params.slug }, data, { new: true });
      if (!p) return res.status(404).json({ message: 'Not found' });

      await regenerateProductJson(); // <-- ENHANCED: Call enhanced regeneration

      res.json(p);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    logger.error('Error updating product:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.delete('/:slug', isAuthenticated, requireRole('admin'), CacheMiddleware.invalidateProducts(), async (req, res) => {
  try {
    // Find product first to gather image paths, then delete
    const p = await Product.findOne({ slug: req.params.slug });
    if (!p) return res.status(404).json({ message: 'Not found' });

    // Remove product document
    await Product.deleteOne({ _id: p._id });

    // Attempt to delete associated image files if they are relative project assets
    try {
      const imgs = Array.isArray(p.images) ? p.images : [];
      for (const rel of imgs) {
        if (!rel || typeof rel !== 'string') continue;
        // Only allow deletion inside assets/images/products
        if (!rel.startsWith('assets/images/products/')) continue;
        const abs = path.join(__dirname, '..', rel);
        try {
          await fs.unlink(abs);
        } catch {}
      }
    } catch (e) {
      logger.warn('Failed to clean up some product images:', e?.message);
    }

    await regenerateProductJson(); // <-- ENHANCED: Call enhanced regeneration

      res.json({ ok: true, message: 'Product deleted' });
  } catch (error) {
    logger.error('Error deactivating product:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Endpoint to update promo-specific images
const promoImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @route   POST /api/products/:slug/promo-image
// @desc    Update promo-specific image for a product
// @access  Private/Admin
router.post('/:slug/promo-image', isAuthenticated, requireRole('admin'), (req, res, next) => {
  // Debug logging
  logger.debug(`Promo image upload request received for slug: ${req.params.slug}`);
  logger.debug(`Request headers: ${JSON.stringify(req.headers)}`);

  promoImageUpload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      logger.error(`Multer error: ${err.code} - ${err.message}`);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      logger.error(`Upload error: ${err.message}`);
      return res.status(500).json({ message: err.message });
    }
    logger.debug('File upload successful, proceeding to route handler');
    next();
  });
}, async (req, res) => {
  try {
    const { slug } = req.params;
    const { promoType } = req.body;

    logger.debug(`Processing promo image upload for slug: ${slug}, promoType: ${promoType}`);

    if (!slug) {
      return res.status(400).json({ message: 'Product slug is required' });
    }

    if (!promoType) {
      return res.status(400).json({ message: 'Promo type is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    // Find the product
    const product = await Product.findOne({ slug });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Define the promo image field based on promo type
    const promoImageFields = {
      'flash-sales': 'flashSaleImage',
      'black-friday': 'blackFridayImage',
      'christmas-sale': 'christmasSaleImage',
      'back-to-school': 'backToSchoolImage',
      'new-year': 'newYearImage',
      'valentines': 'valentinesImage',
      'combo-deals': 'comboDealsImage',
      'independence-day': 'independenceDayImage'
    };

    const imageField = promoImageFields[promoType];
    if (!imageField) {
      return res.status(400).json({ message: 'Invalid promo type' });
    }

    // Sanitize inputs to prevent path traversal
    const sanitizePath = (input) => {
      return input.replace(/[<>:"|?*]/g, '').replace(/\.\.+/g, '');
    };

    const safeCategory = sanitizePath(product.category);
    const safeSubcategory = sanitizePath(product.subcategory || 'misc');
    const safeSlug = sanitizePath(slug);

    // Create the image path
    const filename = `${safeSlug}-${promoType.replace(/-/g, '_')}-promo.webp`;
    const relDir = path.join('assets', 'images', 'products', safeCategory, safeSubcategory);
    const relPath = path.join(relDir, filename).replace(/\\/g, '/');
    const absDir = path.join(__dirname, '..', relDir);
    const absPath = path.join(__dirname, '..', relPath);

    // Validate path doesn't escape web root
    const resolvedAbsDir = path.resolve(absDir);
    const resolvedProjectRoot = path.resolve(__dirname, '..');
    if (!resolvedAbsDir.startsWith(resolvedProjectRoot)) {
      logger.error(`Path traversal attempt detected: ${absDir}`);
      return res.status(403).json({ message: 'Invalid path' });
    }

    // Create directory if it doesn't exist
    await fs.mkdir(absDir, { recursive: true });

    // Write the image file
    await fs.writeFile(absPath, req.file.buffer);

    // Update the product with the new image path and refresh updatedAt for cache busting
    product[imageField] = relPath;
    product.updatedAt = new Date();
    await product.save();

    // Regenerate the corresponding promo JSON file immediately
    try {
      const adminRoutes = require('./admin');
      if (promoType === 'flash-sales') {
        await adminRoutes.regeneratePromoJSON('flash-sales');
      } else if (promoType === 'black-friday') {
        await adminRoutes.regeneratePromoJSON('black-friday');
      } else if (promoType === 'christmas-sale') {
        await adminRoutes.regeneratePromoJSON('christmas-sale');
      } else if (promoType === 'new-year') {
        await adminRoutes.regeneratePromoJSON('new-year');
      } else if (promoType === 'valentines') {
        await adminRoutes.regenerateValentinesJSON();
      } else if (promoType === 'combo-deals') {
        await adminRoutes.regenerateComboDealsJSON();
      } else if (promoType === 'back-to-school') {
        await adminRoutes.regeneratePromoJSON('back-to-school');
      } else if (promoType === 'independence-day') {
        await adminRoutes.regeneratePromoJSON('independence-day');
      }
    } catch (regenErr) {
      logger.warn('Promo JSON regeneration after image update failed:', regenErr?.message);
    }

    res.json({
      ok: true,
      message: 'Promo image updated successfully',
      imagePath: relPath
    });
  } catch (error) {
    logger.error('Error updating promo image:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.intelligentCategorizeProduct = intelligentCategorizeProduct;
module.exports = router;
module.exports.regenerateProductJson = regenerateProductJson;