import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmsContent } from '../../entities';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';

@Module({
  imports: [TypeOrmModule.forFeature([CmsContent])],
  controllers: [CmsController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
