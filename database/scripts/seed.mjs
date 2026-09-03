#!/usr/bin/env node
// Development seed data. Creates the event, roles/permissions, the default
// checkpoints, and a small set of CLEARLY FAKE dev accounts. Idempotent —
// safe to run more than once (uses ON CONFLICT upserts).
import bcrypt from 'bcryptjs';
import { createPool } from './db.mjs';

// Keep in sync with packages/constants/src/permissions.ts — duplicated
// here in plain JS so this script has no dependency on the TS build.
const PERMISSIONS = [
  'VIEW_ATTENDEE',
  'UPDATE_ATTENDEE',
  'MANAGE_REGISTRATIONS',
  'MANAGE_PAYMENTS',
  'MANAGE_SPEAKERS',
  'MANAGE_SESSIONS',
  'MANAGE_AGENDA',
  'MANAGE_TIMELINE',
  'MANAGE_VENUES',
  'MANAGE_FAQ',
  'MANAGE_ANNOUNCEMENTS',
  'MANAGE_CHECKPOINTS',
  'COMPLETE_CHECKPOINT',
  'MANAGE_VOLUNTEERS',
  'MANAGE_CERTIFICATES',
  'MANAGE_ACHIEVEMENTS',
  'VIEW_REPORTS',
  'MANAGE_SETTINGS',
  'VIEW_AUDIT_LOGS',
  'MANAGE_ROLES',
];

const ROLE_PERMISSIONS = {
  // MANAGE_ROLES (granting/revoking roles) is SUPER_ADMIN-exclusive.
  SUPER_ADMIN: PERMISSIONS,
  ADMIN: PERMISSIONS.filter((code) => code !== 'MANAGE_ROLES'),
  VOLUNTEER: ['VIEW_ATTENDEE', 'COMPLETE_CHECKPOINT'],
  ATTENDEE: [],
};

const DEV_PASSWORD = 'DevPassw0rd!'; // clearly-fake dev-only password for every seeded account

const CHECKPOINTS = [
  { name: 'Registration', displayOrder: 1, isRequired: true },
  { name: 'Breakfast', displayOrder: 2, isRequired: false },
  { name: 'Lunch', displayOrder: 3, isRequired: false },
  { name: 'High Tea', displayOrder: 4, isRequired: false },
  { name: 'Goodies', displayOrder: 5, isRequired: false },
];

async function upsertUser(client, { email, roleName, fullName }) {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);
  const { rows } = await client.query(
    `INSERT INTO users (email, password_hash, email_verified_at, status)
     VALUES ($1, $2, now(), 'ACTIVE')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [email, passwordHash],
  );
  const userId = rows[0].id;

  const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [roleName]);
  const roleId = roleRes.rows[0].id;
  await client.query(
    'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [userId, roleId],
  );

  if (fullName) {
    await client.query(
      `INSERT INTO attendees (user_id, full_name, university, department, year, registration_type)
       VALUES ($1, $2, 'Ganpat University', 'Computer Engineering', '3rd Year', 'STUDENT')
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, fullName],
    );
  }

  return userId;
}

async function main() {
  const pool = createPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // --- Roles -----------------------------------------------------------
    for (const name of ['SUPER_ADMIN', 'ADMIN', 'VOLUNTEER', 'ATTENDEE']) {
      await client.query(
        `INSERT INTO roles (name, description) VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING`,
        [name, `${name.charAt(0)}${name.slice(1).toLowerCase()} role`],
      );
    }

    // --- Permissions + role grants ----------------------------------------
    for (const code of PERMISSIONS) {
      await client.query(
        `INSERT INTO permissions (code, description) VALUES ($1, $2)
         ON CONFLICT (code) DO NOTHING`,
        [code, code.replace(/_/g, ' ').toLowerCase()],
      );
    }
    for (const [roleName, codes] of Object.entries(ROLE_PERMISSIONS)) {
      const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [roleName]);
      const roleId = roleRes.rows[0].id;
      for (const code of codes) {
        const permRes = await client.query('SELECT id FROM permissions WHERE code = $1', [code]);
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [roleId, permRes.rows[0].id],
        );
      }
    }

    // --- Event -------------------------------------------------------------
    const eventRes = await client.query(
      `INSERT INTO events (name, slug, description, event_date, venue, status)
       VALUES ($1, $2, $3, $4, $5, 'PUBLISHED')
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [
        'AWS Student Community Day 2026',
        'aws-student-community-day-2026',
        'A student-focused AWS community event at Ganpat University.',
        '2026-11-15',
        'Ganpat University',
      ],
    );
    const eventId = eventRes.rows[0].id;

    // --- Checkpoints (seed data only — never hard-coded into app logic) ---
    for (const cp of CHECKPOINTS) {
      await client.query(
        `INSERT INTO checkpoints (event_id, name, display_order, is_required)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (event_id, name) DO NOTHING`,
        [eventId, cp.name, cp.displayOrder, cp.isRequired],
      );
    }

    // --- Dev users (CLEARLY FAKE — never real people) ----------------------
    await upsertUser(client, { email: 'superadmin@dev.local', roleName: 'SUPER_ADMIN' });
    await upsertUser(client, { email: 'admin@dev.local', roleName: 'ADMIN' });
    const volunteerUserId = await upsertUser(client, {
      email: 'volunteer@dev.local',
      roleName: 'VOLUNTEER',
    });
    await client.query(
      `INSERT INTO volunteers (user_id, name) VALUES ($1, $2)
       ON CONFLICT (user_id) DO NOTHING`,
      [volunteerUserId, 'Dev Volunteer'],
    );
    await upsertUser(client, {
      email: 'attendee1@dev.local',
      roleName: 'ATTENDEE',
      fullName: 'Dev Attendee One',
    });
    await upsertUser(client, {
      email: 'attendee2@dev.local',
      roleName: 'ATTENDEE',
      fullName: 'Dev Attendee Two',
    });

    // Assign the dev volunteer to the Registration checkpoint.
    const volunteerRow = await client.query('SELECT id FROM volunteers WHERE user_id = $1', [
      volunteerUserId,
    ]);
    const registrationCheckpoint = await client.query(
      `SELECT id FROM checkpoints WHERE event_id = $1 AND name = 'Registration'`,
      [eventId],
    );
    await client.query(
      `INSERT INTO volunteer_checkpoint_assignments (volunteer_id, checkpoint_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [volunteerRow.rows[0].id, registrationCheckpoint.rows[0].id],
    );

    await client.query('COMMIT');
    console.log('Seed complete.');
    console.log(`  Event: AWS Student Community Day 2026 (${eventId})`);
    console.log('  Dev accounts (password for all: DevPassw0rd!):');
    console.log('    superadmin@dev.local  (SUPER_ADMIN)');
    console.log('    admin@dev.local       (ADMIN)');
    console.log('    volunteer@dev.local   (VOLUNTEER, assigned to Registration checkpoint)');
    console.log('    attendee1@dev.local   (ATTENDEE)');
    console.log('    attendee2@dev.local   (ATTENDEE)');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
