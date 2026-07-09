import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientProfile } from './entities/patient-profile.entity';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(
    @InjectRepository(PatientProfile)
    private readonly profileRepository: Repository<PatientProfile>,
  ) {}

  // Disabled RabbitMQ for now
  // @RabbitSubscribe({
  //   exchange: 'events',
  //   routingKey: 'patient.registered',
  //   queue: 'patient-service-registration-queue',
  // })
  public async handlePatientRegistered(msg: any) {
    this.logger.log(`Received patient.registered event for user: ${msg.userId}`);
    try {
      const profileData = msg.profile || {};
      
      const newProfile = this.profileRepository.create({
        userId: msg.userId,
        name: profileData.name || null,
        dob: profileData.dob || null,
        gender: profileData.gender || null,
        phone: profileData.phone || null,
        bloodGroup: profileData.bloodGroup || null,
        address: profileData.address || null,
        emergencyContact: profileData.emergencyContact || null,
      });

      await this.profileRepository.save(newProfile);
      this.logger.log(`Patient profile created for user: ${msg.userId}`);
    } catch (error) {
      this.logger.error(`Failed to create patient profile: ${error.message}`);
    }
  }

  public async getProfile(userId: string): Promise<PatientProfile | null> {
    return this.profileRepository.findOne({ where: { userId } });
  }
}
