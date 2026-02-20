# Quick Test Guide for Bulk Price Update

## Step 1: Verify Server is Running
```bash
ps aux | grep "node server.js" | grep -v grep
```
Expected: Should see a node process running

## Step 2: Test Column Detection
```bash
node -e "
const xlsx = require('xlsx');
const workbook = xlsx.readFile('/var/www/ipmckart/complete_product_mapping.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

const keys = Object.keys(data[0]);
console.log('Columns detected:');
keys.forEach(k => console.log('  ✓', k));
"
```

Expected output should include:
- ✓ Database Product Name
- ✓ Excel Product Name
- ✓ Category
- ✓ New Price
- ✓ Mapping Status

## Step 3: Test normalizeString Function
```bash
node -e "
function normalizeString(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^\w\s\-\/\+\(\)\.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const tests = [
  'IPMC AIO CORE I7-12700 8GB/256GB (5 YEARS WARRANTY)',
  'EPSON PRINTER LQ-350',
  'IPMC AIO 8+256GB CORE I5-12400'
];

console.log('Testing normalizeString:');
tests.forEach(name => {
  console.log('  Input:', name);
  console.log('  Output:', normalizeString(name));
  console.log();
});
"
```

Expected: All characters should be preserved correctly
- `8GB/256GB` should keep the `/`
- `8+256GB` should keep the `+`
- `(5 YEARS WARRANTY)` should keep the `(` and `)`

## Step 4: Simulate Excel Upload
```bash
node -e "
const xlsx = require('xlsx');
const workbook = xlsx.readFile('/var/www/ipmckart/complete_product_mapping.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

console.log('Excel Statistics:');
console.log('  Total rows:', data.length);
console.log('  MAPPED:', data.filter(r => r['Mapping Status'] === 'MAPPED').length);
console.log('  NEW PRODUCT:', data.filter(r => r['Mapping Status'] === 'NEW PRODUCT').length);
console.log();
console.log('Sample MAPPED products:');
data.filter(r => r['Mapping Status'] === 'MAPPED').slice(0, 5).forEach((r, i) => {
  console.log(\`  \${i+1}. \${r['Database Product Name'].substring(0, 50)}\`);
});
"
```

Expected:
- Total rows: 362
- MAPPED: 115
- NEW PRODUCT: 247

## Step 5: Test via Web Interface

1. Open browser: `http://your-domain.com/bulk-price-update.html`
2. Click "Choose File"
3. Select: `complete_product_mapping.xlsx`
4. Click "Preview Changes"

Expected results in preview:
- **Matched**: ~115 products (exact matches using Database Product Name)
- **Not Found**: ~247 products (NEW PRODUCT rows, correctly marked)
- **Invalid Prices**: 0
- **Fuzzy Matches**: 0 (all should be exact matches)

## Step 6: Verify Logs
```bash
tail -50 /var/log/nodejs-server.log | grep "Bulk Price Update"
```

Expected to see logs like:
```
[Bulk Price Update] EXACT DB MATCH: "IPMC AIO CORE I7-12700 8GB/256GB (5 YEARS WARRANTY)" -> "IPMC AIO CORE I7-12700 8GB/256GB (5 YEARS WARRANTY)" (ID: xxx, Slug: xxx)
[Bulk Price Update] EXACT DB MATCH: "EPSON PRINTER LQ-350" -> "EPSON PRINTER LQ-350" (ID: xxx, Slug: xxx)
```

## Common Issues & Solutions

### Issue: Still getting low match count
**Solution**: Check that your Excel file has "Database Product Name" column filled in for all MAPPED rows

### Issue: All products marked as "not found"
**Solution**: Check server logs for errors:
```bash
tail -100 /var/log/nodejs-server.log
```

### Issue: 502 Bad Gateway error
**Solution**: Restart the server:
```bash
cd /var/www/ipmckart
pkill -f "node server.js"
nohup node server.js > /var/log/nodejs-server.log 2>&1 &
```

### Issue: Server won't start
**Solution**: Check for syntax errors:
```bash
node -c routes/admin.js
```

## Success Indicators
✓ Server is running on port 4040
✓ bulk-price-update.html returns HTTP 200
✓ Preview shows ~115 matched products
✓ All matched products show "exact-db-match" method
✓ No fuzzy matches needed (all should be exact)
✓ Logs show "EXACT DB MATCH" for most products
✓ NEW PRODUCT rows are marked as "not found" with reason "new_product_not_in_db"

## Next Steps After Successful Upload
1. Review the preview carefully
2. Click "Download Report" to save a copy
3. If satisfied with matches, click "Apply All Changes"
4. Verify prices were updated correctly by checking a few products
5. For NEW PRODUCT rows, create those products in the database first, then re-upload
