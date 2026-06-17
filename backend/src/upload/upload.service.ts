import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as sharp from 'sharp';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  private s3: S3Client;

  constructor(private config: ConfigService) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: config.get<string>('R2_ENDPOINT'),
      credentials: {
        accessKeyId: config.get<string>('R2_ACCESS_KEY') as string,
        secretAccessKey: config.get<string>('R2_SECRET_KEY') as string,
      },
    });
  }

  async uploadImage(buffer: Buffer, originalName: string): Promise<string> {
    const mimeType = this.getMimeType(originalName);
    if (!mimeType) throw new BadRequestException('Unsupported file type');

    if (buffer.length > 5 * 1024 * 1024) {
      throw new BadRequestException('File too large (max 5MB)');
    }

    const webp = await sharp(buffer).webp({ quality: 85 }).toBuffer();

    const key = `products/${randomUUID()}.webp`;
    const bucket = this.config.get<string>('R2_BUCKET');

    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: webp,
        ContentType: 'image/webp',
      }),
    );

    const publicUrl = this.config.get<string>('R2_PUBLIC_URL');
    return `${publicUrl}/${key}`;
  }

  async uploadVideo(buffer: Buffer, originalName: string): Promise<string> {
    const ext = originalName.split('.').pop()?.toLowerCase();
    const videoTypes: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
    };
    const mimeType = videoTypes[ext || ''];
    if (!mimeType) throw new BadRequestException('Unsupported video format (mp4, webm, mov)');

    if (buffer.length > 200 * 1024 * 1024) {
      throw new BadRequestException('Video too large (max 200MB)');
    }

    const key = `products/videos/${randomUUID()}.${ext}`;
    const bucket = this.config.get<string>('R2_BUCKET');

    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    const publicUrl = this.config.get<string>('R2_PUBLIC_URL');
    return `${publicUrl}/${key}`;
  }

  private getMimeType(filename: string): string | null {
    const ext = filename.split('.').pop()?.toLowerCase();
    const types: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    return types[ext || ''] || null;
  }
}
