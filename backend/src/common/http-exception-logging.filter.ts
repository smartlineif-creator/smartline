import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { FastifyRequest } from 'fastify';

// Nest only logs unhandled (500) exceptions on its own; 4xx responses are
// returned to the client silently, so production logs never showed WHY an
// admin request failed. 401 and 404 are skipped: the token-refresh flow and
// path scanners produce them constantly and would drown the signal.
@Catch()
export class HttpExceptionLoggingFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('HttpError');

  catch(exception: unknown, host: ArgumentsHost) {
    const req = host.switchToHttp().getRequest<FastifyRequest>();
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status !== 401 && status !== 404) {
        const response = exception.getResponse();
        const message =
          typeof response === 'string' ? response : JSON.stringify(response);
        const line = `${req.method} ${req.url} -> ${status} ${message}`;
        if (status >= 500) {
          this.logger.error(line);
        } else {
          this.logger.warn(line);
        }
      }
    } else {
      const err = exception as Error;
      this.logger.error(
        `${req.method} ${req.url} -> unhandled: ${err?.message ?? exception}`,
        err?.stack,
      );
    }
    super.catch(exception, host);
  }
}
