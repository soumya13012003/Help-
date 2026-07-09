import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ABAC_POLICY_KEY, AbacPolicyOptions } from './decorators';

// DAG defining Role Inheritance (Higher roles inherit lower roles' permissions)
// e.g., Tenant Admin -> CMO -> Attending -> Resident -> Nurse
const ROLE_HIERARCHY: Record<string, string[]> = {
  'tenant-admin': ['cmo', 'attending', 'resident', 'nurse'],
  'cmo': ['attending', 'resident', 'nurse'],
  'attending': ['resident', 'nurse'],
  'resident': ['nurse'],
  'nurse': [],
};

@Injectable()
export class SecurityPolicyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const policy = this.reflector.getAllAndOverride<AbacPolicyOptions>(ABAC_POLICY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!policy) {
      return true; // No policy defined, bypass this guard (rely on other guards)
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User context missing');
    }

    // Expand roles based on hierarchy DAG
    const effectiveRoles = new Set<string>(user.roles);
    user.roles.forEach((role: string) => {
      const inherited = ROLE_HIERARCHY[role] || [];
      inherited.forEach(r => effectiveRoles.add(r));
    });

    // 1. Static RBAC check: Does the user's role permit this action globally?
    // In a real system, you'd map Actions -> Required Roles, or let ABAC handle it all.
    // For this example, let's say 'tenant-admin' can do anything.
    if (effectiveRoles.has('tenant-admin')) {
      return true;
    }

    // 2. Dynamic ABAC check
    // Compare Subject (user), Resource (request.body / request.params), Action (policy.action), Context (Environment)
    
    // Example: Break-glass action requires CMO or Attending
    if (policy.action === 'break-glass') {
      if (!effectiveRoles.has('cmo') && !effectiveRoles.has('attending')) {
        throw new ForbiddenException('Insufficient role clearance for break-glass action');
      }
    }

    // Context Evaluation: Check if IP is within hospital network for certain actions, or if it's within shift time.
    // For this demonstration, we'll do a basic resource check (e.g. facility match).
    const requestedFacility = request.params.facilityId || request.body?.facilityId;
    
    if (requestedFacility) {
      // Must have clearance for this facility
      if (!user.facility_ids?.includes(requestedFacility)) {
        throw new ForbiddenException('User does not have clearance for the requested facility');
      }
    }

    // If all checks pass:
    return true;
  }
}
