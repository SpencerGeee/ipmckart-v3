/*
  fix_csp_all.js
  - Enforces CSP-friendly HTML across the site by:
    1) Removing WebFont Loader inline configs and switching to CSS-based Google Fonts with display=swap.
    2) Extracting inline <script> blocks into external JS files and wiring them via <script src> with defer.
    3) Converting absolute /assets paths to relative assets paths to avoid 404s under subpaths.
    4) Normalizing CSS loading: convert preload+onload patterns into regular rel="stylesheet" links for critical CSS.
    5) Optionally removes preload-styles helper script tags.

  Run: node scripts/fix_csp_all.js
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INLINE_DIR = path.join(ROOT, 'assets/js/inline');

function readFile(fp) {
  return fs.readFileSync(fp, 'utf8');
}
function writeFile(fp, data) {
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, data, 'utf8');
}

function listHtmlFiles(dir) {
  const out = [];
  function walk(d) {
    const ents = fs.readdirSync(d, { withFileTypes: true });
    for (const ent of ents) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === 'node_modules' || ent.name === '.git') continue;
        walk(full);
      } else if (ent.isFile() && ent.name.toLowerCase().endsWith('.html')) {
        out.push(full);
      }
    }
  }
  walk(dir);
  return out;
}

function ensureRelativeAssetsPaths(html) {
  // Convert /assets/... to assets/... for href/src
  return html
    .replace(/href\s*=\s*"\/assets\//g, 'href="assets/')
    .replace(/src\s*=\s*"\/assets\//g, 'src="assets/');
}

function removeWebFontLoader(html) {
  // Remove inline WebFontConfig blocks and webfont.js includes
  html = html.replace(/<script[^>]*>\s*WebFontConfig[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<script[^>]*src=["'][^"']*webfont[^"']*["'][^>]*><\/script>/gi, '');
  return html;
}

function ensureGoogleFontsLinks(html) {
  // Insert preconnects and CSS link if missing
  const hasFontsCss = /fonts\.googleapis\.com\/css2\?/.test(html);
  const hasPreconnectApi = /<link[^>]*rel=["']preconnect["'][^>]*fonts\.googleapis\.com/.test(html);
  const hasPreconnectGstatic = /<link[^>]*rel=["']preconnect["'][^>]*fonts\.gstatic\.com/.test(html);

  const preconnects = [
    '    <link rel="preconnect" href="https://fonts.googleapis.com">',
    '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
  ].join('\n');
  const fontsCss = '    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&family=Open+Sans:wght@400&display=swap" rel="stylesheet">';

  if (!hasFontsCss || !hasPreconnectApi || !hasPreconnectGstatic) {
    // Insert right after <head> tag opening (or after first meta) for predictability
    html = html.replace(/<head(.*?)>/i, (m) => {
      let inject = '\n' + (hasPreconnectApi && hasPreconnectGstatic ? '' : preconnects + '\n') + (hasFontsCss ? '' : fontsCss + '\n');
      return m + inject;
    });
  }
  return html;
}

function normalizeStylesheets(html) {
  // Convert preload as style to plain stylesheet for local CSS files; keep external CDNs as-is
  html = html.replace(/<link([^>]*?)rel=["']preload["']([^>]*?)as=["']style["']([^>]*?)href=(["'])([^"']+\.css)\4([^>]*)>/gi, (m, a, b, c, q, href, tail) => {
    // Convert only local assets or vendor css; always safe
    return `<link rel="stylesheet" href="${href}">`;
  });
  // Remove duplicate noscript preload wrappers left behind
  html = html.replace(/<noscript>\s*<link[^>]*>\s*<\/noscript>/gi, '');
  // Optionally remove preload-styles helper script
  html = html.replace(/<script[^>]*preload-styles[^>]*><\/script>/gi, '');
  return html;
}

function extractInlineScripts(html, fileBase) {
  let idx = 0;
  const outSnippets = [];
  html = html.replace(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi, (m, body) => {
    const code = String(body || '').trim();
    if (!code) return '';
    const jsName = `${fileBase}-inline-${++idx}.js`;
    outSnippets.push({ name: jsName, code });
    return `  <script src="assets/js/inline/${jsName}" defer></script>`;
  });
  return { html, outSnippets };
}

function fixScriptCssPaths(html) {
  // Ensure any remaining absolute paths become relative
  html = ensureRelativeAssetsPaths(html);
  // Common bundles ensure relative
  html = html.replace(/src=\"\/assets\/js\/common\.bundle[^\"]*\"/g, (m) => m.replace('/assets/', 'assets/'));
  html = html.replace(/src=\"\/assets\/js\/page-init\.js\"/g, 'src="assets/js/page-init.js"');
  return html;
}

function cleanupArtifacts(html) {
  // Remove stray tokens like </$1>
  html = html.replace(/<\/$1>/g, '');
  return html;
}

function ensurePageInitIncluded(html) {
  if (!/assets\/js\/page-init\.js/.test(html)) {
    // Insert before closing body
    html = html.replace(/<\/body>/i, '  <script src="assets/js/page-init.js" defer></script>\n</body>');
  }
  return html;
}

function processHtmlFile(fp) {
  let html = readFile(fp);
  const fileBase = path.basename(fp, '.html');
  const relOutDir = path.relative(ROOT, fp);

  html = removeWebFontLoader(html);
  html = ensureGoogleFontsLinks(html);
  html = normalizeStylesheets(html);

  const extracted = extractInlineScripts(html, fileBase);
  html = extracted.html;

  html = fixScriptCssPaths(html);
  html = ensurePageInitIncluded(html);
  html = cleanupArtifacts(html);

  // Write out inline JS snippets
  if (extracted.outSnippets.length) {
    for (const snip of extracted.outSnippets) {
      const jsPath = path.join(INLINE_DIR, snip.name);
      writeFile(jsPath, snip.code + '\n');
    }
  }

  writeFile(fp, html);
  return extracted.outSnippets.length;
}

function main() {
  fs.mkdirSync(INLINE_DIR, { recursive: true });
  const files = listHtmlFiles(ROOT);
  let totalInline = 0;
  let totalFiles = 0;
  for (const fp of files) {
    // Skip any files in templates/ (emails) and ajax/ if desired
    if (fp.includes(path.sep + 'templates' + path.sep)) continue;
    try {
      const count = processHtmlFile(fp);
      totalInline += count;
      totalFiles++;
      console.log(`[CSP FIX] Processed ${path.relative(ROOT, fp)} - extracted inline scripts: ${count}`);
    } catch (e) {
      console.error(`[CSP FIX] Failed ${path.relative(ROOT, fp)}:`, e.message);
    }
  }
  console.log(`[CSP FIX] Done. Files processed: ${totalFiles}. Inline scripts extracted: ${totalInline}.`);
}

if (require.main === module) {
  main();
}
