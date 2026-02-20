const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
// const Product = require('../models/Product');  // Uncomment if adding seeding

describe('Products API', () => {
  let server;

  beforeAll(async () => {
    // Start the server on a random available port
    server = app.listen(0);
    
    // Optional: Seed test data (uncomment to test with products)
    // await Product.create([
    //   { slug: 'test-slug-1', category: 'test-cat', name: 'Test Product 1', price: 10, stock: 5, active: true },
    //   { slug: 'test-slug-2', category: 'test-cat', name: 'Test Product 2', price: 20, stock: 10, active: true }
    // ]);
  });

  afterAll(async () => {
    // Optional: Clean up seeded data (uncomment if seeding)
    // await Product.deleteMany({ slug: { $in: ['test-slug-1', 'test-slug-2'] } });
    
    // Close the server and mongoose connection
    await server.close();
    await mongoose.connection.close();
  });

  it('should get all products', async () => {
    jest.setTimeout(10000);  // <-- ADD: Increase timeout to 10s (safety net)

    const res = await request(server)
      .get('/api/products')
      .expect('Content-Type', /json/)
      .expect(200);
    
    console.log('Response body:', res.body);  // Debug: See the full body
    console.log('Type of res.body:', typeof res.body);  // Debug: Should be 'object'
    console.log('Is res.body.products an array?', Array.isArray(res.body.products));  // Debug: Should be true
    
    expect(Array.isArray(res.body.products)).toBe(true);  // <-- FIXED: Check the 'products' key
    // Optional: Add more expects if seeded
    // expect(res.body.products.length).toBe(2);
    // expect(res.body.total).toBe(2);
  });
});