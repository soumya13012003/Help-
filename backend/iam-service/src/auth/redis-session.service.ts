import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisSessionService {
  private readonly blacklist = new Map<string, number>();

  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds > 0) {
      this.blacklist.set(jti, Date.now() + (ttlSeconds * 1000));
    }
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const expiresAt = this.blacklist.get(jti);
    if (!expiresAt) return false;
    
    if (Date.now() > expiresAt) {
      this.blacklist.delete(jti);
      return false;
    }
    return true;
  }
}
