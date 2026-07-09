import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisSessionService } from './redis-session.service';
import { Request } from 'express';

@Injectable()
export class JwtBlacklistGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private redisSessionService: RedisSessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      // The JWT module is configured with the public key, so this verifies the signature securely.
      const payload = this.jwtService.verify(token);
      
      if (!payload.jti) {
        throw new UnauthorizedException('Invalid token format');
      }

      // Check if jti is blacklisted in Redis
      const isBlacklisted = await this.redisSessionService.isTokenBlacklisted(payload.jti);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Attach payload to request for downstream ABAC/RBAC guards
      (request as any).user = payload;
      
    } catch (err) {
      // Defensively catch and throw standard 401 without leaking why (e.g. signature mismatch vs expired)
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
