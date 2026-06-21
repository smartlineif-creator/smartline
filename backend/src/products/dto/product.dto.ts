import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class VariantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  compareAtPrice?: number | null;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stock?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => VariantSelectionDto)
  selections?: VariantSelectionDto[];
}

export class VariantSelectionDto {
  @IsString()
  groupName: string;

  @IsString()
  value: string;
}

export class ProductOptionValueDto {
  @IsString()
  value: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class ProductOptionGroupDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionValueDto)
  values: ProductOptionValueDto[];
}

export class AttributeDto {
  @IsString()
  name: string;

  @IsString()
  value: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class ProductImageDto {
  @IsString()
  url: string;

  @IsBoolean()
  @IsOptional()
  isMain?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  basePrice?: number | null;

  @IsNumber()
  @IsOptional()
  @Min(0)
  compareAtPrice?: number | null;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stock?: number;

  @IsString()
  @IsOptional()
  videoUrl?: string | null;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  categoryId: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants?: VariantDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionGroupDto)
  optionGroups?: ProductOptionGroupDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  attributes?: AttributeDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  recommendedProductIds?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  withThisBuyProductIds?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  accessoryCategoryIds?: string[];

  @IsOptional()
  @IsString()
  recommendedCategoryId?: string | null;

  @IsOptional()
  @IsString()
  withThisBuyCategoryId?: string | null;
}

export class UpdateProductDto extends CreateProductDto {}

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  /** Comma-separated list of category IDs for multi-select filtering */
  @IsOptional()
  @IsString()
  categoryIds?: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsString()
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  featured?: string;

  @IsOptional()
  @IsString()
  isActive?: string;

  /**
   * JSON-encoded option filters: {"Memory": ["1TB", "512GB"], "Condition": ["New"]}
   * Product passes if it has at least one variant satisfying ALL specified groups simultaneously.
   */
  @IsOptional()
  @IsString()
  options?: string;
}
