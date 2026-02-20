const fs = require('fs');
const path = require('path');

// Function to update navigation in a file
function updateNavigation(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Define the new navigation template (without the active class - that will be handled by JS)
        const newNav = `<nav class="main-nav w-100">
                            <ul class="menu">
                                <li class="nav-home">
                                    <a href="index.html">Home</a>
                                </li>
                                <li class="nav-categories">
                                    <a href="category-page.html">Categories</a>
                                    <div class="megamenu megamenu-fixed-width megamenu-3cols">
                                        <div class="row">
                                            <div class="col-lg-4">
                                                <a href="category1.html?category=printers-scanners" class="nolink">Printers & Scanners</a>
                                                <ul class="submenu">
                                                    <li><a href="category1.html?category=printers-scanners&subcategory=printers-scanners">Printers & Scanners</a></li>
                                                    <li><a href="category1.html?category=printers-scanners&subcategory=toners">Toners</a>
                                                    </li>
                                                    <li><a href="category1.html?category=printers-scanners&subcategory=ink-cartridges">Ink Catridges</a>
                                                    </li>
                                                    <li><a href="category1.html?category=printers-scanners&subcategory=printing-consumables">Printing Consumables</a></li>
                                                </ul>
                                            </div>
                                            <div class="col-lg-4">
                                                <a href="category1.html?category=computing-devices" class="nolink">Computing Devices</a>
                                                <ul class="submenu">
                                                    <li><a href="category1.html?category=computing-devices&subcategory=workstations">Workstations</a></li>
                                                    <li><a href="category1.html?category=computing-devices&subcategory=laptops">Laptops</a>
                                                    </li>
                                                    <li><a href="category1.html?category=computing-devices&subcategory=tablets">Tablets</a></li>
                                                    <li><a href="category1.html?category=computing-devices&subcategory=monitors">Monitors</a></li>
                                                    <li><a href="category1.html?category=computing-devices&subcategory=all-in-one-computers">All-In-One Computers</a></li>
                                                    <li><a href="category1.html?category=computing-devices&subcategory=keys">Keys & Clicks</a></li>
                                                </ul>
                                            </div>
                                            <div class="col-lg-4">
                                                <a href="category1.html?category=home-appliances" class="nolink">Home Appliances</a>
                                                <ul class="submenu">
                                                    <li><a href="category1.html?category=home-appliances&subcategory=washing-machines">Washing Machines</a></li>
                                                    <li><a href="category1.html?category=home-appliances&subcategory=refridgerators">Refridgerators</a>
                                                    </li>
                                                    <li><a href="category1.html?category=home-appliances&subcategory=washing-machines">Irons</a></li>
                                                    <li><a href="category1.html?category=home-appliances&subcategory=vacuum-cleaners">Vacuum Cleaners</a></li>
                                                </ul>
                                            </div>
                                            <div class="col-lg-4">
                                                <a href="category1.html?category=kitchen-appliances" class="nolink">Kitchen Appliances</a>
                                                <ul class="submenu">
                                                    <li><a href="category1.html?category=kitchen-appliances&subcategory=dishwashers">Dishwashers</a></li>
                                                    <li><a href="category1.html?category=kitchen-appliances&subcategory=microwaves">Microwaves</a></li>
                                                    <li><a href="category1.html?category=kitchen-appliances&subcategory=stoves">Stoves</a></li>
                                                    <li><a href="category1.html?category=kitchen-appliances&subcategory=rice-cookers">Rice Cooker</a></li>
                                                </ul>
                                            </div>
                                            <div class="col-lg-4">
                                                <a href="category1.html?category=tech-accessories" class="nolink">Tech Accessories</a>
                                                <ul class="submenu">
                                                    <li><a href="category1.html?category=tech-accessories&subcategory=storage-devices">Storage Devices</a></li>
                                                    <li><a href="category1.html?category=tech-accessories&subcategory=headsets-earphones">Headsets & Earphones</a>
                                                    </li>
                                                    <li><a href="category1.html?category=tech-accessories&subcategory=playhub">PlayHub</a></li>
                                                    <li><a href="category-4col.html">Wireless Sound</a></li>
                                                    <li><a href="category1.html?category=tech-accessories&subcategory=cctv-cameras">CCTV Cameras</a></li>
                                                    <li><a href="category1.html?category=tech-accessories&subcategory=network-switches">Network Switches</a>
                                                    </li>
                                                    <li><a href="category.html">WIFI Extenders</a></li>
                                                    <li><a href="category1.html?category=tech-accessories&subcategory=tablet-laptop-sleeves">Tablet & Laptop Sleeves</a></li>
                                                    <li><a href="category1.html?category=tech-accessories&subcategory=power-solutions">Power Solutions</a></li>
                                                    <li><a href="category1.html?category=tech-accessories&subcategory=wireless-sound">Smart Watches</a></li>
                                                </ul>
                                            </div>
                                            <div class="col-lg-4">
                                                <a href="category1.html?category=mobile-phones" class="nolink">Mobile Phones</a>
                                                <ul class="submenu">
                                                    <li><a href="category1.html?category=mobile-phones&subcategory=apple-iphone">Apple Iphone </a></li>
                                                    <li><a href="category1.html?category=mobile-phones&subcategory=samsung-smartphones">Samsung Smartphones</a></li>
                                                    <li><a href="category1.html?category=mobile-phones&subcategory=tecno-phones">Tecno Phones</a></li>
                                                    <li><a href="category1.html?category=mobile-phones&subcategory=itel-phones">Itel Phones</a></li>
                                                    <li><a href="category1.html?category=mobile-phones&subcategory=infinix-smartphones">Infinix Smartphones </a></li>
                                                    <li><a href="category1.html?category=mobile-phones&subcategory=oppo-smartphones">Oppo Smartphones</a></li>
                                                    <li><a href="category1.html?category=mobile-phones&subcategory=oppo-smartphones">Realme Smartphones</a></li>
                                                </ul>
                                            </div>
                                            <div class="col-lg-4">
                                                <a href="category1.html?category=ups&subcategory=ups" class="nolink">UPS</a>
                                            </div>
                                            <div class="col-lg-4">
                                                <a href="category1.html?category=computing-devices&subcategory=shredders" class="nolink">Shredders</a>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- End .megamenu -->
                                </li>
                                <li class="nav-starlink">
                                    <a href="product.html?id=starlink-001-starlink-standard-kit">Starlink Ghana</a>
                                    <div class="megamenu megamenu-fixed-width">
                                        <div class="row">
                                            <div class="col-lg-4">
                                                <a href="category1.html?category=computing-devices&subcategory=starlink" class="nolink">Order Starlink</a>
                                                <ul class="submenu">
                                                    <li><a href="starlink-mini.html">Starlink Mini</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                        <!-- End .row -->
                                    </div>
                                    <!-- End .megamenu -->
                                </li>
                                <li class="nav-newyear">
                                    <a href="newyear-sale.html">⚡ New Year Sales</a>
                                </li>
                                <li class="nav-repairs">
                                    <a href="repairs-upgrade.html">Repairs and Upgrades</a>
                                </li>
                                <li class="nav-blog">
                                    <a href="blog.html">Blog</a>
                                </li>
                                <li class="nav-about">
                                    <a href="about.html">About Us</a>
                                </li>
                                <li class="nav-contact">
                                    <a href="contact.html">Contact Us</a>
                                </li>
                            </ul>
                        </nav>`;
        
        // Regular expression to match the navigation menu section
        const navRegex = /<nav class="main-nav w-100">[\s\S]*?<\/nav>/;
        
        // Replace the navigation
        if (navRegex.test(content)) {
            content = content.replace(navRegex, newNav);
            console.log(`Updated navigation in: ${filePath}`);
            
            // Write the updated content back to the file
            fs.writeFileSync(filePath, content, 'utf8');
            return true;
        } else {
            console.log(`No navigation found to update in: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`Error updating ${filePath}:`, error.message);
        return false;
    }
}

// Function to add the navigation handler script to a file
function addNavigationScript(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if the script is already added
        if (content.includes('navigation-handler.js')) {
            console.log(`Navigation script already present in: ${filePath}`);
            return false;
        }
        
        // Add the script before the closing body tag
        const scriptTag = '    <script src="scripts/navigation-handler.js" defer></script>\n</body>';
        const newContent = content.replace('</body>', scriptTag);
        
        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Added navigation script to: ${filePath}`);
            return true;
        } else {
            console.log(`Could not add navigation script to: ${filePath} (no body tag found)`);
            return false;
        }
    } catch (error) {
        console.error(`Error adding script to ${filePath}:`, error.message);
        return false;
    }
}

// Main function to process all HTML files
function processHTMLFiles(directory) {
    const files = fs.readdirSync(directory);
    let updatedCount = 0;
    let scriptAddedCount = 0;
    
    files.forEach(file => {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Recursively process subdirectories
            processHTMLFiles(filePath);
        } else if (file.endsWith('.html')) {
            // Update navigation
            if (updateNavigation(filePath)) {
                updatedCount++;
            }
            
            // Add navigation script
            if (addNavigationScript(filePath)) {
                scriptAddedCount++;
            }
        }
    });
    
    return { updatedCount, scriptAddedCount };
}

// Process the current directory
console.log('Starting navigation update process...');
const result = processHTMLFiles(process.cwd());

console.log(`\nProcess completed!`);
console.log(`Navigation updated in ${result.updatedCount} files`);
console.log(`Navigation script added to ${result.scriptAddedCount} files`);
console.log('Note: Active states will be handled by the navigation-handler.js script dynamically based on the current page.');