import { Controller, Get, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { PatientService } from './patient.service';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get('profile')
  @UseGuards(RolesGuard)
  async getProfile(@Req() req: any) {
    const userId = req.user.sub || req.user.userId;
    if (!userId) {
      throw new UnauthorizedException('Missing user ID in token');
    }
    
    return this.patientService.getProfile(userId);
  }
}
