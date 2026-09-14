export interface IntegrationStatus {
  name: string;
  configured: boolean;
  status: 'ok' | 'error';
  detail: string;
}

export interface SystemStatus {
  database: IntegrationStatus;
  email: IntegrationStatus & { queueDepth: number };
  storage: IntegrationStatus;
  sheetsSync: IntegrationStatus & { queueDepth: number };
}
