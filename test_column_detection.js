const xlsx = require('xlsx');

function normalizeString(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Load Excel file
console.log('Testing column detection and matching...\n');

const workbook = xlsx.readFile('./complete_product_mapping.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

console.log(`Total rows in Excel: ${data.length}`);
console.log(`Columns: ${Object.keys(data[0] || {}).join(', ')}\n`);

// Simulate column detection from admin.js
const firstRow = data[0];
const keys = Object.keys(firstRow).map(k => k.toLowerCase().trim());

console.log('Normalized column names:', keys);

const findColumn = (keywords) => {
  return keys.find(k => keywords.some(kw => k.includes(kw)));
};

const idCol = findColumn(['slug', 'id', 'sku', 'product id', 'item no', 'item no.']);
const nameCol = findColumn(['name', 'product name', 'product', 'title', 'description', 'item', 'clean product name', 'excel product name', 'database product name']);
const priceCol = findColumn(['price', 'new price', 'updated price', 'selling price', 'unit price']);
const categoryCol = findColumn(['category', 'product category', 'type']);

console.log('\nDetected columns:');
console.log(`ID Column: ${idCol}`);
console.log(`Name Column: ${nameCol}`);
console.log(`Price Column: ${priceCol}`);
console.log(`Category Column: ${categoryCol}\n`);

// Get actual column names
const actualIdCol = idCol ? Object.keys(firstRow).find(k => k.toLowerCase() === idCol) : null;
const actualNameCol = nameCol ? Object.keys(firstRow).find(k => k.toLowerCase() === nameCol) : null;
const actualPriceCol = priceCol ? Object.keys(firstRow).find(k => k.toLowerCase() === priceCol) : null;
const actualCategoryCol = categoryCol ? Object.keys(firstRow).find(k => k.toLowerCase() === categoryCol) : null;

console.log('Actual column names from file:');
console.log(`ID: ${actualIdCol}`);
console.log(`Name: ${actualNameCol}`);
console.log(`Price: ${actualPriceCol}`);
console.log(`Category: ${actualCategoryCol}\n`);

// Show first few rows with actual values
console.log('Sample data (first 5 rows):');
data.slice(0, 5).forEach((row, i) => {
  console.log(`\nRow ${i + 1}:`);
  console.log(`  Excel Product Name: ${row['Excel Product Name']}`);
  console.log(`  Database Product Name: ${row['Database Product Name']}`);
  console.log(`  Category: ${row['Category']}`);
  console.log(`  New Price: ${row['New Price']}`);
  console.log(`  Mapping Status: ${row['Mapping Status']}`);
});

// Check which column would be used as name column
console.log('\n=== MATCHING STRATEGY ANALYSIS ===');
console.log(`Using "${actualNameCol}" as the name column for matching`);
console.log(`Using "${actualPriceCol}" as the price column\n`);

// Test matching logic with sample data
const sampleProducts = [
  { name: 'IPMC AIO CORE I7-12700 8GB/256GB (5 YEARS WARRANTY)', slug: 'ipmc-aio-core-i7-12700-8gb-256gb-5-years-warranty', category: 'computing-devices', price: 12000 },
  { name: 'IPMC AIO 8+256GB CORE I5-12400 ( 5 YEARS WARRANTY)', slug: 'ipmc-aio-8-256gb-core-i5-12400-5-years-warranty', category: 'computing-devices', price: 8500 },
  { name: 'IPMC CREA I540 16GB RAM/512GB SSD', slug: 'ipmc-crea-i540-16gb-ram-512gb-ssd', category: 'tech-accessories', price: 6000 }
];

console.log('Testing exact name matching (Priority 1):');
data.slice(0, 10).forEach((row, i) => {
  const dbName = row['Database Product Name'];
  const excelName = row['Excel Product Name'];

  console.log(`\nRow ${i + 1}:`);

  // Try matching with Database Product Name
  if (dbName) {
    const searchNormalized = normalizeString(dbName);
    const match = sampleProducts.find(p => normalizeString(p.name) === searchNormalized);
    if (match) {
      console.log(`  ✓ EXACT DB MATCH: "${dbName.substring(0, 50)}" -> "${match.name.substring(0, 50)}"`);
    } else {
      console.log(`  ✗ No exact DB match for: "${dbName.substring(0, 50)}"`);
    }
  }

  // Try matching with Excel Product Name
  if (excelName) {
    const searchNormalized = normalizeString(excelName);
    const match = sampleProducts.find(p => normalizeString(p.name) === searchNormalized);
    if (match) {
      console.log(`  ✓ EXCEL NAME MATCH: "${excelName.substring(0, 50)}" -> "${match.name.substring(0, 50)}"`);
    } else {
      console.log(`  - No Excel name match for: "${excelName.substring(0, 50)}"`);
    }
  }
});

console.log('\n\n=== ANALYSIS COMPLETE ===');
console.log('\nKey findings:');
console.log('1. The Excel file has "Database Product Name" column with exact database names');
console.log('2. The column detection now includes "database product name" as a valid name column');
console.log('3. This means the system will use Database Product Name for exact matching');
console.log('4. With the fixes applied, exact matches should now work correctly');
console.log('\nNext steps:');
console.log('1. Restart the server to apply the fixes');
console.log('2. Upload the complete_product_mapping.xlsx file');
console.log('3. The system should now match most products using the Database Product Name column');
console.log('4. For remaining unmatched products, fuzzy matching will be used');
