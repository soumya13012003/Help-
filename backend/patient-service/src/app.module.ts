import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PatientModule } from './patient/patient.module';
import { ClinicalModule } from './clinical/clinical.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_URL || 'patient_db.sqlite',
      autoLoadEntities: true,
      synchronize: true, // Auto-create tables for dev
    } as any),
    JwtModule.register({}),
    PatientModule,
    ClinicalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
