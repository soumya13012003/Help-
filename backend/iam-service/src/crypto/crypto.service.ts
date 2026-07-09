import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  // In a real app, this key should be loaded securely from a KMS or environment variable.
  // It must be exactly 32 bytes for aes-256-gcm.
  private readonly encryptionKey: Buffer;

  constructor() {
    const keyString = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';
    this.encryptionKey = Buffer.from(keyString, 'utf-8');
    if (this.encryptionKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 bytes');
    }
  }

  /**
   * Encrypts plaintext using AES-256-GCM.
   * Returns a payload containing the IV, Auth Tag, and Ciphertext (base64 encoded).
   */
  encrypt(plainText: string): string {
    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
      
      let encrypted = cipher.update(plainText, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      const authTag = cipher.getAuthTag();
      
      // Format: iv:authTag:encryptedText
      return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    } catch (error) {
      // Never leak internal crypto errors
      throw new InternalServerErrorException('Encryption failed');
    }
  }

  /**
   * Decrypts a payload formatted as iv:authTag:encryptedText using AES-256-GCM.
   */
  decrypt(cipherPayload: string): string {
    try {
      const [ivBase64, authTagBase64, encryptedText] = cipherPayload.split(':');
      if (!ivBase64 || !authTagBase64 || !encryptedText) {
        throw new Error('Invalid payload format');
      }

      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
      
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      // Return null or throw safe error on decryption failure (e.g. tampering)
      throw new InternalServerErrorException('Decryption failed or data tampered');
    }
  }
}
