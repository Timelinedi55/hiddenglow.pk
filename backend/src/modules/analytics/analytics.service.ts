import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Between } from 'typeorm';
import { Visitor, PageView } from '../../entities';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Visitor) private visitorRepo: Repository<Visitor>,
    @InjectRepository(PageView) private pageViewRepo: Repository<PageView>,
  ) {}

  async track(data: {
    visitorId: string;
    ip: string;
    userAgent: string;
    browser: string;
    os: string;
    deviceType: string;
    screenResolution: string;
    language: string;
    referrer: string;
    url: string;
    pageTitle: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }) {
    let visitor = await this.visitorRepo.findOne({
      where: { fingerprint: data.visitorId },
    });

    if (!visitor) {
      const v = new Visitor();
      v.fingerprint = data.visitorId;
      v.ip = (data.ip || '').substring(0, 45);
      v.userAgent = (data.userAgent || '').substring(0, 500);
      v.browser = (data.browser || '').substring(0, 50);
      v.os = (data.os || '').substring(0, 50);
      v.deviceType = (data.deviceType || '').substring(0, 20);
      v.screenResolution = (data.screenResolution || '').substring(0, 50);
      v.language = (data.language || '').substring(0, 10);
      v.referrer = (data.referrer || '').substring(0, 500);
      v.utmSource = (data.utmSource || '').substring(0, 100);
      v.utmMedium = (data.utmMedium || '').substring(0, 100);
      v.utmCampaign = (data.utmCampaign || '').substring(0, 100);
      v.totalVisits = 1;
      v.totalPageViews = 1;
      v.lastVisit = new Date();
      visitor = await this.visitorRepo.save(v);
    } else {
      visitor.totalPageViews += 1;
      visitor.lastVisit = new Date();
      visitor.ip = (data.ip || visitor.ip || '').substring(0, 45);
      if (data.referrer && data.referrer !== visitor.referrer) {
        visitor.totalVisits += 1;
      }
      await this.visitorRepo.save(visitor);
    }

    const pageView = new PageView();
    pageView.visitorId = visitor.id;
    pageView.url = (data.url || '/').substring(0, 500);
    pageView.pageTitle = (data.pageTitle || '').substring(0, 255);
    pageView.referrer = (data.referrer || '').substring(0, 500);
    await this.pageViewRepo.save(pageView);

    return { ok: true };
  }

  async updateDuration(data: { visitorId: string; url: string; duration: number }) {
    const visitor = await this.visitorRepo.findOne({
      where: { fingerprint: data.visitorId },
    });
    if (!visitor) return { ok: false };

    const pv = await this.pageViewRepo.findOne({
      where: { visitorId: visitor.id, url: data.url.substring(0, 500) },
      order: { viewedAt: 'DESC' },
    });
    if (pv) {
      pv.duration = Math.min(data.duration || 0, 3600);
      await this.pageViewRepo.save(pv);
    }
    return { ok: true };
  }

  async getDashboard(period: string = '7d') {
    const now = new Date();
    let since: Date;
    switch (period) {
      case '24h': since = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case '7d': since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      default: since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const [
      totalVisitors,
      newVisitors,
      totalPageViews,
      topPages,
      topReferrers,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      recentVisitors,
      dailyStats,
    ] = await Promise.all([
      // Total unique visitors in period
      this.visitorRepo.count({
        where: { lastVisit: MoreThanOrEqual(since) },
      }),
      // New visitors in period
      this.visitorRepo.count({
        where: { firstVisit: MoreThanOrEqual(since) },
      }),
      // Total page views in period
      this.pageViewRepo.count({
        where: { viewedAt: MoreThanOrEqual(since) },
      }),
      // Top pages
      this.pageViewRepo
        .createQueryBuilder('pv')
        .select('pv.url', 'url')
        .addSelect('pv.pageTitle', 'pageTitle')
        .addSelect('COUNT(*)', 'views')
        .addSelect('COUNT(DISTINCT pv.visitorId)', 'uniqueVisitors')
        .addSelect('ROUND(AVG(pv.duration))', 'avgDuration')
        .where('pv.viewedAt >= :since', { since })
        .groupBy('pv.url')
        .addGroupBy('pv.pageTitle')
        .orderBy('views', 'DESC')
        .limit(20)
        .getRawMany(),
      // Top referrers
      this.visitorRepo
        .createQueryBuilder('v')
        .select('v.referrer', 'referrer')
        .addSelect('COUNT(*)', 'count')
        .where('v.lastVisit >= :since', { since })
        .andWhere("v.referrer IS NOT NULL AND v.referrer != ''")
        .groupBy('v.referrer')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany(),
      // Device breakdown
      this.visitorRepo
        .createQueryBuilder('v')
        .select('v.deviceType', 'type')
        .addSelect('COUNT(*)', 'count')
        .where('v.lastVisit >= :since', { since })
        .groupBy('v.deviceType')
        .getRawMany(),
      // Browser breakdown
      this.visitorRepo
        .createQueryBuilder('v')
        .select('v.browser', 'name')
        .addSelect('COUNT(*)', 'count')
        .where('v.lastVisit >= :since', { since })
        .groupBy('v.browser')
        .orderBy('count', 'DESC')
        .limit(8)
        .getRawMany(),
      // OS breakdown
      this.visitorRepo
        .createQueryBuilder('v')
        .select('v.os', 'name')
        .addSelect('COUNT(*)', 'count')
        .where('v.lastVisit >= :since', { since })
        .groupBy('v.os')
        .orderBy('count', 'DESC')
        .limit(8)
        .getRawMany(),
      // Recent visitors with page views
      this.visitorRepo.find({
        where: { lastVisit: MoreThanOrEqual(since) },
        relations: ['pageViews'],
        order: { lastVisit: 'DESC' },
        take: 50,
      }),
      // Daily page views and visitors for chart
      this.getDailyStats(since),
    ]);

    return {
      overview: {
        totalVisitors,
        newVisitors,
        returningVisitors: totalVisitors - newVisitors,
        totalPageViews,
        avgPagesPerVisit: totalVisitors > 0 ? +(totalPageViews / totalVisitors).toFixed(1) : 0,
      },
      topPages,
      topReferrers,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      recentVisitors: recentVisitors.map((v) => ({
        id: v.id,
        visitorId: v.fingerprint,
        ip: v.ip,
        country: v.country,
        city: v.city,
        browser: v.browser,
        os: v.os,
        deviceType: v.deviceType,
        screenResolution: v.screenResolution,
        referrer: v.referrer,
        totalVisits: v.totalVisits,
        totalPageViews: v.totalPageViews,
        firstVisit: v.firstVisit,
        lastVisit: v.lastVisit,
        pages: (v.pageViews || [])
          .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
          .slice(0, 20)
          .map((pv) => ({
            url: pv.url,
            pageTitle: pv.pageTitle,
            duration: pv.duration,
            viewedAt: pv.viewedAt,
          })),
      })),
      dailyStats,
    };
  }

  private async getDailyStats(since: Date) {
    const raw = await this.pageViewRepo
      .createQueryBuilder('pv')
      .select("DATE_FORMAT(pv.viewedAt, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(*)', 'pageViews')
      .addSelect('COUNT(DISTINCT pv.visitorId)', 'visitors')
      .where('pv.viewedAt >= :since', { since })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();
    return raw;
  }

  async getVisitorDetail(id: number) {
    const visitor = await this.visitorRepo.findOne({
      where: { id },
      relations: ['pageViews'],
    });
    if (!visitor) return null;
    return {
      ...visitor,
      pageViews: (visitor.pageViews || [])
        .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()),
    };
  }

  async getLiveVisitors() {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const visitors = await this.pageViewRepo
      .createQueryBuilder('pv')
      .innerJoinAndSelect('pv.visitor', 'v')
      .where('pv.viewedAt >= :since', { since: fiveMinAgo })
      .orderBy('pv.viewedAt', 'DESC')
      .getMany();

    const uniqueMap = new Map<number, any>();
    for (const pv of visitors) {
      if (!uniqueMap.has(pv.visitor.id)) {
        uniqueMap.set(pv.visitor.id, {
          id: pv.visitor.id,
          ip: pv.visitor.ip,
          browser: pv.visitor.browser,
          os: pv.visitor.os,
          deviceType: pv.visitor.deviceType,
          currentPage: pv.url,
          pageTitle: pv.pageTitle,
          lastSeen: pv.viewedAt,
        });
      }
    }
    return Array.from(uniqueMap.values());
  }
}
