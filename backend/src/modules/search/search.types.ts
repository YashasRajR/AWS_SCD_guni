export interface SearchResult {
  type: 'ATTENDEE' | 'REGISTRATION';
  id: string;
  title: string;
  subtitle: string;
  adminPath: string;
}
