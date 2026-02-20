// Fingerprint CSS/JS assets with content hashes and rewrite HTML references.
// Outputs asset-manifest.json mapping original -> hashed filename.
// Idempotent: if a hashed file already exists with same content hash, it won’t duplicate.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ASSET_DIRS = [
  'assets/js',
  'assets/css'
];

const HTML_GLOBS = ['.'];

function walkFiles(dir, filterFn) {
  const out = [];
  (function recur(d){
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()){
        if (['node_modules','blog_IPMCKart','packages','testsprite_tests','cert'].includes(e.name)) continue;
        recur(full);
      } else if (e.isFile()) {
        if (!filterFn || filterFn(full)) out.push(full);
      }
    }
  })(dir);
  return out;
}

function hashContent(buf){
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0,8);
}

function isHashed(name){
  return /\.[a-f0-9]{8}\.(?:js|css)$/i.test(name);
}

function fingerprintAssets(){
  const manifest = {};

  for (const dir of ASSET_DIRS){
    if (!fs.existsSync(dir)) continue;
    const files = walkFiles(dir, f => /\.(?:js|css)$/i.test(f) && !isHashed(f));
    for (const file of files){
      const rel = file.replace(/\\/g,'/');
      const buf = fs.readFileSync(file);
      const hash = hashContent(buf);
      const ext = path.extname(file);
      const base = path.basename(file, ext);
      const hashedName = `${base}.${hash}${ext}`;
      const hashedPath = path.join(path.dirname(file), hashedName);

      if (!fs.existsSync(hashedPath)){
        fs.writeFileSync(hashedPath, buf);
      }

      const relRoot = rel.replace(/^\.?\/?/, '/');
      const relHashed = hashedPath.replace(/\\/g,'/').replace(/^\.?\/?/, '/');
      manifest[relRoot] = relHashed;
    }
  }

  fs.writeFileSync('asset-manifest.json', JSON.stringify(manifest, null, 2));
  return manifest;
}

function rewriteHtml(manifest){
  // Replace occurrences of original asset paths to hashed ones
  const htmlFiles = walkFiles('.', f => f.endsWith('.html'));
  for (const file of htmlFiles){
    if (file.startsWith('blog_IPMCKart')) continue;
    let html = fs.readFileSync(file, 'utf8');
    let changed = false;
    for (const [orig, hashed] of Object.entries(manifest)){
      // Support both leading-slash and relative paths in HTML
      const variants = [orig, orig.replace(/^\//,'')];
      for (const v of variants){
        const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(escaped, 'g');
        if (re.test(html)){
          html = html.replace(re, hashed);
          changed = true;
        }
      }
    }
    if (changed){
      fs.writeFileSync(file, html, 'utf8');
    }
  }
}

if (require.main === module){
  const manifest = fingerprintAssets();
  rewriteHtml(manifest);
  console.log('Fingerprinting complete. Manifest written to asset-manifest.json');
}
