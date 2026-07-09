import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { IamModule } from './iam/iam.module';
import { AuditModule } from './audit/audit.module';
import { CryptoModule } from './crypto/crypto.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_URL || 'iam_db.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Use migrations in prod
    }),
    AuthModule,
    IamModule,
    AuditModule,
    CryptoModule,
  ],
})
export class AppModule {}
