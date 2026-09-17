export interface AdminDashboardSummary {
  totalRegistrations: number;
  confirmedRegistrations: number;
  registrationsToday: number;
  registrationsThisWeek: number;
  registrationsThisMonth: number;
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
  registrationsByStatus: StatusCount[];
}

export interface RecentRegistration {
  id: string;
  registrationNumber: string;
  fullName: string;
  status: string;
  createdAt: string;
}

export interface AdminDashboardRecentActivity {
  recentRegistrations: RecentRegistration[];
}
