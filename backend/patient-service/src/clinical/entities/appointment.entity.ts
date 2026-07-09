import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  patientId: string;

  @Column({ type: 'varchar', nullable: true })
  patientSystemId: string | null; // e.g. PAT-123456

  @Column({ type: 'varchar', nullable: true })
  patientName: string | null;

  @Column({ type: 'varchar', nullable: true })
  patientEmail: string | null;

  @Column({ type: 'varchar', nullable: true })
  doctorId: string | null;

  @Column({ type: 'varchar', nullable: true })
  doctorSystemId: string | null; // e.g. DOC-942981

  @Column({ type: 'varchar', nullable: true })
  doctorName: string | null;

  @Column({ type: 'varchar', nullable: true })
  department: string | null;

  @Column({ type: 'datetime' })
  appointmentDate: Date;

  @Column({ type: 'text', nullable: true })
  reasonForVisit: string;

  @Column({ type: 'varchar', default: 'REQUESTED' })
  status: string; // REQUESTED, SCHEDULED, COMPLETED, CANCELLED

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
