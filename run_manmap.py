import pandas as pd
from manmap import complete_mapping

# Load your Excel file
excel_df = pd.read_excel('new products.xlsx')

# Apply the mapping
excel_df['Database_Name'] = excel_df['Clean Product Name'].map(complete_mapping)

# For unmapped (new) products, keep the original name (to be added to DB)
excel_df['Database_Name'] = excel_df['Database_Name'].fillna(excel_df['Clean Product Name'])

# Add category column (you'll need to map these based on product type)
def infer_category(product_name):
    name_lower = str(product_name).lower()
    if any(word in name_lower for word in ['laptop', 'desktop', 'tablet', 'monitor', 'aio']):
        return 'computing-devices'
    elif any(word in name_lower for word in ['phone', 'iphone', 'samsung galaxy', 'oppo', 'realme', 'tecno', 'itel']):
        return 'mobile-phones'
    elif any(word in name_lower for word in ['printer', 'scanner', 'toner', 'cartridge', 'ink']):
        return 'printers-scanners'
    elif any(word in name_lower for word in ['headset', 'earphone', 'speaker', 'audio']):
        return 'tech-accessories'
    elif any(word in name_lower for word in ['ups', 'inverter', 'stabilizer']):
        return 'ups'
    elif any(word in name_lower for word in ['refrigerator', 'washing', 'air conditioner', 'fan', 'iron', 'vacuum']):
        return 'home-appliances'
    elif any(word in name_lower for word in ['blender', 'kettle', 'cooker', 'toaster', 'microwave']):
        return 'kitchen-appliances'
    else:
        return 'tech-accessories'

excel_df['Category'] = excel_df['Database_Name'].apply(infer_category)

# Save final mapping
excel_df.to_csv('complete_product_mapping.csv', index=False)