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
      // Resend SDK does not throw on API errors — it returns { data, error }
      const { error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });
      if (error) {
        this.logger.error(
          `Failed to send email to ${to}: ${error.name} — ${error.message}`,
        );
        return;
      }
      this.logger.log(`Email sent: ${subject} → ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err);
    }
  }

  private static PAYMENT_LABELS: Record<string, string> = {
    cod: 'Накладений платіж (оплата при отриманні)',
    online: 'Онлайн оплата',
    bank_transfer: 'На розрахунковий рахунок',
  };

  private static DELIVERY_LABELS: Record<string, string> = {
    pickup: 'Самовивіз',
    nova_poshta_branch: 'Нова пошта, відділення',
    nova_poshta_address: 'Нова пошта, адресна доставка',
  };

  private formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Kyiv',
    });
  }

  /** Shared email shell: header, content, contacts footer. */
  private wrap(content: string): string {
    return `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff">
        <div style="padding:24px 24px 0">
          <span style="font-size:26px;font-weight:bold;color:#2563eb;letter-spacing:0.5px">SmartLine</span>
          <span style="font-size:13px;color:#9ca3af"> · техніка й аксесуари</span>
        </div>
        <div style="padding:8px 24px 24px">${content}</div>
        <div style="padding:16px 24px;border-top:1px solid #e5e7eb;background:#f9fafb;border-radius:0 0 12px 12px">
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280">
            Є питання? Телефонуйте:
            <a href="tel:+380957162055" style="color:#2563eb;text-decoration:none">+380 (95) 716-20-55</a> ·
            <a href="tel:+380689410560" style="color:#2563eb;text-decoration:none">+380 (68) 941-05-60</a>
          </p>
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280">Пн–Пт 11:00–18:00 · Сб 11:00–17:00 · Нд — вихідний</p>
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280">м. Івано-Франківськ, вул. Галицька 112Д, маг. №17 (ТЦ Щедрик)</p>
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280">
            Instagram: <a href="https://www.instagram.com/smartline_if" style="color:#2563eb;text-decoration:none">@smartline_if</a>
          </p>
          <p style="margin:8px 0 0;font-size:12px;color:#9ca3af">Це автоматичний лист — відповідати на нього не потрібно.</p>
        </div>
      </div>
    `;
  }

  private deliveryRows(order: any): string {
    const delivery = order.delivery ?? {};
    const method =
      MailService.DELIVERY_LABELS[delivery.type] || delivery.method || '';
    const city = delivery.cityName || delivery.city || '';
    const place =
      delivery.warehouseName || delivery.warehouse || delivery.address || '';
    const payment =
      MailService.PAYMENT_LABELS[order.payment?.method] ||
      order.payment?.method ||
      '';

    const row = (label: string, value: string) =>
      value
        ? `<tr>
            <td style="padding:6px 12px 6px 0;font-size:14px;color:#6b7280;white-space:nowrap;vertical-align:top">${label}</td>
            <td style="padding:6px 0;font-size:14px;color:#111827">${value}</td>
          </tr>`
        : '';

    return `
      <table style="width:100%;border-collapse:collapse;margin:4px 0 0">
        ${row('Доставка', method)}
        ${row('Місто', city)}
        ${row('Адреса', place)}
        ${row('Оплата', payment)}
        ${row('Коментар', delivery.note || '')}
      </table>
    `;
  }

  async sendOrderConfirmation(order: any) {
    if (!order.customerEmail) return;

    const itemsHtml = (order.items || [])
      .map(
        (item: any) =>
          `<tr>
            <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827">
              ${item.name}${item.variantName ? `<br><span style="font-size:13px;color:#6b7280">${item.variantName}</span>` : ''}
            </td>
            <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:14px;color:#6b7280;white-space:nowrap">${item.price} грн × ${item.quantity}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;text-align:right;font-size:14px;font-weight:bold;color:#111827;white-space:nowrap">${item.price * item.quantity} грн</td>
          </tr>`,
      )
      .join('');

    const firstName = (order.customerName || '').trim().split(/\s+/)[0];

    const nextSteps =
      order.delivery?.type === 'pickup'
        ? [
            'Менеджер зателефонує вам, щоб підтвердити замовлення.',
            'Повідомимо, щойно замовлення буде готове до видачі в магазині.',
          ]
        : [
            'Менеджер зателефонує вам, щоб підтвердити замовлення.',
            'Відправляємо протягом 1–2 робочих днів.',
            'Номер ТТН для відстеження прийде окремим листом.',
          ];

    const content = `
      <h2 style="margin:16px 0 4px;font-size:22px;color:#111827">${firstName ? `${firstName}, дякуємо` : 'Дякуємо'} за замовлення! 🎉</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280">
        Замовлення <strong style="color:#111827">#${order.orderNumber}</strong> від ${this.formatDate(order.createdAt)} прийнято.
      </p>

      <table style="width:100%;border-collapse:collapse;margin:0 0 4px">
        <thead>
          <tr>
            <th style="padding:8px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;background:#f3f4f6;border-radius:6px 0 0 6px">Товар</th>
            <th style="padding:8px;text-align:center;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;background:#f3f4f6">Ціна</th>
            <th style="padding:8px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;background:#f3f4f6;border-radius:0 6px 6px 0">Сума</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px 8px;font-size:16px;font-weight:bold;color:#111827">Разом</td>
            <td style="padding:12px 8px;text-align:right;font-size:16px;font-weight:bold;color:#2563eb;white-space:nowrap">${order.totalAmount} грн</td>
          </tr>
        </tfoot>
      </table>

      <div style="margin:8px 0 16px;padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px">
        ${this.deliveryRows(order)}
      </div>

      <div style="padding:14px 16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px">
        <p style="margin:0 0 8px;font-size:14px;color:#1e40af"><strong>Що далі?</strong></p>
        <table style="border-collapse:collapse">
          ${nextSteps
            .map(
              (step, i) =>
                `<tr><td style="padding:2px 8px 2px 0;font-size:14px;color:#1e40af;vertical-align:top">${i + 1}.</td><td style="padding:2px 0;font-size:14px;color:#1e40af">${step}</td></tr>`,
            )
            .join('')}
        </table>
      </div>
    `;

    await this.send(
      order.customerEmail,
      `Замовлення #${order.orderNumber} прийнято — SmartLine`,
      this.wrap(content),
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

  async sendContactMessage(data: {
    name: string;
    phone: string;
    message: string;
    adminEmail: string;
  }) {
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

    const STATUS_VIEW: Record<
      string,
      { emoji: string; title: string; text: string }
    > = {
      CONFIRMED: {
        emoji: '✅',
        title: 'Замовлення підтверджено',
        text: 'Менеджер підтвердив ваше замовлення — готуємо його до відправки.',
      },
      SHIPPED: {
        emoji: '🚚',
        title: 'Замовлення відправлено',
        text: 'Ваше замовлення передано у службу доставки. Очікуйте повідомлення про прибуття.',
      },
      DELIVERED: {
        emoji: '📬',
        title: 'Замовлення доставлено',
        text: 'Ваше замовлення прибуло. Дякуємо за покупку — будемо раді бачити вас знову! Якщо все сподобалось, залиште відгук про товар на сайті — це дуже допомагає іншим покупцям.',
      },
      CANCELLED: {
        emoji: '❌',
        title: 'Замовлення скасовано',
        text: 'Ваше замовлення скасовано. Якщо це сталося помилково — зателефонуйте нам, і ми все виправимо.',
      },
    };

    const view = STATUS_VIEW[order.status] || {
      emoji: 'ℹ️',
      title: `Статус: ${order.status}`,
      text: '',
    };

    const ttnBlock = order.ttn
      ? `<div style="margin:16px 0 0;padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px">
          <p style="margin:0;font-size:14px;color:#111827">
            ТТН Нової пошти: <strong>${order.ttn}</strong><br>
            <a href="https://tracking.novaposhta.ua/#/uk/parcel/list/${order.ttn}" style="color:#2563eb">Відстежити посилку →</a>
          </p>
        </div>`
      : '';

    const content = `
      <h2 style="margin:16px 0 4px;font-size:22px;color:#111827">${view.emoji} ${view.title}</h2>
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280">Замовлення <strong style="color:#111827">#${order.orderNumber}</strong></p>
      ${view.text ? `<p style="margin:0;font-size:14px;color:#111827">${view.text}</p>` : ''}
      ${ttnBlock}
    `;

    await this.send(
      order.customerEmail,
      `${view.emoji} ${view.title} — #${order.orderNumber}`,
      this.wrap(content),
    );
  }
}
