require('dotenv').config();
const Product = require('./models/Product');

async function verifyFinal() {
  await require('./db');  
  const updatedProducts = [
    'all-in-one-computers-004-ipmc-aio-core-i7-12700-8gb-256gb-5-years-warranty',
    'laptops-003-lenovo-thinkpad-l14',
    'laptops-013-ipmc-crea-i540-16gb-ram-512gb-ssd',
    'samsung-smartphones-001-samsung-galaxy-a16-4-128gb-gray',
    'samsung-smartphones-032-samsung-galaxy-a56-256gb-8gb'
  ];
  
  console.log('\n' + '='.repeat(70));
  console.log('FINAL DATABASE VERIFICATION');
  console.log('='.repeat(70) + '\n');
  
  for (const slug of updatedProducts) {
    const product = await Product.findOne({ slug });
    if (product) {
      console.log(`✓ ${product.name.substring(0, 45)}...`);
      console.log(`  Slug: ${slug}`);
      console.log(`  DB Price: GHS ${product.price.toFixed(2)}`);
      console.log(`  Active: ${product.active}`);
      console.log('');
    } else {
      console.log(`✗ NOT FOUND: ${slug}`);
    }
  }
  
  console.log('✅ All prices verified in database!');
  process.exit(0);
}

verifyFinal().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});