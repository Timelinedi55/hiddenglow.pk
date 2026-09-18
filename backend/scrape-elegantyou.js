/**
 * Scrapes product data and images from elegantyou.com.pk
 * Downloads images to uploads/products/ and outputs product JSON
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BASE = 'https://elegantyou.com.pk';
const COLLECTION_URL = '/collections/all?sort_by=best-selling';
const PRODUCTS_DIR = path.join(__dirname, 'uploads', 'products');
const CATEGORIES_DIR = path.join(__dirname, 'uploads', 'categories');
const OUTPUT_FILE = path.join(__dirname, 'scraped-products.json');

// How many pages to scrape (each has ~36 products)
const MAX_PAGES = 3;
// Max products total
const MAX_PRODUCTS = 50;

// Ensure dirs exist
fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
fs.mkdirSync(CATEGORIES_DIR, { recursive: true });

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    if (!url || url.includes('no-image')) { resolve(null); return; }
    // Get high-res version
    let imgUrl = url.replace(/&width=\d+/, '&width=800');
    if (!imgUrl.startsWith('http')) imgUrl = 'https:' + imgUrl;
    
    const filepath = path.join(PRODUCTS_DIR, filename);
    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 1000) {
      console.log(`  ✓ Already exists: ${filename}`);
      resolve(filename);
      return;
    }
    
    const mod = imgUrl.startsWith('https') ? https : http;
    mod.get(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location, filename).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) { resolve(null); return; }
      const ws = fs.createWriteStream(filepath);
      res.pipe(ws);
      ws.on('finish', () => {
        ws.close();
        const size = fs.statSync(filepath).size;
        if (size < 500) { fs.unlinkSync(filepath); resolve(null); return; }
        console.log(`  ✓ Downloaded: ${filename} (${(size/1024).toFixed(0)}KB)`);
        resolve(filename);
      });
      ws.on('error', () => resolve(null));
    }).on('error', () => resolve(null));
  });
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[()[\]{}]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

function cleanName(raw) {
  // Remove size prefixes like "(30-36)b" and product codes like "(061-062)"
  return raw
    .replace(/^\([^)]*\)\s*[a-z]?\/?[a-z]?\s*/i, '')
    .replace(/\s*\([0-9-]+\)\s*$/g, '')
    .replace(/\s*\[[0-9-]+\]\s*$/g, '')
    .replace(/\s*\d+%\s*OFF\s*$/i, '')
    .trim();
}

function extractSizeRange(raw) {
  const match = raw.match(/^\((\d+)-(\d+)\)/);
  if (match) {
    const start = parseInt(match[1]);
    const end = parseInt(match[2]);
    const sizes = [];
    for (let s = start; s <= end; s += 2) sizes.push(String(s));
    return sizes;
  }
  return ['S', 'M', 'L', 'XL'];
}

async function scrapeProductDetail(productUrl) {
  try {
    const html = await fetch(BASE + productUrl);
    const $ = cheerio.load(html.toString());
    
    // Get all product images
    const images = [];
    // Try product media gallery
    $('img[src*="/cdn/shop/files/"], img[src*="/cdn/shop/products/"]').each((_, el) => {
      let src = $(el).attr('src') || '';
      if (src && !images.includes(src) && !src.includes('icon') && !src.includes('logo')) {
        // Get higher resolution
        src = src.replace(/&width=\d+/, '&width=800').replace(/\?width=\d+/, '?width=800');
        images.push(src);
      }
    });
    
    // Get description
    let description = '';
    const descBlock = $('.product__description, .product-description, [class*="description"]').first();
    if (descBlock.length) {
      description = descBlock.html() || '';
    }
    
    // Get price info from JSON-LD or meta
    let price = 0, comparePrice = 0;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html());
        if (json['@type'] === 'Product' && json.offers) {
          const offer = Array.isArray(json.offers) ? json.offers[0] : json.offers;
          price = parseFloat(offer.price) || 0;
        }
      } catch (e) {}
    });
    
    return { images: images.slice(0, 5), description, detailPrice: price };
  } catch (e) {
    return { images: [], description: '', detailPrice: 0 };
  }
}

async function scrapeCollectionPage(pageNum) {
  const url = `${BASE}${COLLECTION_URL}&page=${pageNum}`;
  console.log(`\nFetching page ${pageNum}: ${url}`);
  const html = await fetch(url);
  const $ = cheerio.load(html.toString());
  
  const products = [];
  
  // Each product card
  $('li.grid__item, .product-card, .card-wrapper').each((idx, el) => {
    const card = $(el);
    
    // Title & link
    const titleLink = card.find('a[href*="/products/"]').first();
    const href = titleLink.attr('href') || '';
    const rawTitle = card.find('.card__heading, .card-information__text, h3').first().text().trim();
    
    if (!rawTitle || !href) return;
    
    // Price
    let price = 0, comparePrice = 0;
    const priceText = card.find('.price-item--regular, .price__regular .price-item').first().text().replace(/[^0-9.]/g, '');
    const saleText = card.find('.price-item--sale, .price__sale .price-item--sale').first().text().replace(/[^0-9.]/g, '');
    
    if (saleText) {
      price = parseFloat(saleText) || 0;
      comparePrice = parseFloat(priceText) || 0;
    } else {
      price = parseFloat(priceText) || 0;
    }
    
    // Image
    const img = card.find('img').first();
    let imgSrc = img.attr('src') || img.attr('data-src') || '';
    
    products.push({
      rawTitle,
      name: cleanName(rawTitle),
      slug: slugify(cleanName(rawTitle)),
      href,
      price,
      comparePrice,
      imgSrc,
      sizes: extractSizeRange(rawTitle),
    });
  });
  
  return products;
}

async function main() {
  console.log('🔍 Scraping elegantyou.com.pk best sellers...\n');
  
  let allProducts = [];
  
  for (let page = 1; page <= MAX_PAGES; page++) {
    const products = await scrapeCollectionPage(page);
    allProducts = allProducts.concat(products);
    console.log(`  Found ${products.length} products on page ${page}`);
    if (allProducts.length >= MAX_PRODUCTS) break;
    // Be respectful
    await new Promise(r => setTimeout(r, 1000));
  }
  
  allProducts = allProducts.slice(0, MAX_PRODUCTS);
  
  // Deduplicate by slug
  const seen = new Set();
  allProducts = allProducts.filter(p => {
    if (seen.has(p.slug) || !p.name || p.name.length < 3) return false;
    seen.add(p.slug);
    return true;
  });
  
  console.log(`\n📦 Total unique products: ${allProducts.length}`);
  console.log('\n📸 Downloading images and fetching details...\n');
  
  for (let i = 0; i < allProducts.length; i++) {
    const p = allProducts[i];
    console.log(`[${i+1}/${allProducts.length}] ${p.name}`);
    
    // Scrape detail page for more images
    const detail = await scrapeProductDetail(p.href);
    
    // Collect all image URLs (from listing + detail page)
    const allImgUrls = [];
    if (p.imgSrc) allImgUrls.push(p.imgSrc);
    detail.images.forEach(img => {
      if (!allImgUrls.includes(img)) allImgUrls.push(img);
    });
    
    // Use detail price if listing failed
    if (!p.price && detail.detailPrice) {
      p.price = detail.detailPrice;
    }
    
    // Download up to 4 images per product
    const downloadedImages = [];
    for (let j = 0; j < Math.min(4, allImgUrls.length); j++) {
      const ext = allImgUrls[j].includes('.png') ? 'png' : 'jpg';
      const filename = `${p.slug}-${j + 1}.${ext}`;
      const result = await downloadImage(allImgUrls[j], filename);
      if (result) downloadedImages.push(result);
    }
    
    p.downloadedImages = downloadedImages;
    p.description = detail.description || '';
    
    // Small delay to be respectful
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Filter out products with no images
  const final = allProducts.filter(p => p.downloadedImages && p.downloadedImages.length > 0);
  
  console.log(`\n✅ Successfully scraped ${final.length} products with images`);
  
  // Save to JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(final, null, 2));
  console.log(`📄 Saved to ${OUTPUT_FILE}`);
}

main().catch(console.error);
