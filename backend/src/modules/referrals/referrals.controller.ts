import { Controller, Get, Post, Put, Delete, Param, Query, Body, Req, UseGuards, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReferralsService } from './referrals.service';
import { Request } from 'express';

@Controller('referrals')
export class ReferralsController {
  constructor(private service: ReferralsService) {}

  // ── Public endpoints ──────────────────────────────────────────────────────

  @Post('click')
  @HttpCode(200)
  async trackClick(@Body() body: any, @Req() req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket?.remoteAddress || '';

    return this.service.trackClick({
      code: String(body.code || '').substring(0, 20),
      ip,
      userAgent: req.headers['user-agent']?.substring(0, 500),
      landingPage: body.landingPage ? String(body.landingPage).substring(0, 500) : undefined,
      visitorFingerprint: body.visitorFingerprint ? String(body.visitorFingerprint).substring(0, 64) : undefined,
    });
  }

  @Get('validate/:code')
  validateCode(@Param('code') code: string) {
    return this.service.validateCode(code);
  }

  // ── Partner endpoints (public auth via email/password) ────────────────────

  @Post('partner/login')
  @HttpCode(200)
  partnerLogin(@Body() body: { email: string; password: string }) {
    return this.service.partnerLogin(body.email, body.password);
  }

  @Post('partner/dashboard')
  @HttpCode(200)
  getPartnerDashboard(@Body() body: { partnerId: number; email: string }) {
    return this.service.getPartnerDashboard(body.partnerId);
  }

  @Post('partner/bank-details')
  @HttpCode(200)
  updateBankDetails(@Body() body: { partnerId: number; bankName: string; accountTitle: string; accountNumber: string; iban?: string }) {
    return this.service.updateBankDetails(body.partnerId, body);
  }

  @Post('partner/withdraw')
  @HttpCode(200)
  requestWithdrawal(@Body() body: { partnerId: number; amount: number }) {
    return this.service.requestWithdrawal(body.partnerId, body.amount);
  }

  // ── Admin endpoints ───────────────────────────────────────────────────────

  @Get('admin/list')
  @UseGuards(AuthGuard('jwt'))
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get('admin/stats')
  @UseGuards(AuthGuard('jwt'))
  getStats() {
    return this.service.getStats();
  }

  @Get('admin/withdrawals')
  @UseGuards(AuthGuard('jwt'))
  getWithdrawals(@Query() query: any) {
    return this.service.getWithdrawals(query);
  }

  @Put('admin/withdrawal/:id/status')
  @UseGuards(AuthGuard('jwt'))
  updateWithdrawalStatus(@Param('id') id: number, @Body() body: any) {
    return this.service.updateWithdrawalStatus(+id, body);
  }

  @Get('admin/:id')
  @UseGuards(AuthGuard('jwt'))
  findById(@Param('id') id: number) {
    return this.service.findById(+id);
  }

  @Get('admin/:id/conversions')
  @UseGuards(AuthGuard('jwt'))
  getConversions(@Param('id') id: number, @Query() query: any) {
    return this.service.getConversions(+id, query);
  }

  @Post('admin')
  @UseGuards(AuthGuard('jwt'))
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put('admin/:id')
  @UseGuards(AuthGuard('jwt'))
  update(@Param('id') id: number, @Body() body: any) {
    return this.service.update(+id, body);
  }

  @Delete('admin/:id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: number) {
    return this.service.remove(+id);
  }

  @Put('admin/conversion/:id/status')
  @UseGuards(AuthGuard('jwt'))
  updateConversionStatus(@Param('id') id: number, @Body() body: any) {
    return this.service.updateConversionStatus(+id, body);
  }
}
