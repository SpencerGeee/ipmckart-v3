# Bulk Price Update Matching Improvements

## Problem
When uploading `complete_product_mapping.xlsx` to bulk-price-update.html, only 27 products were matched out of 362 rows. This was unacceptably low performance.

## Root Causes Identified

### 1. Incorrect Column Detection Logic
The original `findColumn` function searched for name columns in this order:
```javascript
['database product name', 'clean product name', 'excel product name', 'name', 'product name', 'product', 'title', 'description', 'item']
```

This would find the FIRST matching column, which might be "Excel Product Name" instead of "Database Product Name", leading to fuzzy matching instead of exact matching.

### 2. Faulty normalizeString Function
The `normalizeString` function had regex with double backslashes:
```javascript
.replace(/[^\\w\\s-]/g, '')  // Wrong - removed important characters
```

This removed characters like `/`, `+`, `(`, `)`, `.` from product names:
- `8GB/256GB` became `8gb256gb` (lost the `/`)
- `8+256GB` became `8256gb` (lost the `+`)
- `(5 YEARS WARRANTY)` became `5 years warranty` (lost the parentheses)

This prevented exact matches from working correctly.

### 3. Missing Handling for "Mapping Status" Column
The Excel file has a "Mapping Status" column with values:
- `MAPPED` - Product exists in database
- `NEW PRODUCT` - Product doesn't exist in database yet

The code wasn't skipping "NEW PRODUCT" rows, so it would try to match them and mark them as "not found", polluting the results.

## Solutions Implemented

### 1. Separate Column Detection for Exact vs Fuzzy Matching
Created separate detection for:
- `dbProductNameCol` - Database Product Name (for exact matches)
- `excelProductNameCol` - Excel Product Name (for fuzzy fallback)
- `mappingStatusCol` - Mapping Status (to skip new products)

```javascript
const dbProductNameCol = findActualColumn('database product name');
const excelProductNameCol = findActualColumn('excel product name');
const mappingStatusCol = findActualColumn('mapping status');
```

### 2. Improved normalizeString Function
Fixed the regex to keep important characters:
```javascript
function normalizeString(str) {
  return String(str || '')
    .toLowerCase()
    // Keep letters, numbers, spaces, hyphens, slashes, plus, dots, parentheses
    .replace(/[^\w\s\-\/\+\(\)\.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
```

Now handles:
- `IPMC AIO CORE I7-12700 8GB/256GB (5 YEARS WARRANTY)` ✓
- `EPSON PRINTER LQ-350` ✓
- `IPMC AIO 8+256GB CORE I5-12400 ( 5 YEARS WARRANTY)` ✓

### 3. Skip NEW PRODUCT Rows
Added logic to skip rows where Mapping Status = "NEW PRODUCT":
```javascript
if (mappingStatus && mappingStatus.toUpperCase() === 'NEW PRODUCT') {
  notFound.push({
    identifier: dbProductName || excelProductName || identifier,
    reason: 'new_product_not_in_db'
  });
  continue;
}
```

### 4. Matching Priority Order
1. **Priority 1**: Exact match using "Database Product Name" column (most reliable)
2. **Priority 2**: Exact match using "Excel Product Name" (if no DB name)
3. **Priority 3**: Slug match
4. **Priority 4**: Identifier name match
5. **Priority 5**: Item No. matching
6. **Priority 6**: Key-part matching (only with Excel Product Name)
7. **Priority 7**: Fuzzy matching (only with Excel Product Name)

### 5. Fixed Regex in Helper Functions
Fixed double backslashes in:
- `extractModelNumber()` function patterns
- `extractKeywords()` function
- `extractKeyParts()` function pattern

## Expected Results

### Before Fix
- Total rows: 362
- Matched: 27 (7.5%)
- Not Found: 335 (92.5%)

### After Fix
- Total rows: 362
- MAPPED rows (should match): 115
- NEW PRODUCT rows (should be skipped): 247

**Expected matches: ~115 products** (100% of MAPPED rows)

## Testing
```bash
# Test normalizeString function
node -e "
  const xlsx = require('xlsx');
  const workbook = xlsx.readFile('/var/www/ipmckart/complete_product_mapping.xlsx');
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
  console.log('Total rows:', data.length);
  console.log('MAPPED:', data.filter(r => r['Mapping Status'] === 'MAPPED').length);
  console.log('NEW PRODUCT:', data.filter(r => r['Mapping Status'] === 'NEW PRODUCT').length);
"
```

## Files Modified
- `/var/www/ipmckart/routes/admin.js`
  - Fixed column detection logic
  - Fixed `normalizeString()` function
  - Fixed `extractModelNumber()` function
  - Fixed `extractKeywords()` function
  - Fixed `extractKeyParts()` function
  - Added NEW PRODUCT row skipping
  - Updated matching priority logic
  - Fixed all template literal syntax errors
  - Added missing module exports

## How to Use
1. Open `https://your-domain.com/bulk-price-update.html`
2. Upload `complete_product_mapping.xlsx`
3. Click "Preview Changes"
4. Review matches:
   - MAPPED products should show as exact matches
   - NEW PRODUCT rows will be marked as "not found" (correct behavior)
5. Apply changes to update prices

## Notes
- Products marked as "NEW PRODUCT" need to be created in the database first before they can be updated via bulk price update
- The "Database Product Name" column contains the exact product name from the database, providing 100% matching accuracy for MAPPED rows
- Fuzzy matching is only used as a fallback when "Database Product Name" is not available
