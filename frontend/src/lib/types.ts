export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPrice: number | null;
  costPrice: number | null;
  categoryId: number;
  category?: Category;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  seoTitle: string;
  seoDescription: string;
  videoUrl: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  reviews?: Review[];
  createdAt: string;
}

export interface ProductImage {
  id: number;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: number;
  size: string;
  color: string;
  colorCode: string | null;
  variantPrice: number | null;
  costPrice: number | null;
  stock: number;
  sku: string;
  weight: string | null;
  image: string | null;
  isActive: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  email: string | null;
  phone: string;
  whatsapp: string | null;
  address: string;
  city: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  notes: string;
  paymentMethod: string;
  trackingNumber: string | null;
  courierName: string | null;
  adminNotes: string | null;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusHistory {
  id: number;
  status: string;
  note: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  variantId: number;
  productName: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  productImage: string;
}

export interface CartItem {
  productId: number;
  variantId?: number;
  name: string;
  price: number;
  size?: string;
  color?: string;
  quantity: number;
  image: string;
  slug: string;
}

export interface Review {
  id: number;
  productId: number;
  product?: { id: number; name: string; slug: string; images?: ProductImage[] };
  name: string;
  email: string | null;
  rating: number;
  comment: string;
  images: string[] | null;
  isApproved: boolean;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CmsSection {
  id: number;
  title: string;
  content: string;
  metadata: any;
}

export interface SiteSettings {
  [key: string]: string;
}

export interface Refund {
  id: number;
  orderId: number;
  order?: Order;
  amount: number;
  status: string;
  reason: string | null;
  adminNote: string | null;
  method: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  description: string | null;
  productId: number | null;
  date: string;
  receipt: string | null;
  createdAt: string;
}

export interface ReturnOrder {
  id: number;
  orderId: number;
  order?: Order;
  status: 'requested' | 'approved' | 'picked_up' | 'received' | 'refunded' | 'rejected';
  reason: string;
  customerNotes: string | null;
  adminNotes: string | null;
  refundAmount: number;
  refundMethod: string | null;
  refundId: number | null;
  refund?: Refund;
  items: ReturnItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ReturnItem {
  id: number;
  orderItemId: number;
  productId: number;
  variantId: number | null;
  productName: string;
  size: string | null;
  color: string | null;
  quantity: number;
  price: number;
  condition: string | null;
}

export interface ReferralPartner {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  code: string;
  commissionRate: number;
  totalClicks: number;
  totalOrders: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  isActive: boolean;
  createdAt: string;
}

export interface ReferralConversion {
  id: number;
  referralId: number;
  referral?: ReferralPartner;
  orderId: number;
  order?: Order;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  createdAt: string;
}

export interface AnalyticsEvent {
  id: number;
  eventType: string;
  sessionId: string | null;
  visitorId: string | null;
  productId: number | null;
  productName: string | null;
  categoryId: number | null;
  orderId: number | null;
  orderAmount: number | null;
  searchQuery: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  referralCode: string | null;
  device: string | null;
  page: string | null;
  metadata: any;
  createdAt: string;
}
