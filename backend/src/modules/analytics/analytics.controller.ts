import {
  Controller, Post, Get, Body, Param, Query, Req,
  UseGuards, HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';
import { Request } from 'express';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @HttpCode(200)
  async track(@Body() body: any, @Req() req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket?.remoteAddress ||
      '';

    // Sanitize inputs
    const visitorId = String(body.visitorId || '').replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 64);
    if (!visitorId) return { ok: false, error: 'missing visitorId' };

    return this.analyticsService.track({
      visitorId,
      ip,
      userAgent: String(body.userAgent || '').substring(0, 500),
      browser: String(body.browser || '').substring(0, 50),
      os: String(body.os || '').substring(0, 50),
      deviceType: String(body.deviceType || '').substring(0, 20),
      screenResolution: String(body.screenResolution || '').substring(0, 50),
      language: String(body.language || '').substring(0, 10),
      referrer: String(body.referrer || '').substring(0, 500),
      url: String(body.url || '/').substring(0, 500),
      pageTitle: String(body.pageTitle || '').substring(0, 255),
      utmSource: body.utmSource ? String(body.utmSource).substring(0, 100) : undefined,
      utmMedium: body.utmMedium ? String(body.utmMedium).substring(0, 100) : undefined,
      utmCampaign: body.utmCampaign ? String(body.utmCampaign).substring(0, 100) : undefined,
    });
  }

  @Post('duration')
  @HttpCode(200)
  async updateDuration(@Body() body: any) {
    const visitorId = String(body.visitorId || '').replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 64);
    if (!visitorId) return { ok: false };
    return this.analyticsService.updateDuration({
      visitorId,
      url: String(body.url || '/').substring(0, 500),
      duration: Math.min(Number(body.duration) || 0, 3600),
    });
  }

  @Get('dashboard')
  @UseGuards(AuthGuard('jwt'))
  async getDashboard(@Query('period') period: string) {
    return this.analyticsService.getDashboard(period);
  }

  @Get('live')
  @UseGuards(AuthGuard('jwt'))
  async getLive() {
    return this.analyticsService.getLiveVisitors();
  }

  @Get('visitor/:id')
  @UseGuards(AuthGuard('jwt'))
  async getVisitor(@Param('id') id: string) {
    return this.analyticsService.getVisitorDetail(+id);
  }
}
