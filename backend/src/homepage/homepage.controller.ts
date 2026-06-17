import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  HomepageService,
  CreateSectionDto,
  UpdateSectionDto,
  ReorderDto,
} from './homepage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('homepage')
export class HomepageController {
  constructor(private homepageService: HomepageService) {}

  /** Public — store homepage reads this */
  @Get('sections')
  findActive() {
    return this.homepageService.findActive();
  }

  /** Admin — all sections including inactive */
  @Get('sections/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.homepageService.findAll();
  }

  @Post('sections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateSectionDto) {
    return this.homepageService.create(dto);
  }

  @Patch('sections/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateSectionDto) {
    return this.homepageService.update(id, dto);
  }

  @Put('sections/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  reorder(@Body() dto: ReorderDto) {
    return this.homepageService.reorder(dto);
  }

  @Delete('sections/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.homepageService.remove(id);
  }
}
