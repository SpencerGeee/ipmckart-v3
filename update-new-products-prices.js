require('dotenv').config();
const xlsx = require('xlsx');
const Product = require('./models/Product');

async function updatePricesFromNewProducts() {
  console.log('Connecting to database...');
  await require('./db')();

  console.log('Reading new products.xlsx...');
  const workbook = xlsx.readFile('/var/www/ipmckart/new products.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const excelData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

  console.log(`Total rows in Excel: ${excelData.length}`);
  console.log('\n' + '='.repeat(70));
  console.log('UPDATING PRODUCT PRICES FROM new_products.xlsx');
  console.log('='.repeat(70));

  // Fetch all products from database
  const allProducts = await Product.find({}).lean();
  const activeProducts = allProducts.filter(p => p.active !== false);
  
  console.log(`\nTotal products in DB: ${allProducts.length}`);
  console.log(`Active products in DB: ${activeProducts.length}`);

  // Helper functions for matching
  const normalizeString = (str) => String(str || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const calculateSimilarity = (str1, str2) => {
    const s1 = normalizeString(str1);
    const s2 = normalizeString(str2);
    
    const words1 = s1.split(' ').filter(w => w.length >= 3);
    const words2 = s2.split(' ').filter(w => w.length >= 3);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    let matches = 0;
    words1.forEach(w1 => {
      words2.forEach(w2 => {
        if (w1 === w2) {
          matches += 2; // Exact word match
        } else if (w1.includes(w2) || w2.includes(w1)) {
          matches += 1; // Partial match
        }
      });
    });
    
    const maxMatches = Math.max(words1.length, words2.length) * 2;
    return matches / maxMatches;
  };

  // Process each row from Excel
  const results = {
    exactMatches: [],
    partialMatches: [],
    notFound: [],
    invalidPrices: [],
    updated: [],
    skipped: []
  };

  for (let i = 0; i < excelData.length; i++) {
    const row = excelData[i];
    const cleanProductName = row['Clean Product Name'];
    const newPrice = parseFloat(row['New Price']);

    if (!cleanProductName) {
      results.skipped.push({ row: i + 2, reason: 'No product name' });
      console.log(`⚠️  SKIP (Row ${i + 2}): No product name`);
      continue;
    }

    if (isNaN(newPrice) || newPrice <= 0) {
      results.invalidPrices.push({ 
        row: i + 2, 
        name: cleanProductName, 
        price: row['New Price'] 
      });
      console.log(`❌ INVALID PRICE (Row ${i + 2}): "${cleanProductName.substring(0, 50)}" - Price: ${row['New Price']}`);
      continue;
    }

    // Try to find matching product in database
    const normalizedExcelName = normalizeString(cleanProductName);
    let match = null;
    let matchMethod = '';
    let matchScore = 0;

    // Priority 1: Exact name match (case-insensitive, normalized)
    match = activeProducts.find(p => normalizeString(p.name) === normalizedExcelName);
    if (match) {
      matchMethod = 'EXACT NAME MATCH';
      matchScore = 100;
    }

    // Priority 2: Slug match
    if (!match) {
      const excelSlug = cleanProductName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      match = activeProducts.find(p => p.slug === excelSlug);
      if (match) {
        matchMethod = 'SLUG MATCH';
        matchScore = 95;
      }
    }

    // Priority 3: Contains match (if Excel name is contained in DB name)
    if (!match) {
      match = activeProducts.find(p => normalizeString(p.name).includes(normalizedExcelName) && normalizedExcelName.length >= 5);
      if (match) {
        matchMethod = 'CONTAINS MATCH (Excel in DB)';
        matchScore = 80;
      }
    }

    // Priority 4: Reverse contains match (if DB name is contained in Excel name)
    if (!match) {
      match = activeProducts.find(p => p.name.toLowerCase().includes(cleanProductName.toLowerCase()) && cleanProductName.length >= 5);
      if (match) {
        matchMethod = 'CONTAINS MATCH (DB in Excel)';
        matchScore = 80;
      }
    }

    // Priority 5: Fuzzy similarity match (threshold 0.7)
    if (!match) {
      let bestMatch = null;
      let bestScore = 0;
      
      for (const dbProduct of activeProducts) {
        const score = calculateSimilarity(cleanProductName, dbProduct.name);
        if (score >= 0.7 && score > bestScore) {
          bestScore = score;
          bestMatch = dbProduct;
        }
      }
      
      if (bestMatch) {
        match = bestMatch;
        matchMethod = `FUZZY MATCH (${Math.round(bestScore * 100)}%)`;
        matchScore = Math.round(bestScore * 100);
      }
    }

    // If match found, update the price
    if (match) {
      const currentPrice = match.price;
      const priceDiff = Math.abs(currentPrice - newPrice);
      
      // Only update if price is different
      if (priceDiff >= 0.01) {
        try {
          await Product.findByIdAndUpdate(match._id, { price: Number(newPrice) });
          
          const percentChange = currentPrice > 0 ? ((newPrice - currentPrice) / currentPrice * 100).toFixed(2) : 0;
          const diffSign = newPrice > currentPrice ? '+' : '';
          
          results.updated.push({
            row: i + 2,
            excelName: cleanProductName,
            dbName: match.name,
            slug: match.slug,
            oldPrice: currentPrice,
            newPrice: newPrice,
            diff: newPrice - currentPrice,
            percentChange: parseFloat(percentChange),
            matchMethod,
            matchScore
          });
          
          console.log(`\n✅ UPDATED (Row ${i + 2}): "${cleanProductName.substring(0, 50)}"`);
          console.log(`   → Matched: "${match.name.substring(0, 50)}"`);
          console.log(`   → Slug: ${match.slug}`);
          console.log(`   → Method: ${matchMethod} (Score: ${matchScore}%)`);
          console.log(`   → Price: GHS ${currentPrice.toFixed(2)} → GHS ${newPrice.toFixed(2)} (${diffSign}${percentChange}%)`);
          
          // Categorize match
          if (matchMethod.startsWith('EXACT') || matchMethod.startsWith('SLUG')) {
            results.exactMatches.push(cleanProductName);
          } else {
            results.partialMatches.push(cleanProductName);
          }
        } catch (err) {
          console.log(`\n❌ ERROR UPDATING (Row ${i + 2}): ${err.message}`);
        }
      } else {
        console.log(`\n⏭️  SAME PRICE (Row ${i + 2}): "${cleanProductName.substring(0, 50)}"`);
        console.log(`   → Already GHS ${currentPrice.toFixed(2)} (Excel: GHS ${newPrice.toFixed(2)})`);
        results.skipped.push({
          row: i + 2,
          name: cleanProductName,
          reason: 'Price already matches'
        });
      }
    } else {
      results.notFound.push({
        row: i + 2,
        name: cleanProductName,
        price: newPrice
      });
      console.log(`\n❌ NOT FOUND (Row ${i + 2}): "${cleanProductName.substring(0, 50)}" (Price: GHS ${newPrice.toFixed(2)})`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('UPDATE SUMMARY');
  console.log('='.repeat(70));
  console.log(`\n✅ Successfully UPDATED: ${results.updated.length} products`);
  console.log(`📊 Exact/Slug matches: ${results.exactMatches.length}`);
  console.log(`🔍 Partial/Fuzzy matches: ${results.partialMatches.length}`);
  console.log(`⏭️  Skipped (same price): ${results.skipped.filter(s => s.reason === 'Price already matches').length}`);
  console.log(`⚠️  Skipped (no name): ${results.skipped.filter(s => s.reason === 'No product name').length}`);
  console.log(`❌ Invalid prices: ${results.invalidPrices.length}`);
  console.log(`🔍 Not found in DB: ${results.notFound.length}`);

  // Show samples of each category
  if (results.updated.length > 0) {
    console.log('\n\n=== SAMPLE: Updated Products (first 10) ===\n');
    results.updated.slice(0, 10).forEach(u => {
      const diffSign = u.diff > 0 ? '+' : '';
      console.log(`Row ${u.row}: ${u.excelName.substring(0, 45)}...`);
      console.log(`  Slug: ${u.slug}`);
      console.log(`  Price: GHS ${u.oldPrice.toFixed(2)} → GHS ${u.newPrice.toFixed(2)} (${diffSign}${u.percentChange}%)`);
      console.log(`  Method: ${u.matchMethod}\n`);
    });
  }

  if (results.notFound.length > 0) {
    console.log('\n\n=== Products NOT Found (first 20) ===\n');
    results.notFound.slice(0, 20).forEach(n => {
      console.log(`Row ${n.row}: ${n.name.substring(0, 60)} (GHS ${n.price.toFixed(2)})`);
    });
  }

  if (results.invalidPrices.length > 0) {
    console.log('\n\n=== Products with Invalid Prices ===\n');
    results.invalidPrices.forEach(n => {
      console.log(`Row ${n.row}: ${n.name.substring(0, 50)} - Price: "${n.price}"`);
    });
  }

  // Save detailed report
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalExcelRows: excelData.length,
      updated: results.updated.length,
      exactMatches: results.exactMatches.length,
      partialMatches: results.partialMatches.length,
      notFound: results.notFound.length,
      invalidPrices: results.invalidPrices.length,
      skippedSamePrice: results.skipped.filter(s => s.reason === 'Price already matches').length
    },
    updatedProducts: results.updated,
    notFoundProducts: results.notFound,
    invalidPrices: results.invalidPrices
  };

  const fs = require('fs').promises;
  await fs.writeFile('/var/www/ipmckart/new-products-update-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Report saved to: new-products-update-report.json');

  console.log('\n✅ Price update complete!');
  console.log('\n' + '='.repeat(70));
  
  process.exit(0);
}

updatePricesFromNewProducts().catch(err => {
  console.error('\n❌ Fatal error:', err);
  console.error(err.stack);
  process.exit(1);
});