export interface SearchResult {
  type: 'ATTENDEE' | 'REGISTRATION' | 'PAYMENT' | 'INVOICE';
  id: string;
  title: string;
  subtitle: string;
  adminPath: string;
}
