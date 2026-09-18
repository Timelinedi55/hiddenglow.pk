import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Between } from 'typeorm';
import { AnalyticsEvent, Visitor, PageView, Order, OrderItem } from '../../entities';

@Injectable()
export class AnalyticsEventsService {
  constructor(
    @InjectRepository(AnalyticsEvent) private eventRepo: Repository<AnalyticsEvent>,
    @InjectRepository(Visitor) private visitorRepo: Repository<Visitor>,
    @InjectRepository(PageView) private pageViewRepo: Repository<PageView>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
  ) {}

  // Track an e-commerce event (add_to_cart, begin_checkout, purchase, etc.)
  async trackEvent(data: {
    visitorFingerprint?: string;
    eventType: string;
    eventData?: any;
    url?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
    deviceType?: string;
    ip?: string;
    referralCode?: string;
    value?: number;
    currency?: string;
  }) {
    const event = this.eventRepo.create({
      visitorFingerprint: data.visitorFingerprint || undefined,
      eventType: data.eventType,
      eventData: data.eventData || undefined,
      url: data.url || undefined,
      utmSource: data.utmSource || undefined,
      utmMedium: data.utmMedium || undefined,
      utmCampaign: data.utmCampaign || undefined,
      utmContent: data.utmContent || undefined,
      utmTerm: data.utmTerm || undefined,
      deviceType: data.deviceType || undefined,
      ip: data.ip || undefined,
      referralCode: data.referralCode || undefined,
      value: data.value || undefined,
      currency: data.currency || 'PKR',
    });
    return this.eventRepo.save(event);
  }

  // ── Conversion Funnel ─────────────────────────────────────────────────────
  async getConversionFunnel(period: string = '7d') {
    const since = this.getSince(period);

    const [visitors, productViews, addToCarts, checkouts, purchases] = await Promise.all([
      this.visitorRepo.count({ where: { lastVisit: MoreThanOrEqual(since) } }),
      this.eventRepo.count({ where: { eventType: 'view_product', createdAt: MoreThanOrEqual(since) } }),
      this.eventRepo.count({ where: { eventType: 'add_to_cart', createdAt: MoreThanOrEqual(since) } }),
      this.eventRepo.count({ where: { eventType: 'begin_checkout', createdAt: MoreThanOrEqual(since) } }),
      this.eventRepo.count({ where: { eventType: 'purchase', createdAt: MoreThanOrEqual(since) } }),
    ]);

    return {
      steps: [
        { name: 'Visitors', count: visitors, rate: 100 },
        { name: 'Product Views', count: productViews, rate: visitors > 0 ? +((productViews / visitors) * 100).toFixed(1) : 0 },
        { name: 'Add to Cart', count: addToCarts, rate: visitors > 0 ? +((addToCarts / visitors) * 100).toFixed(1) : 0 },
        { name: 'Checkout', count: checkouts, rate: visitors > 0 ? +((checkouts / visitors) * 100).toFixed(1) : 0 },
        { name: 'Purchase', count: purchases, rate: visitors > 0 ? +((purchases / visitors) * 100).toFixed(1) : 0 },
      ],
      overallConversion: visitors > 0 ? +((purchases / visitors) * 100).toFixed(2) : 0,
      cartToCheckout: addToCarts > 0 ? +((checkouts / addToCarts) * 100).toFixed(1) : 0,
      checkoutToPayment: checkouts > 0 ? +((purchases / checkouts) * 100).toFixed(1) : 0,
    };
  }

  // ── Campaign/Source Analytics ──────────────────────────────────────────────
  async getCampaignAnalytics(period: string = '7d') {
    const since = this.getSince(period);

    // Source/Medium breakdown
    const sourceBreakdown = await this.eventRepo
      .createQueryBuilder('e')
      .select('e.utmSource', 'source')
      .addSelect('e.utmMedium', 'medium')
      .addSelect('COUNT(*)', 'events')
      .addSelect('COUNT(DISTINCT e.visitorFingerprint)', 'uniqueVisitors')
      .addSelect("SUM(CASE WHEN e.eventType = 'purchase' THEN 1 ELSE 0 END)", 'purchases')
      .addSelect("SUM(CASE WHEN e.eventType = 'purchase' THEN e.value ELSE 0 END)", 'revenue')
      .where('e.createdAt >= :since', { since })
      .andWhere("e.utmSource IS NOT NULL AND e.utmSource != ''")
      .groupBy('e.utmSource')
      .addGroupBy('e.utmMedium')
      .orderBy('events', 'DESC')
      .limit(25)
      .getRawMany();

    // Campaign breakdown
    const campaignBreakdown = await this.eventRepo
      .createQueryBuilder('e')
      .select('e.utmCampaign', 'campaign')
      .addSelect('e.utmSource', 'source')
      .addSelect('COUNT(*)', 'events')
      .addSelect('COUNT(DISTINCT e.visitorFingerprint)', 'uniqueVisitors')
      .addSelect("SUM(CASE WHEN e.eventType = 'purchase' THEN 1 ELSE 0 END)", 'purchases')
      .addSelect("SUM(CASE WHEN e.eventType = 'purchase' THEN e.value ELSE 0 END)", 'revenue')
      .where('e.createdAt >= :since', { since })
      .andWhere("e.utmCampaign IS NOT NULL AND e.utmCampaign != ''")
      .groupBy('e.utmCampaign')
      .addGroupBy('e.utmSource')
      .orderBy('events', 'DESC')
      .limit(25)
      .getRawMany();

    // Daily source trend
    const dailyBySource = await this.eventRepo
      .createQueryBuilder('e')
      .select("DATE_FORMAT(e.createdAt, '%Y-%m-%d')", 'date')
      .addSelect('e.utmSource', 'source')
      .addSelect('COUNT(*)', 'events')
      .addSelect("SUM(CASE WHEN e.eventType = 'purchase' THEN e.value ELSE 0 END)", 'revenue')
      .where('e.createdAt >= :since', { since })
      .andWhere("e.utmSource IS NOT NULL AND e.utmSource != ''")
      .groupBy('date')
      .addGroupBy('e.utmSource')
      .orderBy('date', 'ASC')
      .getRawMany();

    return { sourceBreakdown, campaignBreakdown, dailyBySource };
  }

  // ── Traffic Analysis: Visitors Not Converting ─────────────────────────────
  async getDropoffAnalysis(period: string = '7d') {
    const since = this.getSince(period);

    // Visitors who viewed products but never added to cart
    const viewedNotCarted = await this.eventRepo
      .createQueryBuilder('e')
      .select('COUNT(DISTINCT e.visitorFingerprint)', 'count')
      .where('e.createdAt >= :since', { since })
      .andWhere("e.eventType = 'view_product'")
      .andWhere(`e.visitorFingerprint NOT IN (
        SELECT DISTINCT e2.visitorFingerprint FROM analytics_events e2
        WHERE e2.eventType = 'add_to_cart' AND e2.createdAt >= :since
      )`)
      .getRawOne();

    // Visitors who added but didn't checkout
    const cartedNotCheckedout = await this.eventRepo
      .createQueryBuilder('e')
      .select('COUNT(DISTINCT e.visitorFingerprint)', 'count')
      .where('e.createdAt >= :since', { since })
      .andWhere("e.eventType = 'add_to_cart'")
      .andWhere(`e.visitorFingerprint NOT IN (
        SELECT DISTINCT e2.visitorFingerprint FROM analytics_events e2
        WHERE e2.eventType = 'begin_checkout' AND e2.createdAt >= :since
      )`)
      .getRawOne();

    // Most abandoned products (viewed but not purchased)
    const abandonedProducts = await this.eventRepo
      .createQueryBuilder('e')
      .select("JSON_UNQUOTE(JSON_EXTRACT(e.eventData, '$.productName'))", 'productName')
      .addSelect("JSON_UNQUOTE(JSON_EXTRACT(e.eventData, '$.productId'))", 'productId')
      .addSelect('COUNT(*)', 'views')
      .where('e.createdAt >= :since', { since })
      .andWhere("e.eventType = 'view_product'")
      .groupBy('productName')
      .addGroupBy('productId')
      .orderBy('views', 'DESC')
      .limit(15)
      .getRawMany();

    // Bounce by device type
    const bounceByDevice = await this.visitorRepo
      .createQueryBuilder('v')
      .select('v.deviceType', 'device')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN v.totalPageViews = 1 THEN 1 ELSE 0 END)', 'bounced')
      .where('v.lastVisit >= :since', { since })
      .groupBy('v.deviceType')
      .getRawMany();

    // Peak hours
    const peakHours = await this.eventRepo
      .createQueryBuilder('e')
      .select('HOUR(e.createdAt)', 'hour')
      .addSelect('COUNT(*)', 'events')
      .addSelect("SUM(CASE WHEN e.eventType = 'purchase' THEN 1 ELSE 0 END)", 'purchases')
      .where('e.createdAt >= :since', { since })
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany();

    return {
      viewedNotCarted: parseInt(viewedNotCarted?.count || '0'),
      cartedNotCheckedout: parseInt(cartedNotCheckedout?.count || '0'),
      abandonedProducts,
      bounceByDevice: bounceByDevice.map((d) => ({
        ...d,
        bounceRate: parseInt(d.total) > 0 ? +((parseInt(d.bounced) / parseInt(d.total)) * 100).toFixed(1) : 0,
      })),
      peakHours,
    };
  }

  // ── Remarketing Data: Pixel-friendly event export ─────────────────────────
  async getRemarketingData(period: string = '7d') {
    const since = this.getSince(period);

    // Audiences for remarketing
    const viewedProducts = await this.eventRepo
      .createQueryBuilder('e')
      .select('DISTINCT e.visitorFingerprint', 'fingerprint')
      .where('e.createdAt >= :since', { since })
      .andWhere("e.eventType = 'view_product'")
      .getRawMany();

    const addedToCart = await this.eventRepo
      .createQueryBuilder('e')
      .select('DISTINCT e.visitorFingerprint', 'fingerprint')
      .where('e.createdAt >= :since', { since })
      .andWhere("e.eventType = 'add_to_cart'")
      .getRawMany();

    const purchased = await this.eventRepo
      .createQueryBuilder('e')
      .select('DISTINCT e.visitorFingerprint', 'fingerprint')
      .where('e.createdAt >= :since', { since })
      .andWhere("e.eventType = 'purchase'")
      .getRawMany();

    const abandoned = await this.eventRepo
      .createQueryBuilder('e')
      .select('DISTINCT e.visitorFingerprint', 'fingerprint')
      .where('e.createdAt >= :since', { since })
      .andWhere("e.eventType = 'add_to_cart'")
      .andWhere(`e.visitorFingerprint NOT IN (
        SELECT DISTINCT e2.visitorFingerprint FROM analytics_events e2
        WHERE e2.eventType = 'purchase' AND e2.createdAt >= :since
      )`)
      .getRawMany();

    // Event summary for pixel data
    const eventSummary = await this.eventRepo
      .createQueryBuilder('e')
      .select('e.eventType', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(e.value)', 'totalValue')
      .where('e.createdAt >= :since', { since })
      .groupBy('e.eventType')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      audiences: {
        productViewers: viewedProducts.length,
        cartAbandoners: abandoned.length,
        customers: purchased.length,
        addToCartUsers: addedToCart.length,
      },
      eventSummary,
    };
  }

  // ── Revenue Analytics ─────────────────────────────────────────────────────
  async getRevenueAnalytics(period: string = '30d') {
    const since = this.getSince(period);

    const dailyRevenue = await this.orderRepo
      .createQueryBuilder('o')
      .select("DATE_FORMAT(o.createdAt, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(*)', 'orders')
      .addSelect('SUM(o.total)', 'revenue')
      .addSelect('AVG(o.total)', 'avgOrderValue')
      .where('o.createdAt >= :since', { since })
      .andWhere("o.status != 'cancelled'")
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    const revenueBySource = await this.eventRepo
      .createQueryBuilder('e')
      .select('e.utmSource', 'source')
      .addSelect('SUM(e.value)', 'revenue')
      .addSelect('COUNT(*)', 'conversions')
      .where('e.createdAt >= :since', { since })
      .andWhere("e.eventType = 'purchase'")
      .andWhere("e.utmSource IS NOT NULL AND e.utmSource != ''")
      .groupBy('e.utmSource')
      .orderBy('revenue', 'DESC')
      .getRawMany();

    const revenueByDevice = await this.eventRepo
      .createQueryBuilder('e')
      .select('e.deviceType', 'device')
      .addSelect('SUM(e.value)', 'revenue')
      .addSelect('COUNT(*)', 'conversions')
      .where('e.createdAt >= :since', { since })
      .andWhere("e.eventType = 'purchase'")
      .groupBy('e.deviceType')
      .getRawMany();

    return { dailyRevenue, revenueBySource, revenueByDevice };
  }

  // ── Event Counts for Dashboard ────────────────────────────────────────────
  async getEventCounts(period: string = '7d') {
    const since = this.getSince(period);

    const counts = await this.eventRepo
      .createQueryBuilder('e')
      .select('e.eventType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('e.createdAt >= :since', { since })
      .groupBy('e.eventType')
      .getRawMany();

    return counts.reduce((acc, c) => {
      acc[c.type] = parseInt(c.count);
      return acc;
    }, {} as Record<string, number>);
  }

  private getSince(period: string): Date {
    const now = new Date();
    switch (period) {
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }
}
