// update-scripts.js
const fs = require('fs').promises;
const path = require('path');

(async () => {
  const directory = './';

  const commonScripts = [
    'assets/js/jquery.min.js',
    'assets/js/bootstrap.bundle.min.js',
    'assets/js/plugins.min.js',
    'assets/js/optional/isotope.pkgd.min.js',
    'assets/js/jquery.appear.min.js',
    'assets/js/jquery.plugin.min.js',
    'assets/js/jquery.countdown.min.js',
    'assets/js/main.min.js',
    'search-preview.js',
    'assets/js/cart.js',
    'assets/js/dynamic-purchase-popup.js',
    'cart-manager.js'
  ];

  const inlineLoadedScript = `
<script>
document.querySelector('body').classList.add('loaded');
</script>
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

    // Add missing common scripts before </body>
    commonScripts.forEach(scriptSrc => {
      if (!content.includes(`src="${scriptSrc}"`)) {
        console.log(`Adding missing script ${scriptSrc} to ${file}`);
        content = content.replace(/<\/body>/i, `<script src="${scriptSrc}"></script>\n</body>`);
        updated = true;
      }
    });

    // Add inline loaded script if missing
    if (!content.includes("document.querySelector('body').classList.add('loaded');")) {
      console.log(`Adding inline loaded script to ${file}`);
      content = content.replace(/<\/body>/i, `${inlineLoadedScript}\n</body>`);
      updated = true;
    }

    if (updated) {
      await fs.writeFile(file, content, 'utf8');
      console.log(`Updated ${file}`);
    } else {
      console.log(`No script changes needed for ${file}`);
    }
  }
  console.log('✅ All scripts updated!');
})();