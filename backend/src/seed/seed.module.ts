import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AdminUser, CmsContent, SiteSetting, Faq,
  Category, Product, ProductImage, ProductVariant, Review,
} from '../entities';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([
    AdminUser, CmsContent, SiteSetting, Faq,
    Category, Product, ProductImage, ProductVariant, Review,
  ])],
  providers: [SeedService],
})
export class SeedModule {}
