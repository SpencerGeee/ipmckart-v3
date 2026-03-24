const axios = require('axios');
async function test() {
    const url = 'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c00281636.jpg';
    try {
        await axios.head(url, {timeout: 5000, headers: {'User-Agent': 'Mozilla/5.0'}});
        console.log('HP Lowres Works!');
    } catch(e) {
        console.log('HP Lowres Fails:', e.message);
    }
}
test();
