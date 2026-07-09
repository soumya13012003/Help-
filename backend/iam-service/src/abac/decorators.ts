import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

export const ABAC_POLICY_KEY = 'abac_policy';
export interface AbacPolicyOptions {
  action: 'read' | 'write' | 'delete' | 'break-glass';
  resource: string;
}
export const AbacPolicy = (options: AbacPolicyOptions) => SetMetadata(ABAC_POLICY_KEY, options);

export const REQUIRE_MFA_KEY = 'require_mfa';
export const RequireMfa = () => SetMetadata(REQUIRE_MFA_KEY, true);
