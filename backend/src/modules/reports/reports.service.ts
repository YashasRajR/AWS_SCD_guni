import { reportsRepository } from './reports.repository.js';
import type { AdminDashboardRecentActivity, AdminDashboardSummary, AdminDashboardTrends } from './reports.types.js';

export const reportsService = {
  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    return reportsRepository.getDashboardSummary();
  },

  async getTrends(): Promise<AdminDashboardTrends> {
    return reportsRepository.getTrends();
  },

  async getRecentActivity(): Promise<AdminDashboardRecentActivity> {
    return reportsRepository.getRecentActivity();
  },
};
