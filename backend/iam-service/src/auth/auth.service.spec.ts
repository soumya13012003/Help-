import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PasswordService } from '../crypto/password.service';
import { JwtService } from '@nestjs/jwt';
import { RedisSessionService } from './redis-session.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../iam/entities/user.entity';
import { RefreshToken } from '../iam/entities/refresh-token.entity';
import * as crypto from 'crypto';

describe('AuthService PKCE Validation', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PasswordService, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: RedisSessionService, useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(RefreshToken), useValue: {} },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('should validate a correct S256 PKCE challenge', () => {
    const codeVerifier = 'a_very_long_secure_random_string_that_is_at_least_43_chars';
    
    // Simulate what the client does:
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const isValid = authService.validatePkce(codeVerifier, codeChallenge, 'S256');
    expect(isValid).toBe(true);
  });

  it('should reject an incorrect S256 PKCE challenge', () => {
    const codeVerifier = 'a_very_long_secure_random_string_that_is_at_least_43_chars';
    const wrongChallenge = 'wrong_challenge_string';

    const isValid = authService.validatePkce(codeVerifier, wrongChallenge, 'S256');
    expect(isValid).toBe(false);
  });
});
