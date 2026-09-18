import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CmsContent } from '../../entities';

@Injectable()
export class CmsService {
  constructor(
    @InjectRepository(CmsContent) private cmsRepo: Repository<CmsContent>,
  ) {}

  async getByPage(pageKey: string) {
    const sections = await this.cmsRepo.find({ where: { pageKey } });
    const result: Record<string, any> = {};
    sections.forEach((s) => {
      result[s.sectionKey] = { id: s.id, title: s.title, content: s.content, metadata: s.metadata };
    });
    return result;
  }

  async getSection(pageKey: string, sectionKey: string) {
    return this.cmsRepo.findOne({ where: { pageKey, sectionKey } });
  }

  async getAllPages() {
    const all = await this.cmsRepo.find({ order: { pageKey: 'ASC', sectionKey: 'ASC' } });
    const grouped: Record<string, any[]> = {};
    all.forEach((item) => {
      if (!grouped[item.pageKey]) grouped[item.pageKey] = [];
      grouped[item.pageKey].push(item);
    });
    return grouped;
  }

  async upsert(pageKey: string, sectionKey: string, data: { title?: string; content?: string; metadata?: any }) {
    let section = await this.cmsRepo.findOne({ where: { pageKey, sectionKey } });
    if (section) {
      Object.assign(section, data);
      return this.cmsRepo.save(section);
    }
    section = this.cmsRepo.create({ pageKey, sectionKey, ...data });
    return this.cmsRepo.save(section);
  }

  async bulkUpdate(updates: Array<{ pageKey: string; sectionKey: string; title?: string; content?: string; metadata?: any }>) {
    const results: any[] = [];
    for (const u of updates) {
      results.push(await this.upsert(u.pageKey, u.sectionKey, u));
    }
    return results;
  }
}
