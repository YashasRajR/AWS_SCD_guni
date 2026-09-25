#!/usr/bin/env node
// Development seed data. Creates the event, roles/permissions, the default
// a small set of CLEARLY FAKE dev accounts. Idempotent —
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
  'MANAGE_QR_TOKENS',
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
  ATTENDEE: [],
  // Narrower admin roles (spec #43) — keep in sync with
  // packages/constants/src/permissions.ts ROLE_PERMISSION_SEED.
  FINANCE_ADMIN: ['VIEW_ATTENDEE', 'MANAGE_PAYMENTS', 'VIEW_REPORTS'],
  CONTENT_ADMIN: [
    'MANAGE_SPEAKERS',
    'MANAGE_SESSIONS',
    'MANAGE_AGENDA',
    'MANAGE_TIMELINE',
    'MANAGE_VENUES',
    'MANAGE_FAQ',
    'MANAGE_ANNOUNCEMENTS',
    'MANAGE_SETTINGS',
  ],
};

const DEV_PASSWORD = 'DevPassw0rd!'; // clearly-fake dev-only password for every seeded account

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
    for (const name of [
      'SUPER_ADMIN',
      'ADMIN',
      'ATTENDEE',
      'FINANCE_ADMIN',
      'CONTENT_ADMIN',
    ]) {
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

    // --- Ticket plans (Student ₹200 / Professional ₹300) -------------
    const TICKET_PLANS = [
      {
        code: 'STUDENT',
        name: 'Student',
        description: 'For currently enrolled college/university students.',
        price: 200,
        displayOrder: 0,
      },
      {
        code: 'PROFESSIONAL',
        name: 'Professional / Adult',
        description: 'For working professionals and other adult attendees.',
        price: 300,
        displayOrder: 1,
      },
    ];
    for (const plan of TICKET_PLANS) {
      await client.query(
        `INSERT INTO ticket_plans (code, name, description, price, currency, is_active, display_order)
         VALUES ($1, $2, $3, $4, 'INR', TRUE, $5)
         ON CONFLICT (code) DO UPDATE SET price = EXCLUDED.price, name = EXCLUDED.name, description = EXCLUDED.description`,
        [plan.code, plan.name, plan.description, plan.price, plan.displayOrder],
      );
    }

    // --- Demo coupon (spec example: AWSGUNI25 -- 25% off, capped, no
    // per-plan restriction) -----------------------------------------------
    await client.query(
      `INSERT INTO coupons (code, name, discount_type, discount_value, currency, per_user_limit, is_active)
       VALUES ('AWSGUNI25', '25% off', 'PERCENT', 25, 'INR', 1, TRUE)
       ON CONFLICT (UPPER(code)) DO NOTHING`,
    );

    // --- Surprise Cloud Quest Game Boy coupon ---
    await client.query(
      `INSERT INTO coupons (code, name, discount_type, discount_value, currency, per_user_limit, is_active)
       VALUES ('AWS-SCD-P2026', 'Cloud Quest Surprise Pass Discount', 'PERCENT', 50, 'INR', 1, TRUE)
       ON CONFLICT (UPPER(code)) DO NOTHING`,
    );

    // --- Past events (from AWS SBG GUNI) --------------------------------
    const PAST_EVENTS = [
      {
        eventName: 'AWS Gujarat Students Builder Week 2026',
        year: 2026,
        sessionName: '10+ Industry Experts & Continuous Cloud Learning',
        sessionImage: '/gallery/gujarat_builder_week_poster.png',
        shortDescription:
          'A 7-day virtual learning experience organized by the AWS Student Builder Group Leaders – Gujarat. Featuring 10+ industry experts, live interactive Q&A, e-certificates, and hands-on cloud learning.',
        eventDate: '2026-07-05',
        location: 'Online Event (Meetup Live)',
        archiveUrl: 'https://www.meetup.com/aws-sbg-at-ganpat-university/events/315424216/',
        displayOrder: 1,
        status: 'PUBLISHED',
      },
      {
        eventName: 'GEN AI ON AWS',
        year: 2026,
        sessionName: 'Mr. Ashwin Raiyani (Expert AI Speaker)',
        sessionImage: '/gallery/Poster2.png',
        shortDescription:
          'An online technical session delivered by Mr. Ashwin Raiyani illustrating the future of Generative AI, featuring industry use cases, Amazon Bedrock, FMaaS, building agents, and real-world tools.',
        eventDate: '2026-05-25',
        location: 'Online Event (Meetup Live)',
        archiveUrl: 'https://www.meetup.com/aws-sbg-at-ganpat-university/',
        displayOrder: 2,
        status: 'PUBLISHED',
      },
      {
        eventName: 'AWS Cloud Ignite',
        year: 2026,
        sessionName: 'Nilesh Vaghela & Dimple Vaghela (AWS Community Heroes)',
        sessionImage: '/gallery/Poster1.png',
        shortDescription:
          'Flagship cloud computing awareness event organized by AWS Cloud Club Ganpat University with 600+ registrations, introducing students to cloud fundamentals and AWS ecosystem with hands-on EC2 & S3 console labs.',
        eventDate: '2026-03-25',
        location: 'Seminar Hall 209, New Building, Ganpat University, Mehsana',
        archiveUrl: 'https://www.meetup.com/aws-sbg-at-ganpat-university/',
        displayOrder: 3,
        status: 'PUBLISHED',
      },
    ];

    for (const ev of PAST_EVENTS) {
      await client.query(
        `INSERT INTO past_events (event_name, year, session_name, session_image, short_description, event_date, location, archive_url, display_order, status)
         SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
         WHERE NOT EXISTS (SELECT 1 FROM past_events WHERE event_name = $1)`,
        [
          ev.eventName,
          ev.year,
          ev.sessionName,
          ev.sessionImage,
          ev.shortDescription,
          ev.eventDate,
          ev.location,
          ev.archiveUrl,
          ev.displayOrder,
          ev.status,
        ],
      );
    }

    // --- Gallery items (Real Event & Workshop Photos) -------------------
    const GALLERY_ITEMS = [
      {
        imageUrl: '/gallery/workshop1.png',
        caption: 'Cloud Practitioner Essentials Workshop',
        altText: 'Students coding and working in the cloud laboratory',
        category: 'WORKSHOP',
        eventYear: 2026,
        displayOrder: 1,
        status: 'PUBLISHED',
      },
      {
        imageUrl: '/gallery/day2_nirmal_1.png',
        caption: 'Keynote Address by Nirmal Pathak Sir',
        altText: 'Nirmal Pathak Sir presenting on main stage',
        category: 'KEYNOTE',
        eventYear: 2026,
        displayOrder: 2,
        status: 'PUBLISHED',
      },
      {
        imageUrl: '/gallery/community1.jpeg',
        caption: 'AWS Cloud Ignite Community Gathering',
        altText: 'Full auditorium community group photo with AWS Family banner',
        category: 'COMMUNITY',
        eventYear: 2026,
        displayOrder: 3,
        status: 'PUBLISHED',
      },
      {
        imageUrl: '/gallery/speaker1.png',
        caption: 'Cloud Computing Insights by Nilesh Vaghela Sir',
        altText: 'Nilesh Vaghela Sir speaking about cloud architectures',
        category: 'SPEAKER',
        eventYear: 2026,
        displayOrder: 4,
        status: 'PUBLISHED',
      },
      {
        imageUrl: '/gallery/day2_manthan_1.png',
        caption: 'Mastering AWS Cloud Innovation with Manthan Sir',
        altText: 'Technical session with Manthan Sir on stage',
        category: 'SPEAKER',
        eventYear: 2026,
        displayOrder: 5,
        status: 'PUBLISHED',
      },
      {
        imageUrl: '/gallery/day2_group_1.png',
        caption: 'Student Community Circle - Concepts to Career',
        altText: 'Student leaders and attendees collaborating in interactive session',
        category: 'STUDENT_CIRCLE',
        eventYear: 2026,
        displayOrder: 6,
        status: 'PUBLISHED',
      },
      {
        imageUrl: '/gallery/workshop2.png',
        caption: 'Hands-on EC2 & S3 Sandbox Labs',
        altText: 'Deep dive live coding and architectural workshop',
        category: 'WORKSHOP',
        eventYear: 2026,
        displayOrder: 7,
        status: 'PUBLISHED',
      },
      {
        imageUrl: '/gallery/speaker2.png',
        caption: 'Keynote Session by Mr. Ashwin Raiyani',
        altText: 'Gen AI on AWS with Mr. Ashwin Raiyani',
        category: 'SPEAKER',
        eventYear: 2026,
        displayOrder: 8,
        status: 'PUBLISHED',
      },
      {
        imageUrl: '/gallery/community2.png',
        caption: 'AWS Student Builders Group Collaboration',
        altText: 'Students and mentors interacting and celebrating milestones',
        category: 'COMMUNITY',
        eventYear: 2026,
        displayOrder: 9,
        status: 'PUBLISHED',
      },
      {
        imageUrl: '/gallery/day2_nirmal_2.png',
        caption: 'Cloud Builder Q&A with Nirmal Pathak Sir',
        altText: 'Interactive Q&A panel with students asking cloud questions',
        category: 'PANEL',
        eventYear: 2026,
        displayOrder: 10,
        status: 'PUBLISHED',
      },
      {
        imageUrl: '/gallery/day2_group_2.png',
        caption: 'Campus Builder Network Meetup',
        altText: 'Group photo of AWS student builders community',
        category: 'COMMUNITY',
        eventYear: 2026,
        displayOrder: 11,
        status: 'PUBLISHED',
      },
    ];

    for (const item of GALLERY_ITEMS) {
      await client.query(
        `INSERT INTO gallery_items (image_url, caption, alt_text, category, event_year, display_order, status)
         SELECT $1, $2, $3, $4, $5, $6, $7
         WHERE NOT EXISTS (SELECT 1 FROM gallery_items WHERE image_url = $1)`,
        [item.imageUrl, item.caption, item.altText, item.category, item.eventYear, item.displayOrder, item.status],
      );
      await client.query(
        `UPDATE gallery_items
         SET caption = $2, alt_text = $3, category = $4, event_year = $5, display_order = $6, status = $7
         WHERE image_url = $1 AND (caption IS NULL OR caption = '' OR display_order = 0)`,
        [item.imageUrl, item.caption, item.altText, item.category, item.eventYear, item.displayOrder, item.status],
      );
    }

    // --- Dev users (CLEARLY FAKE — never real people) ----------------------
    await upsertUser(client, { email: 'superadmin@dev.local', roleName: 'SUPER_ADMIN' });
    await upsertUser(client, { email: 'admin@dev.local', roleName: 'ADMIN' });
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
    await upsertUser(client, { email: 'finance@dev.local', roleName: 'FINANCE_ADMIN' });
    await upsertUser(client, { email: 'content@dev.local', roleName: 'CONTENT_ADMIN' });

    await client.query('COMMIT');
    console.log('Seed complete.');
    console.log(`  Event: AWS Student Community Day 2026 (${eventId})`);
    console.log('  Dev accounts (password for all: DevPassw0rd!):');
    console.log('    superadmin@dev.local  (SUPER_ADMIN)');
    console.log('    admin@dev.local       (ADMIN)');
    console.log('    attendee1@dev.local   (ATTENDEE)');
    console.log('    attendee2@dev.local   (ATTENDEE)');
    console.log('    finance@dev.local     (FINANCE_ADMIN)');
    console.log('    content@dev.local     (CONTENT_ADMIN)');
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
