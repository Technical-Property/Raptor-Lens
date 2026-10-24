import { 
  collection, 
  doc, 
  getDocs, 
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
import { INITIAL_SIGHTINGS } from '../data/initialSightings';
import { INITIAL_OBSERVERS, INITIAL_SKYWATCHES, INITIAL_DISCUSSIONS } from '../data/communityData';

const SIGHTINGS_COLLECTION = 'sightings';
const OBSERVERS_COLLECTION = 'observers';
const SKYWATCHES_COLLECTION = 'groupSkywatches';
const DISCUSSIONS_COLLECTION = 'discussions';

/**
 * Seed initial field sightings to Firestore if collection is empty
 */
export async function seedSightingsIfEmpty(): Promise<void> {
  try {
    const colRef = collection(db, SIGHTINGS_COLLECTION);
    const snap = await getDocs(query(colRef, limit(1)));
    if (snap.empty) {
      for (const sighting of INITIAL_SIGHTINGS.slice(0, 15)) {
        await setDoc(doc(db, SIGHTINGS_COLLECTION, sighting.id), sighting);
      }
    }
  } catch (err) {
    console.error('Error checking or seeding sightings in Firestore:', err);
  }
}

/**
 * Seed initial community observers, skywatches, and discussions if empty
 */
export async function seedCommunityIfEmpty(): Promise<void> {
  try {
    const obsSnap = await getDocs(query(collection(db, OBSERVERS_COLLECTION), limit(1)));
    if (obsSnap.empty) {
      for (const obs of INITIAL_OBSERVERS) {
        await setDoc(doc(db, OBSERVERS_COLLECTION, obs.id), obs);
      }
    }

    const skySnap = await getDocs(query(collection(db, SKYWATCHES_COLLECTION), limit(1)));
    if (skySnap.empty) {
      for (const sky of INITIAL_SKYWATCHES) {
        await setDoc(doc(db, SKYWATCHES_COLLECTION, sky.id), sky);
      }
    }

    const discSnap = await getDocs(query(collection(db, DISCUSSIONS_COLLECTION), limit(1)));
    if (discSnap.empty) {
      for (const disc of INITIAL_DISCUSSIONS) {
        await setDoc(doc(db, DISCUSSIONS_COLLECTION, disc.id), disc);
      }
    }
  } catch (err) {
    console.warn('Error seeding community collections in Firestore:', err);
  }
}

/**
 * Subscribe to real-time sighting updates from Firestore
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
          const list: SightingLog[] = snapshot.docs.map((docSnap) => docSnap.data() as SightingLog);
          callback(list);
        } else {
          callback(fallbackData);
        }
      },
      (error) => {
        console.warn('Firestore subscription warning, falling back to local memory:', error);
        callback(fallbackData);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to create Firestore subscription:', err);
    callback(fallbackData);
    return () => {};
  }
}

/**
 * Save a new sighting log directly to Firestore
 */
export async function saveSightingToFirestore(sighting: SightingLog): Promise<void> {
  try {
    const docRef = doc(db, SIGHTINGS_COLLECTION, sighting.id);
    await setDoc(docRef, sighting);
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
 * Subscribe to real-time community observers from Firestore
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
          const list: ObserverProfile[] = snapshot.docs.map((d) => d.data() as ObserverProfile);
          callback(list);
        } else {
          callback(fallbackData);
        }
      },
      () => callback(fallbackData)
    );
  } catch {
    callback(fallbackData);
    return () => {};
  }
}

export async function saveObserverToFirestore(observer: ObserverProfile): Promise<void> {
  try {
    // Strip undefined fields before writing to Firestore
    const clean = JSON.parse(JSON.stringify(observer));
    await setDoc(doc(db, OBSERVERS_COLLECTION, observer.id), clean, { merge: true });
  } catch (err) {
    console.warn('Error saving observer to Firestore:', err);
  }
}

/**
 * Subscribe to real-time group skywatches from Firestore
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
          const list: GroupSkywatch[] = snapshot.docs.map((d) => d.data() as GroupSkywatch);
          callback(list);
        } else {
          callback(fallbackData);
        }
      },
      () => callback(fallbackData)
    );
  } catch {
    callback(fallbackData);
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
 * Subscribe to real-time community forum discussions from Firestore
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
          const list: CommunityDiscussion[] = snapshot.docs.map((d) => d.data() as CommunityDiscussion);
          callback(list);
        } else {
          callback(fallbackData);
        }
      },
      () => callback(fallbackData)
    );
  } catch {
    callback(fallbackData);
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

