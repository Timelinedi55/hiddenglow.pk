import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CmsService } from './cms.service';

@Controller('cms')
export class CmsController {
  constructor(private cmsService: CmsService) {}

  @Get('page/:pageKey')
  getByPage(@Param('pageKey') pageKey: string) {
    return this.cmsService.getByPage(pageKey);
  }

  @Get('page/:pageKey/:sectionKey')
  getSection(@Param('pageKey') pageKey: string, @Param('sectionKey') sectionKey: string) {
    return this.cmsService.getSection(pageKey, sectionKey);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/all')
  getAll() {
    return this.cmsService.getAllPages();
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('page/:pageKey/:sectionKey')
  upsert(
    @Param('pageKey') pageKey: string,
    @Param('sectionKey') sectionKey: string,
    @Body() body: { title?: string; content?: string; metadata?: any },
  ) {
    return this.cmsService.upsert(pageKey, sectionKey, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('bulk')
  bulkUpdate(@Body() body: { updates: any[] }) {
    return this.cmsService.bulkUpdate(body.updates);
  }
}
