import { SectorId } from './sector';

export type WingShape = 'broad-fingered' | 'pointed-sickle' | 'rounded' | 'long-narrow';
export type TailShape = 'forked' | 'fan-wedge' | 'square-long' | 'short-square';
export type FlightProfile = 'flat-soar' | 'shallow-v' | 'high-v' | 'hovering' | 'rapid-stoop' | 'flap-glide';
export type UkStatus = 'Green' | 'Amber' | 'Red';
export type RaptorCategory = 'Kite' | 'Buzzard' | 'Falcon' | 'Harrier' | 'Hawk' | 'Owl' | 'Osprey';

export interface RaptorSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  category: RaptorCategory;
  wingspanCm: string;
  lengthCm: string;
  weightG: string;
  ukStatus: UkStatus;
  silhouetteSvg: string; // Key SVG path or full SVG graphic
  aspectRatio: string;
  wingShape: WingShape;
  tailShape: TailShape;
  flightProfile: FlightProfile;
  wingShapeLabel: string;
  tailShapeLabel: string;
  flightProfileLabel: string;
  keyMarks: string[];
  flightDescription: string;
  callDescription: string;
  habitat: string;
  wessexFrequency: 'Abundant' | 'Common' | 'Regular' | 'Scarce/Seasonal' | 'Rare Passage';
  bestHotspots: string[];
  confusionSpecies: string[];
  dangerNotes?: string;
}

export interface Hotspot {
  id: string;
  name: string;
  sectorId?: SectorId;
  coordinates: [number, number]; // [lat, lng]
  elevationM: number;
  gridRef: string;
  primaryHabitat: string;
  keyRaptors: string[];
  bestWindDirections: string[];
  thermalRating: 'High' | 'Very High' | 'Moderate';
  activeObservers: number;
  recentSightingsCount: number;
  description: string;
  vantagePointTips: string;
  parkingInfo: string;
  accessInfo: string;
}

export type SightingBehavior = 
  | 'Thermal Soaring' 
  | 'Escarpment Lift' 
  | 'Hover Hunting' 
  | 'Low Quartering' 
  | 'High-Speed Stoop' 
  | 'Perched on Post/Sarsen' 
  | 'Territorial Mobbing' 
  | 'Passage Migration';

export type VerificationStatus = 
  | 'Specialist Confirmed' 
  | 'Corroborated by Peers' 
  | 'Pending Review' 
  | 'Flagged for Review';

export interface CorroborationRecord {
  observerCallsign: string;
  observerRank?: string;
  timestamp: string;
  notes?: string;
}

export interface AuditEntry {
  timestamp: string;
  action: 'INITIAL_LOG' | 'PEER_CORROBORATION' | 'SPECIALIST_VERIFIED' | 'FLAGGED' | 'RESOLVED';
  actorCallsign: string;
  actorRank?: string;
  details: string;
}

export interface SightingLog {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  speciesId: string;
  speciesName: string;
  locationName: string;
  sectorId?: SectorId;
  coordinates: [number, number];
  count: number;
  behavior: SightingBehavior;
  altitudeM?: number;
  opticalGear: string;
  observerCallsign: string;
  observerRank?: string;
  observerAffiliation?: string;
  notes: string;
  confidence: 'Confirmed (100%)' | 'High (80%)' | 'Probable (60%)';
  windDirection: string;
  windSpeedMph: number;
  thermalStrength: 'Weak' | 'Moderate' | 'Strong';
  verificationStatus: VerificationStatus;
  corroborations: CorroborationRecord[];
  rarityAlert?: boolean;
  rarityReason?: string;
  isSchedule1?: boolean;
  isFuzzed?: boolean;
  privacyRadiusKm?: number;
  markerCategory?: 'raptor' | 'sky' | 'walkers';
  auditTrail: AuditEntry[];
}

export type DispatchCategory = 
  | 'SIGHTING ALERT' 
  | 'MIGRATION SURGE' 
  | 'THERMAL WATCH' 
  | 'NESTING STATUS' 
  | 'FIELD BULLETIN';

export interface RssDispatch {
  id: string;
  title: string;
  timestamp: string;
  timeAgo: string;
  source: string;
  category: DispatchCategory;
  summary: string;
  hotspotRef?: string;
  coordinates?: [number, number];
  gridRef?: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
  author: string;
  verified: boolean;
  speciesMentioned?: string[];
}

export interface LiveCamSpotterReport {
  id: string;
  timestamp: string;
  timeAgo: string;
  callsign: string;
  speciesName: string;
  count: number;
  sectorQuadrant: string;
  description: string;
  verified: boolean;
}

export interface LivestreamCam {
  id: string;
  title: string;
  location: string;
  channelName: string;
  youtubeId: string;
  channelUrl?: string; // Direct YouTube channel URL (e.g. https://www.youtube.com/@... or channel/UC...)
  channelId?: string;  // YouTube channel ID (e.g. UC...) for direct channel live stream embed
  status: 'LIVE' | 'STANDBY';
  description: string;
  elevation: string;
  gridRef: string;
  viewers: number;
  isCommunityFieldCam?: boolean;
  distanceToSubjectKm?: number; // e.g. 3.0 km
  opticalZoom?: string;         // e.g. "30x Optical Zoom"
  panBearing?: string;          // e.g. "195° SSW towards Hillfort"
  sensorSpecs?: string;         // e.g. "4K Ultra-telephoto Optical Sensor"
  spotterReports?: LiveCamSpotterReport[];
}

