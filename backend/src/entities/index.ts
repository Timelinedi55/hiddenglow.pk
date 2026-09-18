import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany, ManyToOne, JoinColumn,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 500, nullable: true })
  image: string;

  @Column({ nullable: true })
  parentId: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ length: 255, nullable: true })
  seoTitle: string;

  @Column({ type: 'text', nullable: true })
  seoDescription: string;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  shortDescription: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number;

  @Column({ nullable: true })
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isBestSeller: boolean;

  @Column({ length: 255, nullable: true })
  seoTitle: string;

  @Column({ type: 'text', nullable: true })
  seoDescription: string;

  @Column({ length: 500, nullable: true })
  videoUrl: string;

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true, eager: true })
  images: ProductImage[];

  @OneToMany(() => ProductVariant, (variant) => variant.product, { cascade: true, eager: true })
  variants: ProductVariant[];

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @ManyToOne(() => Product, (product) => product.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ length: 500 })
  url: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: false })
  isPrimary: boolean;
}

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ length: 50 })
  size: string;

  @Column({ length: 50, nullable: true })
  color: string;

  @Column({ length: 50, nullable: true })
  colorCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  variantPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ length: 100, nullable: true })
  sku: string;

  @Column({ length: 50, nullable: true })
  weight: string;

  @Column({ length: 500, nullable: true })
  image: string;

  @Column({ default: true })
  isActive: boolean;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  orderNumber: string;

  @Column({ length: 255 })
  customerName: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 20, nullable: true })
  whatsapp: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ length: 50, default: 'COD' })
  paymentMethod: string;

  @Column({ length: 100, nullable: true })
  trackingNumber: string;

  @Column({ length: 100, nullable: true })
  courierName: string;

  @Column({ type: 'text', nullable: true })
  adminNotes: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  @OneToMany(() => OrderStatusHistory, (h) => h.order, { cascade: true })
  statusHistory: OrderStatusHistory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  productId: number;

  @Column({ nullable: true })
  variantId: number;

  @Column({ length: 255 })
  productName: string;

  @Column({ length: 50, nullable: true })
  size: string;

  @Column({ length: 50, nullable: true })
  color: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 1 })
  quantity: number;

  @Column({ length: 500, nullable: true })
  productImage: string;
}

@Entity('cms_content')
export class CmsContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  pageKey: string;

  @Column({ length: 100 })
  sectionKey: string;

  @Column({ length: 255, nullable: true })
  title: string;

  @Column({ type: 'longtext', nullable: true })
  content: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('site_settings')
export class SiteSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  settingKey: string;

  @Column({ type: 'longtext', nullable: true })
  settingValue: string;

  @Column({ length: 50, default: 'text' })
  settingType: string;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255 })
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @ManyToOne(() => Product, (product) => product.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ type: 'tinyint', default: 5 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ default: false })
  isApproved: boolean;

  @Column({ default: false })
  isVerifiedPurchase: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('faqs')
export class Faq {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @ManyToOne(() => Order, (order) => order.statusHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ length: 50 })
  status: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  phone: string;

  @Column({ length: 255, nullable: true })
  name: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  whatsapp: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ default: 0 })
  orderCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  adminNote: string;

  @Column({ length: 50, nullable: true })
  method: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 100 })
  category: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'date' })
  date: string;

  @Column({ length: 500, nullable: true })
  receipt: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('visitors')
export class Visitor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 64, unique: true })
  fingerprint: string;

  @Column({ length: 45, nullable: true })
  ip: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 500, nullable: true })
  userAgent: string;

  @Column({ length: 50, nullable: true })
  browser: string;

  @Column({ length: 50, nullable: true })
  os: string;

  @Column({ length: 20, nullable: true })
  deviceType: string;

  @Column({ length: 50, nullable: true })
  screenResolution: string;

  @Column({ length: 10, nullable: true })
  language: string;

  @Column({ length: 500, nullable: true })
  referrer: string;

  @Column({ length: 100, nullable: true })
  utmSource: string;

  @Column({ length: 100, nullable: true })
  utmMedium: string;

  @Column({ length: 100, nullable: true })
  utmCampaign: string;

  @Column({ default: 0 })
  totalVisits: number;

  @Column({ default: 0 })
  totalPageViews: number;

  @OneToMany(() => PageView, (pv) => pv.visitor, { cascade: true })
  pageViews: PageView[];

  @CreateDateColumn()
  firstVisit: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastVisit: Date;
}

@Entity('page_views')
export class PageView {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  visitorId: number;

  @ManyToOne(() => Visitor, (v) => v.pageViews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'visitorId' })
  visitor: Visitor;

  @Column({ length: 500 })
  url: string;

  @Column({ length: 255, nullable: true })
  pageTitle: string;

  @Column({ length: 500, nullable: true })
  referrer: string;

  @Column({ default: 0 })
  duration: number;

  @CreateDateColumn()
  viewedAt: Date;
}

// ─── Returns ──────────────────────────────────────────────────────────────────

@Entity('return_orders')
export class ReturnOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  returnNumber: string;

  @Column()
  orderId: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ length: 50, default: 'requested' })
  status: string; // requested, approved, picked_up, received, refunded, rejected

  @Column({ length: 100 })
  reason: string; // defective, wrong_size, wrong_item, not_needed, other

  @Column({ type: 'text', nullable: true })
  reasonDetail: string;

  @Column({ type: 'text', nullable: true })
  adminNote: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundAmount: number;

  @Column({ length: 50, nullable: true })
  refundMethod: string; // bank_transfer, easypaisa, jazzcash, store_credit

  @Column({ nullable: true })
  refundId: number;

  @ManyToOne(() => Refund, { nullable: true })
  @JoinColumn({ name: 'refundId' })
  refund: Refund;

  @OneToMany(() => ReturnItem, (item) => item.returnOrder, { cascade: true, eager: true })
  items: ReturnItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('return_items')
export class ReturnItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  returnOrderId: number;

  @ManyToOne(() => ReturnOrder, (ro) => ro.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'returnOrderId' })
  returnOrder: ReturnOrder;

  @Column()
  orderItemId: number;

  @Column()
  productId: number;

  @Column({ nullable: true })
  variantId: number;

  @Column({ length: 255 })
  productName: string;

  @Column({ length: 50, nullable: true })
  size: string;

  @Column({ length: 50, nullable: true })
  color: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ length: 500, nullable: true })
  productImage: string;

  @Column({ length: 50, default: 'pending' })
  condition: string; // pending, good, damaged, missing
}

// ─── Analytics Events ─────────────────────────────────────────────────────────

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 64, nullable: true })
  visitorFingerprint: string;

  @Column({ length: 50 })
  eventType: string; // page_view, view_product, add_to_cart, begin_checkout, purchase, remove_from_cart, search

  @Column({ type: 'json', nullable: true })
  eventData: any; // flexible JSON for event-specific data

  @Column({ length: 500, nullable: true })
  url: string;

  @Column({ length: 100, nullable: true })
  utmSource: string;

  @Column({ length: 100, nullable: true })
  utmMedium: string;

  @Column({ length: 100, nullable: true })
  utmCampaign: string;

  @Column({ length: 100, nullable: true })
  utmContent: string;

  @Column({ length: 100, nullable: true })
  utmTerm: string;

  @Column({ length: 20, nullable: true })
  deviceType: string;

  @Column({ length: 45, nullable: true })
  ip: string;

  @Column({ length: 20, nullable: true })
  referralCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  value: number; // monetary value of the event (e.g., cart total, purchase amount)

  @Column({ length: 3, nullable: true })
  currency: string;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── Referrals ────────────────────────────────────────────────────────────────

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 255, nullable: true })
  password: string; // bcrypt hash for partner login

  @Column({ length: 20, unique: true })
  code: string; // unique referral code

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  commissionRate: number; // percentage

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pendingEarnings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidEarnings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  availableBalance: number; // earnings past hold period, ready to withdraw

  @Column({ default: 0 })
  totalClicks: number;

  @Column({ default: 0 })
  totalOrders: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Bank details for withdrawals
  @Column({ length: 100, nullable: true })
  bankName: string;

  @Column({ length: 255, nullable: true })
  accountTitle: string;

  @Column({ length: 50, nullable: true })
  accountNumber: string;

  @Column({ length: 34, nullable: true })
  iban: string;

  @OneToMany(() => ReferralClick, (click) => click.referral, { cascade: true })
  clicks: ReferralClick[];

  @OneToMany(() => ReferralConversion, (conv) => conv.referral, { cascade: true })
  conversions: ReferralConversion[];

  @OneToMany(() => Withdrawal, (w) => w.referral, { cascade: true })
  withdrawals: Withdrawal[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('referral_clicks')
export class ReferralClick {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  referralId: number;

  @ManyToOne(() => Referral, (r) => r.clicks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referralId' })
  referral: Referral;

  @Column({ length: 45, nullable: true })
  ip: string;

  @Column({ length: 500, nullable: true })
  userAgent: string;

  @Column({ length: 500, nullable: true })
  landingPage: string;

  @Column({ length: 64, nullable: true })
  visitorFingerprint: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('referral_conversions')
export class ReferralConversion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  referralId: number;

  @ManyToOne(() => Referral, (r) => r.conversions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referralId' })
  referral: Referral;

  @Column()
  orderId: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  orderAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  commissionAmount: number;

  @Column({ length: 50, default: 'pending' })
  status: string; // pending, approved, paid, rejected

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ─── Withdrawals ──────────────────────────────────────────────────────────────

@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  referralId: number;

  @ManyToOne(() => Referral, (r) => r.withdrawals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referralId' })
  referral: Referral;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 50, default: 'pending' })
  status: string; // pending, approved, processed, rejected

  @Column({ length: 100, nullable: true })
  bankName: string;

  @Column({ length: 255, nullable: true })
  accountTitle: string;

  @Column({ length: 50, nullable: true })
  accountNumber: string;

  @Column({ length: 34, nullable: true })
  iban: string;

  @Column({ type: 'text', nullable: true })
  adminNote: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
