import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';
import { SightingLog, CorroborationRecord } from '../types/raptor';
import { ObserverProfile, GroupSkywatch, CommunityDiscussion } from '../types/community';
import { DEFAULT_CAMERA_VIDEO_ID, isStaleOrLegacyVideoId } from '../utils/youtube';

const SIGHTINGS_COLLECTION = 'sightings';
const OBSERVERS_COLLECTION = 'observers';
const SKYWATCHES_COLLECTION = 'groupSkywatches';
const DISCUSSIONS_COLLECTION = 'discussions';

/**
 * Legacy seeded / fake IDs and callsigns to filter out so the app starts 100% fresh
 */
const FAKE_SIGHTING_IDS = new Set([
  'sgt-101', 'sgt-102', 'sgt-103', 'sgt-104', 'sgt-105', 'sgt-106',
  'sgt-107', 'sgt-108', 'sgt-109', 'sgt-110', 'sgt-111', 'sgt-112',
  'fallback-1', 'fallback-2', 'fallback-3'
]);

const FAKE_OBSERVER_IDS = new Set([
  'obs-wessex-01', 'obs-wessex-02', 'obs-wessex-03', 'obs-wessex-04', 'obs-fowlmere-01'
]);

const FAKE_CALLSIGNS = new Set([
  'DOWNS-ALPHA',
  'RIDGEWAY-EAGLE',
  'BARBURY-WATCH',
  'WESSEX-SCOUT-07',
  'CHALK-THERMAL-99',
  'CHILTERN-KESTREL',
  'PLAIN-WATCHER',
  'AVEBURY-KESTREL',
  'FYFIELD-HARRIER',
  'FOWLMERE-SCOUT',
  'OGBOURNE-BUZZARD',
  'CHILTERN-KITE-01',
  'KITE-WATCHER-07',
  'RIDGEWAY-VANGUARD'
]);

const FAKE_SKYWATCH_IDS = new Set([
  'skywatch-01', 'skywatch-02', 'skywatch-03',
  'skywatch-2026-11', 'skywatch-2026-12',
  'skywatch-2027-01', 'skywatch-2027-02', 'skywatch-2027-03', 'skywatch-2027-04', 'skywatch-2027-05'
]);

const FAKE_DISCUSSION_IDS = new Set([
  'disc-01', 'disc-02', 'disc-03'
]);

export function isFakeSighting(s: SightingLog): boolean {
  if (!s || !s.id) return true;
  if (FAKE_SIGHTING_IDS.has(s.id) || /^sgt-1\d\d$/.test(s.id)) return true;
  if (s.observerCallsign && FAKE_CALLSIGNS.has(s.observerCallsign.toUpperCase())) return true;
  return false;
}

export function isFakeObserver(o: ObserverProfile): boolean {
  if (!o || !o.id) return true;
  if (FAKE_OBSERVER_IDS.has(o.id) || o.id.startsWith('sim-obs-')) return true;
  if (o.callsign && FAKE_CALLSIGNS.has(o.callsign.toUpperCase())) return true;
  if (o.joinedDate && o.joinedDate.includes('Simulated')) return true;
  return false;
}

export function isFakeSkywatch(w: GroupSkywatch): boolean {
  if (!w || !w.id) return true;
  return FAKE_SKYWATCH_IDS.has(w.id);
}

export function isFakeDiscussion(d: CommunityDiscussion): boolean {
  if (!d || !d.id) return true;
  return FAKE_DISCUSSION_IDS.has(d.id);
}

/**
 * Disabled automatic fake seeding so the app starts completely fresh
 */
export async function seedSightingsIfEmpty(): Promise<void> {
  // No-op: fake sightings seeding disabled
}

/**
 * Disabled automatic fake community seeding so the app starts completely fresh
 */
export async function seedCommunityIfEmpty(): Promise<void> {
  // No-op: fake community seeding disabled
}

/**
 * Subscribe to real-time sighting updates from Firestore (excluding legacy seeded records)
 */
export function subscribeToSightings(
  callback: (sightings: SightingLog[]) => void,
  fallbackData: SightingLog[]
): () => void {
  try {
    const q = query(
      collection(db, SIGHTINGS_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: SightingLog[] = snapshot.docs
            .map((docSnap) => docSnap.data() as SightingLog)
            .filter((s) => !isFakeSighting(s));
          callback(list);
        } else {
          callback(fallbackData.filter((s) => !isFakeSighting(s)));
        }
      },
      (error) => {
        console.warn('Firestore subscription warning, falling back to local memory:', error);
        callback(fallbackData.filter((s) => !isFakeSighting(s)));
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to create Firestore subscription:', err);
    callback(fallbackData.filter((s) => !isFakeSighting(s)));
    return () => {};
  }
}

/**
 * Save a new sighting log directly to Firestore
 */
export async function saveSightingToFirestore(sighting: SightingLog): Promise<void> {
  try {
    const clean = JSON.parse(JSON.stringify(sighting));
    const docRef = doc(db, SIGHTINGS_COLLECTION, sighting.id);
    await setDoc(docRef, clean, { merge: true });
  } catch (err) {
    console.error('Error saving sighting to Firestore:', err);
    throw err;
  }
}

/**
 * Add peer corroboration to an existing sighting in Firestore
 */
export async function addCorroborationToFirestore(
  sightingId: string, 
  corroboration: CorroborationRecord
): Promise<void> {
  try {
    const docRef = doc(db, SIGHTINGS_COLLECTION, sightingId);
    await updateDoc(docRef, {
      corroborations: arrayUnion(corroboration),
      verificationStatus: 'Corroborated by Peers'
    });
  } catch (err) {
    console.error('Error adding corroboration in Firestore:', err);
    throw err;
  }
}

/**
 * Subscribe to real-time community observers from Firestore (excluding legacy seeded/simulated sign-ups)
 */
export function subscribeToObservers(
  callback: (observers: ObserverProfile[]) => void,
  fallbackData: ObserverProfile[]
): () => void {
  try {
    const q = query(collection(db, OBSERVERS_COLLECTION), limit(100));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: ObserverProfile[] = snapshot.docs
            .map((d) => d.data() as ObserverProfile)
            .filter((o) => !isFakeObserver(o));
          callback(list);
        } else {
          callback(fallbackData.filter((o) => !isFakeObserver(o)));
        }
      },
      () => callback(fallbackData.filter((o) => !isFakeObserver(o)))
    );
  } catch {
    callback(fallbackData.filter((o) => !isFakeObserver(o)));
    return () => {};
  }
}

export async function saveObserverToFirestore(observer: ObserverProfile): Promise<void> {
  try {
    // Strip undefined fields and private credentials (passcode, contactEmail) before writing to public Firestore
    const clean = JSON.parse(JSON.stringify(observer));
    delete clean.passcode;
    delete clean.contactEmail;
    await setDoc(doc(db, OBSERVERS_COLLECTION, observer.id), clean, { merge: true });
  } catch (err) {
    console.warn('Error saving observer to Firestore:', err);
  }
}

/**
 * Subscribe to real-time group skywatches from Firestore (excluding legacy seeded records)
 */
export function subscribeToSkywatches(
  callback: (skywatches: GroupSkywatch[]) => void,
  fallbackData: GroupSkywatch[]
): () => void {
  try {
    const q = query(collection(db, SKYWATCHES_COLLECTION), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: GroupSkywatch[] = snapshot.docs
            .map((d) => d.data() as GroupSkywatch)
            .filter((w) => !isFakeSkywatch(w));
          callback(list);
        } else {
          callback(fallbackData.filter((w) => !isFakeSkywatch(w)));
        }
      },
      () => callback(fallbackData.filter((w) => !isFakeSkywatch(w)))
    );
  } catch {
    callback(fallbackData.filter((w) => !isFakeSkywatch(w)));
    return () => {};
  }
}

export async function saveSkywatchToFirestore(skywatch: GroupSkywatch): Promise<void> {
  try {
    const clean = JSON.parse(JSON.stringify(skywatch));
    await setDoc(doc(db, SKYWATCHES_COLLECTION, skywatch.id), clean, { merge: true });
  } catch (err) {
    console.warn('Error saving skywatch to Firestore:', err);
  }
}

/**
 * Subscribe to real-time community forum discussions from Firestore (excluding legacy seeded threads)
 */
export function subscribeToDiscussions(
  callback: (discussions: CommunityDiscussion[]) => void,
  fallbackData: CommunityDiscussion[]
): () => void {
  try {
    const q = query(collection(db, DISCUSSIONS_COLLECTION), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: CommunityDiscussion[] = snapshot.docs
            .map((d) => d.data() as CommunityDiscussion)
            .filter((disc) => !isFakeDiscussion(disc));
          callback(list);
        } else {
          callback(fallbackData.filter((disc) => !isFakeDiscussion(disc)));
        }
      },
      () => callback(fallbackData.filter((disc) => !isFakeDiscussion(disc)))
    );
  } catch {
    callback(fallbackData.filter((disc) => !isFakeDiscussion(disc)));
    return () => {};
  }
}

export async function saveDiscussionToFirestore(discussion: CommunityDiscussion): Promise<void> {
  try {
    const clean = JSON.parse(JSON.stringify(discussion));
    await setDoc(doc(db, DISCUSSIONS_COLLECTION, discussion.id), clean, { merge: true });
  } catch (err) {
    console.warn('Error saving discussion to Firestore:', err);
  }
}

export interface StationStreamConfig {
  videoId: string;
  channelUrl?: string;
  channelId?: string;
  mode?: 'video' | 'channel';
  updatedAt: string;
}

const SPOTTER_REPORTS_COLLECTION = 'spotterReports';
const STATION_CONFIG_DOC_ID = 'station-live-config';

/**
 * Subscribe to the globally synced Station Live Stream configuration in Firestore
 * so when the station operator pastes a new YouTube Live URL or Channel ID in the app,
 * it automatically updates across all devices and visitors in real time.
 */
export function subscribeToStationStreamConfig(
  callback: (config: StationStreamConfig) => void
): () => void {
  try {
    const docRef = doc(db, SPOTTER_REPORTS_COLLECTION, STATION_CONFIG_DOC_ID);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && typeof data.camId === 'string' && data.camId.trim()) {
            const rawCamId = data.camId.trim();
            const resolvedVideoId = isStaleOrLegacyVideoId(rawCamId)
              ? DEFAULT_CAMERA_VIDEO_ID
              : rawCamId;
            callback({
              videoId: resolvedVideoId,
              channelUrl: `https://youtube.com/live/${resolvedVideoId}`,
              channelId: typeof data.channelId === 'string' ? data.channelId : undefined,
              mode: 'video',
              updatedAt: typeof data.timestamp === 'string' ? data.timestamp : new Date().toISOString(),
            });
          }
        }
      },
      (err) => {
        console.warn('Station stream config listener fallback to local:', err);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Save the active Station Live Stream Video ID / Channel ID to Firestore
 * (stored in spotterReports/station-live-config to adhere to existing Firestore security rules).
 */
export async function saveStationStreamConfigToFirestore(config: {
  videoId: string;
  channelUrl?: string;
  channelId?: string;
  mode?: 'video' | 'channel';
  callsign?: string;
}): Promise<void> {
  try {
    const docRef = doc(db, SPOTTER_REPORTS_COLLECTION, STATION_CONFIG_DOC_ID);
    await setDoc(
      docRef,
      {
        id: STATION_CONFIG_DOC_ID,
        camId: config.videoId.trim(),
        channelUrl: config.channelUrl || `https://youtube.com/live/${config.videoId.trim()}`,
        channelId: config.channelId || '',
        mode: config.mode || 'video',
        speciesName: 'Station Cam Live Sync',
        callsign: config.callsign || 'STATION-OPERATOR',
        count: 1,
        timestamp: new Date().toISOString(),
        verified: true,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync station stream config to Firestore:', err);
  }
}
