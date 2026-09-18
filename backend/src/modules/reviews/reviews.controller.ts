import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReviewsService } from './reviews.service';
import { IsString, IsInt, IsOptional, MinLength, Min, Max, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class CreateReviewDto {
  @Type(() => Number)
  @IsInt()
  productId: number;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  email?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsArray()
  images?: string[];
}

@Controller('reviews')
export class ReviewsController {
  constructor(private service: ReviewsService) {}

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: number) {
    return this.service.findByProduct(productId);
  }

  @Get('homepage')
  getHomepage() {
    return this.service.getApprovedHomepage();
  }

  @Post()
  create(@Body() dto: CreateReviewDto) {
    return this.service.create(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('admin')
  adminCreate(@Body() dto: CreateReviewDto) {
    return this.service.adminCreate(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/list')
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/stats')
  getStats() {
    return this.service.getStats();
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id/approve')
  approve(@Param('id') id: number) {
    return this.service.approve(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  update(@Param('id') id: number, @Body() data: any) {
    return this.service.update(id, data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
