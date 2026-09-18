import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReturnOrder, ReturnItem, Order, OrderItem, ProductVariant, Refund } from '../../entities';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(ReturnOrder) private returnRepo: Repository<ReturnOrder>,
    @InjectRepository(ReturnItem) private returnItemRepo: Repository<ReturnItem>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
    @InjectRepository(Refund) private refundRepo: Repository<Refund>,
  ) {}

  // Create a return request - auto-fetches order details
  async create(data: { orderId: number; reason: string; reasonDetail?: string; items: { orderItemId: number; quantity: number }[] }) {
    const order = await this.orderRepo.findOne({
      where: { id: data.orderId },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException('Order not found');

    if (!['delivered', 'shipped'].includes(order.status)) {
      throw new BadRequestException('Returns can only be created for delivered or shipped orders');
    }

    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('At least one item must be selected for return');
    }

    const returnNumber = 'RT-' + uuid().slice(0, 8).toUpperCase();

    // Build return items from order items
    const orderItemMap = new Map(order.items.map((i) => [i.id, i]));
    let refundAmount = 0;

    const returnItems: Partial<ReturnItem>[] = [];
    for (const reqItem of data.items) {
      const orderItem = orderItemMap.get(reqItem.orderItemId);
      if (!orderItem) throw new BadRequestException(`Order item ${reqItem.orderItemId} not found`);
      if (reqItem.quantity > orderItem.quantity) {
        throw new BadRequestException(`Cannot return more than ordered quantity for ${orderItem.productName}`);
      }

      const lineRefund = Number(orderItem.price) * reqItem.quantity;
      refundAmount += lineRefund;

      returnItems.push({
        orderItemId: orderItem.id,
        productId: orderItem.productId,
        variantId: orderItem.variantId || undefined,
        productName: orderItem.productName,
        size: orderItem.size,
        color: orderItem.color,
        quantity: reqItem.quantity,
        price: Number(orderItem.price),
        productImage: orderItem.productImage,
        condition: 'pending',
      });
    }

    const returnOrder = this.returnRepo.create({
      returnNumber,
      orderId: data.orderId,
      status: 'requested',
      reason: data.reason,
      reasonDetail: data.reasonDetail || undefined,
      refundAmount,
      items: returnItems.map((item) => this.returnItemRepo.create(item)),
    });

    return this.returnRepo.save(returnOrder);
  }

  async findAll(query: any) {
    const { page = 1, limit = 20, status, search } = query;
    const qb = this.returnRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.order', 'o')
      .leftJoinAndSelect('r.items', 'items')
      .leftJoinAndSelect('r.refund', 'refund')
      .orderBy('r.createdAt', 'DESC');

    if (status && status !== 'all') {
      qb.andWhere('r.status = :status', { status });
    }
    if (search) {
      qb.andWhere('(r.returnNumber LIKE :s OR o.orderNumber LIKE :s OR o.customerName LIKE :s OR o.phone LIKE :s)', {
        s: `%${search}%`,
      });
    }

    const total = await qb.getCount();
    const items = await qb
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .take(parseInt(limit as string))
      .getMany();

    return {
      items,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    };
  }

  async findById(id: number) {
    const ret = await this.returnRepo.findOne({
      where: { id },
      relations: ['order', 'order.items', 'items', 'refund'],
    });
    if (!ret) throw new NotFoundException('Return not found');
    return ret;
  }

  // Fetch order details for creating a return
  async getOrderForReturn(orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException('Order not found');

    // Check existing returns for this order to prevent double-returns
    const existingReturns = await this.returnRepo.find({
      where: { orderId },
      relations: ['items'],
    });

    const returnedQuantities = new Map<number, number>();
    for (const ret of existingReturns) {
      if (['rejected'].includes(ret.status)) continue;
      for (const item of ret.items) {
        const current = returnedQuantities.get(item.orderItemId) || 0;
        returnedQuantities.set(item.orderItemId, current + item.quantity);
      }
    }

    return {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        alreadyReturned: returnedQuantities.get(item.id) || 0,
        returnableQty: item.quantity - (returnedQuantities.get(item.id) || 0),
      })),
    };
  }

  // Update return status with side effects
  async updateStatus(id: number, data: { status: string; adminNote?: string; refundMethod?: string }) {
    const ret = await this.findById(id);
    const oldStatus = ret.status;
    ret.status = data.status;
    if (data.adminNote !== undefined) ret.adminNote = data.adminNote;
    if (data.refundMethod !== undefined) ret.refundMethod = data.refundMethod;

    // Auto-restock when items are received back
    if (data.status === 'received' && oldStatus !== 'received') {
      for (const item of ret.items) {
        if (item.variantId) {
          await this.variantRepo.increment({ id: item.variantId }, 'stock', item.quantity);
        }
      }
    }

    // Auto-create refund when status changes to refunded
    if (data.status === 'refunded' && oldStatus !== 'refunded') {
      const refundEntity = new Refund();
      refundEntity.orderId = ret.orderId;
      refundEntity.amount = ret.refundAmount;
      refundEntity.status = 'approved';
      refundEntity.reason = `Return ${ret.returnNumber}: ${ret.reason}`;
      refundEntity.method = ret.refundMethod || '';
      refundEntity.adminNote = `Auto-created from return ${ret.returnNumber}`;
      const savedRefund = await this.refundRepo.save(refundEntity);
      ret.refundId = savedRefund.id;
    }

    return this.returnRepo.save(ret);
  }

  async updateItemCondition(returnItemId: number, condition: string) {
    const item = await this.returnItemRepo.findOne({ where: { id: returnItemId } });
    if (!item) throw new NotFoundException('Return item not found');
    item.condition = condition;
    return this.returnItemRepo.save(item);
  }

  async getStats() {
    const total = await this.returnRepo.count();
    const requested = await this.returnRepo.count({ where: { status: 'requested' } });
    const approved = await this.returnRepo.count({ where: { status: 'approved' } });
    const received = await this.returnRepo.count({ where: { status: 'received' } });
    const refunded = await this.returnRepo.count({ where: { status: 'refunded' } });
    const rejected = await this.returnRepo.count({ where: { status: 'rejected' } });

    const totalRefundedAmount = await this.returnRepo
      .createQueryBuilder('r')
      .select('SUM(r.refundAmount)', 'total')
      .where('r.status = :s', { s: 'refunded' })
      .getRawOne();

    const byReason = await this.returnRepo
      .createQueryBuilder('r')
      .select('r.reason', 'reason')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.reason')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      total,
      requested,
      approved,
      received,
      refunded,
      rejected,
      totalRefundedAmount: parseFloat(totalRefundedAmount?.total || '0'),
      byReason,
    };
  }
}
