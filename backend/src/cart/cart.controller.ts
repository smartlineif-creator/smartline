import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CartService, AddCartItemDto, MergeCartDto } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: User) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  addItem(@CurrentUser() user: User, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.id, dto);
  }

  @Delete('items/:id')
  removeItem(@CurrentUser() user: User, @Param('id') id: string) {
    return this.cartService.removeItem(user.id, id);
  }

  @Post('clear')
  clearCart(@CurrentUser() user: User) {
    return this.cartService.clearCart(user.id);
  }

  @Post('merge')
  mergeCart(@CurrentUser() user: User, @Body() dto: MergeCartDto) {
    return this.cartService.mergeCart(user.id, dto);
  }
}
