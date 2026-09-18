import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { IsString, IsArray, IsNumber, IsOptional, MinLength, ValidateNested, IsInt, IsIn, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @Type(() => Number)
  @IsInt()
  productId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  variantId?: number;

  @IsOptional()
  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price: number;

  @Type(() => Number)
  @IsInt()
  quantity: number;

  @IsOptional()
  @IsString()
  productImage?: string;
}

class CreateOrderDto {
  @IsString()
  @MinLength(2)
  customerName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(10)
  phone: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsString()
  @MinLength(5)
  address: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shippingFee?: number;

  @IsOptional()
  @IsString()
  referralCode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

class UpdateStatusDto {
  @IsString()
  @IsIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
  status: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  courierName?: string;
}

class UpdateOrderDto {
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  courierName?: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get('track/:orderNumber')
  track(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/stats')
  getStats() {
    return this.ordersService.getDashboardStats();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/list')
  findAll(@Query() query) {
    return this.ordersService.findAll(query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/customers')
  getCustomers(@Query() query) {
    return this.ordersService.getCustomers(query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/low-stock')
  getLowStock() {
    return this.ordersService.getLowStockVariants();
  }

  // ─── Inventory ─────────────────────────────────────────────────────────────

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/inventory')
  getInventory(@Query() query) {
    return this.ordersService.getInventory(query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/inventory/stats')
  getInventoryStats() {
    return this.ordersService.getInventoryStats();
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('admin/inventory/:id/stock')
  updateStock(@Param('id') id: number, @Body() body: { stock: number }) {
    return this.ordersService.updateStock(id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('admin/inventory/batch')
  batchUpdateStock(@Body() body: { items: { id: number; stock: number }[] }) {
    return this.ordersService.batchUpdateStock(body.items);
  }

  // ─── Refunds ───────────────────────────────────────────────────────────────

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/refunds')
  getRefunds(@Query() query) {
    return this.ordersService.getRefunds(query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/refunds/stats')
  getRefundStats() {
    return this.ordersService.getRefundStats();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('admin/refunds')
  createRefund(@Body() body) {
    return this.ordersService.createRefund(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('admin/refunds/:id')
  updateRefund(@Param('id') id: number, @Body() body) {
    return this.ordersService.updateRefund(id, body);
  }

  // ─── Expenses ──────────────────────────────────────────────────────────────

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/expenses')
  getExpenses(@Query() query) {
    return this.ordersService.getExpenses(query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/expenses/stats')
  getExpenseStats(@Query() query) {
    return this.ordersService.getExpenseStats(query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('admin/expenses')
  createExpense(@Body() body) {
    return this.ordersService.createExpense(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('admin/expenses/:id')
  updateExpense(@Param('id') id: number, @Body() body) {
    return this.ordersService.updateExpense(id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('admin/expenses/:id')
  deleteExpense(@Param('id') id: number) {
    return this.ordersService.deleteExpense(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findById(@Param('id') id: number) {
    return this.ordersService.findById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id/status')
  updateStatus(@Param('id') id: number, @Body() dto: UpdateStatusDto) {
    return this.ordersService.updateStatus(id, dto.status, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  updateOrder(@Param('id') id: number, @Body() dto: UpdateOrderDto) {
    return this.ordersService.updateOrder(id, dto);
  }
}
