import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faq } from '../../entities';

@Injectable()
export class FaqService {
  constructor(@InjectRepository(Faq) private repo: Repository<Faq>) {}

  async findAll() {
    return this.repo.find({ where: { isActive: true }, order: { sortOrder: 'ASC' } });
  }

  async findAllAdmin() {
    return this.repo.find({ order: { sortOrder: 'ASC' } });
  }

  async create(data: any) {
    const faq = this.repo.create(data);
    return this.repo.save(faq);
  }

  async update(id: number, data: any) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { message: 'FAQ deleted' };
  }
}
