import type { PaginatedData } from '@scd/types';
import { sheetsSyncRepository } from './sheets-sync.repository.js';
import {
  toSheetsSyncQueueItem,
  type SheetsSyncEntityType,
  type SheetsSyncQueueItem,
} from './sheets-sync.types.js';
import { registrationsRepository } from '../registrations/registrations.repository.js';
import { toRegistration } from '../registrations/registrations.types.js';
import { attendeesRepository } from '../attendees/attendees.repository.js';
import { toAttendee } from '../attendees/attendees.types.js';
import { usersService } from '../users/users.service.js';
import { logger } from '../../utils/logger.js';

export const sheetsSyncService = {
  /** Records the intent to sync — mirrors emailsService.enqueue(): never
   * throws, so a queueing failure can't fail the caller's real work
   * (confirming a registration). */
  async enqueue(entityType: SheetsSyncEntityType, entityId: string): Promise<void> {
    try {
      await sheetsSyncRepository.enqueue(entityType, entityId);
    } catch (err) {
      logger.warn({ err, entityType, entityId }, 'Failed to record outgoing Sheets-sync intent');
    }
  },

  /** Builds the spreadsheet row for one queued entity at sync time (not
   * enqueue time), same reasoning as the PDF email attachments in
   * email-worker.ts — the row reflects whatever's true right now, not a
   * stale snapshot from whenever it was queued. Returns null if the
   * underlying record is gone (nothing left worth syncing). */
  async buildRow(entityType: SheetsSyncEntityType, entityId: string): Promise<Record<string, string> | null> {
    if (entityType !== 'REGISTRATION') return null;
    const registrationRow = await registrationsRepository.findById(entityId);
    if (!registrationRow) return null;
    const registration = toRegistration(registrationRow);

    const attendeeRow = await attendeesRepository.findById(registration.attendeeId);
    const attendee = attendeeRow ? toAttendee(attendeeRow) : null;
    const user = attendee ? await usersService.getPublicUserById(attendee.userId) : null;

    return {
      'Registration #': registration.registrationNumber,
      Status: registration.status,
      'Full name': attendee?.fullName ?? '',
      Email: user?.email ?? '',
      'Ticket plan': registration.ticketPlan?.name ?? '',
      'Registered at': registration.registeredAt,
      'Confirmed at': registration.confirmedAt ?? '',
    };
  },

  async list(page: number, pageSize: number): Promise<PaginatedData<SheetsSyncQueueItem>> {
    const { rows, total } = await sheetsSyncRepository.listAll(page, pageSize);
    return {
      items: rows.map(toSheetsSyncQueueItem),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
    };
  },
};
