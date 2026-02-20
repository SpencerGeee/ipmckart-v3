const xlsx = require('xlsx');
const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function generatePriceTemplate() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ipmckart');
    console.log('Connected successfully');

    console.log('Fetching products...');
    const products = await Product.find({ active: true })
      .select('slug name price')
      .sort({ name: 1 })
      .lean();

    if (products.length === 0) {
      console.log('No products found');
      process.exit(0);
    }

    console.log(`Found ${products.length} products`);

    // Create worksheet data
    const data = products.map(p => ({
      'Slug': p.slug || '',
      'Name': p.name || '',
      'Current Price': Number(p.price) || 0,
      'New Price': '',
      'Notes': ''
    }));

    // Add some example entries
    if (products.length > 0) {
      data[0].Notes = 'Fill in "New Price" column for products you want to update';
      data[0]['New Price'] = data[0]['Current Price'];
    }

    // Create workbook
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Price Template');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 }, // Slug
      { wch: 40 }, // Name
      { wch: 15 }, // Current Price
      { wch: 15 }, // New Price
      { wch: 30 }  // Notes
    ];

    // Save file
    const filename = 'product_price_template.xlsx';
    xlsx.writeFile(workbook, filename);
    console.log(`\nTemplate generated: ${filename}`);
    console.log('\nInstructions:');
    console.log('1. Open the Excel file');
    console.log('2. Fill in "New Price" for products you want to update');
    console.log('3. Keep "Slug" and "Name" columns unchanged');
    console.log('4. Upload to admin panel: /admin.html -> Bulk Price Update');
    console.log(`\nTotal products: ${products.length}`);
    console.log(`Current price range: GHS ${Math.min(...products.map(p => p.price))} - GHS ${Math.max(...products.map(p => p.price))}`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

generatePriceTemplate();
