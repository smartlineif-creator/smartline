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
    const PAYMENT_LABELS: Record<string, string> = {
      cod: 'Накладний платіж (без передоплати)',
      online: 'Онлайн картою',
      bank_transfer: 'На розрахунковий рахунок',
    };

    const itemLines = (order.items ?? [])
      .map((item: any) => {
        const variant = item.variantName ? ` (${item.variantName})` : '';
        return `  • ${item.name}${variant} × ${item.quantity} — ${item.price * item.quantity} грн`;
      })
      .join('\n');

    const delivery = order.delivery ?? {};
    const cityLine = delivery.cityName || delivery.city || '';
    const branchLine = delivery.warehouseName || delivery.warehouse || delivery.address || '';
    const deliveryLine = [cityLine, branchLine].filter(Boolean).join(', ');

    const paymentMethod = order.payment?.method || order.payment?.paymentMethod || '';
    const paymentLine = PAYMENT_LABELS[paymentMethod] || paymentMethod;

    const adminUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/admin/orders/${order.id}`
      : '';

    const lines = [
      `🛒 <b>Нове замовлення #${order.orderNumber}</b>`,
      ``,
      `👤 <b>${order.customerName}</b>`,
      `📞 <a href="tel:${order.customerPhone}">${order.customerPhone}</a>`,
      order.customerEmail ? `📧 ${order.customerEmail}` : null,
      ``,
      `📦 <b>Товари:</b>`,
      itemLines,
      ``,
      `💰 Сума: <b>${order.totalAmount} грн</b>`,
      `💳 Оплата: ${paymentLine}`,
      deliveryLine ? `🚚 Доставка: ${deliveryLine}` : null,
      adminUrl ? `\n🔗 <a href="${adminUrl}">Відкрити в адмінці</a>` : null,
    ].filter((l) => l !== null).join('\n');

    await this.sendMessage(lines);
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
