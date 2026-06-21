import { Body, Controller, Post } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { MailService } from '../mail/mail.service';
import { TelegramService } from '../telegram/telegram.service';
import { ConfigService } from '@nestjs/config';

class ContactDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  phone: string;

  @IsString()
  @MinLength(5)
  message: string;
}

@Controller('contact')
export class ContactController {
  constructor(
    private mail: MailService,
    private telegram: TelegramService,
    private config: ConfigService,
  ) {}

  @Post()
  async submit(@Body() dto: ContactDto) {
    const adminEmail = this.config.get<string>('ADMIN_EMAIL') || this.config.get<string>('RESEND_FROM') || '';

    // Send Telegram notification (fast, always works if bot is configured)
    await this.telegram.sendMessage(
      `📩 Нове звернення з сайту\n👤 ${dto.name}\n📞 ${dto.phone}\n💬 ${dto.message}`,
    ).catch(() => {});

    // Send email to admin (best-effort)
    if (adminEmail) {
      await this.mail.sendContactMessage({
        name: dto.name,
        phone: dto.phone,
        message: dto.message,
        adminEmail,
      }).catch(() => {});
    }

    return { ok: true };
  }
}
