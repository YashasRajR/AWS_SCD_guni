import { reportsRepository } from './reports.repository.js';
import type { AdminDashboardSummary, AdminDashboardTrends } from './reports.types.js';

export const reportsService = {
  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    return reportsRepository.getDashboardSummary();
  },

  async getTrends(): Promise<AdminDashboardTrends> {
    return reportsRepository.getTrends();
  },
};
