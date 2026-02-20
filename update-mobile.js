// update-mobile-nav.js
const fs = require('fs').promises;
const path = require('path');

(async () => {
  const directory = './';

  const newMobileMenu = `
<div class="mobile-menu-container">
  <div class="mobile-menu-wrapper">
    <span class="mobile-menu-close"><i class="fa fa-times"></i></span>
    <nav class="mobile-nav">
      <ul class="mobile-menu">
        <li><a href="index.html">Home</a></li>
        <li>
          <a href="category1.html">Categories</a>
          <ul>
            <li><a href="category1.html?category=printers-scanners&subcategory=printers-scanners">Printers & Scanners</a></li>
            <li><a href="category1.html?category=computing-devices">Computing Devices</a></li>
            <li><a href="category1.html?category=home-appliances">Home Appliances</a></li>
            <li><a href="category1.html?category=kitchen-appliances">Kitchen Appliances</a></li>
            <li><a href="category1.html?category=tech-accessories">Tech Accessories</a></li>
            <li><a href="category1.html?category=mobile-phones">Mobile Phones</a></li>
            <li><a href="category1.html?category=ups&subcategory=ups">UPS</a></li>
            <li><a href="category1.html?category=computing-devices&subcategory=starlink">Starlink</a></li>
          </ul>
        </li>
        <li>
          <a href="flash-sales.html">⚡ Flash Sales <span class="tip tip-hot">Hot!</span></a>
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
    <!-- End .mobile-nav -->
    <form class="search-wrapper mb-2" action="#">
      <input type="text" class="form-control mb-0" placeholder="Search..." required />
      <button class="btn icon-search text-white bg-transparent p-0" type="submit"></button>
    </form>
    <div class="social-icons">
      <a href="https://www.facebook.com/IPMCKart/" class="social-icon social-facebook icon-facebook" target="_blank"></a>
      <a href="https://x.com/ipmckart" class="social-icon social-twitter icon-twitter" target="_blank"></a>
      <a href="https://www.linkedin.com/company/ipmc-kart/" class="social-icon social-instagram icon-instagram" target="_blank"></a>
    </div>
  </div>
  <!-- End .mobile-menu-wrapper -->
</div>
  `.trim();

  const newStickyNavbar = `
<div class="sticky-navbar">
  
</div>
  `.trim();

  
  const newScrollTop = `
<a id="scroll-top" href="#top" title="Top" role="button"><i class="icon-angle-up"></i></a>
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
    let updated = false;

    // Mobile menu
    const mobileMenuRegex = /<div class="mobile-menu-container">[\s\S]*?<\/div>/gi;
    if (mobileMenuRegex.test(content)) {
      console.log(`Found mobile-menu-container in ${file}, replacing`);
      content = content.replace(mobileMenuRegex, newMobileMenu);
      updated = true;
    } else {
      console.log(`No mobile-menu-container found in ${file}, skipping`);
    }

    // Sticky navbar
    const stickyNavbarRegex = /<div class="sticky-navbar">[\s\S]*?<\/div>/gi;
    if (stickyNavbarRegex.test(content)) {
      console.log(`Found sticky-navbar in ${file}, replacing`);
      content = content.replace(stickyNavbarRegex, newStickyNavbar);
      updated = true;
    } else {
      console.log(`No sticky-navbar found in ${file}, skipping`);
    }

    

    if (updated) {
      await fs.writeFile(file, content, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
  console.log('✅ All mobile nav elements updated!');
})();