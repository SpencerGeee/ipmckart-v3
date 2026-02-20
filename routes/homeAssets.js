const express = require('express');
const router = express.Router();

// @route   GET /api/home-assets/categories
// @desc    Get dynamic categories for the homepage slider
router.get('/categories', (req, res) => {
    const categories = [
        {
          "id": "combo-deals",
          "href": "category1.html?category=combo-deals",
          "title": "Combo Deals",
          "img": "assets/images/categories/combo.webp"
        },
        {
          "id": "laptops",
          "href": "category1.html?category=computing-devices&subcategory=laptops",
          "title": "Laptops",
          "img": "assets/images/categories/laptop.webp"
        },
        {
          "id": "ups",
          "href": "category1.html?category=ups&subcategory=ups",
          "title": "UPS & Power",
          "img": "assets/images/categories/ups.webp"
        },
        {
          "id": "speakers",
          "href": "category1.html?category=tech-accessories&subcategory=wireless-sound",
          "title": "Speakers",
          "img": "assets/images/categories/speaker.webp"
        },
        {
          "id": "gaming",
          "href": "category1.html?category=tech-accessories&subcategory=playhub",
          "title": "Gaming",
          "img": "assets/images/categories/gaming1.webp"
        },
        {
          "id": "watches",
          "href": "category1.html?category=tech-accessories&subcategory=smart-watches",
          "title": "Smart Watches",
          "img": "assets/images/categories/watch.webp"
        },
        {
          "id": "power-banks",
          "href": "category1.html?category=tech-accessories&subcategory=power-solutions",
          "title": "Power Banks",
          "img": "assets/images/categories/power.webp"
        },
        {
          "id": "cables",
          "href": "category1.html?category=tech-accessories&subcategory=tablet-laptop-sleeves",
          "title": "Cables",
          "img": "assets/images/categories/cables1.webp"
        },
        {
          "id": "network",
          "href": "category1.html?category=tech-accessories&subcategory=network-switches",
          "title": "Networking",
          "img": "assets/images/categories/network.webp"
        },
        {
          "id": "office",
          "href": "category1.html?category=computing-devices&subcategory=workstations",
          "title": "Workstations",
          "img": "assets/images/categories/workstation.webp"
        },
        {
          "id": "surge",
          "href": "category1.html?category=tech-accessories&subcategory=power-solutions",
          "title": "Surge Protectors",
          "img": "assets/images/categories/surge.webp"
        }
    ];
    res.json({ categories });
});

// @route   GET /api/home-assets/partners
// @desc    Get partner logos for the scrolling banner
router.get('/partners', (req, res) => {
    const partners = [


        { name: 'HP', img:'assets/images/brands/part1.webp', href:'#' },
        { name: 'Dell', img:'assets/images/brands/part2.webp', href:'#'},
        { name: 'Epson', img:'assets/images/brands/part3.webp', href:'#'},
        { name: 'Nutanix', img:'assets/images/brands/part4.webp', href:'#'},
        { name: 'Ortea', img:'assets/images/brands/part5.webp', href:'#'},
        { name: 'Papercut', img:'assets/images/brands/part6.webp', href:'#'},
        { name: 'Vertiv', img:'assets/images/brands/part7.webp', href:'#'}

    ];
    res.json({ partners });
});

module.exports = router;