import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Referral, ReferralClick, ReferralConversion, Order, Withdrawal, Customer } from '../../entities';
import * as bcrypt from 'bcrypt';

function generateCode(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${clean}${rand}`;
}

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral) private refRepo: Repository<Referral>,
    @InjectRepository(ReferralClick) private clickRepo: Repository<ReferralClick>,
    @InjectRepository(ReferralConversion) private convRepo: Repository<ReferralConversion>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Withdrawal) private withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
  ) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────
  async create(data: { name: string; email?: string; phone?: string; commissionRate?: number; notes?: string; password?: string }) {
    if (!data.name) throw new BadRequestException('Name is required');

    let code = generateCode(data.name);
    let existing = await this.refRepo.findOne({ where: { code } });
    let attempts = 0;
    while (existing && attempts < 10) {
      code = generateCode(data.name);
      existing = await this.refRepo.findOne({ where: { code } });
      attempts++;
    }

    const referral = this.refRepo.create({
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      code,
      commissionRate: data.commissionRate || 10,
      notes: data.notes || undefined,
    });

    if (data.password) {
      referral.password = await bcrypt.hash(data.password, 10);
    }

    return this.refRepo.save(referral);
  }

  async findAll(query: any) {
    const { page = 1, limit = 20, search, active } = query;
    const qb = this.refRepo.createQueryBuilder('r')
      .orderBy('r.createdAt', 'DESC');

    if (search) {
      qb.andWhere('(r.name LIKE :s OR r.email LIKE :s OR r.code LIKE :s OR r.phone LIKE :s)', { s: `%${search}%` });
    }
    if (active === 'true') qb.andWhere('r.isActive = true');
    if (active === 'false') qb.andWhere('r.isActive = false');

    const total = await qb.getCount();
    const items = await qb
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .take(parseInt(limit as string))
      .getMany();

    // Strip password from response
    items.forEach(i => { delete (i as any).password; });

    return { items, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) };
  }

  async findById(id: number) {
    const ref = await this.refRepo.findOne({ where: { id } });
    if (!ref) throw new NotFoundException('Referral not found');
    delete (ref as any).password;
    return ref;
  }

  async update(id: number, data: any) {
    const ref = await this.refRepo.findOne({ where: { id } });
    if (!ref) throw new NotFoundException('Referral not found');
    if (data.name !== undefined) ref.name = data.name;
    if (data.email !== undefined) ref.email = data.email;
    if (data.phone !== undefined) ref.phone = data.phone;
    if (data.commissionRate !== undefined) ref.commissionRate = data.commissionRate;
    if (data.isActive !== undefined) ref.isActive = data.isActive;
    if (data.notes !== undefined) ref.notes = data.notes;
    if (data.bankName !== undefined) ref.bankName = data.bankName;
    if (data.accountTitle !== undefined) ref.accountTitle = data.accountTitle;
    if (data.accountNumber !== undefined) ref.accountNumber = data.accountNumber;
    if (data.iban !== undefined) ref.iban = data.iban;
    if (data.password) ref.password = await bcrypt.hash(data.password, 10);
    const saved = await this.refRepo.save(ref);
    delete (saved as any).password;
    return saved;
  }

  async remove(id: number) {
    const ref = await this.refRepo.findOne({ where: { id } });
    if (!ref) throw new NotFoundException('Referral not found');
    await this.refRepo.remove(ref);
    return { success: true };
  }

  // ── Partner Login ─────────────────────────────────────────────────────────
  async partnerLogin(email: string, password: string) {
    if (!email || !password) throw new BadRequestException('Email and password required');
    const ref = await this.refRepo.findOne({ where: { email, isActive: true } });
    if (!ref || !ref.password) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, ref.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    // Return partner data without password
    const { password: _, ...data } = ref as any;
    return { partner: data };
  }

  // ── Partner Dashboard ─────────────────────────────────────────────────────
  async getPartnerDashboard(id: number) {
    const ref = await this.refRepo.findOne({ where: { id } });
    if (!ref) throw new NotFoundException('Partner not found');

    const conversions = await this.convRepo.find({
      where: { referralId: id },
      relations: ['order'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const withdrawals = await this.withdrawalRepo.find({
      where: { referralId: id },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const convRate = ref.totalClicks > 0 ? ((ref.totalOrders / ref.totalClicks) * 100).toFixed(1) : '0';

    const { password: _, ...partnerData } = ref as any;
    return {
      partner: partnerData,
      conversions,
      withdrawals,
      conversionRate: convRate,
    };
  }

  // ── Partner Update Bank Details ───────────────────────────────────────────
  async updateBankDetails(id: number, data: { bankName: string; accountTitle: string; accountNumber: string; iban?: string }) {
    const ref = await this.refRepo.findOne({ where: { id } });
    if (!ref) throw new NotFoundException('Partner not found');
    ref.bankName = data.bankName;
    ref.accountTitle = data.accountTitle;
    ref.accountNumber = data.accountNumber;
    if (data.iban !== undefined) ref.iban = data.iban;
    await this.refRepo.save(ref);
    return { success: true };
  }

  // ── Withdrawal System ─────────────────────────────────────────────────────
  async requestWithdrawal(referralId: number, amount: number) {
    const ref = await this.refRepo.findOne({ where: { id: referralId } });
    if (!ref) throw new NotFoundException('Partner not found');
    if (!ref.bankName || !ref.accountNumber) throw new BadRequestException('Please add bank details first');

    const available = Number(ref.availableBalance);
    if (amount <= 0 || amount > available) throw new BadRequestException(`Available balance is Rs. ${available.toFixed(2)}`);

    const withdrawal = this.withdrawalRepo.create({
      referralId: ref.id,
      amount,
      status: 'pending',
      bankName: ref.bankName,
      accountTitle: ref.accountTitle,
      accountNumber: ref.accountNumber,
      iban: ref.iban,
    });
    await this.withdrawalRepo.save(withdrawal);

    // Deduct from available balance
    ref.availableBalance = Math.max(0, available - amount);
    await this.refRepo.save(ref);

    return withdrawal;
  }

  async getWithdrawals(query: any) {
    const { page = 1, limit = 20, status, referralId } = query;
    const qb = this.withdrawalRepo.createQueryBuilder('w')
      .leftJoinAndSelect('w.referral', 'r')
      .orderBy('w.createdAt', 'DESC');

    if (status) qb.andWhere('w.status = :s', { s: status });
    if (referralId) qb.andWhere('w.referralId = :rid', { rid: referralId });

    const total = await qb.getCount();
    const items = await qb
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .take(parseInt(limit as string))
      .getMany();

    return { items, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) };
  }

  async updateWithdrawalStatus(id: number, data: { status: string; adminNote?: string }) {
    const w = await this.withdrawalRepo.findOne({ where: { id }, relations: ['referral'] });
    if (!w) throw new NotFoundException('Withdrawal not found');

    const oldStatus = w.status;
    w.status = data.status;
    if (data.adminNote) w.adminNote = data.adminNote;
    if (data.status === 'processed') w.processedAt = new Date();

    const ref = w.referral;
    // If rejected, return amount to available balance
    if (data.status === 'rejected' && oldStatus === 'pending') {
      ref.availableBalance = Number(ref.availableBalance) + Number(w.amount);
      await this.refRepo.save(ref);
    }
    // If processed, move from pending to paid earnings
    if (data.status === 'processed' && oldStatus !== 'processed') {
      ref.paidEarnings = Number(ref.paidEarnings) + Number(w.amount);
      ref.pendingEarnings = Math.max(0, Number(ref.pendingEarnings) - Number(w.amount));
      await this.refRepo.save(ref);
    }

    return this.withdrawalRepo.save(w);
  }

  // ── Public: Track click ───────────────────────────────────────────────────
  async trackClick(data: { code: string; ip?: string; userAgent?: string; landingPage?: string; visitorFingerprint?: string }) {
    const ref = await this.refRepo.findOne({ where: { code: data.code, isActive: true } });
    if (!ref) return { ok: false, error: 'invalid code' };

    const click = this.clickRepo.create({
      referralId: ref.id,
      ip: data.ip || undefined,
      userAgent: data.userAgent ? data.userAgent.substring(0, 500) : undefined,
      landingPage: data.landingPage || undefined,
      visitorFingerprint: data.visitorFingerprint || undefined,
    });
    await this.clickRepo.save(click);

    ref.totalClicks += 1;
    await this.refRepo.save(ref);

    return { ok: true, referralId: ref.id };
  }

  // ── Record Conversion (called when order placed with ref code) ────────────
  async recordConversion(data: { code: string; orderId: number; orderAmount: number }) {
    const ref = await this.refRepo.findOne({ where: { code: data.code, isActive: true } });
    if (!ref) return null;

    const commissionAmount = +(data.orderAmount * (Number(ref.commissionRate) / 100)).toFixed(2);

    const conv = this.convRepo.create({
      referralId: ref.id,
      orderId: data.orderId,
      orderAmount: data.orderAmount,
      commissionAmount,
      status: 'pending',
    });
    await this.convRepo.save(conv);

    ref.totalOrders += 1;
    ref.totalEarnings = Number(ref.totalEarnings) + commissionAmount;
    ref.pendingEarnings = Number(ref.pendingEarnings) + commissionAmount;
    await this.refRepo.save(ref);

    return conv;
  }

  // ── Get conversions for a referral ────────────────────────────────────────
  async getConversions(referralId: number, query: any) {
    const { page = 1, limit = 20 } = query;
    const qb = this.convRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.order', 'o')
      .where('c.referralId = :rid', { rid: referralId })
      .orderBy('c.createdAt', 'DESC');

    const total = await qb.getCount();
    const items = await qb
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .take(parseInt(limit as string))
      .getMany();

    return { items, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) };
  }

  // ── Update conversion status (approve/pay/reject) ────────────────────────
  async updateConversionStatus(conversionId: number, data: { status: string; note?: string }) {
    const conv = await this.convRepo.findOne({ where: { id: conversionId }, relations: ['referral'] });
    if (!conv) throw new NotFoundException('Conversion not found');

    const oldStatus = conv.status;
    conv.status = data.status;
    if (data.note) conv.note = data.note;

    const ref = conv.referral;

    if (data.status === 'paid' && oldStatus !== 'paid') {
      ref.pendingEarnings = Math.max(0, Number(ref.pendingEarnings) - Number(conv.commissionAmount));
      ref.paidEarnings = Number(ref.paidEarnings) + Number(conv.commissionAmount);
    } else if (data.status === 'rejected' && oldStatus !== 'rejected') {
      ref.pendingEarnings = Math.max(0, Number(ref.pendingEarnings) - Number(conv.commissionAmount));
      ref.totalEarnings = Math.max(0, Number(ref.totalEarnings) - Number(conv.commissionAmount));
    } else if (data.status === 'approved' && oldStatus === 'pending') {
      // When approved, move to available balance (commission becomes withdrawable)
      ref.availableBalance = Number(ref.availableBalance) + Number(conv.commissionAmount);
    }

    await this.refRepo.save(ref);
    return this.convRepo.save(conv);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  async getStats() {
    const totalReferrals = await this.refRepo.count();
    const activeReferrals = await this.refRepo.count({ where: { isActive: true } });
    const totalClicks = await this.refRepo.createQueryBuilder('r').select('SUM(r.totalClicks)', 'total').getRawOne();
    const totalOrders = await this.refRepo.createQueryBuilder('r').select('SUM(r.totalOrders)', 'total').getRawOne();
    const totalEarnings = await this.refRepo.createQueryBuilder('r').select('SUM(r.totalEarnings)', 'total').getRawOne();
    const pendingEarnings = await this.refRepo.createQueryBuilder('r').select('SUM(r.pendingEarnings)', 'total').getRawOne();
    const paidEarnings = await this.refRepo.createQueryBuilder('r').select('SUM(r.paidEarnings)', 'total').getRawOne();

    const topPerformers = await this.refRepo.find({
      where: { isActive: true },
      order: { totalOrders: 'DESC' },
      take: 10,
    });
    topPerformers.forEach(p => { delete (p as any).password; });

    const recentConversions = await this.convRepo.find({
      relations: ['referral', 'order'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      totalReferrals,
      activeReferrals,
      totalClicks: parseInt(totalClicks?.total || '0'),
      totalOrders: parseInt(totalOrders?.total || '0'),
      totalEarnings: parseFloat(totalEarnings?.total || '0'),
      pendingEarnings: parseFloat(pendingEarnings?.total || '0'),
      paidEarnings: parseFloat(paidEarnings?.total || '0'),
      topPerformers,
      recentConversions,
    };
  }

  // ── Public: Validate referral code ────────────────────────────────────────
  async validateCode(code: string) {
    const ref = await this.refRepo.findOne({ where: { code, isActive: true } });
    return ref ? { valid: true, name: ref.name } : { valid: false };
  }
}
