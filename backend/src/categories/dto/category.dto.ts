import { IsString, IsOptional, IsArray, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AttributeTemplateDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  seoText?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttributeTemplateDto)
  attributeTemplates?: AttributeTemplateDto[];
}

export class UpdateCategoryDto extends CreateCategoryDto {}
