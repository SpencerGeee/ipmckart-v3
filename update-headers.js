// update-headers.js
const fs = require('fs').promises;
const path = require('path');

(async () => {
  const directory = './'; // Adjust to your project root if needed

  const newHeader = `
<header class="header box-shadow">
  <div class="header-top">
    <div class="container">
      <div class="header-left">
        <div class="header-dropdown">
          <a href="#"><i class="flag-us flag"></i>ENG</a>
          <div class="header-menu">
            <ul>
              <li><a href="#"><i class="flag-us flag mr-2"></i>ENG</a></li>
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
        <button class="mobile-menu-toggler" type="button">
          <i class="fas fa-bars"></i>
        </button>
        <a href="index.html" class="logo">
          <img src="assets/logo.webp" alt="IPMC Logo" width="111" height="44" style="border-radius: 10px;">
          <img src="assets/logo.webp" alt="IPMC Logo" width="111" height="44" class="sticky-logo">
        </a>
      </div>
      <div class="header-center">
        <div class="header-icon header-search header-search-inline header-search-category w-lg-max text-right mt-0">
          <a href="#" class="search-toggle" role="button"><i class="icon-search-3"></i></a>
          <form action="#" method="get">
            <div class="header-search-wrapper">
              <input type="search" class="form-control" name="q" id="q" placeholder="I'm searching for..." required>
              <div class="select-custom">
                <select id="cat" name="cat">
                  <option value="">All Categories</option>
                  <option value="4">Printers & Scanners</option>
                  <option value="12">Computing Devices</option>
                  <option value="5">Home Appliances</option>
                  <option value="21">Kitchen Appliances</option>
                  <option value="7">Tech Accessories</option>
                </select>
              </div>
              <button class="btn icon-magnifier p-0" title="search" type="submit"></button>
            </div>
          </form>
        </div>
      </div>
      <div class="header-right ml-0 ml-lg-auto">
        <div class="header-contact d-none d-lg-flex pl-4 mr-4">
          <img alt="phone" src="assets/images/phone.webp" width="30" height="30" class="pb-1">
          <h6>Call us now<a href="tel:#" class="text-dark font1">+233 302 246 465</a></h6>
        </div>
        <a href="login.html" class="header-icon" title="login"><i class="icon-user-2"></i></a>
        <a href="wishlist.html" class="header-icon" title="wishlist"><i class="icon-wishlist-2"></i></a>
        <div class="dropdown cart-dropdown">
          <a href="cart.html" title="Cart" class="dropdown-toggle dropdown-arrow cart-toggle" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-display="static">
            <i class="icon-shopping-cart"></i>
            <span class="cart-count badge-circle">0</span>
          </a>
          <div class="cart-overlay"></div>
          <div class="dropdown-menu mobile-cart">
            <a href="#" title="Close (Esc)" class="btn-close">×</a>
            <div class="dropdownmenu-wrapper">
              <div class="dropdown-cart-header">Shopping Cart</div>
              <!-- End .dropdown-cart-header -->
              <div class="dropdown-cart-products">
                <div class="product">
                  <div class="product-details">
                    <h4 class="product-title">
                      <a href="demo21-product.html">Ultimate 3D Bluetooth Speaker</a>
                    </h4>
                    <span class="cart-product-info">
                      <span class="cart-product-qty">1</span> × ₵35.00
                    </span>
                  </div>
                  <!-- End .product-details -->
                  <figure class="product-image-container">
                    <a href="demo21-product.html" class="product-image">
                      <img src="assets/images/products/product-1.webp" alt="product" width="80" height="80">
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
                <a href="cart.html" class="btn btn-gray btn-block view-cart">View Cart</a>
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
  `.trim();

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

  const htmlFiles = await getHtmlFiles(directory);
  for (const file of htmlFiles) {
    let content = await fs.readFile(file, 'utf8');
    const headerRegex = /<header(?:[^>]*?)>[\s\S]*?<\/header>/gi;
    if (headerRegex.test(content)) {
      console.log(`Found header in ${file}, replacing with uniform header`);
      content = content.replace(headerRegex, newHeader);
      await fs.writeFile(file, content, 'utf8');
      console.log(`Updated ${file}`);
    } else {
      console.log(`No header found in ${file}, skipping`);
    }
  }
  console.log('✅ All headers updated!');
})();