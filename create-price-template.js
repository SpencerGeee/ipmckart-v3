const xlsx = require('xlsx');

function generateSampleTemplate() {
  console.log('Generating sample Excel price template with fuzzy matching examples...\n');

  const sampleData = [
    {
      'Slug': 'example-product-001',
      'Name': 'Example Product 1',
      'Price': 1500.00,
      'Notes': 'Fill slug for exact matching - recommended'
    },
    {
      'Name': 'iPhone 15 Pro Max',
      'Price': 8500.00,
      'Notes': 'Will fuzzy match to "Apple iPhone 15 Pro Max 256GB" or similar'
    },
    {
      'Name': 'Samsung S24 Ultra 256GB',
      'Price': 7200.00,
      'Notes': 'Will fuzzy match to products with similar keywords'
    },
    {
      'Name': 'Dell Latitude 7440 Laptop',
      'Price': 9200.00,
      'Notes': 'Include model numbers for better fuzzy matching'
    },
    {
      'Name': 'MacBook Pro 14 M3',
      'Price': 18500.00,
      'Notes': 'Will match "Apple MacBook Pro 14" M3" or similar'
    },
    {
      'Name': 'HP Laptop 15',
      'Price': 6500.00,
      'Notes': 'Generic name - fuzzy matching will find best match'
    }
  ];

  const worksheet = xlsx.utils.json_to_sheet(sampleData);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Price Updates');

  worksheet['!cols'] = [
    { wch: 30 }, // Slug
    { wch: 45 }, // Name  
    { wch: 15 }, // Price
    { wch: 60 }  // Notes
  ];

  const filename = 'price_update_template.xlsx';
  xlsx.writeFile(workbook, filename);
  
  console.log(`Template created: ${filename}`);
  console.log('\nColumn Information:');
  console.log('  Slug (Optional): Product slug for exact match - RECOMMENDED');
  console.log('  Name (Required): Product name - supports fuzzy matching');
  console.log('  Price (Required): New price value to update');
  console.log('  Notes: For your reference only\n');
  
  console.log('Fuzzy Matching Examples:');
  console.log('  "iPhone 15 Pro" → "Apple iPhone 15 Pro Max 256GB"');
  console.log('  "Samsung S24" → "Samsung Galaxy S24 Ultra"');
  console.log('  "Dell 7440" → "Dell Latitude 7440 Laptop"');
  console.log('  "MacBook M3" → "Apple MacBook Pro 14" M3"\n');
  
  console.log('Usage:');
  console.log('  1. Download and open template');
  console.log('  2. Fill in with your actual product data');
  console.log('  3. Upload to Admin Panel -> Bulk Price Update');
  console.log('  4. Review fuzzy matches in preview before applying\n');
  
  console.log('Tips:');
  console.log('  - Use exact slugs for 100% accurate matching');
  console.log('  - Include model numbers in names for better fuzzy matching');
  console.log('  - Always review fuzzy matches before applying updates');
  console.log('  - Fuzzy matches require 40%+ similarity score');
}

generateSampleTemplate();
