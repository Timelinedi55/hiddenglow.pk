const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, 'uploads');
const productsDir = path.join(uploadsDir, 'products');
const categoriesDir = path.join(uploadsDir, 'categories');

fs.mkdirSync(productsDir, { recursive: true });
fs.mkdirSync(categoriesDir, { recursive: true });

const colors = {
  beige: '#F5E9E2',
  blush: '#E8CFC5',
  cream: '#FFF8F5',
  dark: '#2B2B2B',
  cocoa: '#8B6F68',
  rose: '#D9B2AA',
  pearl: '#FBF2EE',
  wine: '#7D4C54',
  satin: '#EEDFD7',
  sage: '#B9B39D',
  champagne: '#E9D9C7',
  taupe: '#B08D86',
  plum: '#8A6672',
  softWhite: '#FCFAF8',
};

const categorySpecs = [
  { file: 'bras.jpg', label: 'Bras', subtitle: 'Supportive silhouettes', type: 'bra', palette: [colors.pearl, colors.blush, colors.cocoa] },
  { file: 'panties.jpg', label: 'Panties', subtitle: 'Soft essentials', type: 'panty', palette: [colors.softWhite, colors.satin, colors.taupe] },
  { file: 'nightwear.jpg', label: 'Nightwear', subtitle: 'Evening softness', type: 'nightwear', palette: [colors.cream, colors.plum, colors.blush] },
  { file: 'sets.jpg', label: 'Matching Sets', subtitle: 'Styled together', type: 'set', palette: [colors.pearl, colors.rose, colors.wine] },
  { file: 'camisoles.jpg', label: 'Camisoles', subtitle: 'Layering elegance', type: 'camisole', palette: [colors.softWhite, colors.champagne, colors.cocoa] },
  { file: 'shapewear.jpg', label: 'Shapewear', subtitle: 'Smooth foundations', type: 'shapewear', palette: [colors.pearl, colors.sage, colors.dark] },
];

const productSpecs = [
  { prefix: 'everyday-comfort-bra', count: 3, title: 'Everyday Comfort', subtitle: 'Padded Bra', type: 'bra', palette: [colors.pearl, colors.blush, colors.cocoa], badges: ['Soft hold', 'Daily fit', 'Smooth cups'] },
  { prefix: 'lace-elegance-bra', count: 3, title: 'Lace Elegance', subtitle: 'Underwire Bra', type: 'bra', palette: [colors.softWhite, colors.rose, colors.wine], badges: ['Lace touch', 'Lifted fit', 'Signature finish'] },
  { prefix: 'seamless-tshirt-bra', count: 2, title: 'Seamless T-Shirt', subtitle: 'Bra', type: 'bra', palette: [colors.cream, colors.champagne, colors.cocoa], badges: ['No lines', 'Light support', 'Second skin'] },
  { prefix: 'pushup-luxe-bra', count: 3, title: 'Push-Up Luxe', subtitle: 'Bra', type: 'bra', palette: [colors.pearl, colors.blush, colors.dark], badges: ['Lifted shape', 'Plunge fit', 'Soft satin'] },
  { prefix: 'sports-active-bra', count: 2, title: 'Sports Active', subtitle: 'Bra', type: 'bra', palette: [colors.cream, colors.sage, colors.dark], badges: ['Move easy', 'Secure fit', 'Breathable'] },

  { prefix: 'cotton-essentials-bikini', count: 2, title: 'Cotton Essentials', subtitle: 'Bikini', type: 'panty', palette: [colors.softWhite, colors.blush, colors.taupe], badges: ['Pure cotton', 'Daily staple', 'Soft stretch'] },
  { prefix: 'lace-trim-hipster', count: 2, title: 'Lace Trim', subtitle: 'Hipster', type: 'panty', palette: [colors.pearl, colors.rose, colors.cocoa], badges: ['Lace edge', 'Mid rise', 'Comfort fit'] },
  { prefix: 'seamless-thong', count: 2, title: 'Seamless No-Show', subtitle: 'Thong', type: 'panty', palette: [colors.cream, colors.champagne, colors.dark], badges: ['No show', 'Barely there', 'Smooth edge'] },
  { prefix: 'cotton-briefs-pack', count: 2, title: 'Cotton Briefs', subtitle: 'Pack of 3', type: 'panty', palette: [colors.softWhite, colors.satin, colors.taupe], badges: ['3-pack', 'Full comfort', 'Everyday wear'] },
  { prefix: 'boyshort-comfort', count: 2, title: 'Boyshort Comfort', subtitle: 'Short', type: 'panty', palette: [colors.pearl, colors.sage, colors.dark], badges: ['Extra cover', 'Stay-put', 'Soft waist'] },

  { prefix: 'silk-satin-nightgown', count: 3, title: 'Silk Satin', subtitle: 'Nightgown', type: 'nightwear', palette: [colors.softWhite, colors.plum, colors.blush], badges: ['Fluid drape', 'Evening soft', 'Elegant line'] },
  { prefix: 'cotton-pajama-set', count: 2, title: 'Cotton Pajama', subtitle: 'Set', type: 'nightwear', palette: [colors.cream, colors.sage, colors.dark], badges: ['Relaxed set', 'Lightweight', 'Sleep easy'] },
  { prefix: 'lace-chemise', count: 3, title: 'Lace Trim', subtitle: 'Chemise', type: 'nightwear', palette: [colors.pearl, colors.rose, colors.wine], badges: ['Soft shine', 'Lace trim', 'Evening edit'] },
  { prefix: 'sleep-shorts-set', count: 2, title: 'Sleep Shorts', subtitle: 'Set', type: 'nightwear', palette: [colors.softWhite, colors.champagne, colors.cocoa], badges: ['Cool nights', 'Soft handfeel', 'Easy fit'] },

  { prefix: 'bridal-lace-set', count: 3, title: 'Bridal Lace', subtitle: 'Set', type: 'set', palette: [colors.softWhite, colors.champagne, colors.taupe], badges: ['Special edit', 'Lace detail', 'Gift ready'] },
  { prefix: 'everyday-matching-set', count: 2, title: 'Everyday Matching', subtitle: 'Set', type: 'set', palette: [colors.pearl, colors.blush, colors.dark], badges: ['Coordinated', 'Daily wear', 'Soft lift'] },
  { prefix: 'date-night-set', count: 3, title: 'Date Night', subtitle: 'Set', type: 'set', palette: [colors.pearl, colors.wine, colors.dark], badges: ['Bold lace', 'Statement fit', 'Evening edit'] },

  { prefix: 'silk-camisole', count: 2, title: 'Silk', subtitle: 'Camisole', type: 'camisole', palette: [colors.softWhite, colors.champagne, colors.cocoa], badges: ['Silky feel', 'Layer-ready', 'Fine straps'] },
  { prefix: 'lace-trim-cami', count: 2, title: 'Lace Trim', subtitle: 'Cami', type: 'camisole', palette: [colors.pearl, colors.rose, colors.dark], badges: ['Lace edge', 'Soft layer', 'Easy fit'] },
  { prefix: 'layering-tank', count: 2, title: 'Everyday Layering', subtitle: 'Tank', type: 'camisole', palette: [colors.softWhite, colors.beige, colors.taupe], badges: ['Core staple', 'Stretch cotton', 'Smooth fit'] },

  { prefix: 'bodysuit-shaper', count: 2, title: 'Seamless Bodysuit', subtitle: 'Shaper', type: 'shapewear', palette: [colors.pearl, colors.sage, colors.dark], badges: ['Sculpting', 'Smooth finish', 'All-day hold'] },
  { prefix: 'high-waist-shaper', count: 2, title: 'High Waist', subtitle: 'Tummy Shaper', type: 'shapewear', palette: [colors.softWhite, colors.champagne, colors.dark], badges: ['Mid control', 'Waist hold', 'Invisible edge'] },
  { prefix: 'thigh-shaper-shorts', count: 2, title: 'Thigh Shaper', subtitle: 'Shorts', type: 'shapewear', palette: [colors.pearl, colors.rose, colors.dark], badges: ['Smooth line', 'Anti-chafe', 'Light compression'] },
];

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function glow(x, y, radius, color, opacity) {
  return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" opacity="${opacity}" />`;
}

function badge(x, y, label, bg, fg) {
  return `
    <g transform="translate(${x}, ${y})">
      <rect width="164" height="42" rx="21" fill="${bg}" opacity="0.94" />
      <text x="82" y="27" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="${fg}" letter-spacing="1.5">${escapeXml(label.toUpperCase())}</text>
    </g>
  `;
}

function backdrop(width, height, palette, variant) {
  const [base, accent, detail] = palette;
  const offset = variant * 38;

  return `
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${base}" />
        <stop offset="50%" stop-color="${accent}" />
        <stop offset="100%" stop-color="${base}" />
      </linearGradient>
      <linearGradient id="panel" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.86)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0.28)" />
      </linearGradient>
      <pattern id="grain" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M0 24 Q24 ${12 + offset % 10} 48 24" stroke="${detail}" stroke-opacity="0.07" stroke-width="1.2" fill="none" />
      </pattern>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)" />
    ${glow(width * 0.2, height * 0.3, width * 0.28, '#FFFFFF', 0.32)}
    ${glow(width * 0.82, height * 0.18, width * 0.22, accent, 0.18)}
    ${glow(width * 0.78, height * 0.76, width * 0.27, '#FFFFFF', 0.16)}
    <rect width="${width}" height="${height}" fill="url(#grain)" />
    <path d="M-40 ${height * 0.72} C ${width * 0.18} ${height * 0.53}, ${width * 0.38} ${height * 0.94}, ${width * 0.63} ${height * 0.72} S ${width * 1.08} ${height * 0.44}, ${width + 40} ${height * 0.62} L ${width + 40} ${height + 40} L -40 ${height + 40} Z" fill="#FFFFFF" opacity="0.24" />
  `;
}

function garment(type, palette, variant) {
  const [, accent, detail] = palette;
  const stroke = detail;
  const fill = accent;
  const secondary = '#FFFFFF';
  const shift = variant * 10;

  if (type === 'bra') {
    return `
      <g transform="translate(280, 250)">
        <path d="M124 24 C96 78 88 164 104 252" stroke="${stroke}" stroke-width="16" stroke-linecap="round" fill="none" opacity="0.9" />
        <path d="M356 24 C384 78 392 164 376 252" stroke="${stroke}" stroke-width="16" stroke-linecap="round" fill="none" opacity="0.9" />
        <path d="M128 182 C86 176 42 210 34 276 C120 310 200 292 246 210 C210 186 170 178 128 182 Z" fill="${fill}" opacity="0.92" />
        <path d="M352 182 C394 176 438 210 446 276 C360 310 280 292 234 210 C270 186 310 178 352 182 Z" fill="${fill}" opacity="0.92" />
        <path d="M182 ${220 + shift} C226 264 254 264 298 ${220 + shift} C280 308 246 336 240 372 C232 338 198 308 182 ${220 + shift} Z" fill="${secondary}" opacity="0.55" />
        <rect x="42" y="260" width="396" height="58" rx="28" fill="${stroke}" opacity="0.82" />
        <path d="M160 180 C152 226 152 262 182 314" stroke="${secondary}" stroke-opacity="0.36" stroke-width="8" fill="none" stroke-linecap="round" />
        <path d="M320 180 C328 226 328 262 298 314" stroke="${secondary}" stroke-opacity="0.36" stroke-width="8" fill="none" stroke-linecap="round" />
      </g>
    `;
  }

  if (type === 'panty') {
    return `
      <g transform="translate(260, 340)">
        <path d="M70 44 L410 44 L452 284 L340 338 L240 250 L140 338 L28 284 Z" fill="${fill}" opacity="0.92" />
        <path d="M70 44 C164 92 318 92 410 44" stroke="${stroke}" stroke-width="18" fill="none" stroke-linecap="round" />
        <path d="M164 338 C178 250 196 204 240 158 C284 204 302 250 316 338" fill="${secondary}" opacity="0.46" />
        <path d="M108 78 C154 106 194 114 240 116 C286 114 326 106 372 78" stroke="${secondary}" stroke-opacity="0.4" stroke-width="10" fill="none" stroke-linecap="round" />
      </g>
    `;
  }

  if (type === 'nightwear') {
    return `
      <g transform="translate(280, 180)">
        <path d="M180 30 C154 74 140 126 138 192 L112 240 L158 272 L144 524 C206 560 274 560 336 524 L322 272 L368 240 L342 192 C340 126 326 74 300 30 L240 78 Z" fill="${fill}" opacity="0.92" />
        <path d="M180 30 L240 78 L300 30" stroke="${stroke}" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M176 210 C214 244 266 244 304 210" stroke="${secondary}" stroke-opacity="0.45" stroke-width="10" fill="none" stroke-linecap="round" />
        <path d="M176 314 C214 348 266 348 304 314" stroke="${secondary}" stroke-opacity="0.3" stroke-width="8" fill="none" stroke-linecap="round" />
        <path d="M220 78 L196 530" stroke="${secondary}" stroke-opacity="0.28" stroke-width="8" />
        <path d="M260 78 L284 530" stroke="${secondary}" stroke-opacity="0.28" stroke-width="8" />
      </g>
    `;
  }

  if (type === 'set') {
    return `
      <g transform="translate(248, 216)">
        <path d="M146 0 C120 46 112 116 128 194" stroke="${stroke}" stroke-width="14" stroke-linecap="round" fill="none" opacity="0.9" />
        <path d="M338 0 C364 46 372 116 356 194" stroke="${stroke}" stroke-width="14" stroke-linecap="round" fill="none" opacity="0.9" />
        <path d="M144 126 C108 120 70 150 64 214 C138 242 204 230 242 166 C212 138 178 122 144 126 Z" fill="${fill}" opacity="0.92" />
        <path d="M340 126 C376 120 414 150 420 214 C346 242 280 230 242 166 C272 138 306 122 340 126 Z" fill="${fill}" opacity="0.92" />
        <rect x="70" y="202" width="344" height="50" rx="25" fill="${stroke}" opacity="0.82" />
        <path d="M108 340 L376 340 L410 520 L326 566 L242 492 L158 566 L74 520 Z" fill="${fill}" opacity="0.86" />
        <path d="M108 340 C182 382 302 382 376 340" stroke="${stroke}" stroke-width="16" fill="none" stroke-linecap="round" />
        <path d="M188 566 C198 494 214 446 242 406 C270 446 286 494 296 566" fill="${secondary}" opacity="0.34" />
      </g>
    `;
  }

  if (type === 'camisole') {
    return `
      <g transform="translate(300, 190)">
        <path d="M160 0 C136 54 128 92 128 156 L94 510 C144 542 194 556 244 556 C294 556 344 542 394 510 L360 156 C360 92 352 54 328 0 L244 56 Z" fill="${fill}" opacity="0.92" />
        <path d="M160 0 L244 56 L328 0" stroke="${stroke}" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M170 196 C218 230 270 230 318 196" stroke="${secondary}" stroke-opacity="0.38" stroke-width="10" fill="none" stroke-linecap="round" />
        <path d="M144 352 C208 388 280 388 344 352" stroke="${secondary}" stroke-opacity="0.22" stroke-width="8" fill="none" stroke-linecap="round" />
      </g>
    `;
  }

  return `
    <g transform="translate(290, 180)">
      <path d="M228 0 C182 48 156 110 150 184 L140 360 C144 474 180 556 244 612 C308 556 344 474 348 360 L338 184 C332 110 306 48 260 0 Z" fill="${fill}" opacity="0.92" />
      <path d="M228 0 C210 88 210 172 244 254 C278 172 278 88 260 0" fill="${secondary}" opacity="0.38" />
      <path d="M150 184 C186 216 216 230 244 230 C272 230 302 216 338 184" stroke="${stroke}" stroke-width="18" fill="none" stroke-linecap="round" />
      <path d="M168 324 C206 362 230 382 244 420 C258 382 282 362 320 324" stroke="${secondary}" stroke-opacity="0.34" stroke-width="12" fill="none" stroke-linecap="round" />
    </g>
  `;
}

function editorialCopy(title, subtitle, palette, variant) {
  const [, accent, detail] = palette;
  const label = variant === 0 ? 'editor pick' : variant === 1 ? 'signature fit' : 'new season';
  return `
    <g transform="translate(92, 1040)">
      <text x="0" y="0" font-family="Arial, sans-serif" font-size="18" fill="${detail}" letter-spacing="4">HIDDEN GLOW</text>
      <text x="0" y="78" font-family="Georgia, serif" font-size="76" fill="${colors.dark}">${escapeXml(title)}</text>
      <text x="0" y="138" font-family="Arial, sans-serif" font-size="28" fill="${detail}" letter-spacing="2">${escapeXml(subtitle.toUpperCase())}</text>
      <line x1="0" y1="176" x2="280" y2="176" stroke="${accent}" stroke-width="4" stroke-linecap="round" />
      <text x="0" y="224" font-family="Arial, sans-serif" font-size="22" fill="${detail}">Designed for comfort, confidence, and a polished everyday feel.</text>
      <text x="0" y="262" font-family="Arial, sans-serif" font-size="18" fill="${detail}" opacity="0.82">${escapeXml(label.toUpperCase())}</text>
    </g>
  `;
}

function buildProductSvg(spec, variant) {
  const width = 1200;
  const height = 1500;
  const [, , detail] = spec.palette;
  const art = garment(spec.type, spec.palette, variant);
  const badgeSet = [
    badge(82, 90, spec.badges[variant % spec.badges.length], colors.dark, colors.softWhite),
    badge(256, 90, spec.badges[(variant + 1) % spec.badges.length], '#FFFFFF', detail),
  ].join('');

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${backdrop(width, height, spec.palette, variant)}
      <rect x="72" y="72" width="1056" height="1356" rx="56" fill="url(#panel)" opacity="0.66" />
      ${badgeSet}
      ${art}
      <ellipse cx="600" cy="1180" rx="250" ry="72" fill="${detail}" opacity="0.08" />
      ${editorialCopy(spec.title, spec.subtitle, spec.palette, variant)}
      <text x="1060" y="1380" text-anchor="end" font-family="Arial, sans-serif" font-size="18" fill="${detail}" letter-spacing="3">${escapeXml(`0${variant + 1}`)}</text>
      <text x="1060" y="1410" text-anchor="end" font-family="Arial, sans-serif" font-size="18" fill="${detail}" opacity="0.72">PAKISTAN EDIT</text>
    </svg>
  `;
}

function buildCategorySvg(spec) {
  const width = 1200;
  const height = 1500;
  const art = garment(spec.type, spec.palette, 0);
  const [, accent, detail] = spec.palette;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${backdrop(width, height, spec.palette, 0)}
      <rect x="80" y="80" width="1040" height="1340" rx="58" fill="url(#panel)" opacity="0.7" />
      ${badge(80, 88, 'collection', colors.dark, colors.softWhite)}
      <g transform="scale(1.05) translate(24, -10)">${art}</g>
      <g transform="translate(96, 1112)">
        <text x="0" y="0" font-family="Arial, sans-serif" font-size="19" fill="${detail}" letter-spacing="4">SHOP THE EDIT</text>
        <text x="0" y="86" font-family="Georgia, serif" font-size="88" fill="${colors.dark}">${escapeXml(spec.label)}</text>
        <text x="0" y="146" font-family="Arial, sans-serif" font-size="30" fill="${detail}">${escapeXml(spec.subtitle)}</text>
        <line x1="0" y1="186" x2="230" y2="186" stroke="${accent}" stroke-width="4" stroke-linecap="round" />
        <text x="0" y="230" font-family="Arial, sans-serif" font-size="22" fill="${detail}">Soft structure, premium finishes, and comfort-led essentials.</text>
      </g>
    </svg>
  `;
}

function buildHeroSvg() {
  const width = 1600;
  const height = 1040;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${backdrop(width, height, [colors.softWhite, colors.blush, colors.cocoa], 1)}
      <rect x="68" y="68" width="1464" height="904" rx="64" fill="url(#panel)" opacity="0.62" />
      <g transform="translate(920, 120)">
        <ellipse cx="230" cy="740" rx="210" ry="52" fill="${colors.dark}" opacity="0.09" />
        ${garment('nightwear', [colors.pearl, colors.rose, colors.wine], 1)}
      </g>
      <g transform="translate(120, 224)">
        <text x="0" y="0" font-family="Arial, sans-serif" font-size="22" fill="${colors.cocoa}" letter-spacing="6">PREMIUM INNERWEAR FOR PAKISTAN</text>
        <text x="0" y="120" font-family="Georgia, serif" font-size="112" fill="${colors.dark}">Feel The Glow</text>
        <text x="0" y="236" font-family="Georgia, serif" font-size="112" fill="${colors.dark}">Within</text>
        <text x="0" y="320" font-family="Arial, sans-serif" font-size="29" fill="${colors.cocoa}">Comfort-first bras, elevated nightwear, discreet delivery,</text>
        <text x="0" y="366" font-family="Arial, sans-serif" font-size="29" fill="${colors.cocoa}">and a premium edit designed for the modern woman.</text>
        ${badge(0, 390, 'soft fabrics', colors.dark, colors.softWhite)}
        ${badge(176, 390, 'discreet delivery', '#FFFFFF', colors.cocoa)}
        ${badge(402, 390, 'cash on delivery', '#FFFFFF', colors.cocoa)}
        <text x="0" y="548" font-family="Arial, sans-serif" font-size="24" fill="${colors.cocoa}">Confidence starts from the first layer.</text>
      </g>
    </svg>
  `;
}

async function writeJpeg(filePath, svg, width, height) {
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(filePath);
  console.log(`Created ${path.relative(__dirname, filePath)}`);
}

async function main() {
  for (const category of categorySpecs) {
    const svg = buildCategorySvg(category);
    await writeJpeg(path.join(categoriesDir, category.file), svg, 1200, 1500);
  }

  for (const product of productSpecs) {
    for (let index = 0; index < product.count; index += 1) {
      const svg = buildProductSvg(product, index);
      await writeJpeg(path.join(productsDir, `${product.prefix}-${index + 1}.jpg`), svg, 1200, 1500);
    }
  }

  await writeJpeg(path.join(productsDir, 'hero-banner.jpg'), buildHeroSvg(), 1600, 1040);
  console.log('All Hidden Glow artwork regenerated.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
