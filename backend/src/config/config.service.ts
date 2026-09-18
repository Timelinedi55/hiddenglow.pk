import { Injectable } from '@nestjs/common';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

@Injectable()
export class ConfigService {
  get(key: string): string {
    return process.env[key] || '';
  }
}
