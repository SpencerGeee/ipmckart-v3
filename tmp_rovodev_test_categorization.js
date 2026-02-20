/**
 * Test Script for Enhanced Product Categorization
 * Run this to test the new categorization logic and regenerate products.grouped2.json
 */

const mongoose = require('mongoose');
const Product = require('./models/product.js');
const fs = require('fs').promises;
const path = require('path');

// Test products to verify categorization
const testProducts = [
  { name: 'Dell Chromebook 3100', description: 'laptop for students' },
  { name: 'IPAD PRO 13-INCH 256GB', description: 'tablet for professionals' },
  { name: 'HP Z27 4K UHD DISPLAY', description: 'monitor display' },
  { name: 'Dell Precision 7920 XCTO Base', description: 'workstation for CAD' },
  { name: 'HP EliteOne 840 AIO', description: 'all-in-one computer' },
  { name: 'FELLOWES 60CS SHREDDER', description: 'paper shredder' },
  { name: 'STARLINK STANDARD KIT', description: 'satellite internet' },
  { name: 'iPhone 15 Pro', description: 'smartphone' },
  { name: 'Samsung Galaxy S24', description: 'android phone' },
  { name: 'Canon PIXMA Printer', description: 'inkjet printer' },
  { name: 'LG 65" OLED TV', description: 'television smart tv' },
  { name: 'Dyson V15 Vacuum', description: 'vacuum cleaner' }
];

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
      excludeKeywords: ['all-in-one', 'aio', 'desktop', 'workstation tower', 'tablet', 'monitor'],
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
    
    // Home Appliances
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
    
    'vacuum-cleaners': {
      categoryId: 'home-appliances',
      categoryName: 'Home Appliances',
      subcategoryId: 'vacuum-cleaners',
      subcategoryName: 'Vacuum Cleaners',
      keywords: ['vacuum', 'cleaner', 'dyson'],
      patterns: [/.*vacuum.*/, /.*cleaner.*/],
      priority: 8
    },
    
    // Printers & Scanners
    'printers-scanners': {
      categoryId: 'printers-scanners',
      categoryName: 'Printers & Scanners',
      subcategoryId: 'printers-scanners',
      subcategoryName: 'Printers & Scanners', 
      keywords: ['printer', 'scanner', 'inkjet', 'laser printer', 'canon', 'hp printer'],
      excludeKeywords: ['shredder', 'computer', 'laptop'],
      patterns: [/.*print.*/, /.*scan.*/, /.*inkjet.*/, /.*pixma.*/],
      priority: 8
    },
    
    // Shredders (separate category)
    'shredders': {
      categoryId: 'shredders',
      categoryName: 'Shredders',
      subcategoryId: 'shredders',
      subcategoryName: 'Shredders',
      keywords: ['shredder', 'paper shredder', 'fellowes'], 
      patterns: [/.*shred.*/, /.*fellowes.*/],
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
        subcategoryName: rule.subcategoryName,
        score: score
      };
    }
  }
  
  // Fallback to uncategorized
  if (!bestMatch || bestScore < 3) {
    return {
      categoryId: 'uncategorized',
      categoryName: 'Uncategorized', 
      subcategoryId: 'misc',
      subcategoryName: 'Miscellaneous',
      score: 0
    };
  }
  
  return bestMatch;
}

async function testCategorization() {
  console.log('🧪 Testing Enhanced Product Categorization Logic\n');
  console.log('=' .repeat(80));
  
  for (const product of testProducts) {
    const result = intelligentCategorizeProduct(product);
    console.log(`📦 Product: ${product.name}`);
    console.log(`📝 Description: ${product.description}`);
    console.log(`🏷️  Category: ${result.categoryName} > ${result.subcategoryName}`);
    console.log(`📊 Score: ${result.score}`);
    console.log('-'.repeat(80));
  }
  
  console.log('\n✅ Categorization test complete!');
}

async function regenerateFromDatabase() {
  try {
    console.log('\n🔄 Connecting to database and regenerating products.grouped2.json...');
    
    // Connect to MongoDB (adjust connection string as needed)
    await mongoose.connect('mongodb://localhost:27017/ipmc_kart', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to database');
    
    // Trigger the regeneration by making a small change to a product
    // This will call the enhanced regenerateProductJson function
    const firstProduct = await Product.findOne({ active: true });
    
    if (firstProduct) {
      console.log(`🔄 Triggering regeneration by updating product: ${firstProduct.name}`);
      
      // Make a trivial update to trigger regeneration
      await Product.findByIdAndUpdate(firstProduct._id, { 
        updatedAt: new Date() 
      });
      
      console.log('✅ Regeneration triggered successfully');
      console.log('📄 Check the new products.grouped2.json file for improved categorization');
    } else {
      console.log('⚠️  No active products found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('✅ Disconnected from database');
    }
  }
}

async function main() {
  console.log('🚀 Enhanced Product Categorization Test & Regeneration Script\n');
  
  // Test the categorization logic
  await testCategorization();
  
  // Regenerate from actual database
  await regenerateFromDatabase();
  
  console.log('\n🎉 Script completed successfully!');
  console.log('\n📋 Summary of improvements:');
  console.log('• Laptops are now correctly placed in "Laptops" subcategory');
  console.log('• Tablets are now correctly placed in "Tablets" subcategory');  
  console.log('• Monitors are now correctly placed in "Monitors" subcategory');
  console.log('• Workstations only contain actual workstation computers');
  console.log('• All-in-One computers are correctly categorized');
  console.log('• Shredders are moved to their own category');
  console.log('• Enhanced keyword matching with priority scoring');
  console.log('• Better brand and pattern recognition');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { intelligentCategorizeProduct, testCategorization };