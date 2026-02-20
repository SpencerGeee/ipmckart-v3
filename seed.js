// seed.js
require('dotenv').config();
const connectDB = require('./config/db');
const Product = require('./models/Product');
const fs = require('fs');
const path = require('path');

async function seed() {
  try {
    // Connect to DB
    await connectDB();
    console.log('Connected to MongoDB');

    // Load transformed flat products JSON
    const jsonPath = path.join(__dirname, 'products.flat2.json');
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`File not found: ${jsonPath}. Run transform-products.js first.`);
    }
    const productsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Loaded ${productsData.length} products from JSON`);

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Prepare data for insert (map JSON fields to model)
    const productsToInsert = productsData.map(p => ({
      slug: p.slug || p.id,
      category: p.categoryId || p.category,
      subcategory: p.subcategoryId || p.subcategory || '',
      brand: p.brand || '',
      name: p.name,
      price: Number(p.price) || 0,
      stock: Number(p.stock || p.stockQuantity || 0),
      rating: Number(p.rating || 0),
      images: Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []),
      description: p.description || '',
      fullDescription: p.fullDescription || '',
      careInstructions: '',
      tags: Array.isArray(p.tags) ? p.tags : [],
      isFlashSale: false,
      flashSalePrice: null,
      flashSaleImage: '',
      flashSaleStock: 0,
      active: p.active !== false
    }));

    // Insert all products
    const inserted = await Product.insertMany(productsToInsert);
    console.log(`${inserted.length} products inserted into DB`);

    // Randomly select 5-10 products to flag as flash sales
    const numFlash = Math.floor(Math.random() * 6) + 5;  // 5-10
    const flashIndices = [];
    while (flashIndices.length < numFlash) {
      const idx = Math.floor(Math.random() * inserted.length);
      if (!flashIndices.includes(idx)) flashIndices.push(idx);
    }

    for (let idx of flashIndices) {
      const prod = inserted[idx];
      const discount = Math.random() * 0.4 + 0.1;  // 10-50% off
      await Product.findByIdAndUpdate(prod._id, {
        isFlashSale: true,
        flashSalePrice: Math.round(prod.price * (1 - discount) * 100) / 100,  // Rounded to 2 decimals
        flashSaleImage: prod.images[0] || '',  // Use first image
        flashSaleStock: Math.floor(Math.random() * 151) + 50,  // 50-200 stock
      });
      console.log(`Flagged "${prod.name}" as flash sale (ID: ${prod._id})`);
    }

    console.log('Seeding complete!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    process.exit(0);  // Exit process
  }
}

seed();