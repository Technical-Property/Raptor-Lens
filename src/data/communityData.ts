import { ObserverProfile, GroupSkywatch, CommunityDiscussion } from '../types/community';

/**
 * Clean slate: All fake observer sign-ups, skywatches, and forum threads removed.
 * Only real community registrations and posts are stored and displayed.
 */
export const INITIAL_OBSERVERS: ObserverProfile[] = [];

export const INITIAL_SKYWATCHES: GroupSkywatch[] = [];

export const INITIAL_DISCUSSIONS: CommunityDiscussion[] = [];
