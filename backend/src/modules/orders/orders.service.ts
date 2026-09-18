import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThanOrEqual, Like } from 'typeorm';
import { Order, OrderItem, OrderStatusHistory, Product, ProductVariant, Customer, Refund, Expense } from '../../entities';
import { EmailService } from '../email/email.service';
import { ReferralsService } from '../referrals/referrals.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private itemRepo: Repository<OrderItem>,
    @InjectRepository(OrderStatusHistory) private historyRepo: Repository<OrderStatusHistory>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Refund) private refundRepo: Repository<Refund>,
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
    private emailService: EmailService,
    private referralsService: ReferralsService,
  ) {}

  async create(data: any) {
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new BadRequestException('At least one order item is required');
    }

    const orderNumber = 'HG-' + uuid().slice(0, 8).toUpperCase();
    const productIds = Array.from(new Set(data.items.map((item: any) => item.productId)));
    const variantIds = Array.from(new Set(data.items.filter((item: any) => item.variantId).map((item: any) => item.variantId)));

    const products = await this.productRepo.find({
      where: { id: In(productIds), isActive: true },
      relations: ['images'],
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    if (productMap.size !== productIds.length) {
      throw new BadRequestException('One or more ordered products are unavailable');
    }

    const variants = variantIds.length
      ? await this.variantRepo.find({ where: { id: In(variantIds) } })
      : [];
    const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

    let subtotal = 0;
    const items = data.items.map((item: any) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException('One or more ordered products are unavailable');
      }

      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new BadRequestException('Invalid item quantity');
      }

      let variant: ProductVariant | undefined;
      if (item.variantId) {
        variant = variantMap.get(item.variantId);
        if (!variant || variant.productId !== product.id) {
          throw new BadRequestException('Invalid product variant selected');
        }
        if (variant.stock < quantity) {
          throw new BadRequestException(`Insufficient stock for ${product.name}${variant.size ? ` (${variant.size})` : ''}`);
        }
      }

      const unitPrice = Number(product.discountPrice || product.price);
      const primaryImage = product.images?.find((image) => image.isPrimary) || product.images?.[0];
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;
      return this.itemRepo.create({
        productId: product.id,
        variantId: variant?.id,
        productName: product.name,
        size: variant?.size || item.size,
        color: variant?.color || item.color,
        price: unitPrice,
        quantity,
        productImage: primaryImage?.url || item.productImage,
      });
    });

    const shippingFee = Math.max(0, Number(data.shippingFee) || 0);

    const order = this.orderRepo.create({
      orderNumber,
      customerName: data.customerName,
      email: data.email || null,
      phone: data.phone,
      whatsapp: data.whatsapp || null,
      address: data.address,
      city: data.city,
      notes: data.notes,
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      paymentMethod: 'COD',
      items,
    });

    const saved = await this.orderRepo.save(order);

    // Create initial status history
    await this.historyRepo.save(
      this.historyRepo.create({ orderId: saved.id, status: 'pending', note: 'Order placed' }),
    );

    // Update stock
    for (const item of data.items) {
      if (item.variantId) {
        await this.variantRepo.decrement({ id: item.variantId }, 'stock', item.quantity);
      }
    }

    // Send confirmation email (non-blocking)
    if (saved.email) {
      this.emailService.sendOrderConfirmation(saved).catch(() => {});
    }

    // Record referral conversion if referral code provided
    if (data.referralCode) {
      try {
        await this.referralsService.recordConversion({
          code: data.referralCode,
          orderId: saved.id,
          orderAmount: saved.total,
        });
      } catch {}
    }

    // Auto-create or update customer account by phone number
    try {
      const phone = data.phone?.replace(/[^0-9]/g, '');
      if (phone) {
        let customer = await this.customerRepo.findOne({ where: { phone } });
        if (customer) {
          customer.orderCount += 1;
          customer.totalSpent = Number(customer.totalSpent) + saved.total;
          if (data.customerName) customer.name = data.customerName;
          if (data.email) customer.email = data.email;
          if (data.whatsapp) customer.whatsapp = data.whatsapp;
          if (data.address) customer.address = data.address;
          if (data.city) customer.city = data.city;
          await this.customerRepo.save(customer);
        } else {
          await this.customerRepo.save(this.customerRepo.create({
            phone,
            name: data.customerName,
            email: data.email || null,
            whatsapp: data.whatsapp || null,
            address: data.address,
            city: data.city,
            orderCount: 1,
            totalSpent: saved.total,
          }));
        }
      }
    } catch {}

    return saved;
  }

  async findAll(query: any) {
    const { page = 1, limit = 20, status, search, dateFrom, dateTo } = query;
    const qb = this.orderRepo.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .orderBy('order.createdAt', 'DESC');

    if (status && status !== 'all') {
      qb.andWhere('order.status = :status', { status });
    }

    if (search) {
      qb.andWhere('(order.orderNumber LIKE :s OR order.customerName LIKE :s OR order.phone LIKE :s OR order.whatsapp LIKE :s OR order.email LIKE :s)', {
        s: `%${search}%`,
      });
    }

    if (dateFrom) {
      qb.andWhere('order.createdAt >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      qb.andWhere('order.createdAt < :dateTo', { dateTo: endDate });
    }

    const total = await qb.getCount();
    const items = await qb.skip((parseInt(page as string) - 1) * parseInt(limit as string)).take(parseInt(limit as string)).getMany();

    return { items, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) };
  }

  async findById(id: number) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'statusHistory'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.statusHistory) {
      order.statusHistory.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return order;
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.orderRepo.findOne({
      where: { orderNumber },
      relations: ['items', 'statusHistory'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.statusHistory) {
      order.statusHistory.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    // Mask sensitive data for public tracking endpoint
    return {
      ...order,
      phone: order.phone.slice(0, 4) + '****' + order.phone.slice(-2),
      email: order.email ? order.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null,
      address: order.address.length > 10 ? order.address.slice(0, 10) + '...' : order.address,
      adminNotes: undefined,
    };
  }

  async updateStatus(id: number, status: string, data?: { note?: string; trackingNumber?: string; courierName?: string }) {
    const order = await this.findById(id);
    order.status = status;
    if (data?.trackingNumber !== undefined) order.trackingNumber = data.trackingNumber;
    if (data?.courierName !== undefined) order.courierName = data.courierName;
    await this.orderRepo.save(order);

    // Record history
    await this.historyRepo.save(
      this.historyRepo.create({ orderId: id, status, note: data?.note }),
    );

    // Send email notification (non-blocking)
    if (order.email) {
      this.emailService.sendOrderStatusUpdate(order, data?.note).catch(() => {});
    }

    return this.findById(id);
  }

  async updateOrder(id: number, data: any) {
    const order = await this.findById(id);
    if (data.trackingNumber !== undefined) order.trackingNumber = data.trackingNumber;
    if (data.courierName !== undefined) order.courierName = data.courierName;
    if (data.adminNotes !== undefined) order.adminNotes = data.adminNotes;
    return this.orderRepo.save(order);
  }

  async getDashboardStats() {
    const totalOrders = await this.orderRepo.count();
    const pendingOrders = await this.orderRepo.count({ where: { status: 'pending' } });
    const confirmedOrders = await this.orderRepo.count({ where: { status: 'confirmed' } });
    const shippedOrders = await this.orderRepo.count({ where: { status: 'shipped' } });
    const deliveredOrders = await this.orderRepo.count({ where: { status: 'delivered' } });

    const revenueResult = await this.orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.status != :s', { s: 'cancelled' })
      .getRawOne();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = await this.orderRepo.count({
      where: { createdAt: Between(today, tomorrow) },
    });

    const todayRevenue = await this.orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.createdAt BETWEEN :start AND :end', { start: today, end: tomorrow })
      .andWhere('order.status != :s', { s: 'cancelled' })
      .getRawOne();

    const cancelledOrders = await this.orderRepo.count({ where: { status: 'cancelled' } });

    // Weekly stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const weeklyOrders = await this.orderRepo.count({ where: { createdAt: MoreThanOrEqual(weekAgo) } });
    const weeklyRevenue = await this.orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.createdAt >= :start', { start: weekAgo })
      .andWhere('order.status != :s', { s: 'cancelled' })
      .getRawOne();

    // Daily orders for chart (last 30 days)
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    monthAgo.setHours(0, 0, 0, 0);
    const dailyOrders = await this.orderRepo
      .createQueryBuilder('order')
      .select('DATE(order.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(order.total)', 'revenue')
      .where('order.createdAt >= :start', { start: monthAgo })
      .groupBy('DATE(order.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Top products
    const topProducts = await this.itemRepo
      .createQueryBuilder('item')
      .select('item.productName', 'name')
      .addSelect('SUM(item.quantity)', 'totalSold')
      .addSelect('SUM(item.price * item.quantity)', 'totalRevenue')
      .groupBy('item.productName')
      .orderBy('totalSold', 'DESC')
      .limit(10)
      .getRawMany();

    // Top cities
    const topCities = await this.orderRepo
      .createQueryBuilder('order')
      .select('order.city', 'city')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(order.total)', 'revenue')
      .where('order.status != :s', { s: 'cancelled' })
      .groupBy('order.city')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // Avg order value
    const avgResult = await this.orderRepo
      .createQueryBuilder('order')
      .select('AVG(order.total)', 'avg')
      .where('order.status != :s', { s: 'cancelled' })
      .getRawOne();

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: parseFloat(revenueResult?.total || '0'),
      todayOrders,
      todayRevenue: parseFloat(todayRevenue?.total || '0'),
      weeklyOrders,
      weeklyRevenue: parseFloat(weeklyRevenue?.total || '0'),
      avgOrderValue: parseFloat(avgResult?.avg || '0'),
      dailyOrders,
      topProducts,
      topCities,
    };
  }

  async getCustomers(query: any) {
    const { page = 1, limit = 20, search } = query;
    const qb = this.customerRepo.createQueryBuilder('c')
      .orderBy('c.updatedAt', 'DESC');

    if (search) {
      qb.where('(c.name LIKE :s OR c.phone LIKE :s OR c.email LIKE :s OR c.city LIKE :s)', { s: `%${search}%` });
    }

    const total = await qb.getCount();
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const items = await qb.skip(skip).take(parseInt(limit as string)).getMany();
    return { items, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) };
  }

  async getLowStockVariants() {
    const variants = await this.variantRepo
      .createQueryBuilder('v')
      .leftJoin('v.product', 'p')
      .leftJoin('p.images', 'img', 'img.isPrimary = 1')
      .select('v.id', 'variantId')
      .addSelect('p.name', 'productName')
      .addSelect('p.slug', 'productSlug')
      .addSelect('img.url', 'productImage')
      .addSelect('v.size', 'size')
      .addSelect('v.color', 'color')
      .addSelect('v.sku', 'sku')
      .addSelect('v.stock', 'stock')
      .addSelect('v.variantPrice', 'price')
      .where('v.stock <= :threshold', { threshold: 5 })
      .orderBy('v.stock', 'ASC')
      .getRawMany();
    return variants;
  }

  // ─── Full Inventory ──────────────────────────────────────────────────────────

  async getInventory(query: any) {
    const { page = 1, limit = 30, search, stock, sort = 'stock_asc' } = query;
    const qb = this.variantRepo.createQueryBuilder('v')
      .leftJoin('v.product', 'p')
      .leftJoin('p.images', 'img', 'img.isPrimary = 1')
      .select([
        'v.id AS id', 'v.productId AS productId', 'p.name AS productName', 'p.slug AS productSlug',
        'img.url AS productImage', 'v.size AS size', 'v.color AS color', 'v.colorCode AS colorCode',
        'v.sku AS sku', 'v.stock AS stock', 'v.variantPrice AS variantPrice',
        'v.costPrice AS costPrice', 'v.image AS variantImage', 'v.isActive AS isActive',
        'p.price AS productPrice', 'p.costPrice AS productCostPrice',
      ]);

    if (search) {
      qb.andWhere('(p.name LIKE :s OR v.sku LIKE :s OR v.color LIKE :s OR v.size LIKE :s)', { s: `%${search}%` });
    }
    if (stock === 'out') qb.andWhere('v.stock = 0');
    else if (stock === 'low') qb.andWhere('v.stock > 0 AND v.stock <= 5');
    else if (stock === 'in') qb.andWhere('v.stock > 5');

    const [sortField, sortDir] = sort.split('_');
    if (sortField === 'stock') qb.orderBy('v.stock', sortDir === 'desc' ? 'DESC' : 'ASC');
    else if (sortField === 'name') qb.orderBy('p.name', sortDir === 'desc' ? 'DESC' : 'ASC');
    else if (sortField === 'sku') qb.orderBy('v.sku', sortDir === 'desc' ? 'DESC' : 'ASC');
    else qb.orderBy('v.stock', 'ASC');

    const total = await qb.getCount();
    const items = await qb.offset((parseInt(page as string) - 1) * parseInt(limit as string)).limit(parseInt(limit as string)).getRawMany();
    return { items, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) };
  }

  async updateStock(variantId: number, data: { stock: number }) {
    const variant = await this.variantRepo.findOne({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');
    variant.stock = Math.max(0, data.stock);
    return this.variantRepo.save(variant);
  }

  async batchUpdateStock(items: { id: number; stock: number }[]) {
    for (const item of items) {
      await this.variantRepo.update(item.id, { stock: Math.max(0, item.stock) });
    }
    return { updated: items.length };
  }

  async getInventoryStats() {
    const totalVariants = await this.variantRepo.count();
    const outOfStock = await this.variantRepo.count({ where: { stock: 0 } });
    const lowStockQb = this.variantRepo.createQueryBuilder('v').where('v.stock > 0 AND v.stock <= 5');
    const lowStock = await lowStockQb.getCount();
    const inStock = totalVariants - outOfStock - lowStock;
    const totalStockResult = await this.variantRepo.createQueryBuilder('v').select('SUM(v.stock)', 'total').getRawOne();
    const totalStockValue = await this.variantRepo.createQueryBuilder('v')
      .select('SUM(v.stock * COALESCE(v.costPrice, 0))', 'value')
      .getRawOne();
    return {
      totalVariants, outOfStock, lowStock, inStock,
      totalUnits: parseInt(totalStockResult?.total || '0'),
      stockValue: parseFloat(totalStockValue?.value || '0'),
    };
  }

  // ─── Refunds ─────────────────────────────────────────────────────────────────

  async getRefunds(query: any) {
    const { page = 1, limit = 20, status, search } = query;
    const qb = this.refundRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.order', 'o')
      .orderBy('r.createdAt', 'DESC');

    if (status && status !== 'all') qb.andWhere('r.status = :status', { status });
    if (search) qb.andWhere('(o.orderNumber LIKE :s OR o.customerName LIKE :s)', { s: `%${search}%` });

    const total = await qb.getCount();
    const items = await qb.skip((parseInt(page as string) - 1) * parseInt(limit as string)).take(parseInt(limit as string)).getMany();
    return { items, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) };
  }

  async createRefund(data: any) {
    const order = await this.orderRepo.findOne({ where: { id: data.orderId } });
    if (!order) throw new NotFoundException('Order not found');
    const refund = this.refundRepo.create({
      orderId: data.orderId,
      amount: data.amount,
      reason: data.reason,
      method: data.method || null,
      status: 'pending',
    });
    return this.refundRepo.save(refund);
  }

  async updateRefund(id: number, data: any) {
    const refund = await this.refundRepo.findOne({ where: { id } });
    if (!refund) throw new NotFoundException('Refund not found');
    if (data.status) refund.status = data.status;
    if (data.adminNote !== undefined) refund.adminNote = data.adminNote;
    if (data.method !== undefined) refund.method = data.method;
    return this.refundRepo.save(refund);
  }

  async getRefundStats() {
    const total = await this.refundRepo.count();
    const pending = await this.refundRepo.count({ where: { status: 'pending' } });
    const approved = await this.refundRepo.count({ where: { status: 'approved' } });
    const totalAmount = await this.refundRepo.createQueryBuilder('r')
      .select('SUM(r.amount)', 'total')
      .where('r.status = :s', { s: 'approved' })
      .getRawOne();
    return { total, pending, approved, totalRefunded: parseFloat(totalAmount?.total || '0') };
  }

  // ─── Expenses ────────────────────────────────────────────────────────────────

  async getExpenses(query: any) {
    const { page = 1, limit = 20, category, search, dateFrom, dateTo } = query;
    const qb = this.expenseRepo.createQueryBuilder('e')
      .orderBy('e.date', 'DESC');

    if (category && category !== 'all') qb.andWhere('e.category = :category', { category });
    if (search) qb.andWhere('(e.title LIKE :s OR e.description LIKE :s)', { s: `%${search}%` });
    if (dateFrom) qb.andWhere('e.date >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('e.date <= :dateTo', { dateTo });

    const total = await qb.getCount();
    const items = await qb.skip((parseInt(page as string) - 1) * parseInt(limit as string)).take(parseInt(limit as string)).getMany();
    return { items, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) };
  }

  async createExpense(data: any) {
    const expense = this.expenseRepo.create({
      title: data.title,
      amount: data.amount,
      category: data.category,
      description: data.description || null,
      productId: data.productId || null,
      date: data.date || new Date().toISOString().slice(0, 10),
      receipt: data.receipt || null,
    });
    return this.expenseRepo.save(expense);
  }

  async updateExpense(id: number, data: any) {
    const expense = await this.expenseRepo.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    Object.assign(expense, {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.date !== undefined && { date: data.date }),
      ...(data.receipt !== undefined && { receipt: data.receipt }),
    });
    return this.expenseRepo.save(expense);
  }

  async deleteExpense(id: number) {
    const expense = await this.expenseRepo.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    await this.expenseRepo.remove(expense);
    return { success: true };
  }

  async getExpenseStats(query?: any) {
    const { dateFrom, dateTo } = query || {};
    const qb = this.expenseRepo.createQueryBuilder('e');
    if (dateFrom) qb.andWhere('e.date >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('e.date <= :dateTo', { dateTo });

    const totalResult = await qb.clone().select('SUM(e.amount)', 'total').getRawOne();
    const byCategory = await qb.clone()
      .select('e.category', 'category')
      .addSelect('SUM(e.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .groupBy('e.category')
      .orderBy('total', 'DESC')
      .getRawMany();

    const monthlyExpenses = await this.expenseRepo.createQueryBuilder('e')
      .select('DATE_FORMAT(e.date, "%Y-%m")', 'month')
      .addSelect('SUM(e.amount)', 'total')
      .groupBy('month')
      .orderBy('month', 'DESC')
      .limit(12)
      .getRawMany();

    return {
      totalExpenses: parseFloat(totalResult?.total || '0'),
      byCategory,
      monthlyExpenses,
    };
  }
}
