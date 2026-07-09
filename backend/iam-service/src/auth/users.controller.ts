import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRole, UserStatus } from '../iam/entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @Get('doctors')
  async getDoctors() {
    // Ideally this would be protected by an AdminGuard checking JWT
    return this.authService.findUsersByRole(UserRole.DOCTOR);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: UserStatus }) {
    // Ideally protected by AdminGuard
    return this.authService.updateUserStatus(id, body.status);
  }
}
