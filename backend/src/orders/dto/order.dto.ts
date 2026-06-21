import {
  IsString,
  IsOptional,
  IsArray,
  IsEmail,
  IsEnum,
  ValidateNested,
  IsNumber,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

export class OrderItemDto {
  @IsString()
  productId: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class DeliveryDto {
  @IsIn(['nova_poshta_branch', 'nova_poshta_address', 'pickup'])
  type: string;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  method?: string;

  @IsString()
  @IsOptional()
  serviceType?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  cityName?: string;

  @IsString()
  @IsOptional()
  cityRef?: string;

  @IsString()
  @IsOptional()
  settlementRef?: string;

  @IsString()
  @IsOptional()
  area?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  warehouse?: string;

  @IsString()
  @IsOptional()
  warehouseName?: string;

  @IsString()
  @IsOptional()
  warehouseRef?: string;

  @IsString()
  @IsOptional()
  warehouseNumber?: string;

  @IsString()
  @IsOptional()
  warehouseType?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  streetRef?: string;

  @IsString()
  @IsOptional()
  streetType?: string;

  @IsString()
  @IsOptional()
  building?: string;

  @IsString()
  @IsOptional()
  apartment?: string;

  @IsString()
  @IsOptional()
  entrance?: string;

  @IsString()
  @IsOptional()
  floor?: string;

  @IsString()
  @IsOptional()
  intercom?: string;

  @IsString()
  @IsOptional()
  pickupPoint?: string;

  @IsString()
  @IsOptional()
  recipientName?: string;

  @IsString()
  @IsOptional()
  recipientPhone?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class PaymentInfoDto {
  @IsIn(['online', 'bank_transfer', 'cod'])
  method: string;
}

export class CreateOrderDto {
  @IsString()
  customerName: string;

  @IsString()
  customerPhone: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ValidateNested()
  @Type(() => DeliveryDto)
  delivery: DeliveryDto;

  @ValidateNested()
  @Type(() => PaymentInfoDto)
  payment: PaymentInfoDto;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsString()
  @IsOptional()
  ttn?: string;

  @IsString()
  @IsOptional()
  adminNote?: string;
}
