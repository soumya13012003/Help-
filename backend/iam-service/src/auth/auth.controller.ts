import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRole, UserStatus } from '../iam/entities/user.entity';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  @Post('patient/signup')
  async patientSignup(@Body() body: any) {
    const { email, password, profile } = body;
    const user = await this.authService.registerUser(email, password, [UserRole.PATIENT], null, UserStatus.ACTIVE);
    
    // Publish event for patient-service to consume
    try {
      this.amqpConnection.publish('events', 'patient.registered', {
        userId: user.id, // Keep UUID for backend references
        systemId: user.systemId,
        email: user.email,
        profile: profile || {},
      });
    } catch (e) {
      console.warn('Could not publish to RabbitMQ, proceeding anyway:', e.message);
    }

    return { message: 'Patient signed up successfully', systemId: user.systemId };
  }

  @Post('patient/login')
  @HttpCode(HttpStatus.OK)
  async patientLogin(@Body() body: any) {
    const { systemId, password } = body;
    const token = await this.authService.login(systemId, password);
    // Verify role
    const user = await this.authService.findBySystemId(systemId);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.roles.includes(UserRole.PATIENT)) {
      throw new ForbiddenException('Invalid portal for user role');
    }
    return token;
  }

  @Post('doctor/signup')
  async doctorSignup(@Body() body: any) {
    const { email, password, tenantId } = body;
    // Doctors require verification, set status to PENDING
    const user = await this.authService.registerUser(email, password, [UserRole.DOCTOR], tenantId, UserStatus.PENDING);
    return { message: 'Doctor signed up successfully. Pending approval.', systemId: user.systemId };
  }

  @Post('doctor/login')
  @HttpCode(HttpStatus.OK)
  async doctorLogin(@Body() body: any) {
    const { systemId, password, totpCode } = body;
    
    const user = await this.authService.findBySystemId(systemId);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    
    if (!user.roles.includes(UserRole.DOCTOR)) {
      throw new ForbiddenException('Invalid portal for user role');
    }
    if (user.status === UserStatus.PENDING) {
      throw new ForbiddenException('Account pending approval');
    }
    
    const token = await this.authService.login(systemId, password, totpCode);
    return token;
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() body: any) {
    const { systemId, password, totpCode } = body;
    const user = await this.authService.findBySystemId(systemId);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Invalid portal for user role');
    }
    
    const token = await this.authService.login(systemId, password, totpCode);
    return token;
  }

  @Post('admin/signup')
  async adminSignup(@Body() body: any) {
    const { email, password, name, department, roleTitle } = body;
    const user = await this.authService.registerUser(email, password, [UserRole.ADMIN], null, UserStatus.ACTIVE);
    return { message: 'Admin signed up successfully.', systemId: user.systemId };
  }

  @Post('setup-mfa')
  async setupMfa(@Body() body: any) {
    const { email } = body;
    // In a real flow, this should require a valid token (e.g. they logged in but need setup)
    // For simplicity, we just generate the secret for the given email
    return this.authService.generateTotpSecret(email);
  }

  @Post('verify-mfa')
  async verifyMfa(@Body() body: any) {
    const { email, secret, token } = body;
    const user = await this.authService.findByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');
    
    await this.authService.verifyTotpAndEnable(user.id, secret, token);
    return { message: 'MFA enabled successfully' };
  }
}
