import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { MailService } from '../mail/mail.service';
import { getPrimaryFrontendUrl } from '../common/frontend-url';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { addDays, addMinutes, addHours } from 'date-fns';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const exists = await this.prisma.user.findUnique({
      where: { email },
    });
    if (exists) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashed,
        name: dto.name,
        phone: dto.phone,
      },
    });

    await this.sendVerificationEmail(email);

    return this.issueTokens(user.id, user.email, user.role);
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.prisma.user.update({
      where: { email: record.email },
      data: { emailVerified: true },
    });

    // Claim only unowned guest orders for this now-verified email — never
    // reassign an order already linked to another account.
    await this.prisma.order.updateMany({
      where: {
        customerEmail: { equals: record.email, mode: 'insensitive' },
        userId: null,
      },
      data: { userId: user.id },
    });

    await this.prisma.emailVerificationToken.delete({ where: { token } });
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.emailVerified) return;
    await this.sendVerificationEmail(user.email);
  }

  private async sendVerificationEmail(email: string) {
    const token = randomBytes(32).toString('hex');
    await this.prisma.emailVerificationToken.deleteMany({ where: { email } });
    await this.prisma.emailVerificationToken.create({
      data: { email, token, expiresAt: addHours(new Date(), 24) },
    });
    const frontendUrl = getPrimaryFrontendUrl(
      this.config.get<string>('FRONTEND_URL'),
    );
    this.mail.sendEmailVerification(email, token, frontendUrl).catch(() => {});
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) throw new UnauthorizedException('Невірний email або пароль');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Невірний email або пароль');

    return this.issueTokens(user.id, user.email, user.role);
  }

  async refresh(userId: string, email: string, role: string, oldToken: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token: oldToken } });
    return this.issueTokens(userId, email, role);
  }

  // Kills every session of the user, not just the presented token — a lost or
  // stolen refresh token must die on logout/password change, and in the prod
  // Bearer flow the httpOnly cookie never reaches the backend anyway.
  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) return; // silent — don't leak user existence

    const token = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.deleteMany({
      where: { email },
    });
    await this.prisma.passwordResetToken.create({
      data: { email, token, expiresAt: addHours(new Date(), 1) },
    });

    const frontendUrl = getPrimaryFrontendUrl(
      this.config.get<string>('FRONTEND_URL'),
    );
    this.mail.sendPasswordReset(email, token, frontendUrl).catch(() => {});
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.update({
      where: { email: record.email },
      data: { password: hashed, passwordChangedAt: new Date() },
    });
    await this.prisma.passwordResetToken.delete({
      where: { token: dto.token },
    });
    // Password reset kills every existing session — a compromised account
    // must not stay reachable via a refresh token the attacker already holds.
    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
      },
    });
    const { password, ...safe } = updated;
    return safe;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new BadRequestException('Невірний поточний пароль');
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed, passwordChangedAt: new Date() },
    });
    // Changing the password logs out every device.
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  private async issueTokens(userId: string, email: string, role: string) {
    // Best-effort cleanup so the table doesn't grow unbounded (one row per
    // login/refresh, 30-day TTL) — no cron needed.
    await this.prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });

    const accessToken = this.jwt.sign(
      { sub: userId, email, role, typ: 'access' },
      {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
      },
    );

    const refreshToken = this.jwt.sign(
      { sub: userId, email, role, typ: 'refresh' },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '30d',
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: addDays(new Date(), 30),
      },
    });

    return { accessToken, refreshToken };
  }
}
