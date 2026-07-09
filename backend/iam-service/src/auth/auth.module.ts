import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { RedisSessionService } from './redis-session.service';
import { JwtBlacklistGuard } from './jwt-blacklist.guard';
import { CryptoModule } from '../crypto/crypto.module';
import { User } from '../iam/entities/user.entity';
import { RefreshToken } from '../iam/entities/refresh-token.entity';
import * as crypto from 'crypto';

// Generate mock RSA key pair for demonstration purposes. In production, load from a secure vault.
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
import { AuthController } from './auth.controller';
import { UsersController } from './users.controller';

import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    CryptoModule,
    AuditModule,
    JwtModule.register({
      privateKey: privateKey,
      publicKey: publicKey,
      signOptions: { algorithm: 'RS256', expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [
    AuthService,
    RedisSessionService,
    JwtBlacklistGuard,
  ],
  exports: [AuthService, JwtBlacklistGuard, RedisSessionService, JwtModule],
})
export class AuthModule {}
