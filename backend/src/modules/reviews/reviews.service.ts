import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, Customer, Order, OrderItem } from '../../entities';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private repo: Repository<Review>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
  ) {}

  async findByProduct(productId: number) {
    return this.repo.find({ where: { productId, isApproved: true }, order: { createdAt: 'DESC' } });
  }

  async findAll(query?: any) {
    const qb = this.repo.createQueryBuilder('r')
      .leftJoinAndSelect('r.product', 'product')
      .orderBy('r.createdAt', 'DESC');
    if (query?.status === 'approved') qb.where('r.isApproved = :a', { a: true });
    if (query?.status === 'pending') qb.where('r.isApproved = :a', { a: false });
    if (query?.productId) qb.andWhere('r.productId = :pid', { pid: query.productId });
    if (query?.search) qb.andWhere('(r.name LIKE :s OR r.comment LIKE :s)', { s: `%${query.search}%` });
    return qb.getMany();
  }

  async getApprovedHomepage() {
    return this.repo.find({ where: { isApproved: true }, order: { createdAt: 'DESC' }, take: 6 });
  }

  async create(data: any) {
    // Check if verified purchase
    let isVerified = false;
    if (data.email || data.phone) {
      const customer = await this.customerRepo.findOne({
        where: data.email ? { email: data.email } : { phone: data.phone },
      });
      if (customer) {
        // Check if customer has a delivered order containing this product
        const orders = await this.orderRepo.find({
          where: { phone: customer.phone, status: 'delivered' },
          relations: ['items'],
        });
        isVerified = orders.some(o => o.items?.some(i => i.productId === Number(data.productId)));
      }
    }

    const review = this.repo.create({
      productId: data.productId,
      name: data.name,
      email: data.email || null,
      rating: data.rating,
      comment: data.comment,
      images: data.images || null,
      isApproved: false,
      isVerifiedPurchase: isVerified,
    });
    return this.repo.save(review);
  }

  // Admin can create pre-approved reviews
  async adminCreate(data: any) {
    const review = this.repo.create({
      productId: data.productId,
      name: data.name,
      email: data.email || null,
      rating: data.rating,
      comment: data.comment,
      images: data.images || null,
      isApproved: true,
      isVerifiedPurchase: data.isVerifiedPurchase || false,
    });
    return this.repo.save(review);
  }

  async approve(id: number) {
    await this.repo.update(id, { isApproved: true });
    return { message: 'Review approved' };
  }

  async update(id: number, data: any) {
    await this.repo.update(id, data);
    return { message: 'Review updated' };
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { message: 'Review deleted' };
  }

  async getStats() {
    const total = await this.repo.count();
    const approved = await this.repo.count({ where: { isApproved: true } });
    const pending = await this.repo.count({ where: { isApproved: false } });
    const avgRating = await this.repo.createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .where('r.isApproved = true')
      .getRawOne();
    return { total, approved, pending, avgRating: parseFloat(avgRating?.avg || '0') };
  }
}
