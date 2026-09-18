import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private catService: CategoriesService) {}

  @Get()
  findAll() {
    return this.catService.findAll();
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.catService.findBySlug(slug);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/list')
  findAllAdmin() {
    return this.catService.findAllAdmin();
  }

  @Get(':id')
  findById(@Param('id') id: number) {
    return this.catService.findById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() body) {
    return this.catService.create(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  update(@Param('id') id: number, @Body() body) {
    return this.catService.update(id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.catService.remove(id);
  }
}
