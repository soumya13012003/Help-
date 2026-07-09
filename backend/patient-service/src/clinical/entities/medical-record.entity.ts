import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PatientProfile } from '../../patient/entities/patient-profile.entity';

@Entity('medical_records')
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PatientProfile)
  @JoinColumn({ name: 'patientId', referencedColumnName: 'userId' })
  patient: PatientProfile;

  @Column({ type: 'uuid' })
  patientId: string;

  @Column({ type: 'uuid' })
  doctorId: string;

  @Column()
  doctorName: string;

  @Column()
  type: string; // e.g. 'CLINICAL_NOTE', 'LAB_RESULT', 'DIAGNOSIS'

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
