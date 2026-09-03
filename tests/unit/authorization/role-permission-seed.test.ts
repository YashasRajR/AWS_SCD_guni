import { describe, it, expect } from 'vitest';
import { PERMISSIONS, ROLE_PERMISSION_SEED } from '@scd/constants';

describe('ROLE_PERMISSION_SEED — SUPER_ADMIN boundary', () => {
  it('grants MANAGE_ROLES only to SUPER_ADMIN', () => {
    expect(ROLE_PERMISSION_SEED.SUPER_ADMIN).toContain(PERMISSIONS.MANAGE_ROLES);
    expect(ROLE_PERMISSION_SEED.ADMIN).not.toContain(PERMISSIONS.MANAGE_ROLES);
    expect(ROLE_PERMISSION_SEED.VOLUNTEER).not.toContain(PERMISSIONS.MANAGE_ROLES);
    expect(ROLE_PERMISSION_SEED.ATTENDEE).not.toContain(PERMISSIONS.MANAGE_ROLES);
  });

  it('gives SUPER_ADMIN a strict superset of ADMIN permissions', () => {
    for (const code of ROLE_PERMISSION_SEED.ADMIN) {
      expect(ROLE_PERMISSION_SEED.SUPER_ADMIN).toContain(code);
    }
    expect(ROLE_PERMISSION_SEED.SUPER_ADMIN.length).toBeGreaterThan(
      ROLE_PERMISSION_SEED.ADMIN.length,
    );
  });

  it('ADMIN otherwise retains every operational permission it had before', () => {
    const nonRolePermissions = Object.values(PERMISSIONS).filter(
      (p) => p !== PERMISSIONS.MANAGE_ROLES,
    );
    for (const code of nonRolePermissions) {
      expect(ROLE_PERMISSION_SEED.ADMIN).toContain(code);
    }
  });

  it('VOLUNTEER and ATTENDEE grants are unchanged', () => {
    expect(ROLE_PERMISSION_SEED.VOLUNTEER).toEqual([
      PERMISSIONS.VIEW_ATTENDEE,
      PERMISSIONS.COMPLETE_CHECKPOINT,
    ]);
    expect(ROLE_PERMISSION_SEED.ATTENDEE).toEqual([]);
  });
});
