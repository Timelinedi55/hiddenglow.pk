import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities';
import slugify from 'slugify';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private catRepo: Repository<Category>,
  ) {}

  async findAll() {
    return this.catRepo.find({ where: { isActive: true }, order: { sortOrder: 'ASC' } });
  }

  async findAllAdmin() {
    return this.catRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async findBySlug(slug: string) {
    const cat = await this.catRepo.findOne({ where: { slug, isActive: true } });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async findById(id: number) {
    const cat = await this.catRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async create(data: any) {
    const slug = slugify(data.name, { lower: true, strict: true });
    const cat = this.catRepo.create({ ...data, slug });
    return this.catRepo.save(cat);
  }

  async update(id: number, data: any) {
    const cat = await this.findById(id);
    if (data.name && data.name !== cat.name) {
      const newSlug = slugify(data.name, { lower: true, strict: true });
      const existing = await this.catRepo.findOne({ where: { slug: newSlug } });
      data.slug = existing && existing.id !== id ? `${newSlug}-${Date.now()}` : newSlug;
    }
    await this.catRepo.update(id, data);
    return this.findById(id);
  }

  async remove(id: number) {
    await this.findById(id);
    await this.catRepo.delete(id);
    return { message: 'Category deleted' };
  }
}
