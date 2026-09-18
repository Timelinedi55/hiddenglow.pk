const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'hiddenglow',
  password: 'your_secure_password_here',
  database: 'hiddenglow_db',
};

// ── Category definitions ───────────────────────────────────────────
const CATEGORIES = [
  { name: 'Bras', slug: 'bras', description: 'Premium bras for everyday comfort and style', image: '/uploads/categories/bras.jpg', sortOrder: 1 },
  { name: 'Panties', slug: 'panties', description: 'Comfortable panties and underwear for daily wear', image: '/uploads/categories/panties.jpg', sortOrder: 2 },
  { name: 'Shapewear', slug: 'shapewear', description: 'Body shapers and tummy control garments', image: '/uploads/categories/shapewear.jpg', sortOrder: 3 },
  { name: 'Sports & Comfort', slug: 'sports-comfort', description: 'Sports bras and posture correctors for active lifestyles', image: '/uploads/categories/bras.jpg', sortOrder: 4 },
  { name: 'Matching Sets', slug: 'matching-sets', description: 'Beautiful bra and panty sets', image: '/uploads/categories/sets.jpg', sortOrder: 5 },
  { name: 'Nursing & Maternity', slug: 'nursing-maternity', description: 'Nursing bras and front-button styles for new mothers', image: '/uploads/categories/bras.jpg', sortOrder: 6 },
];

// ── Category classification keywords ───────────────────────────────
function classifyProduct(name, rawTitle, description) {
  const text = `${name} ${rawTitle} ${description}`.toLowerCase();

  if (/bra\s*&\s*panty|panty\s*pair|matching\s*set|set\b.*bra.*panty/i.test(text)) return 'matching-sets';
  if (/shaper|shapewear|tummy|bodysuit|body\s*shaper/i.test(text)) return 'shapewear';
  if (/sport|posture|corrector|active/i.test(text)) return 'sports-comfort';
  if (/nursing|maternity|front\s*button|front\s*open|front\s*hook/i.test(text)) return 'nursing-maternity';
  if (/panty|panties|underwear|thong|hipster|bikini\b|brief|boyshort|menstrual|sanitary|disposable/i.test(text)) return 'panties';
  // Default to bras
  return 'bras';
}

// ── Name cleanup ───────────────────────────────────────────────────
function cleanName(name) {
  let n = name.trim();
  // Remove leading dots
  n = n.replace(/^\.+\s*/, '');
  // Remove leading "size " prefix
  n = n.replace(/^size\s+/i, '');
  // Fix truncated names from scraping (e.g. "mens" -> "Women's", "autiful" -> "Beautiful", "mmer" -> "Summer")
  if (/^mens\s/i.test(n)) n = n.replace(/^mens\s/i, "Women's ");
  if (/^autiful\s/i.test(n)) n = n.replace(/^autiful\s/i, 'Beautiful ');
  if (/^mmer\s/i.test(n)) n = n.replace(/^mmer\s/i, 'Summer ');
  // Remove product codes like (061-062), (101), 1937, etc.
  n = n.replace(/\s*\(\s*\d+[\s\-]*\d*\s*\)\s*/g, ' ');
  n = n.replace(/\s*\d{4}\s*/g, ' ');
  // Title case
  n = n.replace(/\s+/g, ' ').trim();
  n = n.split(' ').map(w => {
    if (['&', 'and', 'or', 'for', 'with', 'non', 'the', 'a'].includes(w.toLowerCase()) && w !== w.toUpperCase()) {
      return w.toLowerCase();
    }
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
  // Capitalize first word always
  n = n.charAt(0).toUpperCase() + n.slice(1);
  return n;
}

// ── Generate slug from name ────────────────────────────────────────
function makeSlug(name) {
  return name.toLowerCase()
    .replace(/[&]/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-+/g, '-');
}

// ── Parse price (scraped values are weird decimals like 0.1099 = Rs 1099) ──
function parsePrice(val) {
  if (!val || val <= 0) return 0;
  // The scraped prices are Shopify format where "Rs 1,099" becomes 0.1099
  // Strategy: multiply to get integer, then check ranges
  // 0.1099 * 10000 = 1099 ✓   0.75 * 1000 = 750 ✓   0.415 * 1000 = 415 ✓
  // Try *1000 first (catches 0.75 → 750, 0.415 → 415, 0.599 → 599, 0.999 → 999)
  const alt = Math.round(val * 1000);
  if (alt >= 300 && alt <= 3000) return alt;
  // Try *10000 for larger prices (catches 0.1099 → 1099, 0.1299 → 1299, 0.185 → 1850)
  const rupees = Math.round(val * 10000);
  if (rupees >= 300 && rupees <= 5000) return rupees;
  return 0;
}

// ── Generate short description ─────────────────────────────────────
function generateShortDescription(name, categorySlug) {
  const descs = {
    'bras': [
      'Premium quality bra designed for all-day comfort and support.',
      'Soft, breathable bra perfect for daily wear with excellent support.',
      'Comfortable everyday bra with adjustable straps and secure fit.',
    ],
    'panties': [
      'Soft and comfortable underwear made with skin-friendly fabric.',
      'Premium quality panties designed for everyday comfort.',
      'Breathable and stretchable underwear for all-day wear.',
    ],
    'shapewear': [
      'Effective body shaper for a smooth, confident silhouette.',
      'High-quality shapewear designed for tummy control and support.',
      'Comfortable shapewear that smooths and supports naturally.',
    ],
    'sports-comfort': [
      'Supportive sports bra designed for active lifestyles.',
      'Comfortable posture-correcting bra with full support.',
      'Performance bra for sports and daily activities.',
    ],
    'matching-sets': [
      'Beautiful matching bra and panty set for a coordinated look.',
      'Elegant bra and panty pair with seamless design.',
      'Stylish matching set combining comfort with elegance.',
    ],
    'nursing-maternity': [
      'Convenient front-open bra designed for nursing mothers.',
      'Comfortable maternity bra with easy front access.',
      'Supportive nursing bra with soft, anti-rash fabric.',
    ],
  };
  const arr = descs[categorySlug] || descs['bras'];
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Generate rich HTML description ─────────────────────────────────
function generateRichDescription(name, sizes, categorySlug) {
  const sizeList = sizes.join(', ');
  return `
<div class="product-description">
  <h3>Product Details</h3>
  <ul>
    <li>Premium quality ${name.toLowerCase()}</li>
    <li>Skin-friendly, breathable fabric</li>
    <li>Designed for everyday comfort</li>
    <li>Available sizes: ${sizeList}</li>
  </ul>
  <h3>Care Instructions</h3>
  <ul>
    <li>Hand wash recommended</li>
    <li>Do not bleach</li>
    <li>Do not tumble dry</li>
    <li>Lay flat to dry</li>
  </ul>
  <p><strong>Note:</strong> Please refer to the size chart before ordering for the perfect fit.</p>
</div>`.trim();
}

// ── Reviews ────────────────────────────────────────────────────────
const REVIEWS = [
  { name: 'Ayesha Malik', rating: 5, comment: 'Absolutely love the quality! The fabric is so soft and comfortable. Fits perfectly as described.' },
  { name: 'Fatima Khan', rating: 4, comment: 'Very comfortable for daily wear. The material is breathable and the stitching is excellent. Will order again!' },
  { name: 'Sana Ahmed', rating: 5, comment: 'Best innerwear I have bought online in Pakistan. The fit is amazing and delivery was fast too.' },
  { name: 'Hira Noor', rating: 5, comment: 'The quality exceeded my expectations. So soft against the skin and provides great support all day.' },
  { name: 'Zainab Hussain', rating: 4, comment: 'Good product for the price. Comfortable and well-made. The size chart was accurate which I appreciate.' },
  { name: 'Mehwish Ali', rating: 5, comment: 'I ordered two and both are perfect! The fabric doesn\'t irritate at all. Great for sensitive skin.' },
  { name: 'Amna Tariq', rating: 4, comment: 'Nice quality and very comfortable. Washes well too without losing shape. Highly recommend.' },
  { name: 'Rabia Aslam', rating: 5, comment: 'The fit is perfect and the material is premium quality. I have been looking for something like this for ages!' },
  { name: 'Nadia Shah', rating: 5, comment: 'Excellent product! The stitching is neat, fabric is breathable, and it looks exactly like the pictures.' },
  { name: 'Kiran Batool', rating: 4, comment: 'Very happy with my purchase. The bra provides great support and is so comfortable I forget I am wearing it.' },
  { name: 'Saima Raza', rating: 5, comment: 'Amazing quality at this price point. The cotton is soft and the elastic is durable. Already ordered more!' },
  { name: 'Iqra Nawaz', rating: 4, comment: 'Good fit and comfortable. The packaging was also very discreet which I really appreciate. Thank you!' },
  { name: 'Bushra Javed', rating: 5, comment: 'This is my third order from Hidden Glow. The quality is consistently excellent. My go-to shop now!' },
  { name: 'Maham Sheikh', rating: 5, comment: 'Super comfortable and great support. The fabric quality is much better than what I find in local markets.' },
  { name: 'Nimra Qadir', rating: 4, comment: 'Lovely product! Fits well and feels premium. The straps are adjustable and don\'t dig into shoulders.' },
  { name: 'Sidra Farooq', rating: 5, comment: 'Perfect everyday bra. The non-wire design is so comfortable and the padding is just right. Love it!' },
  { name: 'Alina Bukhari', rating: 4, comment: 'Good quality for the price. The fabric is soft and breathable especially in summer. Would recommend to friends.' },
  { name: 'Farah Iqbal', rating: 5, comment: 'The best online purchase I\'ve made! Comfortable, supportive, and the material feels luxurious on the skin.' },
];

// ── Main ───────────────────────────────────────────────────────────
async function main() {
  console.log('Connecting to database...');
  const conn = await mysql.createConnection(DB_CONFIG);

  try {
    // Disable FK checks for clean delete
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');

    console.log('Deleting existing data...');
    await conn.execute('DELETE FROM reviews');
    await conn.execute('DELETE FROM order_items');
    await conn.execute('DELETE FROM product_variants');
    await conn.execute('DELETE FROM product_images');
    await conn.execute('DELETE FROM products');
    await conn.execute('DELETE FROM categories');

    // Reset auto-increment
    await conn.execute('ALTER TABLE reviews AUTO_INCREMENT = 1');
    await conn.execute('ALTER TABLE product_variants AUTO_INCREMENT = 1');
    await conn.execute('ALTER TABLE product_images AUTO_INCREMENT = 1');
    await conn.execute('ALTER TABLE products AUTO_INCREMENT = 1');
    await conn.execute('ALTER TABLE categories AUTO_INCREMENT = 1');

    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');

    // ── Insert categories ──────────────────────────────────────────
    console.log('Inserting categories...');
    const categoryMap = {};
    for (const cat of CATEGORIES) {
      const [result] = await conn.execute(
        'INSERT INTO categories (name, slug, description, image, sortOrder, isActive) VALUES (?, ?, ?, ?, ?, ?)',
        [cat.name, cat.slug, cat.description, cat.image, cat.sortOrder, true]
      );
      categoryMap[cat.slug] = result.insertId;
      console.log(`  Category: ${cat.name} (id: ${result.insertId})`);
    }

    // ── Read scraped products ──────────────────────────────────────
    const rawProducts = JSON.parse(fs.readFileSync(path.join(__dirname, 'scraped-products.json'), 'utf-8'));
    console.log(`\nProcessing ${rawProducts.length} scraped products...`);

    const insertedProducts = [];
    const usedSlugs = new Set();

    for (let i = 0; i < rawProducts.length; i++) {
      const p = rawProducts[i];

      // Clean name
      let name = cleanName(p.name);
      let slug = makeSlug(name);

      // Ensure unique slug
      if (usedSlugs.has(slug)) {
        slug = slug + '-' + (i + 1);
      }
      usedSlugs.add(slug);

      // Classify into category
      const catSlug = classifyProduct(name, p.rawTitle || '', p.description || '');
      const categoryId = categoryMap[catSlug];

      // Parse prices
      let price = parsePrice(p.price);
      let discountPrice = null;

      if (price === 0) {
        // Assign realistic price
        price = 750 + Math.floor(Math.random() * 1750); // Rs 750-2500
      }

      // If comparePrice exists and differs from price, use sale logic
      const compareP = parsePrice(p.comparePrice);
      if (compareP > 0 && compareP === price) {
        // Same price = no discount
        discountPrice = null;
      } else if (compareP > 0 && compareP !== price) {
        // comparePrice is original, price is sale
        if (compareP > price) {
          discountPrice = price;
          price = compareP;
        } else {
          discountPrice = compareP;
        }
      }

      const isBestSeller = i < 8;
      const isFeatured = i >= 4 && i < 12;

      const shortDesc = generateShortDescription(name, catSlug);
      const richDesc = generateRichDescription(name, p.sizes || [], catSlug);

      // Insert product
      const [prodResult] = await conn.execute(
        `INSERT INTO products (name, slug, description, shortDescription, price, discountPrice, categoryId, isActive, isFeatured, isBestSeller)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, slug, richDesc, shortDesc, price, discountPrice, categoryId, true, isFeatured, isBestSeller]
      );
      const productId = prodResult.insertId;
      insertedProducts.push({ productId, name, catSlug });

      // Insert images
      const images = p.downloadedImages || [];
      for (let imgIdx = 0; imgIdx < images.length; imgIdx++) {
        const imgUrl = `/uploads/products/${images[imgIdx]}`;
        await conn.execute(
          'INSERT INTO product_images (productId, url, sortOrder, isPrimary) VALUES (?, ?, ?, ?)',
          [productId, imgUrl, imgIdx, imgIdx === 0]
        );
      }

      // Insert variants
      const sizes = p.sizes || [];
      for (const size of sizes) {
        const stock = 15 + Math.floor(Math.random() * 36); // 15-50
        const sku = `HG-${slug.substring(0, 15).toUpperCase()}-${size}`.replace(/[^A-Z0-9\-]/g, '');
        await conn.execute(
          'INSERT INTO product_variants (productId, size, stock, sku) VALUES (?, ?, ?, ?)',
          [productId, size, stock, sku]
        );
      }

      console.log(`  [${i + 1}/${rawProducts.length}] ${name} → ${catSlug} (Rs ${price}${discountPrice ? ', sale Rs ' + discountPrice : ''})`);
    }

    // ── Insert reviews ─────────────────────────────────────────────
    console.log('\nInserting reviews...');
    for (let r = 0; r < REVIEWS.length; r++) {
      const review = REVIEWS[r];
      // Spread reviews across products
      const targetProduct = insertedProducts[r % insertedProducts.length];
      await conn.execute(
        'INSERT INTO reviews (productId, name, rating, comment, isApproved) VALUES (?, ?, ?, ?, ?)',
        [targetProduct.productId, review.name, review.rating, review.comment, true]
      );
      console.log(`  Review by ${review.name} → ${targetProduct.name}`);
    }

    // ── Summary ────────────────────────────────────────────────────
    const [prodCount] = await conn.execute('SELECT COUNT(*) as cnt FROM products');
    const [imgCount] = await conn.execute('SELECT COUNT(*) as cnt FROM product_images');
    const [varCount] = await conn.execute('SELECT COUNT(*) as cnt FROM product_variants');
    const [revCount] = await conn.execute('SELECT COUNT(*) as cnt FROM reviews');
    const [catCount] = await conn.execute('SELECT COUNT(*) as cnt FROM categories');

    console.log('\n✅ Reseed complete!');
    console.log(`   Categories: ${catCount[0].cnt}`);
    console.log(`   Products:   ${prodCount[0].cnt}`);
    console.log(`   Images:     ${imgCount[0].cnt}`);
    console.log(`   Variants:   ${varCount[0].cnt}`);
    console.log(`   Reviews:    ${revCount[0].cnt}`);

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
