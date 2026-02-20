/**
 * Quick Verification Script for Enhanced Product Categorization
 * Run this script to verify the categorization fix is working correctly
 */

const fs = require('fs');
const path = require('path');

async function verifyCategorizationFix() {
  console.log('🔍 Verifying Product Categorization Fix...\n');
  
  try {
    // Check if enhanced routes file exists
    const routesPath = path.join(__dirname, 'routes', 'products.js');
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    
    // Check for key indicators of the enhanced version
    const hasIntelligentCategorization = routesContent.includes('intelligentCategorizeProduct');
    const hasEnhancedRegeneration = routesContent.includes('Enhanced regenerateProductJson');
    const hasPriorityScoring = routesContent.includes('priority:');
    const hasExcludeKeywords = routesContent.includes('excludeKeywords');
    
    console.log('✅ Enhanced routes/products.js checks:');
    console.log(`   📦 Intelligent categorization function: ${hasIntelligentCategorization ? '✅' : '❌'}`);
    console.log(`   🔄 Enhanced regeneration: ${hasEnhancedRegeneration ? '✅' : '❌'}`);
    console.log(`   📊 Priority scoring: ${hasPriorityScoring ? '✅' : '❌'}`);
    console.log(`   🚫 Exclude keywords: ${hasExcludeKeywords ? '✅' : '❌'}`);
    
    // Check if backup was created
    const backupPath = path.join(__dirname, 'routes', 'products.js.backup');
    const backupExists = fs.existsSync(backupPath);
    console.log(`   💾 Backup file created: ${backupExists ? '✅' : '❌'}`);
    
    // Check current products.grouped2.json structure
    const jsonPath = path.join(__dirname, 'products.grouped2.json');
    if (fs.existsSync(jsonPath)) {
      const jsonContent = fs.readFileSync(jsonPath, 'utf8');
      const data = JSON.parse(jsonContent);
      
      console.log('\n📋 Current products.grouped2.json analysis:');
      
      // Find Computing Devices category
      const computingDevices = data.categories?.find(cat => cat.id === 'computing-devices');
      if (computingDevices) {
        const workstations = computingDevices.subcategories?.find(sub => sub.id === 'workstations');
        const laptops = computingDevices.subcategories?.find(sub => sub.id === 'laptops');
        const tablets = computingDevices.subcategories?.find(sub => sub.id === 'tablets');
        const monitors = computingDevices.subcategories?.find(sub => sub.id === 'monitors');
        
        console.log(`   🖥️  Workstations: ${workstations?.products?.length || 0} products`);
        console.log(`   💻 Laptops: ${laptops?.products?.length || 0} products`);
        console.log(`   📱 Tablets: ${tablets?.products?.length || 0} products`);
        console.log(`   🖥️  Monitors: ${monitors?.products?.length || 0} products`);
        
        // Check if workstations still contain laptops/tablets (problem indicators)
        if (workstations?.products) {
          const hasLaptopsInWorkstations = workstations.products.some(p => 
            p.name.toLowerCase().includes('chromebook') || 
            p.name.toLowerCase().includes('elitebook') ||
            p.name.toLowerCase().includes('ideapad')
          );
          
          const hasTabletsInWorkstations = workstations.products.some(p =>
            p.name.toLowerCase().includes('ipad') ||
            p.name.toLowerCase().includes('galaxy tab')
          );
          
          console.log(`   ⚠️  Laptops still in workstations: ${hasLaptopsInWorkstations ? '❌ NEEDS FIX' : '✅'}`);
          console.log(`   ⚠️  Tablets still in workstations: ${hasTabletsInWorkstations ? '❌ NEEDS FIX' : '✅'}`);
        }
      }
      
      // Check for Shredders category
      const shredders = data.categories?.find(cat => cat.id === 'shredders');
      console.log(`   🗂️  Shredders category exists: ${shredders ? '✅' : '❌'}`);
      if (shredders) {
        console.log(`   📄 Shredder products: ${shredders.subcategories?.[0]?.products?.length || 0}`);
      }
      
    } else {
      console.log('\n⚠️  products.grouped2.json file not found');
    }
    
    console.log('\n📝 Next Steps:');
    console.log('1. Go to admin panel and add/edit a product to trigger regeneration');
    console.log('2. Check the updated products.grouped2.json file');
    console.log('3. Verify products are in their correct categories');
    console.log('4. Run: node tmp_rovodev_test_categorization.js for detailed testing');
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

// Run verification
if (require.main === module) {
  verifyCategorizationFix();
}

module.exports = { verifyCategorizationFix };