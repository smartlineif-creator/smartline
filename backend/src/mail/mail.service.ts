import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private from: string;

  constructor(private config: ConfigService) {
    const key = config.get<string>('RESEND_API_KEY');
    if (key && key !== 'placeholder') {
      this.resend = new Resend(key);
    }
    this.from =
      config.get<string>('RESEND_FROM') ||
      'SmartLine <noreply@smartline.com.ua>';
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.resend) {
      this.logger.warn(
        `Email not sent (Resend not configured): ${subject} → ${to}`,
      );
      return;
    }
    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err);
    }
  }

  async sendOrderConfirmation(order: any) {
    if (!order.customerEmail) return;

    const itemsHtml = (order.items || [])
      .map(
        (item: any) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${item.name}${item.variantName ? ` (${item.variantName})` : ''}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${item.price * item.quantity} грн</td>
          </tr>`,
      )
      .join('');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#2563eb">SmartLine</h1>
        <h2>Дякуємо за замовлення!</h2>
        <p>Ваше замовлення <strong>#${order.orderNumber}</strong> успішно прийнято.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:#f3f4f6">
              <th style="padding:8px;text-align:left">Товар</th>
              <th style="padding:8px">Кіл-ть</th>
              <th style="padding:8px;text-align:right">Сума</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:8px;font-weight:bold">Разом:</td>
              <td style="padding:8px;text-align:right;font-weight:bold">${order.totalAmount} грн</td>
            </tr>
          </tfoot>
        </table>
        <p style="color:#6b7280;font-size:14px">Ми зв'яжемося з вами найближчим часом для підтвердження замовлення.</p>
        <p style="color:#6b7280;font-size:14px">З повагою, команда SmartLine</p>
      </div>
    `;

    await this.send(
      order.customerEmail,
      `Замовлення #${order.orderNumber} прийнято`,
      html,
    );
  }

  async sendPasswordReset(email: string, token: string, frontendUrl: string) {
    const link = `${frontendUrl}/reset-password?token=${token}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#2563eb">SmartLine</h1>
        <h2>Скидання пароля</h2>
        <p>Ви запросили скидання пароля. Натисніть кнопку нижче:</p>
        <a href="${link}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">
          Скинути пароль
        </a>
        <p style="color:#6b7280;font-size:14px">Посилання дійсне 1 годину. Якщо ви не запитували скидання — проігноруйте цей лист.</p>
      </div>
    `;
    await this.send(email, 'Скидання пароля — SmartLine', html);
  }

  async sendContactMessage(data: { name: string; phone: string; message: string; adminEmail: string }) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#2563eb">SmartLine — нове повідомлення</h1>
        <p><strong>Ім'я:</strong> ${data.name}</p>
        <p><strong>Телефон:</strong> ${data.phone}</p>
        <p><strong>Повідомлення:</strong></p>
        <p style="background:#f3f4f6;padding:12px;border-radius:8px">${data.message}</p>
      </div>
    `;
    await this.send(data.adminEmail, `Нове звернення від ${data.name}`, html);
  }

  async sendOrderStatusUpdate(order: any) {
    if (!order.customerEmail) return;

    const STATUS_LABELS: Record<string, string> = {
      NEW: 'Нове',
      CONFIRMED: 'Підтверджено',
      SHIPPED: 'Відправлено',
      DELIVERED: 'Доставлено',
      CANCELLED: 'Скасовано',
    };

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#2563eb">SmartLine</h1>
        <p>Статус вашого замовлення <strong>#${order.orderNumber}</strong> змінено на: <strong>${STATUS_LABELS[order.status] || order.status}</strong></p>
        ${order.ttn ? `<p>ТТН Нової Пошти: <strong>${order.ttn}</strong></p>` : ''}
        <p style="color:#6b7280;font-size:14px">З повагою, команда SmartLine</p>
      </div>
    `;

    await this.send(
      order.customerEmail,
      `Статус замовлення #${order.orderNumber} змінено`,
      html,
    );
  }
}
