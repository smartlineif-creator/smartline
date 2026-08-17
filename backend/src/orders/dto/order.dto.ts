import {
  IsString,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  IsEmail,
  IsEnum,
  ValidateNested,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

// Same rule as frontend/lib/validation.ts — change both together.
export const UA_PHONE = /^(\+?38)?0\d{9}$/;
// Empty string collapses to undefined so optional phones stay optional —
// @IsOptional only skips undefined/null, and '' would otherwise fail @Matches.
export const stripPhone = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const stripped = value.replace(/[\s()-]/g, '');
  return stripped === '' ? undefined : stripped;
};

export class OrderItemDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsString()
  @IsOptional()
  serviceId?: string;

  @IsString()
  @IsOptional()
  tierId?: string;

  // Int, not Number: a fractional quantity slips past `stock >= quantity` and
  // then fails on an Int column. Max is a sanity bound — real availability is
  // enforced by the atomic stock decrement in OrdersService.create.
  @IsInt()
  @Min(1)
  @Max(999)
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
  @MinLength(2)
  @MaxLength(120)
  customerName: string;

  @IsString()
  @Transform(stripPhone)
  @Matches(UA_PHONE, { message: 'customerPhone must be a valid UA phone (+380XXXXXXXXX)' })
  customerPhone: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsArray()
  @ArrayNotEmpty()
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
