import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PatientProfile } from '../../patient/entities/patient-profile.entity';

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PatientProfile)
  @JoinColumn({ name: 'patientId', referencedColumnName: 'userId' })
  patient: PatientProfile;

  @Column({ type: 'uuid', nullable: true })
  appointmentId: string;

  @Column({ type: 'uuid' })
  patientId: string;

  @Column({ type: 'uuid' })
  doctorId: string;

  @Column()
  doctorName: string;

  @Column()
  medication: string;

  @Column()
  dosage: string;

  @Column()
  frequency: string;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ type: 'text', nullable: true })
  additionalTests: string;

  @Column({ default: 'ACTIVE' })
  status: string; // ACTIVE, COMPLETED, DISCONTINUED

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
