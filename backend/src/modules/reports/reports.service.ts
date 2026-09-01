import { reportsRepository } from './reports.repository.js';
import type { AdminDashboardSummary } from './reports.types.js';

export const reportsService = {
  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    return reportsRepository.getDashboardSummary();
  },
};
