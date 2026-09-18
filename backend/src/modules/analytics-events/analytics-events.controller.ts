import { Controller, Get, Post, Body, Query, Req, UseGuards, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsEventsService } from './analytics-events.service';
import { Request } from 'express';

@Controller('analytics-events')
export class AnalyticsEventsController {
  constructor(private service: AnalyticsEventsService) {}

  // Public endpoint: track e-commerce events from frontend
  @Post('track')
  @HttpCode(200)
  async trackEvent(@Body() body: any, @Req() req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket?.remoteAddress || '';

    const visitorFingerprint = String(body.visitorFingerprint || '').replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 64);
    const eventType = String(body.eventType || '').substring(0, 50);

    if (!eventType) return { ok: false, error: 'missing eventType' };

    const allowedEvents = ['view_product', 'add_to_cart', 'remove_from_cart', 'begin_checkout', 'purchase', 'search', 'view_category'];
    if (!allowedEvents.includes(eventType)) return { ok: false, error: 'invalid eventType' };

    return this.service.trackEvent({
      visitorFingerprint: visitorFingerprint || undefined,
      eventType,
      eventData: body.eventData || null,
      url: body.url ? String(body.url).substring(0, 500) : undefined,
      utmSource: body.utmSource ? String(body.utmSource).substring(0, 100) : undefined,
      utmMedium: body.utmMedium ? String(body.utmMedium).substring(0, 100) : undefined,
      utmCampaign: body.utmCampaign ? String(body.utmCampaign).substring(0, 100) : undefined,
      utmContent: body.utmContent ? String(body.utmContent).substring(0, 100) : undefined,
      utmTerm: body.utmTerm ? String(body.utmTerm).substring(0, 100) : undefined,
      deviceType: body.deviceType ? String(body.deviceType).substring(0, 20) : undefined,
      ip,
      referralCode: body.referralCode ? String(body.referralCode).substring(0, 20) : undefined,
      value: body.value ? Math.max(0, Number(body.value)) : undefined,
      currency: body.currency ? String(body.currency).substring(0, 3) : 'PKR',
    });
  }

  // Admin endpoints
  @Get('funnel')
  @UseGuards(AuthGuard('jwt'))
  getConversionFunnel(@Query('period') period: string) {
    return this.service.getConversionFunnel(period);
  }

  @Get('campaigns')
  @UseGuards(AuthGuard('jwt'))
  getCampaignAnalytics(@Query('period') period: string) {
    return this.service.getCampaignAnalytics(period);
  }

  @Get('dropoff')
  @UseGuards(AuthGuard('jwt'))
  getDropoffAnalysis(@Query('period') period: string) {
    return this.service.getDropoffAnalysis(period);
  }

  @Get('remarketing')
  @UseGuards(AuthGuard('jwt'))
  getRemarketingData(@Query('period') period: string) {
    return this.service.getRemarketingData(period);
  }

  @Get('revenue')
  @UseGuards(AuthGuard('jwt'))
  getRevenueAnalytics(@Query('period') period: string) {
    return this.service.getRevenueAnalytics(period);
  }

  @Get('counts')
  @UseGuards(AuthGuard('jwt'))
  getEventCounts(@Query('period') period: string) {
    return this.service.getEventCounts(period);
  }
}
