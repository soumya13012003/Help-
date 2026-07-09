import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  /**
   * Hashes a plaintext password using Argon2id with strict HIPAA/Enterprise parameters.
   */
  async hash(password: string): Promise<string> {
    try {
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536, // m_cost = 65536 KB (64MB)
        timeCost: 3,       // t_cost = 3 iterations
        parallelism: 4,    // p_cost = 4 threads
      });
    } catch (error) {
      throw new InternalServerErrorException('Password hashing failed');
    }
  }

  /**
   * Verifies a plaintext password against an Argon2 hash.
   */
  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      return false;
    }
  }
}
