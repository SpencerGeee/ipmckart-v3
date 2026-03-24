const mongoose = require('mongoose');
const Product = require('./models/Product');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');
require('dotenv').config();

const TARGET_SIZE = 800; // Standardized square size for category grid alignment

const exactImageMapping = {
    "HP Deskjet 2320": [
        "https://images.icecat.biz/img/gallery/d5ef0812d17ec62e84a09d7f4ae1c60ec61c543d.jpg",
        "https://images.icecat.biz/img/gallery/bb2515a7bdf1b8e8248b9f4c0dde20bc54b9422a.jpg"
    ],
    "HP DeskJet Plus 4120": [
        "https://images.icecat.biz/img/gallery/016004d39d359746b5034c45da304f6c7dc42a83.jpg",
        "https://images.icecat.biz/img/gallery/aa827f2e0d5bcefd01825c6b88fadd47270f6862.jpg"
    ],
    "HP Neverstop 1000w Printer": [
        "https://images.icecat.biz/img/gallery/3af8ef2456d2a6902085abcace35dc79.jpg",
        "https://images.icecat.biz/img/gallery/f391e6dd781862af43c4ce56354d08b7.jpg"
    ],
    "HP OfficeJet Pro X551dw": [
        "https://images.icecat.biz/img/gallery/35893652_4054628783.jpg",
        "https://images.icecat.biz/img/gallery/35893652_9735668948.jpg"
    ],
    "HP OfficeJet Pro 8023": [
        "https://images.icecat.biz/img/gallery/ced816d15a38c3c2cb0c4993ba0ecb6204764bf4.jpg",
        "https://images.icecat.biz/img/gallery/21e24fdd3c4b8a7feff030d918dbc09b17609828.jpg"
    ],
    "HP LaserJet Pro 4003dw": [
        "https://images.icecat.biz/img/gallery/5d842969e082dd7de0dd9ad6468580a3104eb6c5.jpg",
        "https://images.icecat.biz/img/gallery/e83652ac94029edcf2f3b6cbf6914e9263482ec2.jpg"
    ],
    "HP LaserJet MFP 135w": [
        "https://officejo.com/wp-content/uploads/2020/06/HP-LaserJet-MFP-135w-Printer.jpg",
        "https://jaybest.com/wp-content/uploads/2020/06/HP-LASERJET-MFP-135W-PRINTER.jpg"
    ],
    "HP LaserJet Pro MFP 4103dw": [
        "https://rayashop.com/media/catalog/product/h/p/hp_laserjet_pro_mfp_4103dw_all_in_one_printer_white_-2z627a_1.jpg",
        "https://kayan-solutions.com/wp-content/uploads/2023/05/HP-Printer-LaserJet-Pro-MFP-4103DW.jpg"
    ],
    "HP Color LaserJet Enterprise Flow MFP M776z": [
        "https://dubaimachines.com/media/catalog/product/h/p/hp_m776z_color_laserjet_enterprise_flow_mfp.jpg",
        "https://printerland.co.uk/productimages/HP-Color-LaserJet-Enterprise-Flow-MFP-M776z-A3-Colour-Multifunction-Laser-Printer.jpg"
    ],
    "Epson Perfection V39II": [
        "https://news.epson.com/media-library/images/perfection-v39-ii-1.jpg",
        "https://www.bhphotovideo.com/images/images2500x2500/epson_b11b268201_perfection_v39_ii_color_1765854.jpg"
    ],
    "Epson TM-T20III Printer": [
        "https://godms.com/wp-content/uploads/2020/06/Epson-TM-T20III.jpg",
        "https://tradeinn.com/f/13818/138184444/epson-tm-t20iii-thermal-printer.jpg"
    ],
    "Epson EcoTank L5290": [
        "https://smartsystems.am/wp-content/uploads/2021/10/Epson-EcoTank-L5290.jpg",
        "https://karishma.in/wp-content/uploads/2021/10/EcoTank-L5290.jpg"
    ],
    "Epson EcoTank L8050": [
        "https://anqad.com/wp-content/uploads/2023/05/Epson-EcoTank-L8050.jpg",
        "https://ieccomputers.com/wp-content/uploads/2023/05/EPSON-ECOTANK-L8050-INK-TANK-PRINTER.jpg"
    ],
    "Epson Dot Matrix Printer LQ-690II": [
        "https://cdn-eu.aglty.io/epson/productimages/31995-productpicture-lores-ix-lq-690ii_main.png",
        "https://cdn-eu.aglty.io/epson/productimages/02_fy21_sidm_front_en.jpg"
    ],
    "Epson Dot Matrix Printer LQ-2190": [
        "https://images.icecat.biz/img/gallery/4560563_7828749411.jpg",
        "https://images.icecat.biz/img/gallery/4560563_8326137341.jpg"
    ],
    "Epson Printer LQ-350": [
        "https://images.icecat.biz/img/gallery/16070436_2294176173.jpg",
        "https://images.icecat.biz/img/gallery/16070436_3511641950.jpg"
    ],
    "HP ScanJet Professional 1000": [
        "https://images.icecat.biz/img/gallery/4312148_5130730132.jpg",
        "https://images.icecat.biz/img/gallery/4312148_4169065971.jpg"
    ],
    "HP ScanJet Pro 3000 s4": [
        "https://images.icecat.biz/img/gallery/860fa8532a0812ee958ee9129620337b7dbdf407.jpg",
        "https://images.icecat.biz/img/gallery/dc8f29b0146d82b91e0c2c21467eca80bd2854d4.jpg"
    ],
    "HP ScanJet Pro Scanner - N4600 fnw1": [
        "https://images.icecat.biz/img/gallery/5ee742ddeeb4a1ea8d1034f2c049f864db2277e7.jpg",
        "https://images.icecat.biz/img/gallery/4d5bedf1428ca98877076b36e017a2bbd80fb822.jpg"
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
        // Find exact matches using regex or strict includes
        const matchedProducts = products.filter(p => {
            const dbName = p.name.toLowerCase();
            const searchKey = exactKey.toLowerCase();
            
            // Map the search keys explicitly to what's in our DB
            if (searchKey.includes('2320')) return dbName.includes('2320');
            if (searchKey.includes('4120')) return dbName.includes('4120');
            if (searchKey.includes('neverstop')) return dbName.includes('neverstop printer') && !dbName.includes('toner');
            if (searchKey.includes('x551dw')) return dbName.includes('x551dw');
            if (searchKey.includes('8023')) return dbName.includes('8023');
            if (searchKey.includes('4003dw')) return dbName.includes('4003dw');
            if (searchKey.includes('135w')) return dbName.includes('135w');
            if (searchKey.includes('4103dw')) return dbName.includes('4103dw');
            if (searchKey.includes('m776z')) return dbName.includes('m776z');
            if (searchKey.includes('v39ii')) return dbName.includes('v39ii');
            if (searchKey.includes('t20iii')) return dbName.includes('t20iii');
            if (searchKey.includes('l5290')) return dbName.includes('l5290');
            if (searchKey.includes('l8050')) return dbName.includes('l8050');
            if (searchKey.includes('690ii')) return dbName.includes('690ii');
            if (searchKey.includes('2190')) return dbName.includes('2190');
            if (searchKey.includes('350')) return dbName.includes('350') && !dbName.includes('cartridge');
            if (searchKey.includes('professional 1000')) return dbName.includes('professional 1000');
            if (searchKey.includes('3000 s4')) return dbName.includes('3000 s4');
            if (searchKey.includes('n4600')) return dbName.includes('n4600');
            
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
                
                const localFilePath = path.join('/var/www/ipmckart/assets/images/products', categoryPath, localFileName);
                const webPath = path.join('assets/images/products', categoryPath, localFileName);

                const success = await downloadAndProcessImage(url, localFilePath);
                if (success) {
                    localImagePaths.push(webPath);
                }
            }

            if (localImagePaths.length > 0) {
                await Product.findByIdAndUpdate(product._id, { images: localImagePaths });
                updatedCount++;
                console.log(`✅ Fixed images for ${product.name}`);
            }
        }
    }

    console.log(`\n🎉 Total DB products fixed: ${updatedCount}`);
    mongoose.connection.close();
}

fixImages().catch(console.error);
