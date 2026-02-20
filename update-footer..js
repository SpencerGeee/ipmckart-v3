// update-footers.js
const fs = require('fs').promises;
const path = require('path');

(async () => {
  const directory = './';

  const newFooter = `
<footer class="footer">
  <div class="footer-middle">
    <div class="container">
      <div class="row">
        <div class="col-lg-3">
          <span class="footer-brand">IPMC</span>
          <ul class="contact-widget">
            <li>
              <strong class="title">ADDRESS:</strong>
              <strong class="address">Kwame Nkrumah Ave, Accra, Ghana</strong>
            </li>
            <li>
              <strong class="title">PHONE:</strong>
              <a href="tel:+233-302-246-465">+233-302-246-465</a>
            </li>
            <li>
              <strong class="title">EMAIL:</strong>
              <a href="mailto:info@ipmckart.com">info@ipmckart.com</a>
            </li>
            <li>
              <strong class="title">WORKING DAYS/HOURS:</strong>
              <strong class="address">Mon - Fri / 9:00AM - 5:00PM</strong>
            </li>
          </ul>
        </div>
        <div class="col-lg-3">
          <h4 class="widget-title">My Account</h4>
          <ul class="links">
            <li><a href="dashboard.html">My Account</a></li>
            <li><a href="#">Order History</a></li>
            <li><a href="#">Advanced Search</a></li>
            <li><a href="login.html">Login</a></li>
          </ul>
        </div>
        <div class="col-lg-3">
          <h4 class="widget-title">Main Features</h4>
          <ul class="links">
            <li><a href="#">Super Fast Delivery</a></li>
            <li><a href="#">Secure Payments</a></li>
            <li><a href="#">Money Back Guarantee</a></li>
            <li><a href="#">Easy Returns</a></li>
          </ul>
        </div>
        <div class="col-lg-3">
          <h4 class="widget-title">About Us</h4>
          <ul class="links">
            <li><a href="about.html">About IPMC</a></li>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Privacy Policy</a></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container d-flex justify-content-between align-items-center flex-wrap">
      <p class="footer-copyright py-3 pr-4 mb-0">© IPMC Kart 2024. All Rights Reserved</p>
      <img src="assets/images/payments.webp" alt="payment methods" class="footer-payments py-3">
    </div>
  </div>
</footer>
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
    const footerRegex = /<footer[\s\S]*?<\/footer>/gi;
    if (footerRegex.test(content)) {
      console.log(`Found footer in ${file}, replacing with uniform footer`);
      content = content.replace(footerRegex, newFooter);
      await fs.writeFile(file, content, 'utf8');
      console.log(`Updated ${file}`);
    } else {
      console.log(`No footer found in ${file}, skipping`);
    }
  }
  console.log('✅ All footers updated!');
})();