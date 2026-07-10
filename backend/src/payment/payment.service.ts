import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { getPrimaryFrontendUrl } from '../common/frontend-url';
import axios from 'axios';
import { createHmac } from 'crypto';
import { Role, User } from '@prisma/client';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async createMonobankInvoice(
    orderId: string,
    user: Pick<User, 'id' | 'role'>,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, totalAmount: true, userId: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (user.role !== Role.ADMIN && order.userId !== user.id) {
      throw new ForbiddenException('You cannot pay for this order');
    }

    const token = this.config.get<string>('MONOBANK_TOKEN');
    const frontendUrl = getPrimaryFrontendUrl(this.config.get<string>('FRONTEND_URL'));
    const redirectUrl = `${frontendUrl}/checkout/success?orderId=${order.id}`;

    if (!token || token === 'placeholder') {
      this.logger.warn('Monobank not configured, returning mock URL');
      return { pageUrl: `${redirectUrl}?mock=true` };
    }

    const response = await axios.post(
      'https://api.monobank.ua/api/merchant/invoice/create',
      {
        amount: Math.round(Number(order.totalAmount) * 100), // kopecks
        ccy: 980, // UAH
        merchantPaymInfo: { reference: order.id },
        redirectUrl,
        webhookUrl: `${this.config.get('BACKEND_URL') || 'http://localhost:4000'}/api/payment/webhook`,
      },
      { headers: { 'X-Token': token } },
    );

    return {
      pageUrl: response.data.pageUrl,
      invoiceId: response.data.invoiceId,
    };
  }

  async handleWebhook(body: any, signature: string) {
    const secret = this.config.get<string>('MONOBANK_WEBHOOK_SECRET');

    if (secret && secret !== 'placeholder') {
      const hmac = createHmac('sha256', secret)
        .update(JSON.stringify(body))
        .digest('base64');
      if (hmac !== signature) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    if (body.status === 'success' && body.reference) {
      const existing = await this.prisma.order.findUnique({
        where: { id: body.reference },
        select: { id: true, payment: true },
      });
      if (!existing) return { ok: true };

      const paymentData = existing.payment as any;
      if (paymentData?.status === 'paid') return { ok: true };

      await this.prisma.order.update({
        where: { id: body.reference },
        data: {
          payment: {
            method: 'online',
            status: 'paid',
            invoiceId: body.invoiceId,
          } as any,
        },
      });
    }

    return { ok: true };
  }
}
