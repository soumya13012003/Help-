import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  systemId: string; // E.g., PAT-123456

  @Column({ unique: true, nullable: true })
  email: string;

  @Column()
  passwordHash: string; // Stored securely via Argon2

  @Column({ default: false })
  mfaEnabled: boolean;

  @Column({ nullable: true })
  mfaSecret: string; // Encrypted via CryptoService

  @Column({ type: 'uuid', nullable: true })
  tenantId: string | null; // Can be null for independent patients/doctors

  @Column({ default: UserStatus.ACTIVE })
  status: UserStatus;

  // For ABAC / RBAC (e.g. 'PATIENT', 'DOCTOR', 'ADMIN')
  @Column({ type: 'simple-array', default: '' })
  roles: string[];

  @Column({ type: 'simple-array', default: '' })
  facilityIds: string[];

  @Column({ nullable: true })
  department: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RefreshToken, (token: RefreshToken) => token.user)
  refreshTokens: RefreshToken[];
}
