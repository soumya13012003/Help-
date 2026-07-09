import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { Prescription } from './entities/prescription.entity';
import { Bill } from './entities/bill.entity';
import { MedicalRecord } from './entities/medical-record.entity';
import { ClinicalService } from './clinical.service';
import { ClinicalController } from './clinical.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Prescription, Bill, MedicalRecord])],
  controllers: [ClinicalController],
  providers: [ClinicalService],
  exports: [ClinicalService],
})
export class ClinicalModule {}
