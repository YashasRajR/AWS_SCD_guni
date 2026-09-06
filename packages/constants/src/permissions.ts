// Permission codes. Roles are granted permissions via the role_permissions
// table (see database/seed) — never hard-code "if role === ADMIN" checks
// in controllers; check permissions instead so the mapping stays admin-editable.
export const PERMISSIONS = {
  VIEW_ATTENDEE: 'VIEW_ATTENDEE',
  UPDATE_ATTENDEE: 'UPDATE_ATTENDEE',
  MANAGE_REGISTRATIONS: 'MANAGE_REGISTRATIONS',
  MANAGE_PAYMENTS: 'MANAGE_PAYMENTS',
  MANAGE_SPEAKERS: 'MANAGE_SPEAKERS',
  MANAGE_SESSIONS: 'MANAGE_SESSIONS',
  MANAGE_AGENDA: 'MANAGE_AGENDA',
  MANAGE_TIMELINE: 'MANAGE_TIMELINE',
  MANAGE_VENUES: 'MANAGE_VENUES',
  MANAGE_FAQ: 'MANAGE_FAQ',
  MANAGE_ANNOUNCEMENTS: 'MANAGE_ANNOUNCEMENTS',
  MANAGE_CHECKPOINTS: 'MANAGE_CHECKPOINTS',
  MANAGE_QR_TOKENS: 'MANAGE_QR_TOKENS',
  COMPLETE_CHECKPOINT: 'COMPLETE_CHECKPOINT',
  MANAGE_VOLUNTEERS: 'MANAGE_VOLUNTEERS',
  MANAGE_CERTIFICATES: 'MANAGE_CERTIFICATES',
  MANAGE_ACHIEVEMENTS: 'MANAGE_ACHIEVEMENTS',
  VIEW_REPORTS: 'VIEW_REPORTS',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',
  // SUPER_ADMIN-only: granting/revoking roles (including promoting another
  // user to ADMIN or SUPER_ADMIN). Deliberately withheld from ADMIN's
  // default grant below — role/privilege escalation is the one action an
  // ADMIN must never be able to perform on itself or anyone else.
  MANAGE_ROLES: 'MANAGE_ROLES',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Default role → permission grants, applied by the database seed. */
export const ROLE_PERMISSION_SEED: Record<
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'VOLUNTEER'
  | 'ATTENDEE'
  | 'FINANCE_ADMIN'
  | 'CONTENT_ADMIN'
  | 'VOLUNTEER_MANAGER',
  PermissionCode[]
> = {
  // Everything ADMIN has, plus MANAGE_ROLES.
  SUPER_ADMIN: Object.values(PERMISSIONS),
  // Full operational control of the event, but cannot change anyone's role.
  ADMIN: Object.values(PERMISSIONS).filter((code) => code !== PERMISSIONS.MANAGE_ROLES),
  VOLUNTEER: [PERMISSIONS.VIEW_ATTENDEE, PERMISSIONS.COMPLETE_CHECKPOINT],
  ATTENDEE: [],
  // Narrower admin roles (spec #43): each covers one operational slice
  // instead of full ADMIN access.
  FINANCE_ADMIN: [PERMISSIONS.VIEW_ATTENDEE, PERMISSIONS.MANAGE_PAYMENTS, PERMISSIONS.VIEW_REPORTS],
  CONTENT_ADMIN: [
    PERMISSIONS.MANAGE_SPEAKERS,
    PERMISSIONS.MANAGE_SESSIONS,
    PERMISSIONS.MANAGE_AGENDA,
    PERMISSIONS.MANAGE_TIMELINE,
    PERMISSIONS.MANAGE_VENUES,
    PERMISSIONS.MANAGE_FAQ,
    PERMISSIONS.MANAGE_ANNOUNCEMENTS,
    PERMISSIONS.MANAGE_SETTINGS,
  ],
  VOLUNTEER_MANAGER: [
    PERMISSIONS.VIEW_ATTENDEE,
    PERMISSIONS.MANAGE_VOLUNTEERS,
    PERMISSIONS.MANAGE_CHECKPOINTS,
    PERMISSIONS.MANAGE_QR_TOKENS,
    PERMISSIONS.COMPLETE_CHECKPOINT,
  ],
};
