#!/bin/bash

# Quick analysis of bulk price upload logs
# Use this immediately after clicking "Preview" button

echo "=========================================="
echo "BULK PRICE UPLOAD QUICK ANALYSIS"
echo "=========================================="
echo ""

LOG_DIR="/var/www/ipmckart/logs"
MAIN_LOG="$LOG_DIR/bulk-price-update.log"

# Check if logs exist
if [ ! -f "$MAIN_LOG" ]; then
  echo "❌ No log files found."
  echo ""
  echo "Please upload an Excel file on bulk-price-update.html first."
  echo ""
  echo "To monitor logs in real-time, run:"
  echo "  tail -f /var/www/ipmckart/logs/bulk-price-update.log"
  exit 1
fi

# Get latest JSON log
latest_json=$(ls -t $LOG_DIR/bulk-price-update-*.json 2>/dev/null | head -1)

if [ -z "$latest_json" ]; then
  echo "⏳ Upload in progress or no complete logs yet..."
  echo ""
  echo "Recent log entries:"
  tail -10 "$MAIN_LOG"
  exit 0
fi

echo "📁 Latest Log: $latest_json"
echo "📅 Created: $(stat -c '%y' $latest_json)"
echo ""

# Extract summary
echo "📊 SUMMARY"
echo "----------------------------"
total_rows=$(jq -r '.summary.totalRows' "$latest_json" 2>/dev/null || echo "N/A")
matched=$(jq -r '.summary.matchedProducts' "$latest_json" 2>/dev/null || echo "N/A")
not_found=$(jq -r '.summary.notFound' "$latest_json" 2>/dev/null || echo "N/A")
invalid=$(jq -r '.summary.invalidPrices' "$latest_json" 2>/dev/null || echo "N/A")
fuzzy=$(jq -r '.summary.fuzzyMatches' "$latest_json" 2>/dev/null || echo "N/A")

echo "Total Rows:           $total_rows"
echo "Products Matched:     $matched"
echo "Products Not Found:   $not_found"
echo "Invalid Prices:       $invalid"
echo "Fuzzy Matches:        $fuzzy"

if [ "$total_rows" != "N/A" ] && [ "$total_rows" -gt 0 ]; then
  match_rate=$(echo "scale=1; $matched * 100 / $total_rows" | bc 2>/dev/null || echo "0")
  echo "Match Rate:           $match_rate%"
fi

echo ""

# Column detection
echo "🔍 COLUMN DETECTION"
echo "----------------------------"
db_col=$(jq -r '.columnDetection.dbProductNameCol // "❌ NOT FOUND"' "$latest_json")
excel_col=$(jq -r '.columnDetection.excelProductNameCol // "❌ NOT FOUND"' "$latest_json")
price_col=$(jq -r '.columnDetection.priceCol // "❌ NOT FOUND"' "$latest_json")
cat_col=$(jq -r '.columnDetection.categoryCol // "❌ NOT FOUND"' "$latest_json")
status_col=$(jq -r '.columnDetection.mappingStatusCol // "❌ NOT FOUND"' "$latest_json")

echo "Database Product Name: $db_col"
echo "Excel Product Name:     $excel_col"
echo "Price Column:          $price_col"
echo "Category Column:        $cat_col"
echo "Mapping Status Column:  $status_col"
echo ""

# Match methods breakdown
echo "🎯 MATCH METHODS USED"
echo "----------------------------"
jq -r '.rowLogs[] | select(.result == "MATCHED") | .matchMethod // "unknown"' "$latest_json" 2>/dev/null | \
  sort | uniq -c | sort -rn | \
  while read count method; do
    printf "%-20s %5d\n" "$method" "$count"
  done

if [ "$fuzzy" != "0" ] && [ "$fuzzy" != "N/A" ]; then
  echo ""
  echo "⚠️  WARNING: $fuzzy fuzzy matches detected"
  echo "   Review these manually before applying updates!"
fi

echo ""

# First 10 NOT FOUND rows
not_found_count=$(jq '[.rowLogs[] | select(.result == "NOT_FOUND")] | length' "$latest_json" 2>/dev/null)
if [ "$not_found_count" -gt 0 ]; then
  echo "❌ FIRST 10 NOT FOUND ROWS"
  echo "----------------------------"
  jq -r '.rowLogs[] | select(.result == "NOT_FOUND") | 
    .rowNum as $rn | 
    (.excelName // .identifier // "N/A") as $name | 
    (.dbProductName // "N/A") as $dbn | 
    "\($rn | tostring | . + "."): \($name | tostring)"' "$latest_json" 2>/dev/null | head -10
  echo ""
  echo "💡 TIP: Use ./view-bulk-price-logs.sh --latest to see full details"
else
  echo "✅ All products matched successfully!"
fi

echo ""

# Recent errors from main log
error_count=$(grep -c "\[ERROR\]" "$MAIN_LOG" 2>/dev/null || echo "0")
if [ "$error_count" -gt 0 ]; then
  echo "🚨 RECENT ERRORS (Last 5)"
  echo "----------------------------"
  grep "\[ERROR\]" "$MAIN_LOG" | tail -5
fi

echo ""
echo "=========================================="
echo "QUICK ACTIONS"
echo "=========================================="
echo ""
echo "📋 View full details:"
echo "   ./view-bulk-price-logs.sh --latest"
echo ""
echo "👀 Monitor in real-time:"
echo "   tail -f /var/www/ipmckart/logs/bulk-price-update.log"
echo ""
echo "📊 View JSON log:"
echo "   cat $latest_json | jq"
echo ""
echo "🧹 Clear old logs:"
echo "   ./view-bulk-price-logs.sh --clear"
echo ""
echo "=========================================="
