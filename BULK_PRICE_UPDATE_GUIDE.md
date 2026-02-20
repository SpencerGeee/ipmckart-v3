# Bulk Price Update Instructions

## Overview

The Bulk Price Update feature allows you to upload an Excel file to update product prices in bulk. The system will:

1. Parse your Excel file
2. Match products by **slug** (exact match) or **name** (fuzzy matching with keywords)
3. Preview all changes before applying
4. Update prices in database with one click

## Excel File Format

Your Excel file should contain following columns:

### Required Column:
- **Price** (or: `New Price`, `Updated Price`, `Selling Price`) - The new price value

### At Least One Identifier Column:
- **Slug** (preferred) - The unique product slug (exact match)
- **Name** (fallback) - The product name (supports fuzzy matching)

### Example Excel Layout:

| Slug | Name | Price |
|------|------|-------|
| macbook-pro-14-m3 | Apple MacBook Pro 14" M3 | 18500 |
| iphone-15-pro-max | Apple iPhone 15 Pro Max 256GB | 8500 |
| dell-latitude-7440 | Dell Latitude 7440 Laptop | 9200 |
| samsung-galaxy-s24 | Samsung Galaxy S24 256GB | 7200 |

### Alternative Format (using Name only):

| Product Name | Price |
|--------------|-------|
| Apple MacBook Pro 14" M3 | 18500 |
| Apple iPhone 15 Pro Max 256GB | 8500 |
| Dell Latitude 7440 Laptop | 9200 |

## Supported File Formats

- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)
- `.csv` (Comma Separated Values)

## Maximum File Size

10 MB per file

## How to Use

1. **Prepare your Excel file** with product identifiers and new prices
2. **Log in to Admin Panel** at `/admin.html`
3. **Navigate to "Bulk Price Update"** from sidebar
4. **Upload your file** using file picker
5. **Click "Preview Changes"** to see what will be updated
6. **Review preview**:
   - Check matched products count
   - Review price changes
   - **Check fuzzy matches** - verify these are correct
   - Check for any not found products or invalid prices
7. **Click "Apply All Changes"** to confirm update
8. The system will automatically regenerate product JSON file

## Matching Rules

### Priority Order:

1. **Exact slug match** (highest priority) - if slug column exists
2. **Exact name match** - case-insensitive exact match
3. **Fuzzy name matching** - NEW! Uses similarity scoring

### Fuzzy Matching Details:

The system uses intelligent fuzzy matching when exact matches fail:

- **Keyword overlap**: Compares product name keywords
- **Brand recognition**: Matches brand names (Apple, Samsung, Dell, etc.)
- **Similarity threshold**: 40%+ similarity score required
- **Score calculation**: Based on keyword overlap and length similarity

**Examples of successful fuzzy matches**:
- `"iPhone 15 Pro Max 256GB"` → `Apple iPhone 15 Pro Max 256GB`
- `"Samsung S24 Ultra"` → `Samsung Galaxy S24 Ultra`
- `"Dell Latitude 7440"` → `Dell Latitude 7440 Laptop`
- `"MacBook 14 M3"` → `Apple MacBook Pro 14" M3`

**What fuzzy matching considers**:
- Product brand words (Apple, Samsung, Dell, HP, etc.)
- Model numbers and key identifiers
- Common product name patterns

**What gets ignored**:
- Common words like "the", "a", "with", "for"
- Special characters and punctuation
- Case sensitivity

## Preview Information

The preview shows statistics:

- **Matched**: Total products successfully matched (exact + fuzzy)
- **Fuzzy Match**: Products matched using similarity scoring (review required!)
- **Not Found**: Products that couldn't be matched
- **Invalid Prices**: Rows with invalid or negative price values
- **Total Rows**: Total rows in your Excel file
- **Match Rate**: Percentage of products that were matched

For each matched product, you'll see:
- Product slug and name
- Current price
- New price
- Price difference (red for increase, green for decrease)
- Percentage change
- **Match Method**: Shows how the product was matched (exact vs fuzzy)

## Fuzzy Match Review

⚠️ **Important**: Always review fuzzy matches before applying!

Fuzzy matches are highlighted in the preview with:
- Yellow row background in main table
- Search icon (🔍) next to product name
- "Fuzzy Match" badge with confidence score
- Dedicated "Fuzzy Matches" review card

**When to be cautious with fuzzy matches**:
- Low confidence scores (< 60%)
- Products with similar names but different specs
- Multiple products with similar names

**Best practices**:
1. Review all fuzzy matches carefully
2. Verify the matched product is correct
3. If wrong, either:
   - Update product name in Excel to be more specific
   - Use exact product slug instead
   - Add product details (like color, size) to disambiguate

## Tips

1. **Use product slugs** when possible for exact matching
2. **Be specific with product names** - include model numbers, specs
3. **Check "Fuzzy Matches" card** carefully before applying
4. **Check "Not Found" list** to ensure product names are spelled correctly
5. **Export products first** to get a template with correct slugs
6. **Test with a small sample** (10-20 products) before updating all 400+
7. **Keep a backup** of your original Excel file

## Getting Product Slugs

To get correct product slugs for your Excel file:

1. Go to MongoDB or use API: `GET /api/products?admin=true`
2. Export results to Excel
3. Use `slug` column in your price update file

**Or** use the admin panel:
1. Go to Products section
2. Export/Download products (if available)
3. Use the slug column from export

## Troubleshooting

### "Products Not Found" Count is High

- Check that product names match approximately (fuzzy matching helps)
- Use slug column instead of name for exact matching
- Make sure products are active in database
- Add more specific details to product names

### High Number of Fuzzy Matches

- Review fuzzy matches carefully before applying
- Consider using product slugs for exact matching
- Verify fuzzy match confidence scores
- Update Excel with more specific names

### Fuzzy Match Wrong Product

- Add more details to product name (model, specs)
- Use exact product slug instead
- Manually update that product separately
- Remove from Excel and update individually

### "Invalid Prices" Appears

- Ensure all prices are valid numbers
- Prices must be positive values
- Remove any currency symbols (GHS, $, etc.) - use numbers only
- Check for extra spaces or characters

### File Upload Button Not Working

- Refresh the page and try again
- Try a different browser
- Check file size is under 10MB
- Ensure file format is .xlsx, .xls, or .csv
- Clear browser cache and try again

## Security Notes

- This feature is **admin-only** and requires authentication
- Changes are **previewed first** before applying
- Fuzzy matches require **manual review**
- All changes are **logged** in the server
- **Cannot be undone** - be careful before clicking "Apply"

## API Endpoints

```
POST /api/admin/bulk-price-update/preview
  - Upload Excel file and preview changes
  - Returns: matched, fuzzy matched, not found, invalid prices

POST /api/admin/bulk-price-update/apply
  - Apply confirmed price updates
  - Auto-regenerates product JSON files
```

## Fuzzy Matching Algorithm

The fuzzy matching uses a hybrid approach:

1. **Keyword Extraction**: Removes common words, extracts product keywords
2. **Similarity Scoring**: 
   - Keyword overlap ratio (70% weight)
   - Length similarity ratio (30% weight)
3. **Threshold**: Requires minimum 40% similarity score
4. **Ranking**: Sorts by score, returns best match

This provides high accuracy while catching variations in naming.
POST /api/admin/bulk-price-update/preview
  - Upload Excel file and preview changes
  
POST /api/admin/bulk-price-update/apply
  - Apply confirmed price updates
```
