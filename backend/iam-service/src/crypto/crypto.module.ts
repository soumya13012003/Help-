import { Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { PasswordService } from './password.service';

@Module({
  providers: [CryptoService, PasswordService],
  exports: [CryptoService, PasswordService],
})
export class CryptoModule {}
