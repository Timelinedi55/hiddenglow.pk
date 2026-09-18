import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, OrderItem, OrderStatusHistory, Product, ProductVariant, Customer, Refund, Expense, Referral, ReferralConversion } from '../../entities';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderStatusHistory, Product, ProductVariant, Customer, Refund, Expense, Referral, ReferralConversion]),
    ReferralsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
