import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(@Query() query) {
    return this.productsService.findAll(query);
  }

  @Get('featured')
  getFeatured() {
    return this.productsService.getFeatured();
  }

  @Get('best-sellers')
  getBestSellers() {
    return this.productsService.getBestSellers();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/list')
  findAllAdmin(@Query() query) {
    return this.productsService.findAllAdmin(query);
  }

  @Get('slug/:slug/full')
  findBySlugFull(@Param('slug') slug: string) {
    return this.productsService.findBySlugFull(slug);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id')
  findById(@Param('id') id: number) {
    return this.productsService.findById(id);
  }

  @Get(':id/related')
  getRelated(@Param('id') id: number, @Query('categoryId') categoryId: number) {
    return this.productsService.getRelated(id, categoryId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() body) {
    return this.productsService.create(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  update(@Param('id') id: number, @Body() body) {
    return this.productsService.update(id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.productsService.remove(id);
  }
}
