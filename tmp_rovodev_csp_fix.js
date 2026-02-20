// Global CSP fix: remove inline event handlers from CSS preload links
// - Remove onload= from <link rel="preload" as="style" ...>
// - Ensure <noscript><link rel="stylesheet" ...></noscript> fallback (no preload inside noscript)
// - Ensure assets/js/preload-styles.js is present before </head>
// - Idempotent and skips blog pages

const fs = require('fs');
const path = require('path');

function isBlog(file){
  const p = file.replace(/\\/g,'/');
  return p.startsWith('blog_IPMCKart/') || /^blog\d*\.html$/i.test(path.basename(p)) || /\/blog\d*\.html$/i.test(p);
}

function ensurePreloadScript(headHtml){
  if (/assets\/js\/preload-styles\.js/.test(headHtml)) return headHtml;
  return headHtml.replace(/<\/(head)>/i, (m, tag)=>`  <script src="assets/js/preload-styles.js" defer></script>\n</${tag}>`);
}

function sanitizeHead(head){
  let out = head;
  // 1) Remove onload attributes from preload style links (any order)
  out = out.replace(/(<link\s+[^>]*rel=["']preload["'][^>]*as=["']style["'][^>]*)([^>]*?)>/gi, (m, start, rest)=>{
    // strip any onload attributes from rest
    const cleaned = rest.replace(/\s+onload=["'][^"']*["']/gi, '');
    return start + cleaned + '>';
  });

  // 2) Normalize any noscript wrapping a preload link to use stylesheet
  out = out.replace(/<noscript>\s*<link([^>]*?)rel=["']preload["']([^>]*?)>\s*<\/noscript>/gi, (m, pre, post)=>{
    const attrs = (pre + ' ' + post)
      .replace(/\s*as=["']style["']/gi, '')
      .replace(/\s*onload=["'][^"']*["']/gi, '')
      .replace(/\s*rel=["']preload["']/i, '')
      .trim();
    // pick href
    const hrefMatch = attrs.match(/href=["'][^"']+["']/i);
    if(!hrefMatch) return m; // keep original if no href
    // preserve crossorigin if any
    const crossMatch = attrs.match(/crossorigin=["'][^"']+["']/i);
    const href = hrefMatch[0];
    const cross = crossMatch ? ' ' + crossMatch[0] : '';
    return `<noscript><link rel="stylesheet" ${href}${cross}></noscript>`;
  });

  // 3) Deduplicate consecutive identical noscript fallbacks for same href
  const seen = new Set();
  out = out.replace(/<noscript>\s*<link[^>]*href=["']([^"']+)["'][^>]*>\s*<\/noscript>/gi, (m, href)=>{
    const key = href.toLowerCase();
    if (seen.has(key)) return '';
    seen.add(key);
    return m;
  });

  // 4) Fix stray stylesheet' artifacts left after attribute removal
  out = out.replace(/\s*stylesheet'(\s*>)/gi, '$1');

  // 5) Normalize any noscript-wrapped link to stylesheet fallback, preserving href
  out = out.replace(/<noscript>\s*<link[^>]*href=["']([^"']+)["'][^>]*>\s*<\/noscript>/gi, (m, href)=>{
    return `<noscript><link rel="stylesheet" href="${href}"></noscript>`;
  });

  // 6) Replace inline WebFontConfig block with external file where present
  out = out.replace(/<script>\s*WebFontConfig[\s\S]*?<\/script>/gi, '<script src="assets/js/webfont-config.js" defer></script>');

  // 7) Ensure preload-styles.js present
  out = ensurePreloadScript(out);

  return out;
}

function processFile(file){
  const html = fs.readFileSync(file, 'utf8');
  const headMatch = html.match(/<head>[\s\S]*?<\/head>/i);
  if (!headMatch) return;
  const head = headMatch[0];
  const fixed = sanitizeHead(head);
  if (fixed !== head){
    const updated = html.replace(head, fixed);
    fs.writeFileSync(file, updated, 'utf8');
  }
}

function walk(dir){
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries){
    const full = path.join(dir, e.name);
    if (e.isDirectory()){
      if (['node_modules','assets','blog_IPMCKart','cert','packages','testsprite_tests'].includes(e.name)) continue;
      if (dir === '.' && e.name !== 'ajax') continue;
      walk(full);
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.html')){
      if (isBlog(full)) continue;
      processFile(full);
    }
  }
}

if (require.main === module){
  walk('.');
  console.log('CSP cleanup complete.');
}
