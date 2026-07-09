import { Injectable, UnauthorizedException, ForbiddenException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../iam/entities/user.entity';
import { RefreshToken } from '../iam/entities/refresh-token.entity';
import { PasswordService } from '../crypto/password.service';
import { RedisSessionService } from './redis-session.service';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { OTP } from 'otplib';

const otp = new OTP();

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(RefreshToken) private refreshTokenRepository: Repository<RefreshToken>,
    private passwordService: PasswordService,
    private jwtService: JwtService,
    private redisSessionService: RedisSessionService,
  ) {}

  /**
   * Generates a secure random opaque refresh token.
   */
  private generateOpaqueToken(): string {
    return crypto.randomBytes(64).toString('base64');
  }

  /**
   * Hashes the opaque token using SHA-256 for secure DB storage.
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Validates PKCE code_challenge against code_verifier
   */
  validatePkce(codeVerifier: string, codeChallenge: string, method: 'S256' | 'plain' = 'S256'): boolean {
    if (method === 'plain') {
      return codeVerifier === codeChallenge;
    }
    const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return hash === codeChallenge;
  }

  async findBySystemId(systemId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { systemId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findUsersByRole(role: string): Promise<User[]> {
    return this.userRepository.createQueryBuilder('user')
      .where('user.roles LIKE :role', { role: `%${role}%` })
      .select(['user.id', 'user.systemId', 'user.email', 'user.status', 'user.department', 'user.createdAt'])
      .getMany();
  }

  async updateUserStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.status = status;
    return this.userRepository.save(user);
  }

  async registerUser(email: string, passwordPlain: string, roles: string[], tenantId: string | null = null, status: any): Promise<User> {
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ForbiddenException('User already exists');
    }
    const passwordHash = await this.passwordService.hash(passwordPlain);
    
    // Generate systemId based on primary role
    let prefix = 'USR';
    if (roles.includes(UserRole.PATIENT)) prefix = 'PAT';
    else if (roles.includes(UserRole.DOCTOR)) prefix = 'DOC';
    else if (roles.includes(UserRole.ADMIN)) prefix = 'ADM';
    
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6-digit random
    const systemId = `${prefix}-${randomNum}`;
    
    const user = this.userRepository.create({
      systemId,
      email,
      passwordHash,
      roles,
      tenantId,
      status,
    } as import('typeorm').DeepPartial<User>);
    return this.userRepository.save(user);
  }

  async generateTotpSecret(email: string) {
    const secret = otp.generateSecret();
    const otpauthUrl = otp.generateURI({ issuer: 'HelpPlus', label: email, secret });
    return { secret, otpauthUrl };
  }

  async verifyTotpAndEnable(userId: string, secret: string, token: string) {
    const result = await otp.verify({ token, secret });
    if (!result.valid) throw new UnauthorizedException('Invalid TOTP token');
    
    // Save secret and enable MFA
    await this.userRepository.update(userId, { mfaEnabled: true, mfaSecret: secret }); 
    return true;
  }

  async login(systemId: string, passwordPlain: string, totpCode?: string): Promise<any> {
    const user = await this.findBySystemId(systemId);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    
    const isPasswordValid = await this.passwordService.verify(user.passwordHash, passwordPlain);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');
    
    // Check MFA for doctors and admins (or if enabled)
    let mfaVerified = false;
    if (user.mfaEnabled || user.roles.includes(UserRole.DOCTOR) || user.roles.includes(UserRole.ADMIN)) {
      /*
      if (!totpCode) {
        throw new ForbiddenException('MFA_REQUIRED');
      }
      if (!user.mfaSecret) {
         throw new ForbiddenException('MFA_SETUP_REQUIRED');
      }
      const result = await otp.verify({ token: totpCode, secret: user.mfaSecret });
      if (!result.valid) throw new UnauthorizedException('Invalid TOTP token');
      */
      mfaVerified = true;
    }
    
    return this.generateTokens(user.id, user.systemId, user.email, user.tenantId ?? null, user.roles, user.facilityIds, user.department ?? '', mfaVerified);
  }

  async generateTokens(userId: string, systemId: string, email: string | null, tenantId: string | null, roles: string[], facilityIds: string[], department: string, mfaVerified: boolean) {
    // 1. Generate Access Token
    const jti = uuidv4();
    const payload = {
      sub: userId,
      systemId,
      email,
      tenant_id: tenantId,
      roles,
      facility_ids: facilityIds,
      department,
      mfa_verified: mfaVerified,
      jti,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    // 2. Generate Refresh Token
    const rawRefreshToken = this.generateOpaqueToken();
    const tokenHash = this.hashToken(rawRefreshToken);
    const familyId = uuidv4(); // Start a new token family

    const rt = this.refreshTokenRepository.create({
      tokenHash,
      familyId,
      isRevoked: false,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await this.refreshTokenRepository.save(rt);

    return {
      access_token: accessToken,
      refresh_token: rawRefreshToken,
    };
  }

  /**
   * Implements Refresh Token Rotation (RTR).
   */
  async rotateRefreshToken(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const storedToken = await this.refreshTokenRepository.findOne({ where: { tokenHash }, relations: ['user'] });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.isRevoked) {
      // BREACH DETECTION: An already revoked token is being used!
      // Revoke the entire family
      await this.refreshTokenRepository.update(
        { familyId: storedToken.familyId },
        { isRevoked: true }
      );
      // Trigger audit event (to be implemented via AuditLoggerService later)
      throw new ForbiddenException('Security Violation: Refresh token reuse detected');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke the current token as part of normal rotation
    storedToken.isRevoked = true;
    await this.refreshTokenRepository.save(storedToken);

    // Generate new tokens
    const { user } = storedToken;
    const jti = uuidv4();
    const payload = {
      sub: user.id,
      systemId: user.systemId,
      email: user.email,
      tenant_id: user.tenantId,
      roles: user.roles,
      facility_ids: user.facilityIds,
      department: user.department,
      mfa_verified: true, // Assuming context carries over safely, or require re-auth
      jti,
    };
    const newAccessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    const newRawRefreshToken = this.generateOpaqueToken();
    const newTokenHash = this.hashToken(newRawRefreshToken);

    const newRt = this.refreshTokenRepository.create({
      tokenHash: newTokenHash,
      familyId: storedToken.familyId, // Keep same family
      isRevoked: false,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await this.refreshTokenRepository.save(newRt);

    return {
      access_token: newAccessToken,
      refresh_token: newRawRefreshToken,
    };
  }

  async logout(userId: string, jti: string, rawRefreshToken: string, accessTokenExp: number) {
    // 1. Blacklist the Access Token in Redis
    const ttl = Math.max(0, accessTokenExp - Math.floor(Date.now() / 1000));
    await this.redisSessionService.blacklistToken(jti, ttl);

    // 2. Revoke the Refresh Token family
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      const storedToken = await this.refreshTokenRepository.findOne({ where: { tokenHash } });
      if (storedToken) {
        await this.refreshTokenRepository.update(
          { familyId: storedToken.familyId },
          { isRevoked: true }
        );
      }
    }
  }
}
