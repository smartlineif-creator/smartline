import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  title: string;

  @IsString()
  imageUrl: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateBannerDto extends CreateBannerDto {}

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async findActive(position = 'home') {
    return this.prisma.banner.findMany({
      where: { isActive: true, position },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findAll() {
    return this.prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async create(dto: CreateBannerDto) {
    return this.prisma.banner.create({
      data: { ...dto, position: dto.position || 'home' },
    });
  }

  async update(id: string, dto: UpdateBannerDto) {
    return this.prisma.banner.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.banner.delete({ where: { id } });
  }
}
