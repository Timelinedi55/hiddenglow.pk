import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReturnsService } from './returns.service';

@Controller('returns')
@UseGuards(AuthGuard('jwt'))
export class ReturnsController {
  constructor(private service: ReturnsService) {}

  @Get('admin/list')
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get('admin/stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('admin/order/:orderId')
  getOrderForReturn(@Param('orderId') orderId: number) {
    return this.service.getOrderForReturn(+orderId);
  }

  @Get('admin/:id')
  findById(@Param('id') id: number) {
    return this.service.findById(+id);
  }

  @Post('admin')
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put('admin/:id/status')
  updateStatus(@Param('id') id: number, @Body() body: any) {
    return this.service.updateStatus(+id, body);
  }

  @Put('admin/item/:id/condition')
  updateItemCondition(@Param('id') id: number, @Body() body: { condition: string }) {
    return this.service.updateItemCondition(+id, body.condition);
  }
}
