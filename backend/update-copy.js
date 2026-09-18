/**
 * Hidden Glow — Content Update Script
 * Updates CMS pages and product descriptions with warm, conversational copy.
 * Run: node update-copy.js
 * Requires: Node 18+ (uses native fetch), Backend running at localhost:4000
 */

const API = 'http://localhost:4000/api';

// ─── CMS CONTENT ────────────────────────────────────────────────────────────

const cmsUpdates = [
  // ── HOMEPAGE ──
  {
    pageKey: 'homepage',
    sectionKey: 'hero',
    title: 'You Deserve to Feel Amazing — Inside Out',
    content:
      "Life's too short for uncomfortable innerwear. Discover pieces so soft, so perfectly fitted, you'll forget you're wearing them — but you'll never forget how confident they make you feel.",
  },
  {
    pageKey: 'homepage',
    sectionKey: 'hero_cta',
    title: 'Shop the Collection',
    content: '/shop',
  },
  {
    pageKey: 'homepage',
    sectionKey: 'benefits',
    title: 'Why Women Love Hidden Glow',
    content:
      '<p>We get it — finding innerwear that actually fits well, feels soft against your skin, and doesn\'t cost a fortune? It shouldn\'t be this hard. That\'s exactly why we started Hidden Glow.</p>' +
      '<p>Every piece we make goes through one simple test: would we wear this ourselves, every single day? If the answer isn\'t a wholehearted yes, it doesn\'t make the cut.</p>' +
      '<ul>' +
      '<li><strong>Fabrics That Feel Like a Hug</strong> — Buttery-soft cotton blends, cool satin, and delicate lace that\'s gentle on your skin</li>' +
      '<li><strong>Your Perfect Fit, Guaranteed</strong> — Sizes S to XXL, because great innerwear should be for every body</li>' +
      '<li><strong>Made for Pakistani Weather</strong> — Breathable, lightweight, and designed to keep you cool and comfortable all day</li>' +
      '<li><strong>Premium Without the Premium Price</strong> — Beautiful quality you can feel, at prices that actually make sense</li>' +
      '</ul>',
  },
  {
    pageKey: 'homepage',
    sectionKey: 'cta_banner',
    title: 'Your Comfort Glow-Up Starts Here',
    content:
      "Once you try innerwear that's actually made with you in mind — the right fabrics, the right fit, the right feel — there's no going back. Ready to see what you've been missing?",
  },
  {
    pageKey: 'homepage',
    sectionKey: 'trust_badges',
    title: 'Why Choose Us',
    content: JSON.stringify([
      {
        icon: 'truck',
        title: 'Free Delivery',
        text: 'On orders over Rs. 3,000 — straight to your door',
      },
      {
        icon: 'shield',
        title: 'Cash on Delivery',
        text: 'Pay only when your order arrives. Simple.',
      },
      {
        icon: 'refresh',
        title: 'Easy 7-Day Exchange',
        text: "Not the right fit? We'll sort it out, hassle-free",
      },
    ]),
  },

  // ── ABOUT PAGE ──
  {
    pageKey: 'about',
    sectionKey: 'main',
    title: 'Our Story',
    content:
      '<p>Hidden Glow started with a frustration we know you\'ve felt too: why is it so hard to find comfortable, well-made innerwear in Pakistan without paying imported prices?</p>' +
      '<p>We couldn\'t find the answer — so we decided to become it.</p>' +
      '<h2>What We Believe</h2>' +
      '<p>Your innerwear is the first thing you put on every morning. It sets the tone for your entire day. When it fits right and feels soft against your skin, you carry yourself differently — a little taller, a little more confident. That invisible comfort? That\'s your hidden glow.</p>' +
      '<h2>What Makes Us Different</h2>' +
      '<ul>' +
      '<li><strong>Quality You Can Feel</strong> — We\'re obsessed with fabrics. Every material is hand-selected for softness, durability, and breathability</li>' +
      '<li><strong>Designed for Real Life</strong> — Our pieces are made for the woman juggling work, family, and everything in between. Comfort that keeps up with you</li>' +
      '<li><strong>Every Size, Every Shape</strong> — S to XXL, because confidence doesn\'t come in one size</li>' +
      '<li><strong>Your Privacy, Always</strong> — Every order ships in plain, unmarked packaging. Your business is your business</li>' +
      '</ul>' +
      '<p>We\'re not just building a brand — we\'re building a community of women who refuse to settle for less than they deserve. And honestly? You deserve the best.</p>',
  },

  // ── CONTACT PAGE ──
  {
    pageKey: 'contact',
    sectionKey: 'main',
    title: 'Let\'s Talk',
    content:
      '<p>Got a question about sizing? Need help picking the right piece? Or maybe you just want to say hi — whatever it is, we\'d love to hear from you.</p>' +
      '<p>Our team is real people (not bots!) and we typically reply within a few hours. Drop us a message on WhatsApp for the fastest response — we\'re always happy to help you find your perfect fit.</p>',
  },

  // ── PRIVACY POLICY ──
  {
    pageKey: 'privacy',
    sectionKey: 'main',
    title: 'Privacy Policy',
    content:
      '<h2>Your Privacy Is Sacred to Us</h2>' +
      '<p>We know privacy matters — especially when you\'re shopping for innerwear. So here\'s our promise: we only collect what we absolutely need to get your order to your door, and we never share your information with anyone. Period.</p>' +
      '<h2>What We Collect</h2>' +
      '<p>Just the basics: your name, phone number, delivery address, and city. That\'s it. No long forms, no unnecessary questions.</p>' +
      '<h2>How We Use It</h2>' +
      '<ul>' +
      '<li>To process and deliver your order</li>' +
      '<li>To send you order updates (so you know exactly when to expect your package)</li>' +
      '<li>To make our service better for you</li>' +
      '</ul>' +
      '<h2>Discreet Packaging — Always</h2>' +
      '<p>Every single order ships in plain, unmarked packaging. There are no brand names, no product descriptions on the outside. What you order is between you and us.</p>',
  },

  // ── TERMS & CONDITIONS ──
  {
    pageKey: 'terms',
    sectionKey: 'main',
    title: 'Terms & Conditions',
    content:
      '<h2>The Basics</h2>' +
      '<p>By shopping with us at hiddenglow.pk, you\'re agreeing to these terms. We\'ve kept them as simple and fair as possible — no legal jargon, just straightforward stuff.</p>' +
      '<h2>Products & Pricing</h2>' +
      '<p>All prices are listed in Pakistani Rupees (PKR) and include applicable taxes. We do our best to keep prices stable, but they may occasionally change.</p>' +
      '<h2>Orders</h2>' +
      '<p>When you place an order, we\'ll confirm it via SMS or WhatsApp. All orders are subject to stock availability — if something\'s out of stock, we\'ll let you know right away.</p>' +
      '<h2>Payment</h2>' +
      '<p>We accept Cash on Delivery (COD) across Pakistan. You only pay when your order is in your hands — no upfront payments, no surprises.</p>',
  },

  // ── RETURNS & EXCHANGE ──
  {
    pageKey: 'returns',
    sectionKey: 'main',
    title: 'Returns & Exchanges',
    content:
      '<h2>Not the Right Fit? We\'ve Got You</h2>' +
      '<p>We want you to love what you ordered. If something doesn\'t fit or isn\'t quite what you expected, you have 7 days from delivery to request an exchange. No awkward conversations, no runaround.</p>' +
      '<h2>What We Need</h2>' +
      '<p>Items should be unworn, unwashed, and in their original packaging with tags attached. We totally understand — just keep things fresh and we\'ll take care of the rest.</p>' +
      '<h2>How It Works</h2>' +
      '<ol>' +
      '<li>Send us a quick WhatsApp message with your order number</li>' +
      '<li>Tell us what you\'d like to exchange and why (helps us get it right this time!)</li>' +
      '<li>We\'ll arrange a pickup and send your replacement — easy as that</li>' +
      '</ol>',
  },

  // ── SHIPPING POLICY ──
  {
    pageKey: 'shipping',
    sectionKey: 'main',
    title: 'Shipping & Delivery',
    content:
      '<h2>We Deliver Across Pakistan</h2>' +
      '<p>No matter where you are — Lahore, Karachi, Islamabad, or a smaller city — we\'ll get your order to you. And yes, it always arrives in plain, discreet packaging.</p>' +
      '<h2>How Long Does It Take?</h2>' +
      '<ul>' +
      '<li><strong>Major Cities (Lahore, Karachi, Islamabad, Rawalpindi):</strong> 2-3 business days</li>' +
      '<li><strong>Other Cities:</strong> 3-5 business days</li>' +
      '</ul>' +
      '<p>You\'ll get a tracking update so you always know where your order is.</p>' +
      '<h2>Shipping Charges</h2>' +
      '<ul>' +
      '<li><strong>Orders under Rs. 3,000:</strong> Just Rs. 200 flat rate shipping</li>' +
      '<li><strong>Orders over Rs. 3,000:</strong> FREE shipping — on us!</li>' +
      '</ul>',
  },
];

// ─── PRODUCT DESCRIPTIONS ───────────────────────────────────────────────────

const productUpdates = [
  // ── BRAS (IDs 1-5) ──
  {
    id: 1,
    shortDescription:
      'The bra you\'ll reach for every single morning — soft, supportive, and perfectly comfortable.',
    description:
      '<h3>Your New Everyday Favourite</h3>' +
      '<p>You know that feeling when you find the perfect bra and just want to buy it in every colour? This is that bra. Our bestselling Everyday Comfort is made from a premium cotton-spandex blend that feels like a second skin — soft enough for all-day wear, supportive enough that you actually feel put-together.</p>' +
      '<ul>' +
      '<li>Light foam padding that gives you a natural, flattering shape</li>' +
      '<li>Wide cushioned straps — no digging, no sliding</li>' +
      '<li>Breathable cotton-blend fabric, perfect for Pakistani summers</li>' +
      '<li>Seamless cups that disappear under your clothes</li>' +
      '</ul>',
  },
  {
    id: 2,
    shortDescription:
      'Gorgeous floral lace with real support — because you shouldn\'t have to choose between pretty and practical.',
    description:
      '<h3>Beautiful and Supportive? Yes, Both.</h3>' +
      '<p>Who says lace can\'t be comfortable? Our Lace Elegance bra pairs romantic floral lace with a supportive underwire that actually does its job — without the poking and pinching. The lined cups keep everything smooth and the satin-finish straps add that extra touch of luxury you deserve.</p>' +
      '<ul>' +
      '<li>Delicate floral lace overlay that looks stunning</li>' +
      '<li>Supportive underwire you\'ll actually forget is there</li>' +
      '<li>Lined cups for a smooth, confident silhouette</li>' +
      '<li>Satin-finish straps that feel as good as they look</li>' +
      '</ul>',
  },
  {
    id: 3,
    shortDescription:
      'Completely invisible under your clothes — smooth, seamless, and oh-so-comfortable.',
    description:
      '<h3>The One That Disappears</h3>' +
      '<p>If you\'ve ever worried about bra lines showing through your favourite kurti or fitted shirt, this one\'s for you. Our Seamless T-Shirt Bra has molded cups that create a perfectly smooth line — zero bumps, zero ridges, zero stress. Made with breathable microfiber that keeps you cool even on the warmest days.</p>' +
      '<ul>' +
      '<li>Molded cups for absolutely zero visible lines</li>' +
      '<li>Convertible straps — wear them regular, crossed, or halter</li>' +
      '<li>Breathable microfiber that\'s perfect for our weather</li>' +
      '</ul>',
  },
  {
    id: 4,
    shortDescription:
      'A little extra lift, a lot of confidence — in luxurious satin that feels incredible.',
    description:
      '<h3>Hello, Confidence</h3>' +
      '<p>Some days you want that extra oomph — and this bra delivers. Graduated push-up padding gives you a natural-looking lift, while the plunging neckline works beautifully under lower-cut tops. The satin finish? It just makes getting dressed feel like a treat.</p>' +
      '<ul>' +
      '<li>Graduated push-up padding for natural-looking lift</li>' +
      '<li>Plunging neckline — perfect under V-necks and wrap tops</li>' +
      '<li>Luxurious satin finish that feels as premium as it looks</li>' +
      '</ul>',
  },
  {
    id: 5,
    shortDescription:
      'Stay supported through every workout — breathable, moisture-wicking, and made to move with you.',
    description:
      '<h3>Your Workout Partner</h3>' +
      '<p>Whether you\'re doing morning yoga, hitting the gym, or just running errands all day, this bra keeps everything secure and comfortable. The racerback design gives you full range of motion while the moisture-wicking fabric pulls sweat away from your skin — so you stay dry and focused.</p>' +
      '<ul>' +
      '<li>Racerback design for freedom of movement</li>' +
      '<li>Moisture-wicking fabric that keeps you dry</li>' +
      '<li>Removable padding — customise your support</li>' +
      '</ul>',
  },

  // ── PANTIES (IDs 6-10) ──
  {
    id: 6,
    shortDescription:
      'Pure cotton comfort you\'ll want in every colour — breathable, soft, and perfect for every day.',
    description:
      '<h3>The Everyday Essential</h3>' +
      '<p>Sometimes simple is perfect. Our Cotton Essentials Bikini is made from 100% premium cotton that feels incredibly soft and breathes beautifully — especially important in our warm weather. The gentle elastic waistband sits comfortably without digging in, and the classic bikini cut gives you just the right coverage.</p>' +
      '<ul>' +
      '<li>100% premium cotton — gentle on sensitive skin</li>' +
      '<li>Soft elastic waistband that stays put without pinching</li>' +
      '<li>Classic bikini cut with comfortable coverage</li>' +
      '</ul>',
  },
  {
    id: 7,
    shortDescription:
      'A little bit of lace makes every day feel special — pretty meets practical.',
    description:
      '<h3>Everyday With a Touch of Pretty</h3>' +
      '<p>Why should special occasions get all the beautiful underwear? Our Lace Trim Hipster gives you that little confidence boost every single day. The cotton-blend fabric keeps things comfortable and breathable, while the delicate lace trim adds just enough elegance to make you smile.</p>' +
      '<ul>' +
      '<li>Beautiful lace trim that feels soft, never scratchy</li>' +
      '<li>Flattering hipster cut that sits perfectly on your hips</li>' +
      '<li>Cotton-blend fabric for all-day breathable comfort</li>' +
      '</ul>',
  },
  {
    id: 8,
    shortDescription:
      'Zero panty lines, zero fuss — laser-cut for a completely invisible finish.',
    description:
      '<h3>Like Wearing Nothing at All</h3>' +
      '<p>Got a fitted outfit you love but hate visible panty lines? Problem solved. Our Seamless No-Show Thong has laser-cut edges that lie completely flat against your skin — so all anyone sees is a smooth, seamless silhouette. The ultra-soft microfiber feels gentle and moves with you all day.</p>' +
      '<ul>' +
      '<li>Laser-cut edges — absolutely no visible lines</li>' +
      '<li>Ultra-soft microfiber that feels gentle on your skin</li>' +
      '<li>Low-rise design that stays hidden under everything</li>' +
      '</ul>',
  },
  {
    id: 9,
    shortDescription:
      'Three premium cotton briefs at one great price — stock up on everyday comfort.',
    description:
      '<h3>The Smart Essentials Pack</h3>' +
      '<p>When you find underwear this comfortable, you want more than one pair. This pack of three premium cotton briefs gives you full coverage and all-day softness at a price that just makes sense. They\'re the kind of basics you\'ll reach for again and again — reliable, comfortable, and perfectly fitted.</p>' +
      '<ul>' +
      '<li>Pack of 3 — because one is never enough</li>' +
      '<li>Full coverage for ultimate comfort</li>' +
      '<li>100% cotton that\'s breathable and gentle on skin</li>' +
      '</ul>',
  },
  {
    id: 10,
    shortDescription:
      'Extra coverage, zero ride-up — the sporty-comfy underwear you didn\'t know you needed.',
    description:
      '<h3>The No-Ride-Up Champion</h3>' +
      '<p>If you\'ve ever spent your day pulling and adjusting underwear that just won\'t stay put, you need these. Our Boyshort Comfort gives you extra coverage with a sporty cut that stays exactly where it should — through work, errands, workouts, everything. The stretchy cotton blend moves with you, not against you.</p>' +
      '<ul>' +
      '<li>Boyshort cut — more coverage, more comfort</li>' +
      '<li>Stretchy cotton blend that moves with your body</li>' +
      '<li>No ride-up design — we mean it</li>' +
      '</ul>',
  },

  // ── NIGHTWEAR (IDs 11-14) ──
  {
    id: 11,
    shortDescription:
      'Slip into pure luxury — silky satin that makes bedtime the best part of your day.',
    description:
      '<h3>You Deserve This</h3>' +
      '<p>After a long day, you deserve something that makes you feel truly special. Our Silk Satin Nightgown drapes beautifully against your skin — the satin is cool to the touch, incredibly smooth, and has a subtle sheen that makes you feel like royalty. The V-neckline with delicate lace trim adds an elegant finishing touch.</p>' +
      '<ul>' +
      '<li>Premium satin that feels cool and luxurious against your skin</li>' +
      '<li>V-neckline with delicate lace trim</li>' +
      '<li>Knee-length with a flattering side slit</li>' +
      '<li>Adjustable spaghetti straps for your perfect fit</li>' +
      '</ul>',
  },
  {
    id: 12,
    shortDescription:
      'The softest cotton pajamas you\'ll ever own — cozy nights guaranteed.',
    description:
      '<h3>Cozy Is an Understatement</h3>' +
      '<p>These pajamas are the reason you\'ll actually look forward to getting home and changing. The 100% cotton is unbelievably soft — like being wrapped in a cloud. The button-up top is relaxed and breathable, and the matching pants have an elastic waist and pockets (yes, pockets!) for your phone or a late-night snack.</p>' +
      '<ul>' +
      '<li>100% cotton so soft you won\'t believe it</li>' +
      '<li>Relaxed button-up top for easy comfort</li>' +
      '<li>Elastic-waist pants with actual pockets</li>' +
      '</ul>',
  },
  {
    id: 13,
    shortDescription:
      'Romantic lace meets silky satin — for evenings that call for something special.',
    description:
      '<h3>For Those Special Evenings</h3>' +
      '<p>Sometimes you want to feel a little extra beautiful — and this chemise does exactly that. The silky satin body drapes gorgeously, while the lace detailing adds just the right amount of romance. It\'s elegant without trying too hard, and comfortable enough that you\'ll actually want to wear it.</p>' +
      '<ul>' +
      '<li>Satin body with beautiful lace detailing</li>' +
      '<li>Flattering A-line silhouette</li>' +
      '<li>Mid-thigh length — elegant and comfortable</li>' +
      '</ul>',
  },
  {
    id: 14,
    shortDescription:
      'Lightweight cami and shorts for warm nights — stay cool, sleep better.',
    description:
      '<h3>Made for Warm Nights</h3>' +
      '<p>Pakistani summers and heavy sleepwear don\'t mix. This light, breathable set keeps you cool and comfortable all night long. The cami top is soft and relaxed, and the matching shorts have just enough stretch to let you toss and turn without any restrictions. Sweet dreams, guaranteed.</p>' +
      '<ul>' +
      '<li>Breathable cotton-blend designed for our warm weather</li>' +
      '<li>Soft cami top with adjustable straps</li>' +
      '<li>Comfy matching shorts with gentle elastic</li>' +
      '</ul>',
  },

  // ── MATCHING SETS (IDs 15-17) ──
  {
    id: 15,
    shortDescription:
      'Your dream bridal set — exquisite ivory lace for the most beautiful day of your life.',
    description:
      '<h3>Made for Your Special Day</h3>' +
      '<p>Every bride deserves to feel absolutely stunning — from the inside out. Our Bridal Lace Set features an underwire bra with gorgeous ivory lace and a perfectly matching bikini panty. The lace detailing is exquisite, the satin bow accents add a romantic touch, and the push-up padding gives you a beautiful, confident silhouette under your bridal outfit.</p>' +
      '<ul>' +
      '<li>Ivory lace with delicate satin bow details</li>' +
      '<li>Push-up padding for a beautiful silhouette</li>' +
      '<li>Matching underwire bra + lace bikini panty</li>' +
      '</ul>',
  },
  {
    id: 16,
    shortDescription:
      'A perfectly coordinated set for your daily dose of "put together" — comfy and matching.',
    description:
      '<h3>Matching Made Easy</h3>' +
      '<p>There\'s something about wearing a matching set that just makes you feel like you\'ve got your life together — even on the messiest days. This coordinated padded bra and bikini panty set is soft, seamless, and made from a cotton blend that\'s gentle enough for everyday wear. Because comfort and cute aren\'t mutually exclusive.</p>' +
      '<ul>' +
      '<li>Soft cotton-blend fabric for all-day comfort</li>' +
      '<li>Seamless finish — smooth under your clothes</li>' +
      '<li>Padded bra + matching bikini panty included</li>' +
      '</ul>',
  },
  {
    id: 17,
    shortDescription:
      'Sultry wine lace that comes in its own gift box — for nights worth remembering.',
    description:
      '<h3>Make It Unforgettable</h3>' +
      '<p>Date night, anniversary, or just because you feel like it — this set was made for those moments when you want to feel absolutely incredible. The deep wine-coloured floral lace is rich and romantic, the push-up bra gives you a gorgeous shape, and the matching lace thong completes the look. Oh, and it comes in a beautiful gift box — because you deserve the full experience.</p>' +
      '<ul>' +
      '<li>Rich wine/burgundy floral lace</li>' +
      '<li>Push-up bra + matching lace thong</li>' +
      '<li>Comes beautifully packaged in a gift box</li>' +
      '</ul>',
  },

  // ── CAMISOLES (IDs 18-20) ──
  {
    id: 18,
    shortDescription:
      'Smooth, silky, and endlessly versatile — layer it, sleep in it, or wear it on its own.',
    description:
      '<h3>One Piece, Endless Possibilities</h3>' +
      '<p>Our Silk Camisole is one of those pieces that quietly becomes the most worn thing in your wardrobe. Layer it under a blazer for work, wear it to bed for a touch of luxury, or pair it with your favourite shorts on lazy weekends. The premium satin is silky-smooth, the adjustable straps let you customise the fit, and the V-neckline with lace detail adds a little something extra.</p>' +
      '<ul>' +
      '<li>Premium satin that drapes beautifully</li>' +
      '<li>Adjustable straps for your perfect fit</li>' +
      '<li>V-neckline with delicate lace detail</li>' +
      '</ul>',
  },
  {
    id: 19,
    shortDescription:
      'Soft cotton with feminine lace trim — the camisole that does it all.',
    description:
      '<h3>Pretty and Practical</h3>' +
      '<p>Looking for a cami that\'s as pretty as it is comfortable? This one\'s got soft cotton that breathes beautifully, feminine lace trim that makes you feel put-together, and adjustable straps so you get the exact fit you want. Whether you\'re layering it under a shirt or wearing it solo at home, it just works.</p>' +
      '<ul>' +
      '<li>Soft cotton body that breathes all day</li>' +
      '<li>Feminine lace trim — pretty without being fussy</li>' +
      '<li>Adjustable straps for a customised fit</li>' +
      '</ul>',
  },
  {
    id: 20,
    shortDescription:
      'The layering basic you\'ll wear on repeat — stretchy, soft, and always comfortable.',
    description:
      '<h3>The One You\'ll Buy in Every Colour</h3>' +
      '<p>Every wardrobe needs a great layering tank — and this is it. Made from stretchy cotton blend, it fits just right (not too tight, not too loose), and the scoop neckline works under literally everything. The wide straps are comfortable enough for all-day wear and provide just enough coverage. It\'s simple, it\'s comfortable, and once you try it, you\'ll wonder how you lived without it.</p>' +
      '<ul>' +
      '<li>Stretchy cotton blend that moves with you</li>' +
      '<li>Scoop neckline — perfect for layering</li>' +
      '<li>Wide straps for comfort and coverage</li>' +
      '</ul>',
  },

  // ── SHAPEWEAR (IDs 21-23) ──
  {
    id: 21,
    shortDescription:
      'Smooth everything from bust to thigh — like a confidence boost you can wear.',
    description:
      '<h3>Your Secret Confidence Layer</h3>' +
      '<p>We designed this bodysuit shaper for real life — not just special occasions. It smooths from your bust to your thighs with medium compression that shapes without squeezing the life out of you. The seamless construction means zero visible lines under your clothes, and the open-crotch design means you don\'t have to take the whole thing off for bathroom breaks. Practical <em>and</em> flattering? That\'s what we\'re about.</p>' +
      '<ul>' +
      '<li>Full-body smoothing from bust to mid-thigh</li>' +
      '<li>Seamless construction — invisible under clothes</li>' +
      '<li>Open-crotch design for practical comfort</li>' +
      '<li>Medium compression — shapes you, doesn\'t squeeze you</li>' +
      '</ul>',
  },
  {
    id: 22,
    shortDescription:
      'Targeted tummy support that actually stays in place — comfortable enough for all day.',
    description:
      '<h3>Confident, All Day Long</h3>' +
      '<p>Whether it\'s a work event, an Eid gathering, or just a day when you want a smoother silhouette, this high-waist tummy shaper has you covered. The silicone waistband keeps it firmly in place (no rolling down!), and the seamless finish means you can wear it under anything — lawn suits, fitted kameez, Western outfits, everything.</p>' +
      '<ul>' +
      '<li>High-waist design for targeted tummy support</li>' +
      '<li>Silicone waistband — stays in place all day, guaranteed</li>' +
      '<li>Seamless finish that disappears under your outfit</li>' +
      '</ul>',
  },
  {
    id: 23,
    shortDescription:
      'Smooth thighs, flat tummy, zero chafing — the shorts that make everything look better.',
    description:
      '<h3>Your Under-Everything Solution</h3>' +
      '<p>These shaper shorts do triple duty: they smooth your tummy, slim your hips and thighs, and prevent that annoying inner-thigh chafing that nobody talks about but everyone deals with. The mid-thigh length stays hidden under dresses and longer kameez, and the fabric is comfortable enough that you\'ll honestly forget you\'re wearing shapewear at all.</p>' +
      '<ul>' +
      '<li>Tummy, hip, and thigh smoothing in one piece</li>' +
      '<li>Mid-thigh length — hidden under most outfits</li>' +
      '<li>Prevents chafing — a lifesaver in warm weather</li>' +
      '</ul>',
  },
];

// ─── SCRIPT LOGIC ───────────────────────────────────────────────────────────

async function login() {
  console.log('Logging in...');
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@hiddenglow.pk',
      password: 'Admin@123',
    }),
  });
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  console.log('Logged in successfully.\n');
  return data.accessToken || data.access_token;
}

async function updateCmsPages(token) {
  console.log('── Updating CMS Pages ──\n');
  let success = 0;
  let failed = 0;

  for (const item of cmsUpdates) {
    const url = `${API}/cms/page/${item.pageKey}/${item.sectionKey}`;
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: item.title, content: item.content }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.log(`  FAIL  ${item.pageKey}/${item.sectionKey} — ${res.status}: ${errText}`);
        failed++;
      } else {
        console.log(`  OK    ${item.pageKey}/${item.sectionKey} — "${item.title}"`);
        success++;
      }
    } catch (err) {
      console.log(`  ERROR ${item.pageKey}/${item.sectionKey} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nCMS: ${success} updated, ${failed} failed.\n`);
}

async function updateProducts(token) {
  console.log('── Updating Product Descriptions ──\n');
  let success = 0;
  let failed = 0;

  for (const item of productUpdates) {
    const url = `${API}/products/${item.id}`;
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shortDescription: item.shortDescription,
          description: item.description,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.log(`  FAIL  Product #${item.id} — ${res.status}: ${errText}`);
        failed++;
      } else {
        const data = await res.json();
        console.log(`  OK    Product #${item.id} — ${data.name || '(updated)'}`);
        success++;
      }
    } catch (err) {
      console.log(`  ERROR Product #${item.id} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nProducts: ${success} updated, ${failed} failed.\n`);
}

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Hidden Glow — Content Update Script  ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    const token = await login();
    await updateCmsPages(token);
    await updateProducts(token);
    console.log('Done! All content has been updated.');
  } catch (err) {
    console.error('Script failed:', err.message);
    process.exit(1);
  }
}

main();
