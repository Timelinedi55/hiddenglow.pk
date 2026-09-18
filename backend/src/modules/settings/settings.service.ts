import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSetting } from '../../entities';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SiteSetting) private settingRepo: Repository<SiteSetting>,
  ) {}

  async getAll() {
    const settings = await this.settingRepo.find();
    const result: Record<string, string> = {};
    settings.forEach((s) => { result[s.settingKey] = s.settingValue; });
    return result;
  }

  async get(key: string) {
    const setting = await this.settingRepo.findOne({ where: { settingKey: key } });
    return setting?.settingValue || null;
  }

  async set(key: string, value: string, type = 'text') {
    let setting = await this.settingRepo.findOne({ where: { settingKey: key } });
    if (setting) {
      setting.settingValue = value;
      return this.settingRepo.save(setting);
    }
    setting = this.settingRepo.create({ settingKey: key, settingValue: value, settingType: type });
    return this.settingRepo.save(setting);
  }

  async bulkUpdate(settings: Record<string, string>) {
    for (const [key, value] of Object.entries(settings)) {
      await this.set(key, value);
    }
    return this.getAll();
  }
}
