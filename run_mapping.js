const XLSX = require('xlsx');
const fs = require('fs');

// Import the complete mapping
const complete_mapping = require('./manmap');

// Load your Excel file
console.log('Loading Excel file...');
const workbook = XLSX.readFile('new products.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

console.log(`Loaded ${data.length} products from Excel file`);

// Apply the mapping
console.log('Applying mapping...');
const mappedData = data.map((row, index) => {
  const excelName = row['Clean Product Name'];
  const newPrice = row['New Price'];
  
  // Find the mapped database name
  const dbName = complete_mapping[excelName] || excelName;
  
  // Infer category
  const nameLower = dbName.toLowerCase();
  let category = 'tech-accessories';
  
  if (nameLower.match(/laptop|desktop|tablet|monitor|aio|all-in-one/)) {
    category = 'computing-devices';
  } else if (nameLower.match(/phone|iphone|samsung galaxy|oppo|realme|tecno|itel/)) {
    category = 'mobile-phones';
  } else if (nameLower.match(/printer|scanner|toner|cartridge|ink/)) {
    category = 'printers-scanners';
  } else if (nameLower.match(/headset|earphone|speaker|audio/)) {
    category = 'tech-accessories';
  } else if (nameLower.match(/ups|inverter|stabilizer/)) {
    category = 'ups';
  } else if (nameLower.match(/refrigerator|washing|air conditioner|fan|iron|vacuum/)) {
    category = 'home-appliances';
  } else if (nameLower.match(/blender|kettle|cooker|toaster|microwave/)) {
    category = 'kitchen-appliances';
  }
  
  return {
    'Excel Product Name': excelName,
    'Database Product Name': dbName,
    'Category': category,
    'New Price': newPrice,
    'Mapping Status': complete_mapping[excelName] ? 'MAPPED' : 'NEW PRODUCT'
  };
});

// Count statistics
const mappedCount = mappedData.filter(d => d['Mapping Status'] === 'MAPPED').length;
const newCount = mappedData.filter(d => d['Mapping Status'] === 'NEW PRODUCT').length;

console.log(`\n=== MAPPING RESULTS ===`);
console.log(`Total Products: ${mappedData.length}`);
console.log(`Mapped to Existing DB: ${mappedCount} (${((mappedCount/mappedData.length)*100).toFixed(1)}%)`);
console.log(`New Products: ${newCount} (${((newCount/mappedData.length)*100).toFixed(1)}%)`);

// Save to CSV
const outputSheet = XLSX.utils.json_to_sheet(mappedData);
const outputWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(outputWorkbook, outputSheet, 'Complete Mapping');
XLSX.writeFile(outputWorkbook, 'complete_product_mapping.xlsx');

console.log(`\nSaved to: complete_product_mapping.xlsx`);

// Also save mapping report
const report = `BULK PRICE UPDATE MAPPING REPORT
================================
Generated: ${new Date().toISOString()}

SUMMARY:
- Total Products in Excel: ${mappedData.length}
- Successfully Mapped: ${mappedCount} (${((mappedCount/mappedData.length)*100).toFixed(1)}%)
- New Products (not in DB): ${newCount} (${((newCount/mappedData.length)*100).toFixed(1)}%)

MAPPED PRODUCTS (${mappedCount}):
---------------------------------
${mappedData.filter(d => d['Mapping Status'] === 'MAPPED').map(d => `✓ ${d['Excel Product Name']} → ${d['Database Product Name']}`).join('\n')}

NEW PRODUCTS TO ADD TO DATABASE (${newCount}):
-----------------------------------------------
${mappedData.filter(d => d['Mapping Status'] === 'NEW PRODUCT').map(d => `+ ${d['Excel Product Name']} (${d['Category']}) - GHS ${d['New Price']}`).join('\n')}

INSTRUCTIONS:
-------------
1. Use complete_product_mapping.xlsx as your upload file
2. The "Database Product Name" column will be used for matching
3. New products will need to be added to the database manually
4. All prices from the original Excel file are preserved
`;

fs.writeFileSync('mapping_report.txt', report);
console.log('Saved report to: mapping_report.txt');

console.log('\n✅ Mapping complete! Ready for bulk price update.');
