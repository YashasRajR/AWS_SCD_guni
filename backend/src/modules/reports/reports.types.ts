export interface AdminDashboardSummary {
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingPayments: number;
  paidPayments: number;
  checkpointCompletions: number;
  certificatesIssued: number;
  achievementsUnlocked: number;
  emailsSent: number;
  emailsFailed: number;
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
