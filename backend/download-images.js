#!/usr/bin/env node
/**
 * Download realistic stock images from Pexels for Hidden Glow products.
 * Pexels License: Free to use, no attribution required.
 * https://www.pexels.com/license/
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const UPLOAD_DIR = path.join(__dirname, 'uploads', 'products');
const CAT_DIR = path.join(__dirname, 'uploads', 'categories');

// Pexels image URL helper — crops to exact dimensions
function pexels(id, w = 800, h = 1000) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`;
}

// Product images mapped to Pexels photo IDs
// Each product gets 2-3 images showing different angles/contexts
const productImages = {
  // BRAS
  'everyday-comfort-bra': [
    pexels(6675853, 800, 1000),     // Lace bra flat lay with hearts - clean
    pexels(9111565, 800, 1000),     // Red lace bra with earrings
    pexels(15586510, 800, 1000),    // Black bra with cosmetics
  ],
  'lace-elegance-bra': [
    pexels(10457213, 800, 1000),    // Brown lace lingerie set
    pexels(10457197, 800, 1000),    // Red brassiere elegant
    pexels(9162886, 800, 1000),     // Red lace underwear
  ],
  'seamless-tshirt-bra': [
    pexels(4314754, 800, 1000),     // Black brassiere and makeup
    pexels(6675841, 800, 1000),     // Feminine accessories flat lay
  ],
  'pushup-luxe-bra': [
    pexels(34027234, 800, 1000),    // Red floral lingerie
    pexels(6675834, 800, 1000),     // Red brassiere and coffee
    pexels(6675831, 800, 1000),     // Lace lingerie styled
  ],
  'sports-active-bra': [
    pexels(6675852, 800, 1000),     // Active/styled lingerie
    pexels(9162883, 800, 1000),     // Orange underwear (sporty vibe)
  ],

  // PANTIES
  'cotton-essentials-bikini': [
    pexels(9162885, 800, 1000),     // Yellow bikini on white
    pexels(9162888, 800, 1000),     // Teal lingerie set
  ],
  'lace-trim-hipster': [
    pexels(6675848, 800, 1000),     // Lace lingerie romantic
    pexels(6675839, 800, 1000),     // Lingerie and love message
  ],
  'seamless-thong': [
    pexels(6675850, 800, 1000),     // Lingerie styled
    pexels(6675844, 800, 1000),     // Feminine items flat lay
  ],
  'cotton-briefs-pack': [
    pexels(9162889, 800, 1000),     // Cream lingerie set
    pexels(6794048, 800, 1000),     // Vintage underwear
  ],
  'boyshort-comfort': [
    pexels(9162883, 800, 1000),     // Orange underwear
    pexels(9162885, 800, 1000),     // Yellow bikini
  ],

  // NIGHTWEAR
  'silk-satin-nightgown': [
    pexels(6675851, 800, 1000),     // Elegant accessories
    pexels(4998010, 800, 1000),     // Bridal dress and bra
    pexels(9162889, 800, 1000),     // Cream set
  ],
  'cotton-pajama-set': [
    pexels(6794048, 800, 1000),     // Vintage lingerie styled
    pexels(4314754, 800, 1000),     // Black brassiere styled
  ],
  'lace-chemise': [
    pexels(10457213, 800, 1000),    // Lace lingerie set
    pexels(6675853, 800, 1000),     // Lace bra on marble
    pexels(10457197, 800, 1000),    // Red brassiere
  ],
  'sleep-shorts-set': [
    pexels(9162888, 800, 1000),     // Teal set
    pexels(6675841, 800, 1000),     // Accessories flat lay
  ],

  // MATCHING SETS
  'bridal-lace-set': [
    pexels(4998010, 800, 1000),     // Bridal dress and bra
    pexels(6675853, 800, 1000),     // Lace on marble
    pexels(10457213, 800, 1000),    // Lace set
  ],
  'everyday-matching-set': [
    pexels(9162889, 800, 1000),     // Cream set
    pexels(9162885, 800, 1000),     // Yellow set
  ],
  'date-night-set': [
    pexels(9162886, 800, 1000),     // Red lace underwear
    pexels(34027234, 800, 1000),    // Red floral lingerie
    pexels(6675834, 800, 1000),     // Elegant styling
  ],

  // CAMISOLES
  'silk-camisole': [
    pexels(6675851, 800, 1000),     // Elegant styling
    pexels(9162889, 800, 1000),     // Cream set
  ],
  'lace-trim-cami': [
    pexels(10457213, 800, 1000),    // Lace set
    pexels(6675848, 800, 1000),     // Lace romantic
  ],
  'layering-tank': [
    pexels(4314754, 800, 1000),     // Simple styled
    pexels(15586510, 800, 1000),    // Black with cosmetics
  ],

  // SHAPEWEAR
  'bodysuit-shaper': [
    pexels(6675841, 800, 1000),     // Accessories flat lay
    pexels(9162888, 800, 1000),     // Teal set
  ],
  'high-waist-shaper': [
    pexels(9162883, 800, 1000),     // Orange styled
    pexels(6675844, 800, 1000),     // Feminine items
  ],
  'thigh-shaper-shorts': [
    pexels(6675850, 800, 1000),     // Styled lingerie
    pexels(9162885, 800, 1000),     // Yellow
  ],
};

// Category images
const categoryImages = {
  'bras': pexels(9111565, 800, 600),
  'panties': pexels(9162885, 800, 600),
  'nightwear': pexels(4998010, 800, 600),
  'sets': pexels(10457213, 800, 600),
  'camisoles': pexels(6675851, 800, 600),
  'shapewear': pexels(9162888, 800, 600),
};

// Hero banner
const heroBanner = pexels(6675848, 1600, 800);

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    }, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(dest));
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    }).on('timeout', () => {
      reject(new Error('Timeout'));
    });
  });
}

async function main() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   Hidden Glow — Image Download Script      ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Ensure directories exist
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.mkdirSync(CAT_DIR, { recursive: true });

  let success = 0, failed = 0;

  // Download product images
  console.log('── Downloading Product Images ──\n');
  for (const [slug, urls] of Object.entries(productImages)) {
    for (let i = 0; i < urls.length; i++) {
      const filename = `${slug}-${i + 1}.jpg`;
      const dest = path.join(UPLOAD_DIR, filename);
      try {
        await download(urls[i], dest);
        const size = fs.statSync(dest).size;
        console.log(`  ✓ ${filename} (${(size / 1024).toFixed(0)}KB)`);
        success++;
      } catch (err) {
        console.log(`  ✗ ${filename} — ${err.message}`);
        failed++;
      }
    }
  }

  // Download category images
  console.log('\n── Downloading Category Images ──\n');
  for (const [slug, url] of Object.entries(categoryImages)) {
    const filename = `${slug}.jpg`;
    const dest = path.join(CAT_DIR, filename);
    try {
      await download(url, dest);
      const size = fs.statSync(dest).size;
      console.log(`  ✓ ${filename} (${(size / 1024).toFixed(0)}KB)`);
      success++;
    } catch (err) {
      console.log(`  ✗ ${filename} — ${err.message}`);
      failed++;
    }
  }

  // Download hero banner
  console.log('\n── Downloading Hero Banner ──\n');
  try {
    const dest = path.join(UPLOAD_DIR, 'hero-banner.jpg');
    await download(heroBanner, dest);
    const size = fs.statSync(dest).size;
    console.log(`  ✓ hero-banner.jpg (${(size / 1024).toFixed(0)}KB)`);
    success++;
  } catch (err) {
    console.log(`  ✗ hero-banner.jpg — ${err.message}`);
    failed++;
  }

  console.log(`\n── Summary: ${success} downloaded, ${failed} failed ──`);
}

main().catch(console.error);
