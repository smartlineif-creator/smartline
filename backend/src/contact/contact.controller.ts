import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { MailService } from '../mail/mail.service';
import { TelegramService } from '../telegram/telegram.service';
import { ConfigService } from '@nestjs/config';
import { UA_PHONE, stripPhone } from '../orders/dto/order.dto';

class ContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsString()
  @MaxLength(32)
  @Transform(stripPhone)
  @Matches(UA_PHONE, { message: 'phone must be a valid UA phone (+380XXXXXXXXX)' })
  phone: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
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
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async submit(@Body() dto: ContactDto) {
    const adminEmail =
      this.config.get<string>('ADMIN_EMAIL') ||
      this.config.get<string>('RESEND_FROM') ||
      '';

    // Send Telegram notification (fast, always works if bot is configured)
    await this.telegram
      .sendMessage(
        `📩 Нове звернення з сайту\n👤 ${dto.name}\n📞 ${dto.phone}\n💬 ${dto.message}`,
      )
      .catch(() => {});

    // Send email to admin (best-effort)
    if (adminEmail) {
      await this.mail
        .sendContactMessage({
          name: dto.name,
          phone: dto.phone,
          message: dto.message,
          adminEmail,
        })
        .catch(() => {});
    }

    return { ok: true };
  }
}
