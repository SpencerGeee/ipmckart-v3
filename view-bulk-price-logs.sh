#!/bin/bash

# Script to view bulk price update logs
# Usage: ./view-bulk-price-logs.sh [options]
# Options:
#   -l, --latest    Show latest log file
#   -c, --clear     Clear old log files
#   -t, --tail      Tail the main log file in real-time
#   -s, --summary   Show summary of last upload
#   -j, --json      Show detailed JSON log of last upload
#   -h, --help      Show this help message

LOG_DIR="/var/www/ipmckart/logs"
MAIN_LOG="$LOG_DIR/bulk-price-update.log"

show_help() {
  echo "Bulk Price Update Log Viewer"
  echo "================================"
  echo ""
  echo "Usage: $0 [option]"
  echo ""
  echo "Options:"
  echo "  -l, --latest    Show latest JSON log file"
  echo "  -c, --clear     Clear old log files (keeps last 5)"
  echo "  -t, --tail      Tail main log file in real-time"
  echo "  -s, --summary   Show summary of last upload"
  echo "  -j, --json      Show detailed JSON log of last upload"
  echo "  -h, --help      Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --latest     # View latest upload details"
  echo "  $0 --summary    # Quick summary of last upload"
  echo "  $0 --tail       # Monitor logs in real-time"
}

show_latest() {
  echo "Finding latest bulk price update log..."
  echo ""
  
  latest_json=$(ls -t $LOG_DIR/bulk-price-update-*.json 2>/dev/null | head -1)
  
  if [ -z "$latest_json" ]; then
    echo "No bulk price update logs found."
    echo "Upload an Excel file on bulk-price-update.html to generate logs."
    exit 1
  fi
  
  echo "Latest log file: $latest_json"
  echo ""
  
  # Display summary
  echo "=== SUMMARY ==="
  echo ""
  
  total_rows=$(jq -r '.summary.totalRows' "$latest_json" 2>/dev/null)
  matched=$(jq -r '.summary.matchedProducts' "$latest_json" 2>/dev/null)
  not_found=$(jq -r '.summary.notFound' "$latest_json" 2>/dev/null)
  invalid=$(jq -r '.summary.invalidPrices' "$latest_json" 2>/dev/null)
  fuzzy=$(jq -r '.summary.fuzzyMatches' "$latest_json" 2>/dev/null)
  timestamp=$(jq -r '.timestamp' "$latest_json" 2>/dev/null)
  
  echo "Timestamp: $timestamp"
  echo "Total Rows: $total_rows"
  echo "Matched: $matched"
  echo "Not Found: $not_found"
  echo "Invalid Prices: $invalid"
  echo "Fuzzy Matches: $fuzzy"
  echo ""
  
  # Display column detection
  echo "=== COLUMN DETECTION ==="
  echo ""
  echo "Database Product Name: $(jq -r '.columnDetection.dbProductNameCol // "NOT FOUND"' "$latest_json")"
  echo "Excel Product Name: $(jq -r '.columnDetection.excelProductNameCol // "NOT FOUND"' "$latest_json")"
  echo "Price Column: $(jq -r '.columnDetection.priceCol // "NOT FOUND"' "$latest_json")"
  echo "Category Column: $(jq -r '.columnDetection.categoryCol // "NOT FOUND"' "$latest_json")"
  echo "Mapping Status Column: $(jq -r '.columnDetection.mappingStatusCol // "NOT FOUND"' "$latest_json")"
  echo ""
  
  # Show first 5 NOT_FOUND rows for debugging
  echo "=== FIRST 5 NOT FOUND ROWS ==="
  echo ""
  jq -r '.rowLogs[] | select(.result == "NOT_FOUND") | .rowNum as $rn | .excelName // .identifier // "N/A" as $name | "\($rn). \($name // "N/A") | \(.reason // "Unknown")"' "$latest_json" | head -5
  echo ""
  
  # Show match methods breakdown
  echo "=== MATCH METHODS BREAKDOWN ==="
  echo ""
  jq -r '.rowLogs[] | select(.result == "MATCHED") | .matchMethod // "unknown" as $method | "\($method)"' "$latest_json" | sort | uniq -c | sort -rn
  echo ""
  
  echo "Full log file: $latest_json"
  echo "View with: cat $latest_json | jq"
}

show_summary() {
  echo "=== BULK PRICE UPDATE SUMMARY ==="
  echo ""
  
  latest_json=$(ls -t $LOG_DIR/bulk-price-update-*.json 2>/dev/null | head -1)
  
  if [ -z "$latest_json" ]; then
    echo "No logs found."
    exit 1
  fi
  
  jq '.summary' "$latest_json"
}

show_json() {
  echo "=== DETAILED JSON LOG ==="
  echo ""
  
  latest_json=$(ls -t $LOG_DIR/bulk-price-update-*.json 2>/dev/null | head -1)
  
  if [ -z "$latest_json" ]; then
    echo "No logs found."
    exit 1
  fi
  
  jq '.' "$latest_json"
}

tail_logs() {
  echo "=== TAILING BULK PRICE UPDATE LOG ==="
  echo "Press Ctrl+C to exit"
  echo ""
  
  tail -f "$MAIN_LOG"
}

clear_logs() {
  echo "Clearing old log files (keeping last 5)..."
  echo ""
  
  ls -t $LOG_DIR/bulk-price-update-*.json 2>/dev/null | tail -n +6 | xargs rm -v 2>/dev/null
  
  echo "Old logs cleared."
  echo ""
  echo "Remaining log files:"
  ls -lh $LOG_DIR/bulk-price-update-*.json 2>/dev/null | tail -5
}

# Parse arguments
case "$1" in
  -l|--latest)
    show_latest
    ;;
  -s|--summary)
    show_summary
    ;;
  -j|--json)
    show_json
    ;;
  -t|--tail)
    tail_logs
    ;;
  -c|--clear)
    clear_logs
    ;;
  -h|--help|*)
    show_help
    ;;
esac
