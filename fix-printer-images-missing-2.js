const mongoose = require('mongoose');
const Product = require('./models/Product');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');
require('dotenv').config();

const TARGET_SIZE = 800; // Standardized square size for category grid alignment

// Ensure correct CDNs without www8.hp.com timeouts (using generic Icecat or retail that worked)
const exactImageMapping = {
    // Printers
    "HP LASERJET MFP 135W": [
        "https://images.icecat.biz/img/gallery/71337194_6259021966.jpg",
        "https://images.icecat.biz/img/gallery/71337194_0546995015.jpg"
    ],
    "HP LJ PRO MFP 4103DW": [
        "https://images.icecat.biz/img/gallery/100412854_0664973307.jpg",
        "https://images.icecat.biz/img/gallery/100412854_2302324673.jpg"
    ],
    "Epson Perfection V39II": [
        "https://images.icecat.biz/img/gallery/110756708_9451996769.jpg",
        "https://images.icecat.biz/img/gallery/110756708_7087611586.jpg"
    ],
    "Epson EcoTank L5290": [
        "https://images.icecat.biz/img/gallery/92740920_5803273767.jpg",
        "https://images.icecat.biz/img/gallery/92740920_9107954157.jpg"
    ],
    "Epson EcoTank L8050": [
        "https://images.icecat.biz/img/gallery/108985160_5475150820.jpg",
        "https://images.icecat.biz/img/gallery/108985160_6168694065.jpg"
    ],
    "HP COLOR LJ PRO MFP M479FDN": [
        "https://images.icecat.biz/img/gallery/71616428_8283311394.jpg",
        "https://images.icecat.biz/img/gallery/71616428_1927702431.jpg"
    ],
    
    // RISO
    "RISO Ink FII Type Black E": [
        "https://www.axro.com/media/image/8c/8c/8c/RIS8113_600x600.jpg",
        "https://www.centri-fugal.com/wp-content/uploads/2021/02/S-8113E.jpg"
    ],
    "RISO Master FII Type 30E A4": [
        "https://www.centri-fugal.com/wp-content/uploads/2021/02/S-8188E.jpg",
        "https://www.toner.com/productimages/Riso/Master_Rolls/S-8188E.jpg"
    ],
    "RISO Master FII Type 37E A3": [
        "https://www.centri-fugal.com/wp-content/uploads/2021/02/S-8131E.jpg",
        "https://www.toner.com/productimages/Riso/Master_Rolls/S-8131E.jpg"
    ],
    
    // HP Toners (Using reliable Icecat URLs)
    "HP 80A Black Toner Cartridge": [
        "https://images.icecat.biz/img/gallery/13368297_4051061413.jpg"
    ],
    "HP CART 21 BLACK": [
        "https://images.icecat.biz/img/gallery/833076_8913.jpg"
    ],
    "CART HP 901 COLOR": [
        "https://images.icecat.biz/img/gallery/1650393_6901844969.jpg"
    ],
    "HP LaserJet CE505A": [
        "https://images.icecat.biz/img/gallery/1959714_8648109670.jpg"
    ],
    "HP 83A Black": [
        "https://images.icecat.biz/img/gallery/19630737_9809968945.jpg"
    ],
    "HP 207A Black": [
        "https://images.icecat.biz/img/gallery/78263884_8373722238.jpg"
    ],
    "HP 85A Black": [
        "https://images.icecat.biz/img/gallery/4145719_3622419409.jpg"
    ],
    "HP 415A Magenta": [
        "https://images.icecat.biz/img/gallery/71505307_1975765954.jpg"
    ],
    "HP 415A Yellow": [
        "https://images.icecat.biz/img/gallery/71505306_4541530999.jpg"
    ],
    "HP CART 22 COLOUR": [
        "https://images.icecat.biz/img/gallery/833083_7392683401.jpg"
    ],
    "HP CART 121 BLACK": [
        "https://images.icecat.biz/img/gallery/bc3c862e05976aa1f9f1dd07c369b4ba21bc1b59.jpg",
        "https://images.icecat.biz/img/gallery/57434427_7819765807.jpg"
    ],
    "HP NEVERSTOP TONER": [
        "https://images.icecat.biz/img/gallery/69214376_0492849007.jpg"
    ],
    "HP 44A Black": [
        "https://images.icecat.biz/img/gallery/8ade04fffd69a0c134c7926bbfa5fc50983d250d.jpg",
        "https://images.icecat.biz/img/gallery/7c04f65423d81f60df3a735521ca615e02eb5f42.jpg"
    ],
    "HP 216A Cyan": [
        "https://images.icecat.biz/img/gallery/77114441_0492849007.jpg"
    ],
    "HP 216A Yellow": [
        "https://images.icecat.biz/img/gallery/77114442_0492849007.jpg"
    ],
    "HP 216A Magenta": [
        "https://images.icecat.biz/img/gallery/77114443_0492849007.jpg"
    ]
};

async function downloadAndProcessImage(url, destPath) {
    try {
        console.log(`Downloading: ${url}`);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const dir = path.dirname(destPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Process with sharp directly from the buffer
        await sharp(response.data)
            .resize({
                width: TARGET_SIZE,
                height: TARGET_SIZE,
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .jpeg({ quality: 90 })
            .toFile(destPath);
            
        return true;
    } catch (error) {
        console.error(`Failed to download ${url}: ${error.message}`);
        return false;
    }
}

async function fixImages() {
    await require('./db')();
    const products = await Product.find({}).lean();
    let updatedCount = 0;

    for (const [exactKey, urls] of Object.entries(exactImageMapping)) {
        const matchedProducts = products.filter(p => {
            const dbName = p.name.toLowerCase();
            const searchKey = exactKey.toLowerCase();
            
            if (searchKey.includes('135w')) return dbName.includes('135w');
            if (searchKey.includes('4103dw')) return dbName.includes('4103dw');
            if (searchKey.includes('v39ii')) return dbName.includes('v39ii');
            if (searchKey.includes('l5290')) return dbName.includes('l5290');
            if (searchKey.includes('l8050')) return dbName.includes('l8050');
            if (searchKey.includes('479fdn')) return dbName.includes('479fdn');
            if (searchKey.includes('80a')) return dbName.includes('80a') && dbName.includes('cf280a');
            if (searchKey.includes('21 black')) return dbName.includes('cart 21');
            if (searchKey.includes('901 color')) return dbName.includes('901 colour') || dbName.includes('901 color');
            if (searchKey.includes('ce505a')) return dbName.includes('ce505a');
            if (searchKey.includes('83a')) return dbName.includes('83a');
            if (searchKey.includes('207a')) return dbName.includes('207a');
            if (searchKey.includes('85a')) return dbName.includes('85a');
            if (searchKey.includes('415a magenta')) return dbName.includes('415a magenta');
            if (searchKey.includes('415a yellow')) return dbName.includes('415a yellow');
            if (searchKey.includes('22 colour')) return dbName.includes('22 colour') || dbName.includes('22 color');
            if (searchKey.includes('121 black')) return dbName.includes('121 black');
            if (searchKey.includes('neverstop toner')) return dbName.includes('neverstop laser toner');
            if (searchKey.includes('44a black')) return dbName.includes('44a black');
            if (searchKey.includes('216a cyan')) return dbName.includes('216a cyan');
            if (searchKey.includes('216a yellow')) return dbName.includes('216a yellow');
            if (searchKey.includes('216a magenta')) return dbName.includes('216a magenta');
            if (searchKey.includes('fii type black')) return dbName.includes('fii type black');
            if (searchKey.includes('30e a4')) return dbName.includes('30e a4');
            if (searchKey.includes('37e a3')) return dbName.includes('37e a3');
            
            return false;
        });

        for (const product of matchedProducts) {
            console.log(`\nMatch for [${exactKey}]: ${product.name}`);
            const localImagePaths = [];
            
            for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
                // Force .jpg extension since we are processing with Sharp to JPEG
                const localFileName = `${product.slug}-fixed-printers-${Date.now()}-${i + 1}.jpg`;
                
                let categoryPath = 'printers-scanners/other';
                if (product.slug.includes('hp') || product.name.toLowerCase().includes('hp')) categoryPath = 'printers-scanners/hp';
                else if (product.slug.includes('epson') || product.name.toLowerCase().includes('epson')) categoryPath = 'printers-scanners/epson';
                else if (product.slug.includes('canon') || product.name.toLowerCase().includes('canon')) categoryPath = 'printers-scanners/canon';
                else if (product.name.toLowerCase().includes('riso')) categoryPath = 'printers-scanners/other';
                
                const localFilePath = path.join('/var/www/ipmckart/assets/images/products', categoryPath, localFileName);
                const webPath = path.join('assets/images/products', categoryPath, localFileName);

                const success = await downloadAndProcessImage(url, localFilePath);
                if (success) {
                    localImagePaths.push(webPath);
                }
            }

            if (localImagePaths.length > 0) {
                // If it's the same image twice (common for cartridges), just use one in the array
                const finalImages = localImagePaths.length > 1 && localImagePaths[0] === localImagePaths[1] 
                                    ? [localImagePaths[0]] 
                                    : Array.from(new Set(localImagePaths));
                                    
                await Product.findByIdAndUpdate(product._id, { images: finalImages });
                updatedCount++;
                console.log(`✅ Fixed images for ${product.name}`);
            }
        }
    }

    console.log(`\n🎉 Total DB products fixed: ${updatedCount}`);
    mongoose.connection.close();
}

fixImages().catch(console.error);
