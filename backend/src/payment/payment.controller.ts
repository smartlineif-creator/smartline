import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IsString } from 'class-validator';
import { User } from '@prisma/client';

class CreatePaymentDto {
  @IsString()
  orderId: string;
}

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: User) {
    return this.paymentService.createMonobankInvoice(dto.orderId, user);
  }

  @Post('webhook')
  webhook(@Body() body: any, @Headers('x-sign') signature: string) {
    return this.paymentService.handleWebhook(body, signature);
  }
}
