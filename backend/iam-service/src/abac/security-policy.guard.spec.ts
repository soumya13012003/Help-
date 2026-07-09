import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SecurityPolicyGuard } from './security-policy.guard';
import { ABAC_POLICY_KEY } from './decorators';

describe('SecurityPolicyGuard ABAC Engine', () => {
  let guard: SecurityPolicyGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new SecurityPolicyGuard(reflector);
  });

  const createMockContext = (user: any, policy: any, requestBody?: any): ExecutionContext => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(policy);
    
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          body: requestBody || {},
          params: {},
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow tenant-admin to bypass dynamic checks', () => {
    const user = { roles: ['tenant-admin'] };
    const policy = { action: 'write', resource: 'patient-record' };
    const context = createMockContext(user, policy);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject nurse from performing break-glass action', () => {
    const user = { roles: ['nurse'] };
    const policy = { action: 'break-glass', resource: 'patient-record' };
    const context = createMockContext(user, policy);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Insufficient role clearance for break-glass action');
  });

  it('should allow attending to perform break-glass action', () => {
    const user = { roles: ['attending'] };
    const policy = { action: 'break-glass', resource: 'patient-record' };
    const context = createMockContext(user, policy);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject a user trying to access a facility they do not have clearance for', () => {
    const user = { roles: ['attending'], facility_ids: ['FAC-1'] };
    const policy = { action: 'read', resource: 'patient-record' };
    const requestBody = { facilityId: 'FAC-2' }; // Trying to access another facility
    const context = createMockContext(user, policy, requestBody);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('User does not have clearance for the requested facility');
  });
});
