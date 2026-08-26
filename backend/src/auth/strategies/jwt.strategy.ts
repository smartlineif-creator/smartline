import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  typ?: 'access' | 'refresh';
  iat?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.accessToken || null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: config.get<string>('JWT_SECRET') as string,
    });
  }

  async validate(payload: JwtPayload) {
    // A refresh token must never authenticate as an access token. Tokens minted
    // before this change carry no typ — treat their absence as access for
    // deploy-window compatibility (cross-use is already blocked by the secrets).
    if (payload.typ === 'refresh') throw new UnauthorizedException();

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException();

    // Invalidate access tokens issued before the last password change, so a
    // 15-min access token dies immediately on password change/reset too.
    // Compare at second granularity: `iat` is floored to seconds, while
    // passwordChangedAt has millisecond precision, so comparing raw ms would
    // wrongly reject a token minted in the same second as the change.
    if (
      user.passwordChangedAt &&
      payload.iat &&
      payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)
    ) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
