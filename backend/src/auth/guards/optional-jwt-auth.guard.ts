import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Populates req.user when a valid token is present, but NEVER blocks the route:
// guests proceed with req.user === undefined. Used on public endpoints that
// want to attribute the action to a logged-in user when possible (e.g. linking
// an order to the buyer's account) without forcing authentication.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // ignore — missing/invalid token just means "guest"
    }
    return true;
  }

  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return (user || undefined) as TUser;
  }
}
