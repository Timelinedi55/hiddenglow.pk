import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  AdminUser, CmsContent, SiteSetting, Faq,
  Category, Product, ProductImage, ProductVariant, Review,
} from '../entities';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(AdminUser) private adminRepo: Repository<AdminUser>,
    @InjectRepository(CmsContent) private cmsRepo: Repository<CmsContent>,
    @InjectRepository(SiteSetting) private settingRepo: Repository<SiteSetting>,
    @InjectRepository(Faq) private faqRepo: Repository<Faq>,
    @InjectRepository(Category) private catRepo: Repository<Category>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ProductImage) private imageRepo: Repository<ProductImage>,
    @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
    await this.seedSettings();
    await this.seedCms();
    await this.seedFaqs();
    await this.seedCategories();
    await this.seedProducts();
    await this.seedReviews();
  }

  private async seedAdmin() {
    const count = await this.adminRepo.count();
    if (count > 0) return;
    const password = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123', 10);
    await this.adminRepo.save(
      this.adminRepo.create({
        email: process.env.ADMIN_DEFAULT_EMAIL || 'admin@hiddenglow.pk',
        name: 'Admin',
        password,
      }),
    );
    console.log('✓ Admin created');
  }

  private async seedSettings() {
    const count = await this.settingRepo.count();
    if (count > 0) return;
    const defaults: Record<string, string> = {
      site_name: 'Hidden Glow',
      tagline: 'Premium Innerwear for the Modern Woman',
      logo: '',
      phone: '+92 300 1234567',
      email: 'hello@hiddenglow.pk',
      address: 'Lahore, Pakistan',
      whatsapp: '+92 300 1234567',
      instagram: 'https://instagram.com/hiddenglow.pk',
      facebook: 'https://facebook.com/hiddenglow.pk',
      shipping_fee: '200',
      free_shipping_threshold: '3000',
      meta_pixel: '',
      google_analytics: '',
      google_ads: '',
      custom_scripts_head: '',
      custom_scripts_body: '',
      footer_text: '© 2026 Hidden Glow. All rights reserved.',
      footer_about: 'Hidden Glow is Pakistan\'s premium women\'s innerwear brand, offering comfort, confidence, and elegance in every piece.',
    };
    for (const [key, value] of Object.entries(defaults)) {
      await this.settingRepo.save(this.settingRepo.create({ settingKey: key, settingValue: value }));
    }
    console.log('✓ Settings created');
  }

  private async seedCms() {
    const count = await this.cmsRepo.count();
    if (count > 0) return;
    const pages = [
      { pageKey: 'homepage', sectionKey: 'hero', title: 'Feel the Glow Within', content: 'Premium innerwear designed for comfort, confidence, and everyday elegance. Discover pieces crafted for the modern Pakistani woman.' },
      { pageKey: 'homepage', sectionKey: 'hero_cta', title: 'Shop Collection', content: '/shop' },
      { pageKey: 'homepage', sectionKey: 'hero_image', title: 'Hero Image', content: '/uploads/products/hero-banner.jpg' },
      { pageKey: 'homepage', sectionKey: 'trust_badges', title: 'Why Choose Us', content: JSON.stringify([
        { icon: 'truck', title: 'Free Delivery', text: 'On orders above Rs. 3,000' },
        { icon: 'shield', title: 'Cash on Delivery', text: 'Pay when you receive' },
        { icon: 'refresh', title: 'Easy Exchange', text: '7-day exchange policy' },
      ]) },
      { pageKey: 'homepage', sectionKey: 'benefits', title: 'Why Hidden Glow?', content: '<p>At Hidden Glow, we believe innerwear is the foundation of confidence. Our collections are designed with meticulous care — using ultra-soft fabrics, breathable materials, and flattering silhouettes that celebrate every body type.</p><ul><li><strong>Premium Quality Fabrics</strong> — Soft cotton blends, silk satin, and delicate lace</li><li><strong>Perfect Fit Guarantee</strong> — Sizes from S to XXL, crafted to flatter every shape</li><li><strong>All-Day Comfort</strong> — Breathable, lightweight, and designed for Pakistani weather</li><li><strong>Affordable Luxury</strong> — Premium quality at prices that make sense</li></ul>' },
      { pageKey: 'homepage', sectionKey: 'cta_banner', title: 'Confidence Starts From Within', content: 'Discover our latest collection of premium innerwear, thoughtfully designed for the modern Pakistani woman.' },
      { pageKey: 'about', sectionKey: 'main', title: 'Our Story', content: '<p>Hidden Glow was born from a simple belief: every Pakistani woman deserves innerwear that makes her feel confident, comfortable, and beautiful — without breaking the bank.</p><h2>Our Mission</h2><p>To empower women through comfort and confidence. We design each piece with care, using premium materials that feel as good as they look.</p><h2>What Sets Us Apart</h2><ul><li><strong>Quality First</strong> — We never compromise on fabric quality or construction</li><li><strong>Designed for You</strong> — Every piece is designed with the Pakistani woman in mind</li><li><strong>Inclusive Sizing</strong> — From S to XXL, because beauty comes in every size</li><li><strong>Discreet Packaging</strong> — Your privacy is our priority</li></ul>' },
      { pageKey: 'contact', sectionKey: 'main', title: 'Get in Touch', content: '<p>We love hearing from our customers! Whether you need help choosing the right size, have a question about your order, or just want to share feedback — we\'re here for you.</p>' },
      { pageKey: 'privacy', sectionKey: 'main', title: 'Privacy Policy', content: '<h2>Your Privacy Matters</h2><p>At Hidden Glow, we understand the importance of privacy. We collect only what\'s necessary to process your orders.</p><h2>Information We Collect</h2><p>Name, phone number, delivery address, and city.</p><h2>How We Use Your Information</h2><ul><li>To process and deliver your orders</li><li>To communicate order updates</li><li>To improve our services</li></ul><h2>Discreet Packaging</h2><p>All orders are shipped in plain, unmarked packaging.</p>' },
      { pageKey: 'terms', sectionKey: 'main', title: 'Terms & Conditions', content: '<h2>General Terms</h2><p>By using hiddenglow.pk, you agree to these terms.</p><h2>Products & Pricing</h2><p>All prices are in PKR and include applicable taxes. Prices may change without notice.</p><h2>Orders</h2><p>All orders are subject to availability.</p><h2>Payment</h2><p>We accept Cash on Delivery (COD) only.</p>' },
      { pageKey: 'returns', sectionKey: 'main', title: 'Return & Exchange Policy', content: '<h2>Exchange Policy</h2><p>7-day exchange from delivery date. Items must be unworn, unwashed, in original packaging with tags.</p><h2>How to Request</h2><ol><li>Contact us via WhatsApp</li><li>Provide order number and reason</li><li>We\'ll arrange pickup and send replacement</li></ol>' },
      { pageKey: 'shipping', sectionKey: 'main', title: 'Shipping Policy', content: '<h2>Nationwide Delivery</h2><p>We deliver across Pakistan.</p><h2>Delivery Time</h2><ul><li>Major Cities: 2-3 business days</li><li>Other Cities: 3-5 business days</li></ul><h2>Shipping Charges</h2><ul><li>Under Rs. 3,000: Rs. 200 flat rate</li><li>Above Rs. 3,000: FREE shipping</li></ul>' },
    ];
    for (const page of pages) {
      await this.cmsRepo.save(this.cmsRepo.create(page));
    }
    console.log('✓ CMS content created');
  }

  private async seedFaqs() {
    const count = await this.faqRepo.count();
    if (count > 0) return;
    const faqs = [
      { question: 'What payment methods do you accept?', answer: 'We currently accept Cash on Delivery (COD) across Pakistan.', category: 'payment', sortOrder: 1 },
      { question: 'How long does delivery take?', answer: 'Major cities: 2-3 days. Other cities: 3-5 days. Remote areas: 5-7 days.', category: 'shipping', sortOrder: 2 },
      { question: 'Is the packaging discreet?', answer: 'Yes! All orders ship in plain, unmarked packaging.', category: 'shipping', sortOrder: 3 },
      { question: 'What is your exchange policy?', answer: '7-day exchange policy. Items must be unworn, unwashed, in original packaging with tags.', category: 'returns', sortOrder: 4 },
      { question: 'How do I find my correct size?', answer: 'Each product page has a size guide. You can also WhatsApp us for help!', category: 'products', sortOrder: 5 },
      { question: 'What sizes do you offer?', answer: 'S to XXL across most products.', category: 'products', sortOrder: 6 },
      { question: 'How do I track my order?', answer: 'Visit our Order Tracking page with your order number.', category: 'orders', sortOrder: 7 },
      { question: 'Do you offer refunds?', answer: 'We offer exchanges within 7 days, not refunds.', category: 'returns', sortOrder: 8 },
    ];
    for (const faq of faqs) {
      await this.faqRepo.save(this.faqRepo.create(faq));
    }
    console.log('✓ FAQs created');
  }

  private async seedCategories() {
    const count = await this.catRepo.count();
    if (count > 0) return;
    const categories = [
      { name: 'Bras', slug: 'bras', description: 'Premium bras for every occasion — from everyday comfort to special moments.', image: '/uploads/categories/bras.jpg', sortOrder: 1, seoTitle: 'Premium Bras | Hidden Glow', seoDescription: 'Shop comfortable, stylish bras. Free delivery over Rs. 3,000.' },
      { name: 'Panties', slug: 'panties', description: 'Comfort meets style. Bikinis, hipsters, briefs & thongs in premium fabrics.', image: '/uploads/categories/panties.jpg', sortOrder: 2, seoTitle: 'Panties | Hidden Glow', seoDescription: 'Shop premium panties. Free delivery over Rs. 3,000.' },
      { name: 'Nightwear', slug: 'nightwear', description: 'Sleep in luxury. Silk nightgowns, cotton pajamas & elegant chemises.', image: '/uploads/categories/nightwear.jpg', sortOrder: 3, seoTitle: 'Nightwear | Hidden Glow', seoDescription: 'Shop premium nightwear & sleepwear.' },
      { name: 'Matching Sets', slug: 'matching-sets', description: 'Perfectly coordinated bra & panty sets for everyday or special occasions.', image: '/uploads/categories/sets.jpg', sortOrder: 4, seoTitle: 'Matching Sets | Hidden Glow', seoDescription: 'Shop bra & panty sets.' },
      { name: 'Camisoles', slug: 'camisoles', description: 'Versatile layering pieces and elegant camisoles.', image: '/uploads/categories/camisoles.jpg', sortOrder: 5, seoTitle: 'Camisoles | Hidden Glow', seoDescription: 'Shop premium camisoles.' },
      { name: 'Shapewear', slug: 'shapewear', description: 'Smooth, shape & sculpt with our comfortable shapewear.', image: '/uploads/categories/shapewear.jpg', sortOrder: 6, seoTitle: 'Shapewear | Hidden Glow', seoDescription: 'Shop comfortable shapewear.' },
    ];
    for (const cat of categories) {
      await this.catRepo.save(this.catRepo.create(cat));
    }
    console.log('✓ Categories created');
  }

  private async seedProducts() {
    const count = await this.productRepo.count();
    if (count > 0) return;

    const cats = await this.catRepo.find();
    const catMap: Record<string, number> = {};
    cats.forEach(c => { catMap[c.slug] = c.id; });

    const createProduct = async (data: any) => {
      const product = this.productRepo.create({
        name: data.name, slug: data.slug,
        description: data.description, shortDescription: data.shortDescription,
        price: data.price, discountPrice: data.discountPrice || null,
        categoryId: data.categoryId, isActive: true,
        isFeatured: data.isFeatured || false, isBestSeller: data.isBestSeller || false,
        seoTitle: data.seoTitle || data.name + ' | Hidden Glow',
        seoDescription: data.seoDescription || data.shortDescription,
      });
      const saved = await this.productRepo.save(product);
      const pid = (saved as any).id;
      if (data.images?.length) {
        for (let i = 0; i < data.images.length; i++) {
          await this.imageRepo.save(this.imageRepo.create({ productId: pid, url: data.images[i], sortOrder: i, isPrimary: i === 0 }));
        }
      }
      if (data.variants?.length) {
        for (const v of data.variants) {
          await this.variantRepo.save(this.variantRepo.create({ productId: pid, size: v.size, color: v.color || null, stock: v.stock || 50, sku: `HG-${data.slug.slice(0, 8).toUpperCase()}-${v.size}` }));
        }
      }
      return pid;
    };

    const stdSz = [{ size: 'S', stock: 30 }, { size: 'M', stock: 50 }, { size: 'L', stock: 40 }, { size: 'XL', stock: 35 }, { size: 'XXL', stock: 20 }];
    const braSz = [{ size: '32B', stock: 25 }, { size: '34B', stock: 40 }, { size: '34C', stock: 35 }, { size: '36B', stock: 30 }, { size: '36C', stock: 30 }, { size: '38B', stock: 20 }, { size: '38C', stock: 15 }];

    // BRAS
    await createProduct({ name: 'Everyday Comfort Padded Bra', slug: 'everyday-comfort-padded-bra', shortDescription: 'Your go-to daily bra with light padding and seamless comfort.', description: '<h3>The Perfect Everyday Bra</h3><p>Bestselling padded bra with premium cotton-spandex blend.</p><ul><li>Light foam padding for natural shape</li><li>Wide cushioned straps</li><li>Breathable cotton-blend fabric</li><li>Smooth seamless cups</li></ul>', price: 1890, discountPrice: 1490, categoryId: catMap['bras'], isBestSeller: true, isFeatured: true, images: ['/uploads/products/everyday-comfort-bra-1.jpg', '/uploads/products/everyday-comfort-bra-2.jpg', '/uploads/products/everyday-comfort-bra-3.jpg'], variants: braSz });
    await createProduct({ name: 'Lace Elegance Underwire Bra', slug: 'lace-elegance-underwire-bra', shortDescription: 'Delicate floral lace with supportive underwire.', description: '<h3>Elegance Redefined</h3><p>Romantic floral lace with modern support technology.</p><ul><li>Floral lace overlay</li><li>Supportive underwire</li><li>Lined cups</li><li>Satin finish straps</li></ul>', price: 2490, discountPrice: 1990, categoryId: catMap['bras'], isFeatured: true, isBestSeller: true, images: ['/uploads/products/lace-elegance-bra-1.jpg', '/uploads/products/lace-elegance-bra-2.jpg', '/uploads/products/lace-elegance-bra-3.jpg'], variants: braSz });
    await createProduct({ name: 'Seamless T-Shirt Bra', slug: 'seamless-tshirt-bra', shortDescription: 'Invisible under clothing. Smooth molded cups for a flawless look.', description: '<h3>Invisible Support</h3><p>Smooth, seamless, invisible under even the thinnest fabrics.</p><ul><li>Molded cups — zero lines</li><li>Convertible straps</li><li>Breathable microfiber</li></ul>', price: 1790, categoryId: catMap['bras'], isBestSeller: true, images: ['/uploads/products/seamless-tshirt-bra-1.jpg', '/uploads/products/seamless-tshirt-bra-2.jpg'], variants: braSz });
    await createProduct({ name: 'Push-Up Luxe Bra', slug: 'pushup-luxe-bra', shortDescription: 'Maximum lift with luxurious satin finish.', description: '<h3>Lift & Glamour</h3><p>Stunning lift with graduated padding and plunging neckline.</p><ul><li>Graduated push-up padding</li><li>Plunging neckline</li><li>Satin finish</li></ul>', price: 2290, discountPrice: 1890, categoryId: catMap['bras'], isFeatured: true, images: ['/uploads/products/pushup-luxe-bra-1.jpg', '/uploads/products/pushup-luxe-bra-2.jpg', '/uploads/products/pushup-luxe-bra-3.jpg'], variants: braSz });
    await createProduct({ name: 'Sports Active Bra', slug: 'sports-active-bra', shortDescription: 'High-impact support with moisture-wicking fabric.', description: '<h3>Move With Confidence</h3><p>Racerback design with moisture-wicking fabric.</p><ul><li>Racerback design</li><li>Moisture-wicking</li><li>Removable padding</li></ul>', price: 1690, categoryId: catMap['bras'], images: ['/uploads/products/sports-active-bra-1.jpg', '/uploads/products/sports-active-bra-2.jpg'], variants: stdSz });

    // PANTIES
    await createProduct({ name: 'Cotton Essentials Bikini', slug: 'cotton-essentials-bikini', shortDescription: 'Everyday comfort in pure breathable cotton.', description: '<h3>Pure Cotton Comfort</h3><ul><li>100% premium cotton</li><li>Gentle elastic waistband</li><li>Classic bikini cut</li></ul>', price: 590, discountPrice: 490, categoryId: catMap['panties'], isBestSeller: true, images: ['/uploads/products/cotton-essentials-bikini-1.jpg', '/uploads/products/cotton-essentials-bikini-2.jpg'], variants: stdSz });
    await createProduct({ name: 'Lace Trim Hipster', slug: 'lace-trim-hipster', shortDescription: 'Beautiful lace trim meets everyday comfort.', description: '<h3>A Touch of Lace</h3><ul><li>Delicate lace trim</li><li>Hipster cut</li><li>Cotton-blend fabric</li></ul>', price: 790, discountPrice: 650, categoryId: catMap['panties'], isFeatured: true, images: ['/uploads/products/lace-trim-hipster-1.jpg', '/uploads/products/lace-trim-hipster-2.jpg'], variants: stdSz });
    await createProduct({ name: 'Seamless No-Show Thong', slug: 'seamless-no-show-thong', shortDescription: 'Laser-cut edges for zero panty lines.', description: '<h3>Zero Lines</h3><ul><li>Laser-cut edges</li><li>Ultra-soft microfiber</li><li>Low-rise design</li></ul>', price: 690, categoryId: catMap['panties'], images: ['/uploads/products/seamless-thong-1.jpg', '/uploads/products/seamless-thong-2.jpg'], variants: stdSz });
    await createProduct({ name: 'Cotton Briefs — Pack of 3', slug: 'cotton-briefs-pack-3', shortDescription: 'Three premium cotton briefs at an unbeatable price.', description: '<h3>Everyday Essentials</h3><ul><li>Pack of 3</li><li>Full coverage</li><li>100% cotton</li></ul>', price: 1490, discountPrice: 1190, categoryId: catMap['panties'], isBestSeller: true, images: ['/uploads/products/cotton-briefs-pack-1.jpg', '/uploads/products/cotton-briefs-pack-2.jpg'], variants: stdSz });
    await createProduct({ name: 'Boyshort Comfort', slug: 'boyshort-comfort', shortDescription: 'Extra coverage with a sporty vibe that never rides up.', description: '<h3>Sporty & Comfortable</h3><ul><li>Boyshort cut</li><li>Stretchy cotton blend</li><li>No ride-up</li></ul>', price: 690, categoryId: catMap['panties'], images: ['/uploads/products/boyshort-comfort-1.jpg', '/uploads/products/boyshort-comfort-2.jpg'], variants: stdSz });

    // NIGHTWEAR
    await createProduct({ name: 'Silk Satin Nightgown', slug: 'silk-satin-nightgown', shortDescription: 'Luxurious satin with adjustable spaghetti straps.', description: '<h3>Sleep in Luxury</h3><ul><li>Premium satin</li><li>V-neckline with lace trim</li><li>Knee-length with side slit</li></ul>', price: 3490, discountPrice: 2890, categoryId: catMap['nightwear'], isFeatured: true, isBestSeller: true, images: ['/uploads/products/silk-satin-nightgown-1.jpg', '/uploads/products/silk-satin-nightgown-2.jpg', '/uploads/products/silk-satin-nightgown-3.jpg'], variants: stdSz });
    await createProduct({ name: 'Cotton Pajama Set', slug: 'cotton-pajama-set', shortDescription: 'Soft cotton pajamas with button-up top and matching pants.', description: '<h3>Cozy Nights</h3><ul><li>100% cotton</li><li>Button-up top</li><li>Elastic-waist pants with pockets</li></ul>', price: 2990, discountPrice: 2490, categoryId: catMap['nightwear'], isBestSeller: true, images: ['/uploads/products/cotton-pajama-set-1.jpg', '/uploads/products/cotton-pajama-set-2.jpg'], variants: stdSz });
    await createProduct({ name: 'Lace Trim Chemise', slug: 'lace-trim-chemise', shortDescription: 'Romantic lace on silky fabric for special evenings.', description: '<h3>Romance & Elegance</h3><ul><li>Satin body with lace</li><li>A-line silhouette</li><li>Mid-thigh length</li></ul>', price: 2790, categoryId: catMap['nightwear'], isFeatured: true, images: ['/uploads/products/lace-chemise-1.jpg', '/uploads/products/lace-chemise-2.jpg', '/uploads/products/lace-chemise-3.jpg'], variants: stdSz });
    await createProduct({ name: 'Sleep Shorts Set', slug: 'sleep-shorts-set', shortDescription: 'Light cami top with matching shorts for warm nights.', description: '<h3>Stay Cool</h3><ul><li>Breathable cotton-blend</li><li>Cami top with straps</li><li>Matching shorts</li></ul>', price: 1990, discountPrice: 1690, categoryId: catMap['nightwear'], images: ['/uploads/products/sleep-shorts-set-1.jpg', '/uploads/products/sleep-shorts-set-2.jpg'], variants: stdSz });

    // MATCHING SETS
    await createProduct({ name: 'Bridal Lace Set', slug: 'bridal-lace-set', shortDescription: 'Exquisite lace set for your special day.', description: '<h3>For Your Special Day</h3><p>Includes underwire bra + matching lace bikini panty.</p><ul><li>Ivory/white lace</li><li>Satin bow details</li><li>Push-up padding</li></ul>', price: 4990, discountPrice: 3990, categoryId: catMap['matching-sets'], isFeatured: true, isBestSeller: true, images: ['/uploads/products/bridal-lace-set-1.jpg', '/uploads/products/bridal-lace-set-2.jpg', '/uploads/products/bridal-lace-set-3.jpg'], variants: braSz });
    await createProduct({ name: 'Everyday Matching Set', slug: 'everyday-matching-set', shortDescription: 'Coordinated bra and panty for daily elegance.', description: '<h3>Coordinated Comfort</h3><p>Padded bra + matching bikini panty.</p><ul><li>Soft cotton-blend</li><li>Seamless finish</li></ul>', price: 2490, discountPrice: 1990, categoryId: catMap['matching-sets'], isBestSeller: true, images: ['/uploads/products/everyday-matching-set-1.jpg', '/uploads/products/everyday-matching-set-2.jpg'], variants: braSz });
    await createProduct({ name: 'Date Night Set', slug: 'date-night-set', shortDescription: 'Sultry wine lace set for unforgettable evenings.', description: '<h3>Unforgettable Evenings</h3><p>Push-up lace bra + matching lace thong.</p><ul><li>Wine/burgundy color</li><li>Floral lace</li><li>Comes in gift box</li></ul>', price: 3490, discountPrice: 2890, categoryId: catMap['matching-sets'], isFeatured: true, images: ['/uploads/products/date-night-set-1.jpg', '/uploads/products/date-night-set-2.jpg', '/uploads/products/date-night-set-3.jpg'], variants: braSz });

    // CAMISOLES
    await createProduct({ name: 'Silk Camisole', slug: 'silk-camisole', shortDescription: 'Smooth satin camisole for layering or sleeping.', description: '<h3>Versatile Elegance</h3><ul><li>Premium satin</li><li>Adjustable straps</li><li>V-neckline with lace</li></ul>', price: 1790, discountPrice: 1490, categoryId: catMap['camisoles'], isFeatured: true, images: ['/uploads/products/silk-camisole-1.jpg', '/uploads/products/silk-camisole-2.jpg'], variants: stdSz });
    await createProduct({ name: 'Lace Trim Cami', slug: 'lace-trim-cami', shortDescription: 'Feminine lace-trimmed camisole in soft cotton.', description: '<h3>Feminine & Practical</h3><ul><li>Cotton body</li><li>Lace trim</li><li>Adjustable straps</li></ul>', price: 1290, categoryId: catMap['camisoles'], images: ['/uploads/products/lace-trim-cami-1.jpg', '/uploads/products/lace-trim-cami-2.jpg'], variants: stdSz });
    await createProduct({ name: 'Everyday Layering Tank', slug: 'everyday-layering-tank', shortDescription: 'Essential wardrobe staple in stretchy cotton.', description: '<h3>The Essential Tank</h3><ul><li>Stretchy cotton blend</li><li>Scoop neckline</li><li>Wide straps</li></ul>', price: 890, discountPrice: 690, categoryId: catMap['camisoles'], isBestSeller: true, images: ['/uploads/products/layering-tank-1.jpg', '/uploads/products/layering-tank-2.jpg'], variants: stdSz });

    // SHAPEWEAR
    await createProduct({ name: 'Seamless Bodysuit Shaper', slug: 'seamless-bodysuit-shaper', shortDescription: 'Full-body smoothing from bust to thigh.', description: '<h3>Smooth Silhouette</h3><ul><li>Full body smoothing</li><li>Seamless construction</li><li>Open crotch</li><li>Medium compression</li></ul>', price: 2990, discountPrice: 2490, categoryId: catMap['shapewear'], isFeatured: true, images: ['/uploads/products/bodysuit-shaper-1.jpg', '/uploads/products/bodysuit-shaper-2.jpg'], variants: stdSz });
    await createProduct({ name: 'High Waist Tummy Shaper', slug: 'high-waist-tummy-shaper', shortDescription: 'Targeted tummy control with high-waist design.', description: '<h3>Tummy Control</h3><ul><li>High-waist design</li><li>Silicone waistband</li><li>Seamless finish</li></ul>', price: 1890, categoryId: catMap['shapewear'], images: ['/uploads/products/high-waist-shaper-1.jpg', '/uploads/products/high-waist-shaper-2.jpg'], variants: stdSz });
    await createProduct({ name: 'Thigh Shaper Shorts', slug: 'thigh-shaper-shorts', shortDescription: 'Smooth thighs and tummy under everything.', description: '<h3>Smooth Under Everything</h3><ul><li>Tummy, hip & thigh smoothing</li><li>Mid-thigh length</li><li>Prevents chafing</li></ul>', price: 1490, discountPrice: 1190, categoryId: catMap['shapewear'], isBestSeller: true, images: ['/uploads/products/thigh-shaper-shorts-1.jpg', '/uploads/products/thigh-shaper-shorts-2.jpg'], variants: stdSz });

    console.log('✓ Products created (23 products)');
  }

  private async seedReviews() {
    const count = await this.reviewRepo.count();
    if (count > 0) return;
    const products = await this.productRepo.find({ take: 12 });
    const reviews = [
      { name: 'Ayesha K.', rating: 5, comment: 'Absolutely love the fabric quality! So soft and comfortable. Best innerwear I\'ve bought in Pakistan.' },
      { name: 'Fatima S.', rating: 5, comment: 'The fit is perfect and the packaging was so discreet. Very happy with the quality.' },
      { name: 'Sana M.', rating: 4, comment: 'Very comfortable for daily wear. The cotton is breathable and doesn\'t irritate.' },
      { name: 'Hira A.', rating: 5, comment: 'Ordered the matching set for my wedding — the lace detailing is exquisite!' },
      { name: 'Nadia R.', rating: 5, comment: 'Finally, decent innerwear available in Pakistan with online ordering! Sizes are accurate.' },
      { name: 'Amina Z.', rating: 4, comment: 'Good quality. The seamless bra is invisible under my shirts.' },
      { name: 'Zara T.', rating: 5, comment: 'The silk nightgown feels amazing! So smooth and luxurious.' },
      { name: 'Mehreen B.', rating: 5, comment: 'Fast delivery to Lahore (2 days!) and quality exceeded expectations.' },
      { name: 'Rabia K.', rating: 4, comment: 'Love the plain packaging. Very considerate. Good products.' },
      { name: 'Sarah H.', rating: 5, comment: 'The shapewear is a game-changer! Comfortable all day. Better than imported brands.' },
      { name: 'Maham L.', rating: 5, comment: 'Cotton pajama set is the softest thing I own. Already ordered a second set!' },
      { name: 'Bushra N.', rating: 4, comment: 'Nice products, true to size. The push-up bra gives great lift.' },
      { name: 'Kinza W.', rating: 5, comment: 'Best quality bras in Pakistan. Perfect fit and comfort. 10/10!' },
      { name: 'Anum P.', rating: 5, comment: 'Bridal set was stunning! Beautiful lace work. Perfect for special nights.' },
      { name: 'Rubina D.', rating: 4, comment: 'Comfortable everyday panties with nice lace. Good value for money.' },
    ];
    for (let i = 0; i < reviews.length; i++) {
      const pid = products[i % products.length]?.id;
      if (!pid) continue;
      await this.reviewRepo.save(this.reviewRepo.create({ productId: pid, ...reviews[i], isApproved: true }));
    }
    console.log('✓ Reviews created (15 reviews)');
  }
}
