// Ensure font preconnect hints and font-display: swap across non-blog pages
// - Adds <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
// - Adds <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
// - Ensures <script src="assets/js/webfont-config.js" defer></script> is present (which sets display:'swap')
// - Skips blog and templates (emails) directories

const fs = require('fs');
const path = require('path');

function isBlogOrTemplate(file){
  const p = file.replace(/\\/g,'/');
  if (p.startsWith('blog_IPMCKart/')) return true;
  if (p.startsWith('templates/')) return true; // email templates
  if (/^blog\d*\.html$/i.test(path.basename(p)) || /\/blog\d*\.html$/i.test(p)) return true;
  return false;
}

function ensurePreconnects(head){
  const hasApi = /<link[^>]+rel=["']preconnect["'][^>]*href=["']https:\/\/fonts\.googleapis\.com["'][^>]*>/i.test(head);
  const hasGstatic = /<link[^>]+rel=["']preconnect["'][^>]*href=["']https:\/\/fonts\.gstatic\.com["'][^>]*>/i.test(head);
  let out = head;
  const insertBefore = /<link[^>]+rel=["']manifest["'][^>]*>|<link[^>]+rel=["']apple-touch-icon["'][^>]*>|<link[^>]+rel=["']icon["'][^>]*>/i;

  const preconnectApi = '    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>\n';
  const preconnectGstatic = '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n';

  if (!hasApi || !hasGstatic){
    const toInsert = (hasApi ? '' : preconnectApi) + (hasGstatic ? '' : preconnectGstatic);
    if (insertBefore.test(out)){
      out = out.replace(insertBefore, toInsert + '$&');
    } else {
      out = out.replace(/<head>/i, '<head>\n' + toInsert);
    }
  }
  return out;
}

function ensureWebfontConfig(head){
  if (/assets\/js\/webfont-config\.js/i.test(head)) return head;
  return head.replace(/<\/(head)>/i, (m, tag)=>`  <script src="assets/js/webfont-config.js" defer></script>\n</${tag}>`);
}

function processFile(file){
  let html = fs.readFileSync(file, 'utf8');
  const headMatch = html.match(/<head>[\s\S]*?<\/head>/i);
  if (!headMatch) return;
  let head = headMatch[0];

  head = ensurePreconnects(head);
  head = ensureWebfontConfig(head);

  if (head !== headMatch[0]){
    html = html.replace(headMatch[0], head);
    fs.writeFileSync(file, html, 'utf8');
  }
}

function walk(dir){
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries){
    const full = path.join(dir, e.name);
    if (e.isDirectory()){
      if (['node_modules','assets','blog_IPMCKart','cert','packages','testsprite_tests','templates'].includes(e.name)) continue;
      if (dir === '.' && e.name !== 'ajax') continue;
      walk(full);
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.html')){
      if (isBlogOrTemplate(full)) continue;
      processFile(full);
    }
  }
}

if (require.main === module){
  walk('.');
  console.log('Font optimization applied.');
}
