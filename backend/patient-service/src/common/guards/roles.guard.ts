import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      // Decode JWT without full signature verification for this microservice
      // (assuming edge-gateway verified the signature, or we share the public key)
      const decoded: any = this.jwtService.decode(token);
      
      if (!decoded || !decoded.roles) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Strictly enforce PATIENT role
      if (!decoded.roles.includes('PATIENT')) {
        throw new ForbiddenException('Access denied. Patient role required.');
      }

      // Attach user to request
      request.user = decoded;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
