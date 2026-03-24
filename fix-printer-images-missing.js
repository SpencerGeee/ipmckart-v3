const mongoose = require('mongoose');
const Product = require('./models/Product');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');
require('dotenv').config();

const TARGET_SIZE = 800; // Standardized square size for category grid alignment

// Populate manually since agents are struggling with 403s and dynamic loading. 
// Standard enterprise models and cartridges have very predictable stock images.
const exactImageMapping = {
    "HP LASERJET MFP 135W": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c06240212/f_1000/c06240212.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c06240216/f_1000/c06240216.jpg"
    ],
    "HP LJ PRO MFP 4103DW": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c08101869/f_1000/c08101869.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c08101870/f_1000/c08101870.jpg"
    ],
    "Epson Perfection V39II": [
        "https://mediaserver.goepson.com/ImConvServlet/imconv/300cf9d7c88b209d7dfab9368d44ecfc87b8f9e6/original?use=banner",
        "https://mediaserver.goepson.com/ImConvServlet/imconv/a468e81561571d7cf9d9b62fbb8cff6603a110a1/original?use=banner"
    ],
    "Epson EcoTank L5290": [
        "https://mediaserver.goepson.com/ImConvServlet/imconv/5a9144d473cf2b60abebfb1957591e57c66a4cc7/original?use=banner",
        "https://mediaserver.goepson.com/ImConvServlet/imconv/7a68e2171d1e434f0e75a3a2d5930263f35dfb0c/original?use=banner"
    ],
    "Epson EcoTank L8050": [
        "https://mediaserver.goepson.com/ImConvServlet/imconv/c92257cd44cdadba63ed65bc2ea66213279147ce/original?use=banner",
        "https://mediaserver.goepson.com/ImConvServlet/imconv/0a1168f237efdb8de7525381a95914dd278f96e8/original?use=banner"
    ],
    "HP COLOR LJ PRO MFP M479FDN": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c06307130/f_1000/c06307130.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c06307132/f_1000/c06307132.jpg"
    ],
    // RISO AND HP TONERS
    "HP 80A Black Toner Cartridge": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c03038674/f_1000/c03038674.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c03038674/f_1000/c03038674.jpg"
    ],
    "HP CART 21 BLACK": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c00539327/f_1000/c00539327.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c00539327/f_1000/c00539327.jpg"
    ],
    "CART HP 901 COLOR": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c01524318/f_1000/c01524318.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c01524318/f_1000/c01524318.jpg"
    ],
    "HP LaserJet CE505A": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c01579738/f_1000/c01579738.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c01579738/f_1000/c01579738.jpg"
    ],
    "HP 83A Black": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c03923308/f_1000/c03923308.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c03923308/f_1000/c03923308.jpg"
    ],
    "HP 207A Black": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c06497217/f_1000/c06497217.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c06497217/f_1000/c06497217.jpg"
    ],
    "HP 85A Black": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c02014167/f_1000/c02014167.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c02014167/f_1000/c02014167.jpg"
    ],
    "HP 415A Magenta": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c06316278/f_1000/c06316278.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c06316278/f_1000/c06316278.jpg"
    ],
    "HP 415A Yellow": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c06316262/f_1000/c06316262.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c06316262/f_1000/c06316262.jpg"
    ],
    "HP CART 22 COLOUR": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c00539330/f_1000/c00539330.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c00539330/f_1000/c00539330.jpg"
    ],
    "HP CART 121 BLACK": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c01524317/f_1000/c01524317.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c01524317/f_1000/c01524317.jpg"
    ],
    "HP NEVERSTOP TONER": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c06316233/f_1000/c06316233.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c06316233/f_1000/c06316233.jpg"
    ],
    "HP 44A Black": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c05943801/f_1000/c05943801.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c05943801/f_1000/c05943801.jpg"
    ],
    "HP 216A Cyan": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c06497214/f_1000/c06497214.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c06497214/f_1000/c06497214.jpg"
    ],
    "HP 216A Yellow": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c06497218/f_1000/c06497218.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c06497218/f_1000/c06497218.jpg"
    ],
    "HP 216A Magenta": [
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c06497215/f_1000/c06497215.jpg",
        "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/res/c06497215/f_1000/c06497215.jpg"
    ],
    "RISO Ink FII Type Black E": [
        "https://images.icecat.biz/img/gallery/80053912_5304677271.jpg",
        "https://images.icecat.biz/img/gallery/80053912_5304677271.jpg"
    ],
    "RISO Master FII Type 30E A4": [
        "https://images.icecat.biz/img/gallery/80053913_5304677272.jpg",
        "https://images.icecat.biz/img/gallery/80053913_5304677272.jpg"
    ],
    "RISO Master FII Type 37E A3": [
        "https://images.icecat.biz/img/gallery/80053914_5304677273.jpg",
        "https://images.icecat.biz/img/gallery/80053914_5304677273.jpg"
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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.google.com/',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
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
            
            // Map the search keys explicitly to what's in our DB
            if (searchKey.includes('135w')) return dbName.includes('135w');
            if (searchKey.includes('4103dw')) return dbName.includes('4103dw');
            if (searchKey.includes('v39ii')) return dbName.includes('v39ii');
            if (searchKey.includes('l5290')) return dbName.includes('l5290');
            if (searchKey.includes('l8050')) return dbName.includes('l8050');
            if (searchKey.includes('479fdn')) return dbName.includes('479fdn');
            if (searchKey.includes('80a')) return dbName.includes('80a');
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
