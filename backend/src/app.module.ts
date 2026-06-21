import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { CartModule } from './cart/cart.module';
import { PromotionsModule } from './promotions/promotions.module';
import { BannersModule } from './banners/banners.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UploadModule } from './upload/upload.module';
import { NovaPoshtaModule } from './nova-poshta/nova-poshta.module';
import { TelegramModule } from './telegram/telegram.module';
import { PaymentModule } from './payment/payment.module';
import { MailModule } from './mail/mail.module';
import { HomepageModule } from './homepage/homepage.module';
import { ContactModule } from './contact/contact.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    OrdersModule,
    CartModule,
    PromotionsModule,
    BannersModule,
    ReviewsModule,
    UploadModule,
    NovaPoshtaModule,
    TelegramModule,
    PaymentModule,
    MailModule,
    HomepageModule,
    ContactModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
