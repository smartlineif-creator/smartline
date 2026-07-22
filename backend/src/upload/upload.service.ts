import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as sharp from 'sharp';
import heicConvert from 'heic-convert';
import { randomUUID } from 'crypto';

sharp.concurrency(1);
sharp.cache(false);

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

    if (buffer.length > 10 * 1024 * 1024) {
      throw new BadRequestException('File too large (max 10MB)');
    }

    // iPhones shoot HEIC by default. sharp's prebuilt binary has no HEIF
    // decoder (licensing), so convert to JPEG first with a pure-JS decoder —
    // after that it's a real JPEG and benefits from the shrink-on-load path.
    let sourceBuffer = buffer;
    let effectiveMimeType = mimeType;
    if (mimeType === 'image/heic' || mimeType === 'image/heif') {
      try {
        sourceBuffer = Buffer.from(
          await heicConvert({ buffer, format: 'JPEG', quality: 0.9 }),
        );
        effectiveMimeType = 'image/jpeg';
      } catch {
        throw new BadRequestException(
          'Не вдалося обробити HEIC-фото. Спробуйте зберегти його як JPEG перед завантаженням.',
        );
      }
    }

    // .resize() right after decode lets libvips shrink-on-load JPEGs — the
    // decoder reads directly at a reduced scale instead of materializing the
    // full-resolution bitmap, so even a 60MP JPEG stays cheap in memory. Other
    // formats (PNG, etc.) don't get that optimization and decode the whole
    // bitmap up front, so cap those much lower to avoid OOM on this 512MB box.
    const limitInputPixels =
      effectiveMimeType === 'image/jpeg' ? 60_000_000 : 20_000_000;

    let webp: Buffer;
    try {
      webp = await sharp(sourceBuffer, { limitInputPixels })
        .rotate()
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      throw new BadRequestException(
        'Не вдалося обробити фото. Спробуйте інший файл або зменшіть роздільність.',
      );
    }

    const key = `products/${randomUUID()}.webp`;
    const bucket = this.config.get<string>('R2_BUCKET');

    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: webp,
        ContentType: 'image/webp',
        // Content is a randomUUID key — it never changes once uploaded, so it's
        // safe to cache indefinitely (Lighthouse flagged these as uncached).
        CacheControl: 'public, max-age=31536000, immutable',
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
    if (!mimeType)
      throw new BadRequestException(
        'Unsupported video format (mp4, webm, mov)',
      );

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
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    const publicUrl = this.config.get<string>('R2_PUBLIC_URL');
    return `${publicUrl}/${key}`;
  }

  async getVideoPresignedUrl(
    filename: string,
  ): Promise<{ uploadUrl: string; publicUrl: string }> {
    const ext = filename.split('.').pop()?.toLowerCase();
    const videoTypes: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
    };
    const contentType = videoTypes[ext || ''];
    if (!contentType)
      throw new BadRequestException(
        'Unsupported video format (mp4, webm, mov)',
      );

    const key = `products/videos/${randomUUID()}.${ext}`;
    const bucket = this.config.get<string>('R2_BUCKET');

    // No CacheControl here: it's a non-safelisted CORS header, so adding it
    // forces a preflight OPTIONS request that R2's bucket CORS policy (only
    // allows content-type) rejects with 403 — the PUT never even gets sent.
    // Reverted after this broke all video uploads in production.
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    const publicUrl = `${this.config.get<string>('R2_PUBLIC_URL')}/${key}`;

    return { uploadUrl, publicUrl };
  }

  private getMimeType(filename: string): string | null {
    const ext = filename.split('.').pop()?.toLowerCase();
    const types: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      avif: 'image/avif',
      heic: 'image/heic',
      heif: 'image/heif',
    };
    return types[ext || ''] || null;
  }
}
