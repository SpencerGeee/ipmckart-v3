/**
 * Initialize and regenerate all JSON data files on server startup
 * This ensures the static JSON files are always in sync with the database
 */

const logger = require('../logger');
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs').promises;

async function regenerateAllJsonFiles() {
  try {
    logger.info('Starting JSON data files regeneration...');

    // Regenerate products.grouped2.json
    await regenerateProductsGrouped();

    // Regenerate all promo JSON files
    await regeneratePromoJSON('flash-sales');
    await regeneratePromoJSON('black-friday');
    await regeneratePromoJSON('christmas-sale');
    await regeneratePromoJSON('new-year');
    await regeneratePromoJSON('valentines');
    await regeneratePromoJSON('back-to-school');
    await regeneratePromoJSON('independence-day');
    await regeneratePromoJSON('combo-deals');
    await regenerateTopSelling();

    logger.info('All JSON data files regenerated successfully.');
  } catch (error) {
    logger.error('Error regenerating JSON files:', error.message);
    // Don't throw - let server continue even if regeneration fails
  }
}

async function regenerateProductsGrouped() {
  try {
    const products = await Product.find({ active: true }).lean();
    
    const categories = {};
    for (const p of products) {
      const categoryId = p.categoryId || p.category || 'uncategorized';
      const subcategoryId = p.subcategoryId || p.subcategory || 'misc';
      
      if (!categories[categoryId]) {
        categories[categoryId] = {
          id: categoryId,
          name: p.categoryName || categoryId,
          subcategories: {}
        };
      }
      
      if (!categories[categoryId].subcategories[subcategoryId]) {
        categories[categoryId].subcategories[subcategoryId] = {
          id: subcategoryId,
          name: p.subcategoryName || subcategoryId,
          products: []
        };
      }
      
      categories[categoryId].subcategories[subcategoryId].products.push({
        id: p.slug || p._id.toString(),
        slug: p.slug || '',
        categoryId,
        categoryName: categories[categoryId].name,
        subcategoryId,
        subcategoryName: categories[categoryId].subcategories[subcategoryId].name,
        brand: p.brand || '',
        name: p.name || '',
        price: Number(p.price) || 0,
        stock: Number(p.stock) || 0,
        rating: Number(p.rating) || 0,
        images: Array.isArray(p.images) ? p.images : [],
        description: p.description || '',
        fullDescription: p.fullDescription || '',
        active: true,
        isComboDeals: p.isComboDeals || false,
        comboDealsPrice: p.comboDealsPrice || null
      });
    }

    const finalStructure = {
      categories: Object.values(categories).map(cat => ({
        id: cat.id,
        name: cat.name,
        subcategories: Object.values(cat.subcategories)
      }))
    };

    const rootPath = path.join(process.cwd(), 'products.grouped2.json');
    const assetsPath = path.join(process.cwd(), 'assets', 'data', 'products.grouped2.json');

    await fs.writeFile(rootPath, JSON.stringify(finalStructure, null, 2));
    await fs.mkdir(path.dirname(assetsPath), { recursive: true });
    await fs.writeFile(assetsPath, JSON.stringify(finalStructure, null, 2));

    logger.info(`products.grouped2.json regenerated with ${Object.values(categories).reduce((sum, c) => sum + Object.keys(c.subcategories).length, 0)} subcategories`);
  } catch (error) {
    logger.error('Error regenerating products.grouped2.json:', error.message);
  }
}

async function regeneratePromoJSON(type) {
  try {
    let query = {};
    let filename = '';
    let mapFn = null;

    switch (type) {
      case 'flash-sales':
        query = { isFlashSale: true, active: true };
        filename = 'flash-sales.json';
        mapFn = (p) => ({
          id: p.slug || p._id.toString(),
          slug: p.slug || '',
          name: p.name || '',
          price: Number(p.price) || 0,
          flashSalePrice: p.flashSalePrice || p.price,
          flashSaleImage: p.flashSaleImage || '',
          stock: Number(p.stock) || 0,
          rating: Number(p.rating) || 0,
          images: Array.isArray(p.images) ? p.images : [],
          description: p.description || '',
          active: true
        });
        break;
      case 'black-friday':
        query = { isBlackFriday: true, active: true };
        filename = 'black-friday.json';
        mapFn = (p) => ({
          id: p.slug || p._id.toString(),
          slug: p.slug || '',
          name: p.name || '',
          price: Number(p.price) || 0,
          blackFridayPrice: p.blackFridayPrice || p.price,
          blackFridayImage: p.blackFridayImage || '',
          stock: Number(p.stock) || 0,
          rating: Number(p.rating) || 0,
          images: Array.isArray(p.images) ? p.images : [],
          description: p.description || '',
          active: true
        });
        break;
      case 'christmas-sale':
        query = { isChristmas: true, active: true };
        filename = 'christmas-sale.json';
        mapFn = (p) => ({
          id: p.slug || p._id.toString(),
          slug: p.slug || '',
          name: p.name || '',
          price: Number(p.price) || 0,
          christmasPrice: p.christmasPrice || p.price,
          christmasImage: p.christmasImage || '',
          stock: Number(p.stock) || 0,
          rating: Number(p.rating) || 0,
          images: Array.isArray(p.images) ? p.images : [],
          description: p.description || '',
          active: true
        });
        break;
      case 'new-year':
        query = { isNewYear: true, active: true };
        filename = 'new-year.json';
        mapFn = (p) => ({
          id: p.slug || p._id.toString(),
          slug: p.slug || '',
          name: p.name || '',
          price: Number(p.price) || 0,
          newYearPrice: p.newYearPrice || p.price,
          newYearImage: p.newYearImage || '',
          stock: Number(p.stock) || 0,
          rating: Number(p.rating) || 0,
          images: Array.isArray(p.images) ? p.images : [],
          description: p.description || '',
          active: true
        });
        break;
      case 'valentines':
        query = { isValentines: true, active: true };
        filename = 'valentines.json';
        mapFn = (p) => ({
          id: p.slug || p._id.toString(),
          slug: p.slug || '',
          name: p.name || '',
          price: Number(p.price) || 0,
          valentinesPrice: p.valentinesPrice || p.price,
          valentinesImage: p.valentinesImage || '',
          stock: Number(p.stock) || 0,
          rating: Number(p.rating) || 0,
          images: Array.isArray(p.images) ? p.images : [],
          description: p.description || '',
          active: true
        });
        break;
      case 'back-to-school':
        query = { isBackToSchool: true, active: true };
        filename = 'back-to-school.json';
        mapFn = (p) => ({
          id: p.slug || p._id.toString(),
          slug: p.slug || '',
          name: p.name || '',
          price: Number(p.price) || 0,
          backToSchoolPrice: p.backToSchoolPrice || p.price,
          backToSchoolImage: p.backToSchoolImage || '',
          stock: Number(p.stock) || 0,
          rating: Number(p.rating) || 0,
          images: Array.isArray(p.images) ? p.images : [],
          description: p.description || '',
          active: true
        });
        break;
      case 'independence-day':
        query = { isIndependenceDay: true, active: true };
        filename = 'independence-day.json';
        mapFn = (p) => ({
          id: p.slug || p._id.toString(),
          slug: p.slug || '',
          name: p.name || '',
          price: Number(p.price) || 0,
          independenceDayPrice: p.independenceDayPrice || p.price,
          independenceDayImage: p.independenceDayImage || '',
          stock: Number(p.stock) || 0,
          rating: Number(p.rating) || 0,
          images: Array.isArray(p.images) ? p.images : [],
          description: p.description || '',
          active: true
        });
        break;
      case 'combo-deals':
        query = { isComboDeals: true, active: true };
        filename = 'combo-offers-v2.json';
        mapFn = (p) => ({
          id: p.slug || p._id.toString(),
          slug: p.slug || '',
          name: p.name || '',
          price: Number(p.price) || 0,
          comboPrice: p.comboDealsPrice && Number(p.comboDealsPrice) > 0 ? Number(p.comboDealsPrice) : Number(p.price),
          comboDealsImage: p.comboDealsImage || '',
          stock: Number(p.stock) || 0,
          rating: Number(p.rating) || 0,
          images: Array.isArray(p.images) ? p.images : [],
          description: p.description || '',
          active: true
        });
        break;
      default:
        logger.warn(`Unknown promo type: ${type}`);
        return;
    }

    const products = await Product.find(query).lean();
    const data = mapFn ? products.map(mapFn) : products;
    
    // Wrap in appropriate structure
    const output = type === 'combo-deals' 
      ? { combos: data }
      : type === 'flash-sales'
      ? { flashSales: data }
      : { [type.replace(/-/g, '')]: data };

    const rootPath = path.join(process.cwd(), filename);
    await fs.writeFile(rootPath, JSON.stringify(output, null, 2));

    // Also write to assets/data if applicable
    if (type !== 'independence-day' && type !== 'valentines') {
      const assetsPath = path.join(process.cwd(), 'assets', 'data', filename);
      await fs.mkdir(path.dirname(assetsPath), { recursive: true });
      await fs.writeFile(assetsPath, JSON.stringify(output, null, 2));
    }

    logger.info(`${filename} regenerated with ${data.length} products`);
  } catch (error) {
    logger.error(`Error regenerating ${type} JSON:`, error.message);
  }
}

async function regenerateTopSelling() {
  try {
    const products = await Product.find({ isTopSelling: true, active: true })
      .lean()
      .sort({ rating: -1 })
      .limit(20);

    const data = products.map(p => ({
      id: p.slug || p._id.toString(),
      slug: p.slug || '',
      name: p.name || '',
      price: Number(p.price) || 0,
      stock: Number(p.stock) || 0,
      rating: Number(p.rating) || 0,
      images: Array.isArray(p.images) ? p.images : [],
      description: p.description || '',
      active: true
    }));

    const output = { topSelling: data };

    const rootPath = path.join(process.cwd(), 'top-selling.json');
    const assetsPath = path.join(process.cwd(), 'assets', 'data', 'top-selling.json');

    await fs.writeFile(rootPath, JSON.stringify(output, null, 2));
    await fs.mkdir(path.dirname(assetsPath), { recursive: true });
    await fs.writeFile(assetsPath, JSON.stringify(output, null, 2));

    logger.info(`top-selling.json regenerated with ${data.length} products`);
  } catch (error) {
    logger.error('Error regenerating top-selling.json:', error.message);
  }
}

module.exports = regenerateAllJsonFiles;
