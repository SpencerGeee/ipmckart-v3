# Bulk Price Update Logging System

## Overview
Comprehensive logging system has been added to track every step of the bulk price update process. This will help debug matching issues in real-time.

## Log Files Created

### 1. Main Log File: `logs/bulk-price-update.log`
Contains real-time logs for each upload:
- Column detection results
- Each row's matching attempts
- Match successes/failures
- Errors and warnings
- Final summary

**View in real-time:**
```bash
tail -f /var/www/ipmckart/logs/bulk-price-update.log
```

**View recent logs:**
```bash
tail -50 /var/www/ipmckart/logs/bulk-price-update.log
```

### 2. Detailed JSON Log: `logs/bulk-price-update-[TIMESTAMP].json`
Each upload generates a detailed JSON log file containing:
- Upload metadata (ID, timestamp)
- Column detection results
- Complete row-by-row processing logs
- Summary statistics

**View latest upload:**
```bash
./view-bulk-price-logs.sh --latest
```

**View specific log:**
```bash
cat /var/www/ipmckart/logs/bulk-price-update-1735671234567.json | jq
```

## Log Viewer Script

A convenient script is provided at `/var/www/ipmckart/view-bulk-price-logs.sh`

### Usage:

```bash
cd /var/www/ipmckart

# Show latest upload with full details
./view-bulk-price-logs.sh --latest

# Quick summary of last upload
./view-bulk-price-logs.sh --summary

# View detailed JSON
./view-bulk-price-logs.sh --json

# Monitor logs in real-time
./view-bulk-price-logs.sh --tail

# Clear old logs (keep last 5)
./view-bulk-price-logs.sh --clear

# Show help
./view-bulk-price-logs.sh --help
```

## What Gets Logged

### 1. Upload Start
- Upload ID (timestamp)
- File name
- File size

### 2. Excel File Analysis
- Total rows
- Column names detected
- Sheet name

### 3. Column Detection
- Database Product Name column (found/missing)
- Excel Product Name column (found/missing)
- Price column (found/missing)
- Category column (found/missing)
- Mapping Status column (found/missing)

### 4. Database Query
- Total products in database
- Sample of 5 products for verification

### 5. Row-by-Row Processing
For EACH row, the log includes:
- Row number
- Excel Product Name
- Database Product Name
- Mapping Status
- Category
- Price
- **Matching attempts** (each method tried)
- **Result**: MATCHED / NOT_FOUND / SKIPPED
- **Match method** (if matched)
- **Matched product name** (if matched)
- **Slug** (if matched)
- **Reason** (if not found/skipped)

### 6. Match Attempts Tracked
Each row logs which matching methods were tried:
- `exact-db-match` - Database Product Name exact match
- `exact-excel-name` - Excel Product Name exact match
- `slug-match` - Slug exact match
- `identifier-name-match` - Identifier as name match
- `item-no-match` - Item No. match
- `key-part-match` - Key parts fuzzy match
- `fuzzy-match` - Similarity fuzzy match

### 7. Final Summary
- Total rows processed
- Products matched
- Products not found
- Invalid prices
- Fuzzy matches
- Match rate percentage
- Log file location

## How to Debug

### Scenario 1: Low Match Count
**View latest log:**
```bash
./view-bulk-price-logs.sh --latest
```

**Check:**
1. Are columns detected correctly?
2. Are NEW PRODUCT rows being skipped?
3. What match methods are being used?
4. Look at NOT_FOUND rows - what's common?

### Scenario 2: Specific Product Not Found
**View specific row log:**
```bash
# Get latest log file
latest=$(ls -t /var/www/ipmckart/logs/bulk-price-update-*.json | head -1)

# Search for product name
cat "$latest" | jq '.rowLogs[] | select(.excelName | contains("YOUR PRODUCT NAME"))'
```

**Check:**
- What attempts were made?
- What were the normalized values?
- Are there typos in the name?

### Scenario 3: Column Detection Issues
**Check column detection:**
```bash
./view-bulk-price-logs.sh --latest | grep "COLUMN DETECTION" -A 10
```

**Expected:**
- Database Product Name: Database Product Name ✓
- Excel Product Name: Excel Product Name ✓
- Price Column: New Price ✓
- Category Column: Category ✓
- Mapping Status Column: Mapping Status ✓

### Scenario 4: Real-time Debugging
**Monitor logs while uploading:**
```bash
tail -f /var/www/ipmckart/logs/bulk-price-update.log
```

Then upload file on bulk-price-update.html and watch logs in real-time.

## Log Levels

- `START` - Upload started
- `INFO` - General information
- `DEBUG` - Detailed debugging info
- `MATCH` - Product matched successfully
- `UPDATE` - Price update prepared
- `NOT_FOUND` - Product not found
- `WARNING` - Non-critical issues (duplicates, etc.)
- `ERROR` - Errors occurred
- `COMPLETE` - Processing finished

## Example Log Entry

```
[2025-12-31T14:55:12.345Z] [START] Upload ID: 1735676112345 | {"filename":"complete_product_mapping.xlsx","size":102400}
[2025-12-31T14:55:12.456Z] [INFO] Excel file loaded | {"rows":362,"sheetName":"Sheet1"}
[2025-12-31T14:55:12.457Z] [DEBUG] Columns found in Excel | {"columns":["Excel Product Name","Database Product Name","Category","New Price","Mapping Status"]}
[2025-12-31T14:55:12.458Z] [DEBUG] Database Product Name column | {"found":true,"colName":"Database Product Name"}
[2025-12-31T14:55:12.458Z] [INFO] Database query complete | {"totalProducts":1450,"excelRows":362}
[2025-12-31T14:55:12.520Z] [MATCH] Row 1: EXACT DB MATCH | {"dbName":"IPMC AIO CORE I7-12700 8GB/256GB (5 YEARS WARRANTY)","matchedName":"IPMC AIO CORE I7-12700 8GB/256GB (5 YEARS WARRANTY)","slug":"ipmc-aio-core-i7-12700-8gb-256gb-5-years-warranty","id":"6789abc123"}
[2025-12-31T14:55:12.621Z] [COMPLETE] Processing complete | {"totalRows":362,"matchedProducts":115,"notFound":247,"invalidPrices":0,"fuzzyMatches":0,"matchRate":"31.8%","rowLogFile":"logs/bulk-price-update-1735676112345.json"}
```

## Troubleshooting Guide

### Issue: Only 25 matches instead of 115
**Steps:**
1. Check column detection:
   ```bash
   ./view-bulk-price-logs.sh --latest | grep "COLUMN DETECTION" -A 10
   ```
   
2. Check how many rows have Database Product Name:
   ```bash
   latest=$(ls -t /var/www/ipmckart/logs/bulk-price-update-*.json | head -1)
   cat "$latest" | jq '[.rowLogs[] | select(.dbProductName != null)] | length'
   ```
   
3. View NOT_FOUND rows to see pattern:
   ```bash
   cat "$latest" | jq '.rowLogs[] | select(.result == "NOT_FOUND")' | jq -s '.[:10]'
   ```

4. Check normalizeString output:
   ```bash
   cat "$latest" | jq '.rowLogs[0]' | jq '.attempts[0].normalized'
   ```

### Issue: All products showing as NOT_FOUND
**Check:**
1. Is Database Product Name column empty?
2. Are products names exactly the same (case insensitive)?
3. Compare normalized values in log

### Issue: Server error during upload
**Check:**
```bash
tail -100 /var/www/ipmckart/logs/bulk-price-update.log | grep ERROR
```

## Log File Management

Logs are automatically created for each upload. Old logs accumulate over time.

**Clear old logs:**
```bash
./view-bulk-price-logs.sh --clear
```

This keeps the 5 most recent log files and deletes older ones.

**View all log files:**
```bash
ls -lh /var/www/ipmckart/logs/bulk-price-update-*.json
```

## Best Practices

1. **Always check logs after upload** - Use `--latest` to see what happened
2. **Test with small file first** - Upload 5-10 rows to verify matching
3. **Compare normalized values** - Check if special characters are handled correctly
4. **Review NOT_FOUND rows** - Look for patterns in products that aren't matching
5. **Keep logs for analysis** - Store important uploads for future reference
6. **Clear old logs periodically** - Prevent disk space issues

## Quick Reference Commands

```bash
# View latest upload
./view-bulk-price-logs.sh --latest

# Monitor in real-time (use this before uploading)
tail -f /var/www/ipmckart/logs/bulk-price-update.log

# Quick summary
./view-bulk-price-logs.sh --summary

# Search for specific product
latest=$(ls -t /var/www/ipmckart/logs/bulk-price-update-*.json | head -1)
cat "$latest" | jq '.rowLogs[] | select(.excelName | contains("PRODUCT NAME"))'

# See first 10 NOT_FOUND products
cat "$latest" | jq '.rowLogs[] | select(.result == "NOT_FOUND")' | jq -s '.[:10]'

# See all match methods used
cat "$latest" | jq '.rowLogs[] | .matchMethod // "none"' | sort | uniq -c

# Clear old logs
./view-bulk-price-logs.sh --clear
```
