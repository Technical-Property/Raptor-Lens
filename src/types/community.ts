export type ObserverBadge = 
  | 'Ridgeway Warden' 
  | 'Chalkland Thermal Scout' 
  | 'BTO Ringing Team' 
  | 'Barbury Regular' 
  | 'Raptor Specialist'
  | 'Novice Skywatcher'
  | 'Armchair Observer'
  | 'Downland Walker & Photographer'
  | 'Community Supporter';

export type ExperienceLevel = 
  | 'Armchair Watcher & Webcam Supporter'
  | 'Downland Walker & Nature Photographer'
  | 'Novice Skywatcher / Nature Learner'
  | 'Intermediate Field Spotter'
  | 'Seasoned Chalkland Scout'
  | 'Raptor Specialist / BTO Ringer';

export interface ObserverProfile {
  id: string;
  callsign: string;
  fullName: string;
  badge: ObserverBadge;
  rank?: string;
  isSpecialist?: boolean;
  experienceLevel?: ExperienceLevel;
  yearsExperience?: number;
  affiliation?: string;
  specialties?: string[];
  contactEmail?: string;
  passcode?: string;
  isHumanVerified?: boolean;
  homeHotspot: string;
  hotspotId: string;
  sightingsCount: number;
  verified: boolean;
  opticsGear: string;
  bio: string;
  joinedDate: string;
  avatarColor: string;
}

export type SkywatchDifficulty = 'Easy Trail' | 'Moderate Scarp Walk' | 'Steep Rampart Hike' | 'Stationary Vantage';

export interface GroupSkywatch {
  id: string;
  title: string;
  date: string;
  time: string;
  hotspotId: string;
  locationName: string;
  gridRef: string;
  leaderCallsign: string;
  targetSpecies: string[];
  description: string;
  difficulty: SkywatchDifficulty;
  opticsRecommended: string;
  attendees: string[]; // Callsigns of attendees
  isJoined?: boolean;
}

export interface DiscussionReply {
  id: string;
  authorCallsign: string;
  authorBadge: ObserverBadge;
  text: string;
  timestamp: string;
  upvotes: number;
}

export interface CommunityDiscussion {
  id: string;
  title: string;
  authorCallsign: string;
  authorBadge: ObserverBadge;
  category: 'ID Help' | 'Field Conditions' | 'Optics & Gear' | 'Conservation & Roosts';
  content: string;
  timestamp: string;
  timeAgo: string;
  upvotes: number;
  tags: string[];
  replies: DiscussionReply[];
  hasUpvoted?: boolean;
}
