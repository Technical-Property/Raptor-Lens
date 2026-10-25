export type AnalyticsEventType =
  | 'observer_registered'
  | 'observer_login'
  | 'sighting_logged'
  | 'map_view_mode_toggled'
  | 'sector_switched'
  | 'beta_feedback_submitted'
  | 'confusion_solver_opened'
  | 'life_list_viewed'
  | 'field_lite_mode_toggled'
  | 'page_view';

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: string; // ISO string
  date: string;      // YYYY-MM-DD
  label: string;
  metadata?: Record<string, any>;
}

const STORAGE_KEY = 'raptorlens_analytics_events';
const MAX_EVENTS = 500;

// Helper to get stored events (automatically strips any legacy seeded or simulated events)
export function getStoredAnalyticsEvents(): AnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: AnalyticsEvent[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cleaned = parsed.filter(
      (evt) => evt && typeof evt.id === 'string' && !evt.id.startsWith('seed-') && !evt.metadata?.simulated
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (err) {
    console.error('Failed to read analytics events', err);
    return [];
  }
}

// Track an event
export function trackEvent(
  type: AnalyticsEventType,
  label: string,
  metadata?: Record<string, any>
): AnalyticsEvent {
  const now = new Date();
  const newEvent: AnalyticsEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    timestamp: now.toISOString(),
    date: now.toISOString().split('T')[0],
    label,
    metadata,
  };

  try {
    const events = getStoredAnalyticsEvents();
    const updated = [newEvent, ...events].slice(0, MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save analytics event', err);
  }

  return newEvent;
}

// Download helpers
export function downloadCsvFile(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadJsonFile(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
