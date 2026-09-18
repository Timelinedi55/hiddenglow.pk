import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FaqService } from './faq.service';

@Controller('faqs')
export class FaqController {
  constructor(private service: FaqService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/list')
  findAllAdmin() {
    return this.service.findAllAdmin();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() body) {
    return this.service.create(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  update(@Param('id') id: number, @Body() body) {
    return this.service.update(id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
