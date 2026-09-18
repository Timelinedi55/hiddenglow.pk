import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsEvent, Visitor, PageView, Order, OrderItem } from '../../entities';
import { AnalyticsEventsService } from './analytics-events.service';
import { AnalyticsEventsController } from './analytics-events.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent, Visitor, PageView, Order, OrderItem])],
  controllers: [AnalyticsEventsController],
  providers: [AnalyticsEventsService],
  exports: [AnalyticsEventsService],
})
export class AnalyticsEventsModule {}
