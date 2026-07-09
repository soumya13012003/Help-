import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_MFA_KEY } from './decorators';

@Injectable()
export class MfaGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireMfa = this.reflector.getAllAndOverride<boolean>(REQUIRE_MFA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireMfa) {
      return true; // MFA not required for this route
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Expected to be populated by JwtBlacklistGuard

    if (!user) {
      throw new ForbiddenException('User context missing');
    }

    if (user.mfa_verified !== true) {
      // Clean 403 response indicating step-up auth is required
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'MFA_REQUIRED',
        description: 'This action requires step-up authentication. Please complete MFA.',
      });
    }

    return true;
  }
}
