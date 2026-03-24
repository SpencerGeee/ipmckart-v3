#!/usr/bin/env node
/**
 * Update UPS product descriptions in MongoDB database
 * - Use DESCRIPTION from XLSX for short description
 * - Use KEY SPECS from XLSX for long description (fullDescription)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Load UPS products from JSON (exported from Excel)
const upsExcelData = JSON.parse(fs.readFileSync(path.join(__dirname, 'ups_products.json'), 'utf8'));

// Create lookup by normalized product name
const upsLookup = {};
upsExcelData.forEach(item => {
  const productName = item.product.trim().toLowerCase();
  upsLookup[productName] = {
    description: item.description.trim(),
    key_specs: item.key_specs.trim()
  };
});

function normalizeString(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findMatch(productName, lookup) {
  const normalized = normalizeString(productName);
  
  // Direct match
  if (lookup[normalized]) {
    return normalized;
  }
  
  // Partial matches for UPS products
  const matchers = [
    { test: (n) => n.includes('apc back-ups 700va'), find: (k) => k.includes('apc back-ups 700va') },
    { test: (n) => n.includes('apc back-ups 500va'), find: (k) => k.includes('apc back-ups 500va') },
    { test: (n) => n.includes('apc back-ups bv 650va'), find: (k) => k.includes('apc back-ups bv 650va') },
    { test: (n) => n.includes('liebert iton 800va') && n.includes('iec-ifc'), find: (k) => k.includes('liebert iton 800va e230v iec-ifc') },
    { test: (n) => n.includes('liebert iton 800va') && !n.includes('iec-ifc'), find: (k) => k === 'liebert iton 800va' },
    { test: (n) => n.includes('apc easy ups smv 750va'), find: (k) => k.includes('apc easy ups smv 750va 230v') },
    { test: (n) => n.includes('liebert psi 1000va'), find: (k) => k.includes('liebert psi 1000va (900w)') },
    { test: (n) => n.includes('cworthy') && n.includes('inverter'), find: (k) => k.includes('cworthy 3.5kva/ 24v inverter') },
    { test: (n) => n.includes('apc smart-ups vt 15kva'), find: (k) => k.includes('apc smart-ups vt 15kva') }
  ];
  
  for (const { test, find } of matchers) {
    if (test(normalized)) {
      const matchKey = Object.keys(lookup).find(find);
      if (matchKey) return matchKey;
    }
  }
  
  return null;
}

async function updateDescriptions() {
  console.log('='.repeat(60));
  console.log('UPS PRODUCTS DESCRIPTION UPDATE - DATABASE');
  console.log('='.repeat(60));
  
  console.log('\nConnecting to database...');
  await require('./db')();
  
  const Product = require('./models/Product');
  
  // Get all UPS products from database
  const allProducts = await Product.find({}).lean();
  const upsProducts = allProducts.filter(p => {
    const cat = (p.category || '').toLowerCase();
    return cat === 'ups' || cat.includes('ups') || (p.tags && p.tags.some(t => t.toLowerCase() === 'ups'));
  });
  
  console.log(`Total UPS products in DB: ${upsProducts.length}`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  let notFound = [];
  const updatedProducts = [];
  
  console.log('\nProcessing UPS products...\n');
  
  for (const product of upsProducts) {
    const matchKey = findMatch(product.name, upsLookup);
    
    if (matchKey) {
      const excelData = upsLookup[matchKey];
      
      // Build update data
      const updateData = {};
      let shouldUpdate = false;
      
      // Clean up the key specs into HTML format
      const specsLines = excelData.key_specs.split('\n');
      let specsHtml = '<ul class="product-specs-list">';
      for (const line of specsLines) {
        let cleanLine = line.trim();
        if (cleanLine.startsWith('•')) {
          cleanLine = cleanLine.substring(1).trim();
        }
        if (cleanLine) {
          specsHtml += `<li class="ps-2">${cleanLine}</li>`;
        }
      }
      specsHtml += '</ul>';
      
      // Check if description needs update
      const currentDesc = (product.description || '').replace(/\r\n/g, '\n').trim();
      const newDesc = excelData.description.replace(/\r\n/g, '\n').trim();
      
      if (newDesc && currentDesc !== newDesc) {
        updateData.description = newDesc;
        shouldUpdate = true;
      }
      
      // Check if fullDescription needs update
      const currentFullDesc = (product.fullDescription || '').replace(/\r\n/g, '\n').trim();
      const newFullDesc = specsHtml.replace(/\r\n/g, '\n').trim();
      
      if (specsHtml && currentFullDesc !== newFullDesc) {
        updateData.fullDescription = newFullDesc;
        shouldUpdate = true;
      }
      
      if (shouldUpdate) {
        await Product.findByIdAndUpdate(product._id, updateData);
        updatedCount++;
        updatedProducts.push({
          name: product.name,
          id: product.slug || product._id,
          old_description: product.description ? product.description.substring(0, 50) + '...' : 'N/A'
        });
        console.log(`✅ [UPDATED] "${product.name}"`);
      } else {
        skippedCount++;
        console.log(`ℹ️  [SKIPPED] "${product.name}" (no changes needed)`);
      }
    } else {
      notFound.push(product.name);
      console.log(`❌ [NOT FOUND] "${product.name}"`);
    }
  }
  
  // Close connection
  await require('mongoose').disconnect();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Total updated: ${updatedCount}`);
  console.log(`ℹ️  Total skipped: ${skippedCount}`);
  console.log(`❌ Total not found: ${notFound.length}`);
  
  if (notFound.length > 0) {
    console.log('\nProducts not found in Excel data:');
    notFound.forEach(name => console.log(`  - ${name}`));
  }
  
  // Save summary to file
  const summaryPath = path.join(__dirname, 'ups_db_update_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    updated: updatedProducts,
    not_found: notFound,
    total_updated: updatedCount,
    timestamp: new Date().toISOString()
  }, null, 2));
  
  console.log(`\nSummary saved to: ${summaryPath}`);
  console.log('\nDone!\n');
  
  process.exit(0);
}

updateDescriptions().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
