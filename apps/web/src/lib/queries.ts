import type {
  AgendaItem,
  Announcement,
  EventConfig,
  Faq,
  Session,
  SiteLink,
  Speaker,
  TimelineItem,
  Venue,
} from '@scd/types';
import { useResource } from './hooks.js';

/**
 * One named hook per public content resource, each a thin wrapper over
 * useResource<T>(path) — components depend on these, never on a raw path
 * string, so the API surface for the public site lives in exactly one
 * place. All of it goes through the shared apiClient (packages/api-client).
 */

export function useEvent() {
  return useResource<EventConfig>('/event');
}

export function useSpeakers() {
  return useResource<Speaker>('/speakers');
}

export function useSessions() {
  return useResource<Session>('/sessions');
}

export function useAgenda() {
  return useResource<AgendaItem>('/agenda');
}

export function useTimeline() {
  return useResource<TimelineItem>('/timeline');
}

export function useVenues() {
  return useResource<Venue>('/venues');
}

export function useFAQs() {
  return useResource<Faq>('/faqs');
}

export function useAnnouncements() {
  return useResource<Announcement>('/announcements');
}

export function useNavLinks() {
  return useResource<SiteLink>('/nav-links');
}

export function useSocialLinks() {
  return useResource<SiteLink>('/social-links');
}
