import {
  Controller,
  Post,
  UseGuards,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { FastifyRequest } from 'fastify';

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('image')
  async uploadImage(@Req() req: FastifyRequest) {
    const data = await req.file();
    if (!data) throw new BadRequestException('No file provided');
    const buffer = await data.toBuffer();
    const url = await this.uploadService.uploadImage(buffer, data.filename);
    return { url };
  }

  @Post('video')
  async uploadVideo(@Req() req: FastifyRequest) {
    const data = await req.file();
    if (!data) throw new BadRequestException('No file provided');
    const buffer = await data.toBuffer();
    const url = await this.uploadService.uploadVideo(buffer, data.filename);
    return { url };
  }
}
