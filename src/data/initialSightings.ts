import { SightingLog } from '../types/raptor';

/**
 * Clean slate: No fake or pre-seeded sightings.
 * All sightings are logged live by real observers and persisted via Firestore / local storage.
 */
export const INITIAL_SIGHTINGS: SightingLog[] = [];
