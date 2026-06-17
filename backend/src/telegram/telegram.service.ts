import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private botToken: string;
  private chatId: string;

  constructor(config: ConfigService) {
    this.botToken = config.get<string>('TELEGRAM_BOT_TOKEN') || '';
    this.chatId = config.get<string>('TELEGRAM_CHAT_ID') || '';
  }

  async sendMessage(text: string, chatId?: string) {
    const target = chatId || this.chatId;
    if (!this.botToken || !target || this.botToken === 'placeholder') {
      this.logger.warn('Telegram not configured, skipping message');
      return;
    }
    try {
      await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          chat_id: target,
          text,
          parse_mode: 'HTML',
        },
      );
    } catch (err) {
      this.logger.error('Failed to send Telegram message', err);
    }
  }

  async notifyNewOrder(order: any) {
    const text =
      `🛒 <b>Нове замовлення #${order.orderNumber}</b>\n` +
      `👤 ${order.customerName} | ${order.customerPhone}\n` +
      `💰 ${order.totalAmount} грн\n` +
      `📦 Товарів: ${order.items?.length || 0}`;
    await this.sendMessage(text);
  }

  async notifyOrderStatus(order: any, clientChatId?: string) {
    const statusMap: Record<string, string> = {
      CONFIRMED: '✅ Підтверджено',
      SHIPPED: '🚚 Відправлено',
      DELIVERED: '📬 Доставлено',
      CANCELLED: '❌ Скасовано',
    };
    const text =
      `${statusMap[order.status] || order.status}\n` +
      `Замовлення #${order.orderNumber}\n` +
      (order.ttn ? `ТТН: ${order.ttn}` : '');

    if (clientChatId) await this.sendMessage(text, clientChatId);
  }
}
