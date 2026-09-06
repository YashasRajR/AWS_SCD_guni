import type {
  AssignmentStatus,
  CheckpointAttendanceStatus,
  ContentStatus,
  VolunteerStatus,
} from './enums.js';

export interface Checkpoint {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  location: string | null;
  startTime: string | null;
  endTime: string | null;
  displayOrder: number;
  isRequired: boolean;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CheckpointAttendance {
  id: string;
  attendeeId: string;
  checkpointId: string;
  volunteerId: string | null;
  status: CheckpointAttendanceStatus;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
  /** Joined display fields — populated only by the volunteer history endpoint. */
  attendeeName?: string;
  checkpointName?: string;
}

/** One checkpoint's completion status for a single attendee -- shape
 * returned by checkpointsService.getProgressForAttendee(), reused as-is
 * by the admin attendee-detail aggregate (spec #34). attendanceId is
 * null when not yet completed; set it lets the detail page link
 * straight to the existing correction endpoint
 * (POST /admin/checkpoints/attendance/:attendanceId/reverse) without a
 * second lookup. */
export interface AttendeeCheckpointProgress {
  checkpoint: Checkpoint;
  completed: boolean;
  completedAt: string | null;
  attendanceId: string | null;
}

export interface Volunteer {
  id: string;
  userId: string;
  name: string;
  phone: string | null;
  status: VolunteerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerCheckpointAssignment {
  id: string;
  volunteerId: string;
  checkpointId: string;
  assignedAt: string;
  status: AssignmentStatus;
}
