const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');

async function test() {
    const url = 'https://images.icecat.biz/img/gallery/d5ef0812d17ec62e84a09d7f4ae1c60ec61c543d.jpg'; // test image
    console.log(`Downloading: ${url}`);
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        await sharp(response.data)
            .resize(800, 800, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .jpeg({ quality: 90 })
            .toFile('test-dl.jpg');
            
        console.log("Success! File saved as test-dl.jpg");
    } catch(e) {
        console.error("Error:", e.message);
    }
}
test();
