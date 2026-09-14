export interface AdminDashboardSummary {
  totalRegistrations: number;
  confirmedRegistrations: number;
  registrationsToday: number;
  registrationsThisWeek: number;
  registrationsThisMonth: number;
  checkpointCompletions: number;
  /** Distinct attendees who've completed at least one required checkpoint (i.e. actually checked in). */
  checkInCount: number;
  /** checkInCount / confirmedRegistrations * 100, rounded to 1 decimal; 0 when there are no confirmed registrations. */
  checkInPercentage: number;
  activeVolunteers: number;
  certificatesIssued: number;
  achievementsUnlocked: number;
  emailsSent: number;
  emailsFailed: number;
  eventName: string | null;
  eventStatus: string | null;
  eventDate: string | null;
}

export interface DailyCount {
  day: string;
  count: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface AdminDashboardTrends {
  registrationsByDay: DailyCount[];
  checkpointCompletionsByDay: DailyCount[];
  registrationsByStatus: StatusCount[];
}

export interface RecentRegistration {
  id: string;
  registrationNumber: string;
  fullName: string;
  status: string;
  createdAt: string;
}

export interface RecentCheckIn {
  id: string;
  attendeeName: string;
  checkpointName: string;
  volunteerName: string | null;
  completedAt: string;
}

export interface AdminDashboardRecentActivity {
  recentRegistrations: RecentRegistration[];
  recentCheckIns: RecentCheckIn[];
}
