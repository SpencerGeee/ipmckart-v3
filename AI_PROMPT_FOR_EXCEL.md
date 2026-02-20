# AI Prompt to Reformat Excel File for Bulk Price Update

Copy and paste this into ChatGPT, Claude, or any AI:

---

## TASK: Reformat Excel File for Product Price Matching

I have an Excel file with product data that needs to match against an e-commerce database. Help me reformat it to improve matching accuracy.

## CURRENT FILE FORMAT (Product List.xls):
Columns:
- Entity: "IPMC AI" (not needed)
- Item No.: "PC-4087", "IPMC-94" etc. (product IDs)
- Description: Full product descriptions with specs (e.g., "AWOW Crea i540, 14\" Laptop, I5-12450H, 16GB DDR4 RAM, 512GB SSD, FHD Display, Windows 11 Home")
- Category: Simple category names (e.g., "Laptop", "Printer", "UPS", "Access Point")
- Price: Numeric price values

## DATABASE PRODUCT FORMAT:
The database has products with:
- Name: Clean product names (e.g., "HP LASERJET PRO 4003DW", "APC Back-UPS 500VA")
- Slug: URL-friendly format (e.g., "printers-scanners-001-hp-laserjet-pro-4003dw")
- Category: Hyphenated format (e.g., "computing-devices", "printers-scanners", "power-solutions")
- Price: Current price

## WHAT I NEED YOU TO DO:

### Step 1: Create a Clean Excel File
Create a new Excel file with ONLY these 2 columns:

| Clean Product Name | New Price |
|-------------------|------------|

For each product in my file:
1. Extract the core product name (remove specs like RAM, SSD, screen size, etc.)
2. Keep: Brand + Model + Main Product Type
3. Remove: Detailed specs (e.g., "16GB DDR4 RAM", "512GB SSD", "FHD Display")

Examples of transformations:
- "EPSON PRINTER- LQ-350" → "Epson Printer LQ-350"
- "AWOW Crea i540, 14\" Laptop, I5-12450H, 16GB DDR4 RAM, 512GB SSD" → "AWOW Crea i540 Laptop"
- "APC Easy Back-700VA, 230V" → "APC Back-UPS 700VA"
- "Ubiquity U6- Mesh" → "Ubiquiti U6-Mesh Access Point"
- "11.6'' Laptop Kid Notebook PC Touchscreen Yoga Laptop 360 Flip&Fold, 6GB LPDDR4, 128GB SSD- Purple" → "11.6\" Kid Yoga Laptop"
- "IPMC AIO 27 INCH + CORE I7 -12700" → "IPMC All-In-One PC 27\""

Rules:
- Remove: "CORE I5", "I5-12450H", "16GB", "8GB", "256GB", "512GB", "FHD", "60HHz", "WHITE", "Pivot Stand", "Z Shape Stand", "230V"
- Keep: Brand names (HP, Dell, Epson, APC, Ubiquiti, etc.)
- Keep: Model numbers (LQ-350, U6, 4087, etc.)
- Keep: Product type (Printer, Laptop, UPS, Access Point, Scanner, etc.)
- Fix brand spelling: "Ubiquity" → "Ubiquiti"
- Keep unique variants: "Purple", "Blue" (for color variants)

### Step 2: Output Format
Generate the cleaned data in a format I can copy into a new Excel file:
- Tab-separated or CSV format
- Include all 362 products from the original file
- Preserve original prices

### Step 3: Match Examples
Show me 5 examples of:
- Original description
- Cleaned name
- What this would likely match in the database

---

## IMPORTANT:
- Be thorough - process ALL products in the file
- Keep the product recognisable after cleaning
- Don't over-clean - keep enough detail to identify the product
- Output ready-to-paste data

---

## ALTERNATIVE: Quick JavaScript Solution

If you prefer, you can also run this script to clean the Excel file:

```javascript
// Run this in Node.js
const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('Product List.xls');
const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

const cleaned = data.map(row => {
  let name = row.Description;
  
  // Remove specs
  name = name
    .replace(/\s*\d+\s*[GBGH]+\s*(?:DDR)?\s*(?:RAM|SSD|HDD)/gi, '')  // Remove RAM/SSD specs
    .replace(/\s*\d+\.\d+\s*GHz/gi, '')  // Remove clock speeds
    .replace(/\s*\d+\s*[INCH"]\s*(?:SCREEN)?/gi, '')  // Remove screen sizes
    .replace(/\s*FHD\s*\d*Hz/gi, '')  // Remove display specs
    .replace(/\s*CORE\s*[A-Z\d\-\s]+/gi, '')  // Remove CPU details
    .replace(/\s*WHITE\s*(?:PIVOT|Z\s*SHAPE)\s*STAND/gi, '')  // Remove stand details
    .replace(/\s*,\s*230V/gi, '')  // Remove voltage
    .replace(/\s*WINDOWS\s*\d+\s*(?:PRO|HOME)/gi, '')  // Remove OS
    .replace(/,\s*Touchscreen\s+Yoga\s+Laptop\s+360\s+Flip&Fold/gi, '')  // Remove laptop type
    .replace(/,\s*\d+\s*LPDDR\s*\d+/gi, '')  // Remove RAM variants
    .replace(/\s*-\s*Purple$/gi, ' Purple')  // Fix color format
    .replace(/\s*-\s*Blue$/gi, ' Blue')
    .replace(/Ubiquity/gi, 'Ubiquiti')  // Fix brand
    .replace(/\s{2,}/g, ' ')  // Remove extra spaces
    .trim();
  
  return {
    'Clean Product Name': name,
    'New Price': row.Price,
    'Item No.': row['Item No.'],
    'Original': row.Description
  };
});

const newWorkbook = xlsx.utils.book_new();
const newSheet = xlsx.utils.json_to_sheet(cleaned);
xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'Products');
xlsx.writeFile(newWorkbook, 'Product List Cleaned.xlsx');
console.log('Created: Product List Cleaned.xlsx');
```

Save as `clean-excel.js` and run: `node clean-excel.js`
