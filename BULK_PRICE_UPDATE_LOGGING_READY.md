# Bulk Price Update Logging System - Complete Setup

## What I've Done

✅ **Added comprehensive logging system** to track every step of bulk price update process

## New Files Created

### 1. Enhanced `/var/www/ipmckart/routes/admin.js`
Added detailed logging for:
- Upload start/end
- Column detection
- Row-by-row processing
- Each matching attempt
- Match results
- Errors and warnings
- Final summaries

### 2. Log Files in `/var/www/ipmckart/logs/`
- `bulk-price-update.log` - Main log file with real-time entries
- `bulk-price-update-[TIMESTAMP].json` - Detailed JSON for each upload

### 3. Helper Scripts
- `view-bulk-price-logs.sh` - View and analyze logs
- `analyze-bulk-upload.sh` - Quick analysis of last upload

### 4. Documentation
- `BULK_PRICE_LOGGING_GUIDE.md` - Complete logging documentation
- `BULK_PRICE_DEBUG_GUIDE.md` - Step-by-step debugging guide

## How to Use

### Before Uploading (Important!)
Open a terminal and monitor logs in real-time:

```bash
cd /var/www/ipmckart
tail -f logs/bulk-price-update.log
```

Or use auto-refresh every 5 seconds:

```bash
cd /var/www/ipmckart
watch -n 5 './analyze-bulk-upload.sh'
```

### Upload Your File
1. Go to bulk-price-update.html in browser
2. Click "Choose File"
3. Select `complete_product_mapping.xlsx`
4. Click "Preview Changes"

### Immediately After Upload
Run this command to see what happened:

```bash
cd /var/www/ipmckart
./analyze-bulk-upload.sh
```

This shows:
- ✓ Summary statistics (matched, not found, etc.)
- ✓ Column detection results
- ✓ Match methods used
- ✓ First 10 products that weren't found
- ✓ Any errors

### For Detailed Analysis

```bash
cd /var/www/ipmckart
./view-bulk-price-logs.sh --latest
```

This shows:
- Complete summary
- Column detection
- Match methods breakdown
- First 5 NOT_FOUND rows
- Sample matched products
- Full log file location

## What Gets Logged

### 1. Upload Information
```
[2025-12-31T14:55:12.345Z] [START] Upload ID: 1735676112345 | {"filename":"complete_product_mapping.xlsx","size":102400}
```

### 2. Column Detection
```
[DEBUG] Database Product Name column | {"found":true,"colName":"Database Product Name"}
[DEBUG] Excel Product Name column | {"found":true,"colName":"Excel Product Name"}
[DEBUG] Other columns detected | {"idCol":null,"priceCol":"New Price","categoryCol":"Category","mappingStatusCol":"Mapping Status"}
```

### 3. Row Processing
```
[MATCH] Row 1: EXACT DB MATCH | {
  "dbName": "IPMC AIO CORE I7-12700 8GB/256GB (5 YEARS WARRANTY)",
  "matchedName": "IPMC AIO CORE I7-12700 8GB/256GB (5 YEARS WARRANTY)",
  "slug": "ipmc-aio-core-i7-12700-8gb-256gb-5-years-warranty",
  "id": "6789abc123"
}
```

### 4. Products Not Found
```
[NOT_FOUND] Row 25: Product not found | {
  "dbProductName": "Some Product Name",
  "excelProductName": "Some Product Name",
  "attempts": ["exact-db-match", "exact-excel-name", "slug-match"]
}
```

### 5. Final Summary
```
[COMPLETE] Processing complete | {
  "totalRows": 362,
  "matchedProducts": 115,
  "notFound": 247,
  "invalidPrices": 0,
  "fuzzyMatches": 0,
  "matchRate": "31.8%",
  "rowLogFile": "logs/bulk-price-update-1735676112345.json"
}
```

## Understanding Your Results

### Expected vs Actual

**Based on Excel file analysis:**
- Total rows: 362
- MAPPED rows (should match): 115
- NEW PRODUCT rows (should skip): 247
- **Expected matches: 115**

**Your actual result:**
- Matched: 25
- Not Found: 337
- **Issue: 90 expected matches not working**

## Next Steps to Debug

### Step 1: Upload Again with Monitoring

```bash
# Terminal 1: Monitor logs
cd /var/www/ipmckart
tail -f logs/bulk-price-update.log

# Browser: Upload file on bulk-price-update.html
```

### Step 2: Run Quick Analysis

```bash
cd /var/www/ipmckart
./analyze-bulk-upload.sh
```

**Look for:**
1. Are columns detected correctly?
2. How many EXACT DB MATCHES happened?
3. What match methods are being used?
4. Which products are NOT FOUND?

### Step 3: Check Specific Issues

**If EXACT DB MATCH count is low:**
- Database product names don't match Excel names exactly
- Need to verify DB product names

**If NEW PRODUCT rows aren't skipped:**
- Mapping Status column detection issue

**If many FUZZY matches:**
- Exact matching not working
- Need to check special characters, whitespace, etc.

### Step 4: Share Output for Help

Run this and share output:

```bash
cd /var/www/ipmckart
./analyze-bulk-upload.sh > /tmp/analysis.txt
cat /tmp/analysis.txt

# Also get details
./view-bulk-price-logs.sh --latest > /tmp/details.txt
cat /tmp/details.txt | head -100
```

## Quick Commands Reference

| Command | Purpose |
|---------|---------|
| `tail -f logs/bulk-price-update.log` | Monitor in real-time |
| `./analyze-bulk-upload.sh` | Quick analysis of last upload |
| `./view-bulk-price-logs.sh --latest` | View full latest log |
| `./view-bulk-price-logs.sh --summary` | Quick summary only |
| `./view-bulk-price-logs.sh --clear` | Delete old logs |
| `grep ERROR logs/bulk-price-update.log` | See errors only |

## Understanding the Log Levels

- `START` - Upload started
- `INFO` - General info
- `DEBUG` - Detailed debug info
- `MATCH` - Product matched successfully
- `UPDATE` - Price update prepared
- `NOT_FOUND` - Product not found after all attempts
- `WARNING` - Non-critical issues (duplicates, etc.)
- `ERROR` - Errors occurred
- `COMPLETE` - Processing finished

## Expected Log Output for 115 Matches

When working correctly, you should see:

```
[INFO] Database query complete | {"totalProducts":1450,"excelRows":362}
[MATCH] Row 1: EXACT DB MATCH | ...
[MATCH] Row 2: EXACT DB MATCH | ...
[MATCH] Row 3: EXACT DB MATCH | ...
...
[MATCH] Row 115: EXACT DB MATCH | ...
[COMPLETE] Processing complete | {
  "totalRows": 362,
  "matchedProducts": 115,
  "notFound": 247,
  "matchRate": "31.8%"
}
```

## If You Still Get Only 25 Matches

The logs will tell us WHY:

1. **Check column detection** - Is Database Product Name column found?
2. **Check DB products count** - Are there 1450 active products?
3. **Check exact-db-match count** - How many exact matches succeeded?
4. **Check NOT_FOUND rows** - Which products didn't match and why?

The logs capture EVERY matching attempt, so we'll know exactly what's wrong.

## Server Status

✅ Server is running on port 4040
✅ Logging system is active
✅ Helper scripts are ready to use

## Test It Now

1. Open terminal: `cd /var/www/ipmckart && tail -f logs/bulk-price-update.log`
2. Open browser: Go to bulk-price-update.html
3. Upload: complete_product_mapping.xlsx
4. Click: Preview Changes
5. Check: Terminal showing logs in real-time
6. After upload: Run `./analyze-bulk-upload.sh`

The logs will show us exactly why only 25 products are matching instead of 115!

---

## Summary

✅ Logging system fully implemented
✅ Real-time monitoring available
✅ Detailed JSON logs for each upload
✅ Helper scripts for easy log viewing
✅ Complete documentation provided
✅ Ready to debug your 25-match issue

**Upload the file again and check the logs to see what's happening!**
