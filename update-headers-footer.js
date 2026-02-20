// update-headers-footers.js
const fs = require('fs').promises;
const path = require('path');

(async () => {
  // Define the directory to scan (adjust as needed)
  const directory = './'; // Current directory, change to your project root if different

  // Uniform header content with correct links and aesthetics
  const newHeader = `
    <header class="header box-shadow">
            <div class="header-top">
                <div class="container">
                    <div class="header-left">
                        <div class="header-dropdown">
                            <a href="#"><i class="flag-us flag"></i>ENG</a>
                            <div class="header-menu">
                                <ul>
                                    <li><a href="#"><i class="flag-us flag mr-2"></i>ENG</a>
                                    </li>
                                    
                                </ul>
                            </div>
                            <!-- End .header-menu -->
                        </div>
                        <!-- End .header-dropdown -->
                        <span class="gap mx-3">|</span>
                        <div class="header-dropdown">
                            <a href="#">USD</a>
                            <div class="header-menu">
                                <ul>
                                    
                                    <li><a href="#">USD</a></li>
                                </ul>
                            </div>
                        </div>
                        <!-- End .header-menu -->
                    </div>
                    <!-- End .header-dropdown -->

                    <div class="header-right ml-0 ml-lg-auto">
                        <p class="top-message mb-0 text-uppercase">Welcome To IPMC!</p>
                        <span class="gap mx-4 d-none d-lg-block">|</span>
                        <div class="header-dropdown dropdown-expanded d-none d-lg-block">
                            <a href="#">Links</a>
                            <div class="header-menu">
                                <ul class="mb-0 d-none d-lg-flex">
                                    <li><a href="dashboard.html">My Account</a></li>
                                    <li><a href="about.html">About Us</a></li>
                                    <li><a href="wishlist.html">My Wishlist</a></li>
                                    
                                    <li><a href="cart.html">Cart</a></li>
                                    <li><a href="login.html">Log In</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <!-- End .header-right -->
                </div>
                <!-- End .container -->
            </div>
            <!-- End .header-top -->
            <div class="header-middle sticky-header" data-sticky-options="{'mobile': true}">
                <div class="container" style="height: 65px;">
                    <div class="header-left">
                        <button class="mobile-menu-toggler" type="button" aria-label="Open mobile menu" aria-expanded="false" aria-controls="mobile-menu-container">
                            <i class="fas fa-bars" aria-hidden="true"></i>
                        </button>
                        <a href="index.html" class="logo" aria-label="IPMC Kart Homepage">
                            <img src="assets/logo.webp" alt="IPMC Kart - Quality Electronics Store" width="150" height="44" style="border-radius: 10px;" loading="eager" fetchpriority="high">
                            <img src="assets/logo.webp" alt="IPMC Kart" width="111" height="44" class="sticky-logo" loading="eager">
                        </a>
                    </div>

                    <div class="header-center">
                        <div class="header-icon header-search header-search-inline header-search-category w-lg-max text-right mt-0">
                            <a href="#" class="search-toggle" role="button" aria-label="Open search" aria-expanded="false" tabindex="0"><i class="icon-search-3" aria-hidden="true"></i></a>
                            <form action="#" method="get" role="search" aria-label="Site search">
                                <div class="header-search-wrapper">
                                    <label for="q" class="sr-only">Search products</label>
                                    <input type="search" class="form-control" name="q" id="q" placeholder="I'm searching for..." required aria-label="Search products" autocomplete="off">
                                    <div class="select-custom">
                                        <label for="cat" class="sr-only">Select category</label>
                                        <select id="cat" name="cat" aria-label="Product category">
                                            <option value="">All Categories</option>
                                            <option value="4">Printers & Scanners</option>
                                            <option value="12">Computing Devices</option>
                                           
                                            <option value="5">Home Appliances</option>
                                            <option value="21">Kitchen Appliances</option>
                                            
                                            <option value="7">Tech Accessories</option>
                                            <option value="11">Mobile Phones</option>
                                           
                                        </select>
										
                                    </div>
                                    <!-- End .select-custom -->
                                    <button class="btn icon-magnifier bg-dark text-white" title="Search" type="submit" aria-label="Search">
                                        <span class="sr-only">Search</span>
                                    </button>
                                </div>
                                <!-- End .header-search-wrapper -->
                            </form>
                        </div>
                        <!-- End .header-search -->
                    </div>

                    <div class="header-right ml-0 ml-lg-auto">
                        <a href="wishlist.html" class="header-icon" aria-label="View wishlist">
                            <i class="icon-wishlist-2" aria-hidden="true"></i>
                            <span class="sr-only">Wishlist</span>
                        </a>

                        <div class="dropdown cart-dropdown">
                            <a href="#" title="Shopping Cart" class="dropdown-toggle cart-toggle" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-display="static" aria-label="View shopping cart">
                                <i class="minicart-icon" aria-hidden="true"></i>
                                <span class="cart-count badge-circle" aria-live="polite" aria-atomic="true">3</span>
                                <span class="sr-only">Items in cart:</span>
                            </a>

                            <div class="cart-overlay"></div>

                            <div class="dropdown-menu mobile-cart">
                                <a href="#" title="Close (Esc)" class="btn-close">×</a>

                                <div class="dropdownmenu-wrapper custom-scrollbar">
                                    <div class="dropdown-cart-header">Shopping Cart</div>
                                    <!-- End .dropdown-cart-header -->

                                    <div class="dropdown-cart-products">
                                        <div class="product">
                                            <div class="product-details">
                                                <h4 class="product-title">
                                                    <a href="demo21-product.html">Ultimate 3D Bluetooth Speaker</a>
                                                </h4>

                                                <span class="cart-product-info">
                                                    <span class="cart-product-qty">1</span> × ₵99.00
                                                </span>
                                            </div>
                                            <!-- End .product-details -->

                                            <figure class="product-image-container">
                                                <a href="demo21-product.html" class="product-image">
                                                    <img src="assets/images/products/product-1.webp" alt="Ultimate 3D Bluetooth Speaker" width="80" height="80" loading="lazy">
                                                </a>

                                                <a href="#" class="btn-remove" title="Remove Product"><span>×</span></a>
                                            </figure>
                                        </div>
                                        <!-- End .product -->

                                        <div class="product">
                                            <div class="product-details">
                                                <h4 class="product-title">
                                                    <a href="demo21-product.html">Brown Women Casual HandBag</a>
                                                </h4>

                                                <span class="cart-product-info">
                                                    <span class="cart-product-qty">1</span> × ₵35.00
                                                </span>
                                            </div>
                                            <!-- End .product-details -->

                                            <figure class="product-image-container">
                                                <a href="demo21-product.html" class="product-image">
                                                    <img src="assets/images/products/product-2.webp" alt="Brown Women Casual HandBag" width="80" height="80" loading="lazy">
                                                </a>

                                                <a href="#" class="btn-remove" title="Remove Product"><span>×</span></a>
                                            </figure>
                                        </div>
                                        <!-- End .product -->

                                        <div class="product">
                                            <div class="product-details">
                                                <h4 class="product-title">
                                                    <a href="demo21-product.html">Circled Ultimate 3D Speaker</a>
                                                </h4>

                                                <span class="cart-product-info">
                                                    <span class="cart-product-qty">1</span> × ₵35.00
                                                </span>
                                            </div>
                                            <!-- End .product-details -->

                                            <figure class="product-image-container">
                                                <a href="demo21-product.html" class="product-image">
                                                    <img src="assets/images/products/product-3.webp" alt="Circled Ultimate 3D Speaker" width="80" height="80" loading="lazy">
                                                </a>
                                                <a href="#" class="btn-remove" title="Remove Product"><span>×</span></a>
                                            </figure>
                                        </div>
                                        <!-- End .product -->
                                    </div>
                                    <!-- End .cart-product -->

                                    <div class="dropdown-cart-total">
                                        <span>SUBTOTAL:</span>

                                        <span class="cart-total-price float-right">₵134.00</span>
                                    </div>
                                    <!-- End .dropdown-cart-total -->

                                    <div class="dropdown-cart-action">
                                        <a href="cart.html" class="btn btn-gray btn-block view-cart">View
                                            Cart</a>
                                        <a href="checkout.html" class="btn btn-dark btn-block">Checkout</a>
                                    </div>
                                    <!-- End .dropdown-cart-total -->
                                </div>
                                <!-- End .dropdownmenu-wrapper -->
                            </div>
                            <!-- End .dropdown-menu -->
                        </div>
                        <!-- End .dropdown -->
                    </div>
                </div>
            </div>

            <div class="header-bottom sticky-header" data-sticky-options="{'mobile': false}">
                <div class="container">
                    <div class="header-left">
                        <a href="index.html" class="logo">
                            <img src="assets/logo.webp" alt="IPMC Logo" width="111" height="70" style="border-radius: 10px;">
                        </a>
                    </div>
                    <div class="header-center">
                        <nav class="main-nav w-100">
                            <ul class="menu">
                                <li>
                                    <a href="index.html">Home</a>
                                </li>
                                <li>
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
                                                    <li><a href="category1.html?category=kitchen-appliances&subcategory=microwaves">Microwaves</a>
                                                    </li>
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
                                                    <li><a href="category-4col.html">Wireless Sound</a></li><li>
													<a href="category1.html?category=tech-accessories&subcategory=cctv-cameras">CCTV Cameras</a></li>
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
                                <li>
                                    <a href="product.html?id=starlink-001-starlink-standard-kit">Starlink Ghana</a>
                                    <div class="megamenu megamenu-fixed-width">
                                        <div class="row">
                                            <div class="col-lg-4">
                                                <a href="category1.html?category=computing-devices&subcategory=starlink" class="nolink">Order Starlink</a>
                                                <ul class="submenu">
                                                    <li><a href="starlink-mini.html">Starlink Mini</a></li>
                                                   
                                                </ul>
                                            </div>
                                            <!-- End .col-lg-4 -->


                                            <!-- End .col-lg-4 -->

                                            
                                            <!-- End .col-lg-4 -->
                                        </div>
                                        <!-- End .row -->
                                    </div>
                                    <!-- End .megamenu -->
                                </li>
                                <li>
                                    <a href="newyear-sale.html">⚡︎ New Year Sales</a>

                                </li>
								<li>
                                    <a href="repairs-upgrade.html">Repairs and Upgrades</a>
                                </li>
								
                                <li><a href="blog.html">Blog</a></li>
                                <li>
                                    <a href="about.html">About Us</a>
                                </li>
								<li>
                                    <a href="contact.html">Contact Us</a>
                                </li>
                               
                            </ul>
                        </nav>
                    </div>
                    <div class="header-right pr-0">
                        <div class="header-icon header-search header-search-popup header-search-category w-lg-max text-right">
                            <a href="#" class="search-toggle" role="button" aria-label="Open search"><i class="icon-search-3" aria-hidden="true"></i></a>
                            <form action="#" method="get">
                                <div class="header-search-wrapper">
                                    <input type="search" class="form-control" name="q" id="q1" placeholder="I'm searching for..." required>
                                    <div class="select-custom">
                                        <select id="cat1" name="cat">
                                            <option value="">All Categories</option>
                                            <option value="4">Printers & Scanners</option>
                                            <option value="12">Computing Devices</option>
                                           
                                            <option value="5">Home Appliances</option>
                                            <option value="21">Kitchen Appliances</option>
                                            
                                            <option value="7">Tech Accessories</option>
                                            <option value="11">Mobile Phones</option>
                                        </select>
                                    </div>
                                    <!-- End .select-custom -->
                                    <button class="btn icon-search-3 bg-dark text-white p-0" title="search" type="submit"></button>
                                </div>
                                <!-- End .header-search-wrapper -->
                            </form>
                        </div>
                        <!-- End .header-search -->

                        <a href="wishlist.html" class="header-icon" aria-label="View wishlist">
                            <i class="icon-wishlist-2" aria-hidden="true"></i>
                        </a>

                        <div class="dropdown cart-dropdown">
                            <a href="#" title="Cart" class="dropdown-toggle cart-toggle" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-display="static" aria-label="View shopping cart">
                                <i class="minicart-icon" aria-hidden="true"></i>
                                <span class="cart-count badge-circle">3</span>
                            </a>

                            <div class="cart-overlay"></div>

                            <div class="dropdown-menu mobile-cart">
                                <a href="#" title="Close (Esc)" class="btn-close">×</a>

                                <div class="dropdownmenu-wrapper custom-scrollbar">
                                    <div class="dropdown-cart-header">Shopping Cart</div>
                                    <!-- End .dropdown-cart-header -->

                                    <div class="dropdown-cart-products">
                                        <div class="product">
                                            <div class="product-details">
                                                <h4 class="product-title">
                                                    <a href="demo21-product.html">Ultimate 3D Bluetooth Speaker</a>
                                                </h4>

                                                <span class="cart-product-info">
                                                    <span class="cart-product-qty">1</span> × ₵99.00
                                                </span>
                                            </div>
                                            <!-- End .product-details -->

                                            <figure class="product-image-container">
                                                <a href="demo21-product.html" class="product-image">
                                                    <img src="assets/images/products/product-1.webp" alt="Ultimate 3D Bluetooth Speaker" width="80" height="80" loading="lazy">
                                                </a>

                                                <a href="#" class="btn-remove" title="Remove Product"><span>×</span></a>
                                            </figure>
                                        </div>
                                        <!-- End .product -->

                                        <div class="product">
                                            <div class="product-details">
                                                <h4 class="product-title">
                                                    <a href="demo21-product.html">Brown Women Casual HandBag</a>
                                                </h4>

                                                <span class="cart-product-info">
                                                    <span class="cart-product-qty">1</span> × ₵35.00
                                                </span>
                                            </div>
                                            <!-- End .product-details -->

                                            <figure class="product-image-container">
                                                <a href="demo21-product.html" class="product-image">
                                                    <img src="assets/images/products/product-2.webp" alt="Brown Women Casual HandBag" width="80" height="80" loading="lazy">
                                                </a>

                                                <a href="#" class="btn-remove" title="Remove Product"><span>×</span></a>
                                            </figure>
                                        </div>
                                        <!-- End .product -->

                                        <div class="product">
                                            <div class="product-details">
                                                <h4 class="product-title">
                                                    <a href="demo21-product.html">Circled Ultimate 3D Speaker</a>
                                                </h4>

                                                <span class="cart-product-info">
                                                    <span class="cart-product-qty">1</span> × ₵35.00
                                                </span>
                                            </div>
                                            <!-- End .product-details -->

                                            <figure class="product-image-container">
                                                <a href="demo21-product.html" class="product-image">
                                                    <img src="assets/images/products/product-3.webp" alt="Circled Ultimate 3D Speaker" width="80" height="80" loading="lazy">
                                                </a>
                                                <a href="#" class="btn-remove" title="Remove Product"><span>×</span></a>
                                            </figure>
                                        </div>
                                        <!-- End .product -->
                                    </div>
                                    <!-- End .cart-product -->

                                    <div class="dropdown-cart-total">
                                        <span>SUBTOTAL:</span>

                                        <span class="cart-total-price float-right">₵134.00</span>
                                    </div>
                                    <!-- End .dropdown-cart-total -->

                                    <div class="dropdown-cart-action">
                                        <a href="cart.html" class="btn btn-gray btn-block view-cart">View
                                            Cart</a>
                                        <a href="checkout.html" class="btn btn-dark btn-block">Checkout</a>
                                    </div>
                                    <!-- End .dropdown-cart-total -->
                                </div>
                                <!-- End .dropdownmenu-wrapper -->
                            </div>
                            <!-- End .dropdown-menu -->
                        </div>
                        <!-- End .dropdown -->
                    </div>
                </div>
            </div>
        </header>
    <!-- Header area end here -->
  `.trim();

  // Uniform footer content with correct links and aesthetics

  


  // Recursively find all .html files
  async function getHtmlFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) return getHtmlFiles(fullPath);
        else if (entry.isFile() && entry.name.endsWith('.html')) return fullPath;
        return null;
      })
    );
    return files.flat().filter(f => f);
  }

  // Process each HTML file
  const htmlFiles = await getHtmlFiles(directory);
  for (const file of htmlFiles) {
    let content = await fs.readFile(file, 'utf8');

    let fileHeader = newHeader;
    const filename = path.basename(file);
    const activeMap = {
      'index.html': 'index.html',
      'category-page.html': 'category-page.html',
      'category1.html': 'category-page.html',
      'newyear-sale.html': 'newyear-sale.html',
      'repairs-upgrade.html': 'repairs-upgrade.html',
      'blog.html': 'blog.html',
      'about.html': 'about.html',
      'contact.html': 'contact.html'
    };

    if (activeMap[filename]) {
      const targetHref = activeMap[filename];
      const activeRegex = new RegExp(`(<li)(>\\s*<a href="${targetHref}")`, 'i');
      fileHeader = fileHeader.replace(activeRegex, '$1 class="active"$2');
    }

    // Replace all header instances with a single uniform header
    const headerRegex = /<header(?:[^>]*?)>[\s\S]*?(?=<\/header>|<\/head>|<\/body>|$)(?:<\/header>)?/gi;
    if (headerRegex.test(content)) {
      console.log(`Found header(s) in ${file}, replacing with uniform header`);
      content = content.replace(headerRegex, fileHeader);
    } else {
      console.log(`No header found in ${file}, adding uniform header`);
      // Insert header at a logical position (e.g., after <body> if not present)
      const bodyMatch = content.match(/<body[^>]*>/i);
      if (bodyMatch) {
        content = content.replace(bodyMatch[0], `${bodyMatch[0]}\n${fileHeader}`);
      } else {
        content = `${fileHeader}\n${content}`; // Prepend if no <body>
      }
    }

    // Replace all footer instances with a single uniform footer
    

    console.log(`Writing to ${file}`);
    await fs.writeFile(file, content, 'utf8');
    console.log(`Wrote to ${file}`);
  }

  console.log('✅ All headers and footers updated with uniform versions successfully!');
})();