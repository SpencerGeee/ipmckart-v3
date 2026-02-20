// Build script: fingerprint assets and auto-bump SW version
// - Generates asset-manifest.json and rewrites HTML references
// - Bumps SW_VERSION in sw.js (patch bump)
// - Intended for production build step: npm run build:hash

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function log(msg){ console.log(`[build-hash] ${msg}`); }

function hashContent(buf){
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0,8);
}

function isHashed(name){
  return /\.[a-f0-9]{8}\.(?:js|css)$/i.test(name);
}

function walk(dir, filter){
  const out = [];
  (function recur(d){
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries){
      const full = path.join(d, e.name);
      if (e.isDirectory()){
        if (['node_modules','blog_IPMCKart','packages','testsprite_tests','cert'].includes(e.name)) continue;
        recur(full);
      } else if (e.isFile()){
        if (!filter || filter(full)) out.push(full);
      }
    }
  })(dir);
  return out;
}

function fingerprint(){
  const ASSET_DIRS = ['assets/js','assets/css'];
  const manifest = {};
  for (const dir of ASSET_DIRS){
    if (!fs.existsSync(dir)) continue;
    const files = walk(dir, f => /\.(?:js|css)$/i.test(f) && !isHashed(f));
    for (const file of files){
      const buf = fs.readFileSync(file);
      const hash = hashContent(buf);
      const ext = path.extname(file);
      const base = path.basename(file, ext);
      const hashedName = `${base}.${hash}${ext}`;
      const hashedPath = path.join(path.dirname(file), hashedName);
      if (!fs.existsSync(hashedPath)) fs.writeFileSync(hashedPath, buf);
      const rel = '/' + file.replace(/\\/g,'/');
      const relHashed = '/' + hashedPath.replace(/\\/g,'/');
      manifest[rel] = relHashed;
    }
  }
  fs.writeFileSync('asset-manifest.json', JSON.stringify(manifest, null, 2));
  log(`Wrote asset-manifest.json with ${Object.keys(manifest).length} entries`);
  return manifest;
}

function rewriteHtml(manifest){
  const files = walk('.', f => f.toLowerCase().endsWith('.html'));
  let changedFiles = 0;
  for (const file of files){
    if (file.startsWith('blog_IPMCKart')) continue;
    let html = fs.readFileSync(file, 'utf8');
    let changed = false;
    for (const [orig, hashed] of Object.entries(manifest)){
      const variants = [orig, orig.slice(1)];
      for (const v of variants){
        const re = new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        if (re.test(html)){
          html = html.replace(re, hashed);
          changed = true;
        }
      }
    }
    if (changed){ fs.writeFileSync(file, html, 'utf8'); changedFiles++; }
  }
  log(`Rewrote ${changedFiles} HTML files to hashed assets`);
}

function bumpSW(){
  const swPath = 'sw.js';
  if (!fs.existsSync(swPath)) { log('sw.js not found, skipping SW bump'); return; }
  let sw = fs.readFileSync(swPath, 'utf8');
  const m = sw.match(/const\s+SW_VERSION\s*=\s*['"]([^'"]+)['"]/);
  if (!m){ log('SW_VERSION not found in sw.js'); return; }
  const cur = m[1];
  const bumped = cur.replace(/(v)(\d+)\.(\d+)\.(\d+)/, (full, v, maj, min, patch) => `${v}${maj}.${min}.${Number(patch)+1}`);
  if (cur === bumped){
    // If regex didn’t match, append a build timestamp
    const ts = Date.now();
    sw = sw.replace(cur, `${cur}-${ts}`);
  } else {
    sw = sw.replace(cur, bumped);
    log(`SW_VERSION bumped: ${cur} -> ${bumped}`);
  }
  fs.writeFileSync(swPath, sw, 'utf8');
}

function main(){
  const manifest = fingerprint();
  rewriteHtml(manifest);
  bumpSW();
  log('Build hash step complete');
}

if (require.main === module) main();
