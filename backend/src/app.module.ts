import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CmsModule } from './modules/cms/cms.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UploadModule } from './modules/upload/upload.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { FaqModule } from './modules/faq/faq.module';
import { EmailModule } from './modules/email/email.module';
import { SeedModule } from './seed/seed.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { AnalyticsEventsModule } from './modules/analytics-events/analytics-events.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import {
  Category, Product, ProductImage, ProductVariant,
  Order, OrderItem, OrderStatusHistory, CmsContent, SiteSetting,
  AdminUser, Review, Faq, Customer, Refund, Expense,
  Visitor, PageView,
  ReturnOrder, ReturnItem, AnalyticsEvent,
  Referral, ReferralClick, ReferralConversion, Withdrawal,
} from './entities';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DATABASE_HOST'),
        port: parseInt(config.get('DATABASE_PORT'), 10),
        username: config.get('DATABASE_USER'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME'),
        entities: [
          Category, Product, ProductImage, ProductVariant,
          Order, OrderItem, OrderStatusHistory, CmsContent, SiteSetting,
          AdminUser, Review, Faq, Customer, Refund, Expense,
          Visitor, PageView,
          ReturnOrder, ReturnItem, AnalyticsEvent,
          Referral, ReferralClick, ReferralConversion, Withdrawal,
        ],
        synchronize: true,
        charset: 'utf8mb4',
      }),
    }),
    AuthModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    CmsModule,
    SettingsModule,
    UploadModule,
    ReviewsModule,
    FaqModule,
    EmailModule,
    SeedModule,
    AnalyticsModule,
    ReturnsModule,
    AnalyticsEventsModule,
    ReferralsModule,
  ],
})
export class AppModule {}
