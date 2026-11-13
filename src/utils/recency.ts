import { SightingLog } from '../types/raptor';

export type RecencyWindow = 'all' | 'live' | 'today' | 'recent' | 'archived';
export type TrafficSignalLevel = 'green' | 'amber' | 'orange' | 'slate';

export interface RecencyData {
  status: 'live' | 'today' | 'recent' | 'archived';
  level: TrafficSignalLevel;
  label: string;
  shortBadge: string;
  hoursAgo: number;
  minutesAgo: number;
  relativeTime: string;
  colorHex: string;
  bgRgba: string;
  pulseClass: string;
  badgeClass: string;
  textClass: string;
  borderClass: string;
  trafficEmoji: string;
  recommendation: string;
}

/**
 * Returns the active UK time zone abbreviation ('GMT' or 'BST') for a given date/timestamp.
 */
export function getUkTimeZoneLabel(dateInput?: string | Date): string {
  try {
    const date = dateInput ? (typeof dateInput === 'string' ? new Date(dateInput) : dateInput) : new Date();
    if (Number.isNaN(date.getTime())) return 'GMT/BST';
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      timeZoneName: 'short',
    }).formatToParts(date);
    const tzName = parts.find((p) => p.type === 'timeZoneName')?.value;
    return tzName || 'GMT';
  } catch {
    return 'GMT';
  }
}

/**
 * Calculates freshness / recency metrics and traffic-light signal for any sighting.
 * Thresholds aligned with wildlife alert networks (BirdGuides, Rare Bird Alert, BTO):
 * - GREEN (Live / Breaking): < 3 hours ago (active aloft or in thermal)
 * - AMBER (Today / Same Day): 3 to 24 hours ago (likely roosting or cruising in local sector)
 * - ORANGE (Recent / 48h): 24 to 48 hours ago (recent territory movement)
 * - SLATE (Archived / Historical): > 48 hours ago (permanent biological & territorial ledger)
 */
export function getSightingRecency(timestamp: string | Date): RecencyData {
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp.getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - time);
  const minutesAgo = Math.round(diffMs / (1000 * 60));
  const hoursAgo = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(1));

  // Format humanized relative time
  let relativeTime = 'Just now';
  if (minutesAgo < 1) {
    relativeTime = 'Just now';
  } else if (minutesAgo < 60) {
    relativeTime = `${minutesAgo}m ago`;
  } else if (hoursAgo < 24) {
    const wholeHours = Math.floor(hoursAgo);
    const remMins = minutesAgo % 60;
    relativeTime = remMins > 0 && wholeHours < 4 ? `${wholeHours}h ${remMins}m ago` : `${wholeHours}h ago`;
  } else {
    const daysAgo = Math.floor(hoursAgo / 24);
    relativeTime = daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;
  }

  // GREEN: < 3 hours (180 mins)
  if (hoursAgo < 3) {
    return {
      status: 'live',
      level: 'green',
      label: 'ACTIVE / BREAKING',
      shortBadge: 'LIVE',
      hoursAgo,
      minutesAgo,
      relativeTime,
      colorHex: '#10b981', // emerald-500
      bgRgba: 'rgba(16, 185, 129, 0.2)',
      pulseClass: 'animate-ping',
      badgeClass: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300',
      textClass: 'text-emerald-400',
      borderClass: 'border-emerald-500',
      trafficEmoji: '🟢',
      recommendation: 'High probability of active interception in corridor thermals right now.',
    };
  }

  // AMBER: 3 to 24 hours
  if (hoursAgo < 24) {
    return {
      status: 'today',
      level: 'amber',
      label: 'TODAY / SAME DAY',
      shortBadge: 'TODAY',
      hoursAgo,
      minutesAgo,
      relativeTime,
      colorHex: '#f59e0b', // amber-500
      bgRgba: 'rgba(245, 158, 11, 0.15)',
      pulseClass: '',
      badgeClass: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
      textClass: 'text-amber-400',
      borderClass: 'border-amber-500',
      trafficEmoji: '🟡',
      recommendation: 'Active in sector earlier today; likely roosting or cruising nearby.',
    };
  }

  // ORANGE: 24 to 48 hours
  if (hoursAgo < 48) {
    return {
      status: 'recent',
      level: 'orange',
      label: 'PAST 48 HOURS',
      shortBadge: '48H',
      hoursAgo,
      minutesAgo,
      relativeTime,
      colorHex: '#f97316', // orange-500
      bgRgba: 'rgba(249, 115, 22, 0.12)',
      pulseClass: '',
      badgeClass: 'bg-orange-950/70 border-orange-500/40 text-orange-300',
      textClass: 'text-orange-400',
      borderClass: 'border-orange-500',
      trafficEmoji: '🟠',
      recommendation: 'Confirmed in corridor in past 2 days. Established hunting ground.',
    };
  }

  // SLATE: > 48 hours (Historical Archive)
  return {
    status: 'archived',
    level: 'slate',
    label: 'HISTORICAL ARCHIVE',
    shortBadge: 'ARCHIVE',
    hoursAgo,
    minutesAgo,
    relativeTime,
    colorHex: '#94a3b8', // slate-400
    bgRgba: 'rgba(148, 163, 184, 0.1)',
    pulseClass: '',
    badgeClass: 'bg-neutral-900/90 border-neutral-700 text-neutral-400',
    textClass: 'text-neutral-400',
    borderClass: 'border-neutral-700',
    trafficEmoji: '⚪',
    recommendation: 'Archival territory data; retained for scientific phenology & migration audits.',
  };
}

/**
 * Filter sightings by time-horizon window.
 */
export function filterSightingsByRecency(
  sightings: SightingLog[],
  window: RecencyWindow
): SightingLog[] {
  if (window === 'all') return sightings;

  const now = Date.now();

  return sightings.filter((s) => {
    const time = new Date(s.timestamp).getTime();
    const hoursAgo = (now - time) / (1000 * 60 * 60);

    switch (window) {
      case 'live':
        return hoursAgo < 3;
      case 'today':
        return hoursAgo < 24;
      case 'recent':
        return hoursAgo < 48;
      case 'archived':
        return hoursAgo >= 48;
      default:
        return true;
    }
  });
}

/**
 * Summarizes the count of sightings in each recency band.
 */
export function getRecencyCounts(sightings: SightingLog[]): Record<RecencyWindow, number> {
  const counts: Record<RecencyWindow, number> = {
    all: sightings.length,
    live: 0,
    today: 0,
    recent: 0,
    archived: 0,
  };

  const now = Date.now();

  sightings.forEach((s) => {
    const time = new Date(s.timestamp).getTime();
    const hoursAgo = (now - time) / (1000 * 60 * 60);

    if (hoursAgo < 3) counts.live++;
    if (hoursAgo < 24) counts.today++;
    if (hoursAgo < 48) counts.recent++;
    if (hoursAgo >= 48) counts.archived++;
  });

  return counts;
}

/**
 * Metadata definitions for user guides, UI tooltips, and map legends.
 */
export const TRAFFIC_LIGHT_TIERS = [
  {
    level: 'green' as TrafficSignalLevel,
    emoji: '🟢',
    trafficEmoji: '🟢',
    title: 'Live Airspace',
    label: 'Live Airspace (<3h)',
    timeWindow: '< 3 hours',
    radarStyle: 'Vibrant glowing core + continuous radar ping ring',
    significance: 'Active in corridor right now. Highest chance of immediate visual contact.',
    description: 'Active in corridor right now. Immediate tactical visual interception likely.',
    recommendation: 'Priority watch. Scan ridge crest and thermal updrafts immediately.',
    colorHex: '#10b981',
  },
  {
    level: 'amber' as TrafficSignalLevel,
    emoji: '🟡',
    trafficEmoji: '🟡',
    title: 'Today / Same-Day',
    label: 'Today / Same-Day (3-24h)',
    timeWindow: '3 – 24 hours',
    radarStyle: 'Steady amber beacon glow (no ping)',
    significance: 'Reported earlier today. High likelihood of evening roost or local territory patrol.',
    description: 'Logged today. Raptor likely perched in woods or patrolling nearby fields.',
    recommendation: 'Check traditional late-afternoon roost stands and hedgerow perches.',
    colorHex: '#f59e0b',
  },
  {
    level: 'orange' as TrafficSignalLevel,
    emoji: '🟠',
    trafficEmoji: '🟠',
    title: 'Past 48 Hours',
    label: 'Past 48 Hours',
    timeWindow: '24 – 48 hours',
    radarStyle: 'Warm orange beacon with slight transparency',
    significance: 'Weekend or 2-day scouting window. Confirms active corridor occupancy.',
    description: 'Confirmed in corridor in past 2 days. Validates active hunting territory.',
    recommendation: 'Useful for multi-day sweep planning and weather correlation.',
    colorHex: '#f97316',
  },
  {
    level: 'slate' as TrafficSignalLevel,
    emoji: '⚪',
    trafficEmoji: '⚪',
    title: 'Historical Archive',
    label: 'Historical Archive (>48h)',
    timeWindow: '> 48 hours',
    radarStyle: 'Muted slate translucent blip (60% opacity)',
    significance: 'Permanent scientific record. Never purged—used for territory and migration analysis.',
    description: 'Permanent biological ledger record. Retained indefinitely for territory history.',
    recommendation: 'Permanent baseline for raptor study group audits and seasonal density analysis.',
    colorHex: '#94a3b8',
  },
];
