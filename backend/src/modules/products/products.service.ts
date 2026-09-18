import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Not } from 'typeorm';
import { Product, ProductImage, ProductVariant } from '../../entities';
import slugify from 'slugify';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ProductImage) private imageRepo: Repository<ProductImage>,
    @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
  ) {}

  async findAll(query: any) {
    const { page = 1, limit = 12, category, search, featured, bestSeller, sort } = query;
    const where: any = { isActive: true };
    if (category) where.categoryId = category;
    if (featured === 'true') where.isFeatured = true;
    if (bestSeller === 'true') where.isBestSeller = true;
    if (search) where.name = Like(`%${search}%`);

    let order: any = { createdAt: 'DESC' };
    if (sort === 'price_asc') order = { price: 'ASC' };
    if (sort === 'price_desc') order = { price: 'DESC' };
    if (sort === 'newest') order = { createdAt: 'DESC' };

    const [items, total] = await this.productRepo.findAndCount({
      where,
      relations: ['category', 'images', 'variants'],
      order,
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    return { items, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) };
  }

  async findAllAdmin(query: any) {
    const { page = 1, limit = 20, search } = query;
    const where: any = {};
    if (search) where.name = Like(`%${search}%`);

    const [items, total] = await this.productRepo.findAndCount({
      where,
      relations: ['category', 'images', 'variants'],
      order: { createdAt: 'DESC' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    return { items, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) };
  }

  async findBySlug(slug: string) {
    const product = await this.productRepo.findOne({
      where: { slug, isActive: true },
      relations: ['category', 'images', 'variants', 'reviews'],
    });
    if (!product) throw new NotFoundException('Product not found');
    // Filter reviews server-side
    if (product.reviews) {
      product.reviews = product.reviews.filter((r: any) => r.isApproved);
    }
    return product;
  }

  async findBySlugFull(slug: string) {
    const product = await this.productRepo.findOne({
      where: { slug, isActive: true },
      relations: ['category', 'images', 'variants', 'reviews'],
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.reviews) {
      product.reviews = product.reviews.filter((r: any) => r.isApproved);
    }
    let related: Product[] = [];
    if (product.categoryId) {
      related = await this.productRepo.find({
        where: { categoryId: product.categoryId, isActive: true, id: Not(product.id) },
        relations: ['images'],
        take: 4,
        order: { createdAt: 'DESC' },
      });
    }
    return { product, related };
  }

  async findById(id: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['category', 'images', 'variants'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(data: any) {
    const slug = slugify(data.name, { lower: true, strict: true });
    const existing = await this.productRepo.findOne({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const product = this.productRepo.create({
      ...data,
      slug: finalSlug,
      images: undefined,
      variants: undefined,
    });
    const saved = await this.productRepo.save(product) as any as Product;

    if (data.images?.length) {
      const images = data.images.map((img: any, i: number) =>
        this.imageRepo.create({ productId: saved.id, url: img.url, sortOrder: i, isPrimary: i === 0 }),
      );
      await this.imageRepo.save(images);
    }

    if (data.variants?.length) {
      const variants = data.variants.map((v: any) =>
        this.variantRepo.create({ productId: saved.id, ...v }),
      );
      await this.variantRepo.save(variants);
    }

    return this.findById(saved.id);
  }

  async update(id: number, data: any) {
    const product = await this.findById(id);

    if (data.name && data.name !== product.name) {
      const newSlug = slugify(data.name, { lower: true, strict: true });
      const existing = await this.productRepo.findOne({ where: { slug: newSlug } });
      data.slug = existing && existing.id !== id ? `${newSlug}-${Date.now()}` : newSlug;
    }

    const { images, variants, ...productData } = data;
    await this.productRepo.update(id, productData);

    if (images) {
      await this.imageRepo.delete({ productId: id });
      if (images.length) {
        const newImages = images.map((img: any, i: number) =>
          this.imageRepo.create({ productId: id, url: img.url, sortOrder: i, isPrimary: i === 0 }),
        );
        await this.imageRepo.save(newImages);
      }
    }

    if (variants) {
      await this.variantRepo.delete({ productId: id });
      if (variants.length) {
        const newVariants = variants.map((v: any) =>
          this.variantRepo.create({ productId: id, ...v }),
        );
        await this.variantRepo.save(newVariants);
      }
    }

    return this.findById(id);
  }

  async remove(id: number) {
    await this.findById(id);
    await this.productRepo.delete(id);
    return { message: 'Product deleted' };
  }

  async getFeatured() {
    const products = await this.productRepo.find({
      where: { isFeatured: true, isActive: true },
      relations: ['images', 'variants', 'reviews'],
      take: 8,
      order: { createdAt: 'DESC' },
    });
    products.forEach(p => { if (p.reviews) p.reviews = p.reviews.filter((r: any) => r.isApproved); });
    return products;
  }

  async getBestSellers() {
    const products = await this.productRepo.find({
      where: { isBestSeller: true, isActive: true },
      relations: ['images', 'variants', 'reviews'],
      take: 8,
      order: { createdAt: 'DESC' },
    });
    products.forEach(p => { if (p.reviews) p.reviews = p.reviews.filter((r: any) => r.isApproved); });
    return products;
  }

  async getRelated(productId: number, categoryId: number) {
    return this.productRepo.find({
      where: { categoryId, isActive: true, id: Not(productId) },
      relations: ['images'],
      take: 4,
      order: { createdAt: 'DESC' },
    });
  }
}
