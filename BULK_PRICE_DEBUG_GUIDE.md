# How to Debug Bulk Price Update Matching Issues

## Current Situation
You uploaded `complete_product_mapping.xlsx` and only got **25 matches** instead of expected **115 matches**.

## Step-by-Step Debugging

### Step 1: Start Real-Time Log Monitoring
Before uploading file, start monitoring logs in a separate terminal:

```bash
cd /var/www/ipmckart
tail -f logs/bulk-price-update.log
```

Or use the quick analysis script:

```bash
cd /var/www/ipmckart
watch -n 5 './analyze-bulk-upload.sh'
```

### Step 2: Upload the File
Go to bulk-price-update.html and:
1. Click "Choose File"
2. Select `complete_product_mapping.xlsx`
3. Click "Preview Changes"

### Step 3: Check Logs Immediately
After preview completes, run:

```bash
cd /var/www/ipmckart
./analyze-bulk-upload.sh
```

This will show:
- Summary statistics
- Column detection results
- Match methods used
- First 10 NOT FOUND products
- Any errors

### Step 4: View Detailed Log

```bash
cd /var/www/ipmckart
./view-bulk-price-logs.sh --latest
```

This shows complete details including every matching attempt.

## Expected vs Actual

### Expected (based on Excel file):
- Total Rows: 362
- MAPPED products: **115** (should match exactly)
- NEW PRODUCT: 247 (should be skipped)
- Matched: ~115

### Actual (your result):
- Total Rows: 362
- Matched: **25** (only)
- Not Found: 337

## Possible Causes & How to Check

### Cause 1: Database Products Have Different Names
**Symptom:** EXACT DB MATCH not working

**Check in log:**
```bash
# Look for exact-db-match attempts
cat logs/bulk-price-update-*.json | jq '.rowLogs[] | select(.attempts[].method == "exact-db-match")' | head -5
```

**If no exact-db-match found:** The database product names don't match Excel Database Product Names exactly.

**Debug further:**
```bash
# Get sample of DB names from log
latest=$(ls -t logs/bulk-price-update-*.json | head -1)
cat "$latest" | jq '.rowLogs[0]'
```

### Cause 2: Case Sensitivity Issue
**Symptom:** Names match but case is different

**Check in log:**
```bash
# Look at normalized values in attempts
cat logs/bulk-price-update-*.json | jq '.rowLogs[0].attempts[0]'
```

**Solution:** Our normalizeString function converts everything to lowercase, so this shouldn't be an issue.

### Cause 3: Special Characters Not Handled
**Symptom:** Names with /, +, (, ) not matching

**Test:**
```bash
node -e "
const xlsx = require('xlsx');
const workbook = xlsx.readFile('/var/www/ipmckart/complete_product_mapping.xlsx');
const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });

function normalizeString(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^\w\s\-\/\+\(\)\.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const dbProducts = require('./models/Product');

// Test if normalizeString is working correctly
data.slice(0, 5).forEach(row => {
  const dbName = row['Database Product Name'];
  const normalized = normalizeString(dbName);
  console.log(\`DB Name: \${dbName.substring(0, 50)}\`);
  console.log(\`Normalized: \${normalized.substring(0, 50)}\`);
  console.log();
});
"
```

### Cause 4: Products Not Active in Database
**Symptom:** Exact name exists in DB but not matching

**Check:**
```bash
# Look at total products in DB
cat logs/bulk-price-update-*.json | jq '.summary'

# Should show totalProducts count
```

**If totalProducts is low:** Many products might be inactive.

### Cause 5: Empty Database Product Name Fields
**Symptom:** dbProductNameCol found but values are empty

**Check:**
```bash
node -e "
const xlsx = require('xlsx');
const workbook = xlsx.readFile('/var/www/ipmckart/complete_product_mapping.xlsx');
const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });

const emptyDBNames = data.filter(r => !r['Database Product Name'] || r['Database Product Name'].trim() === '');

console.log('Rows with empty Database Product Name:', emptyDBNames.length);
console.log('Expected: 0');
if (emptyDBNames.length > 0) {
  console.log('\nSample:');
  emptyDBNames.slice(0, 5).forEach((r, i) => {
    console.log(\`  \${i+1}. Status: \${r['Mapping Status']}, DB Name: [\${r['Database Product Name'] || 'empty'}]\`);
  });
}
"
```

### Cause 6: Duplicate Matches Causing Skip
**Symptom:** Product matches first row, then skipped for subsequent rows

**Check in log:**
```bash
cat logs/bulk-price-update-*.json | jq '.rowLogs[] | select(.result | contains("SKIPPED"))' | head -5
```

**Look for:** "duplicate_match" or "DUPLICATE SLUG"

## Debugging Workflow

### Quick Check (1 minute)

```bash
cd /var/www/ipmckart
./analyze-bulk-upload.sh
```

### Detailed Check (5 minutes)

```bash
cd /var/www/ipmckart

# View full log
./view-bulk-price-logs.sh --latest

# Look at specific section:
# 1. Column detection - verify columns found
# 2. Match methods breakdown - see what's being used
# 3. NOT_FOUND rows - see why they're not matching
# 4. Sample DB products - verify DB names
```

### Deep Dive (15 minutes)

```bash
cd /var/www/ipmckart

# Get latest log
latest=$(ls -t logs/bulk-price-update-*.json | head -1)

# Export to file for easier viewing
cat "$latest" | jq > /tmp/bulk-debug.json

# Open in text editor
nano /tmp/bulk-debug.json
```

Then search for:
- `"exact-db-match"` - count how many
- `"NOT_FOUND"` - see patterns
- `"skipped"` - check duplicates

## Common Patterns

### Pattern 1: Only Slug Matches Working
**Indicates:** Database Product Name column not matching at all

**Fix Needed:** Check if DB names match Excel names exactly

### Pattern 2: Many Fuzzy Matches
**Indicates:** Exact names don't match

**Fix Needed:** Improve name normalization or add manual mapping

### Pattern 3: All SKIPPED (Duplicates)
**Indicates:** Same product appears multiple times in Excel

**Fix Needed:** Remove duplicate rows from Excel

### Pattern 4: NEW PRODUCT Rows Not Being Skipped
**Indicates:** Mapping Status detection issue

**Check:**
```bash
cat logs/bulk-price-update-*.json | jq '.rowLogs[] | select(.mappingStatus != "MAPPED") | .mappingStatus' | head -10
```

## Getting Help

### Share These Outputs

When asking for help, provide:

1. **Quick Analysis Output:**
   ```bash
   cd /var/www/ipmckart
   ./analyze-bulk-upload.sh > analysis-output.txt
   ```

2. **Column Detection:**
   From the "COLUMN DETECTION" section of `--latest`

3. **Sample NOT_FOUND Rows:**
   First 10 from the NOT_FOUND section

4. **Match Methods:**
   From "MATCH METHODS USED" section

5. **Sample DB Products:**
   From "Sample DB products" section

## Quick Fixes to Try

### Fix 1: Verify Database Connection

```bash
node -e "
const Product = require('./models/Product');
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const count = await Product.countDocuments({ active: true });
  const sample = await Product.find({ active: true }).limit(5).lean();
  
  console.log('Active products:', count);
  console.log('\nSample products:');
  sample.forEach(p => {
    console.log(\`  \${p.name.substring(0, 60)}\`);
  });
  
  await mongoose.connection.close();
}).catch(console.error);
"
```

### Fix 2: Test Specific Product

```bash
node -e "
const Product = require('./models/Product');
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const searchName = 'IPMC AIO CORE I7-12700 8GB/256GB (5 YEARS WARRANTY)';
  
  // Try exact match
  const exact = await Product.findOne({ name: searchName, active: true }).lean();
  console.log('Exact match:', exact ? 'FOUND' : 'NOT FOUND');
  if (exact) {
    console.log('  Name:', exact.name);
    console.log('  Slug:', exact.slug);
    console.log('  Price:', exact.price);
  }
  
  // Try normalized match
  function normalizeString(str) {
    return String(str || '').toLowerCase().replace(/[^\w\s\-\/\+\(\)\.]/g, '').replace(/\s+/g, ' ').trim();
  }
  const normalized = normalizeString(searchName);
  const allProducts = await Product.find({ active: true }).lean();
  const normalizedMatch = allProducts.find(p => normalizeString(p.name) === normalized);
  console.log('\nNormalized match:', normalizedMatch ? 'FOUND' : 'NOT FOUND');
  if (normalizedMatch) {
    console.log('  Name:', normalizedMatch.name);
    console.log('  Original normalized:', normalized);
    console.log('  DB normalized:', normalizeString(normalizedMatch.name));
  }
  
  await mongoose.connection.close();
}).catch(console.error);
"
```

### Fix 3: Check Excel Data Quality

```bash
node -e "
const xlsx = require('xlsx');
const workbook = xlsx.readFile('/var/www/ipmckart/complete_product_mapping.xlsx');
const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });

console.log('Data Quality Check:\n');

const mapped = data.filter(r => r['Mapping Status'] === 'MAPPED');
const hasDBName = data.filter(r => r['Database Product Name'] && r['Database Product Name'].trim() !== '');

console.log('Total rows:', data.length);
console.log('MAPPED rows:', mapped.length);
console.log('Rows with DB Name:', hasDBName.length);
console.log('MAPPED with DB Name:', mapped.filter(r => r['Database Product Name'] && r['Database Product Name'].trim() !== '').length);

if (hasDBName.length < mapped.length) {
  console.log('\n⚠️  WARNING: Some MAPPED rows have empty Database Product Name!');
}

// Check for whitespace issues
const whitespaceIssues = data.filter(r => 
  r['Database Product Name'] && r['Database Product Name'] !== r['Database Product Name'].trim()
);

if (whitespaceIssues.length > 0) {
  console.log('\n⚠️  WARNING:', whitespaceIssues.length, 'rows have leading/trailing whitespace in DB Product Name!');
  whitespaceIssues.slice(0, 3).forEach((r, i) => {
    console.log(\`  \${i+1}. [\${r['Database Product Name']}] -> [\${r['Database Product Name'].trim()}]\`);
  });
}
"
```

## What to Provide When Asking for Help

Please run these commands and share the output:

```bash
cd /var/www/ipmckart

# 1. Quick analysis
./analyze-bulk-upload.sh

# 2. View latest log summary
./view-bulk-price-logs.sh --latest | head -50

# 3. Check database products
node -e "
  const Product = require('./models/Product');
  require('dotenv').config();
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const count = await Product.countDocuments({ active: true });
    console.log('Active products in DB:', count);
    await mongoose.connection.close();
  }).catch(console.error);
"

# 4. Check Excel data
node -e "
  const xlsx = require('xlsx');
  const workbook = xlsx.readFile('/var/www/ipmckart/complete_product_mapping.xlsx');
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
  const mapped = data.filter(r => r['Mapping Status'] === 'MAPPED');
  console.log('MAPPED rows in Excel:', mapped.length);
"
```

## Log File Locations

- **Main log:** `/var/www/ipmckart/logs/bulk-price-update.log`
- **Detailed JSON:** `/var/www/ipmckart/logs/bulk-price-update-[timestamp].json`
- **View latest:** `./view-bulk-price-logs.sh --latest`
- **Analyze:** `./analyze-bulk-upload.sh`

## Quick Reference

| What You Want | Command |
|---------------|---------|
| See what just happened | `./analyze-bulk-upload.sh` |
| View full details | `./view-bulk-price-logs.sh --latest` |
| Monitor in real-time | `tail -f logs/bulk-price-update.log` |
| See recent errors | `grep ERROR logs/bulk-price-update.log` |
| Clear old logs | `./view-bulk-price-logs.sh --clear` |

---

**Next Steps:**
1. Upload the file again
2. Immediately run `./analyze-bulk-upload.sh`
3. Share the output for further analysis
