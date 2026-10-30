import React, { useState, useEffect, useMemo } from 'react';
import { NavTab, Navbar, SceneryMode } from './components/Navbar';
import { TacticalMap } from './components/TacticalMap';
import { SectorSwitcher } from './components/SectorSwitcher';
import { SilhouetteIdentifier } from './components/SilhouetteIdentifier';
import { SilhouetteQuiz } from './components/SilhouetteQuiz';
import { SightingLogger } from './components/SightingLogger';
import { LiveStreamDispatches } from './components/LiveStreamDispatches';
import { CommunityHub } from './components/CommunityHub';
import { FieldGuideModal } from './components/FieldGuideModal';
import { SightingModal } from './components/SightingModal';
import { HotspotDetailModal } from './components/HotspotDetailModal';
import { SpeciesDetailModal } from './components/SpeciesDetailModal';
import { ObserverRegistrationModal } from './components/ObserverRegistrationModal';
import { LoginModal } from './components/LoginModal';
import { SightingAuditModal } from './components/SightingAuditModal';
import { FieldLiteMode } from './components/FieldLiteMode';
import { BetaFeedbackModal, BetaFeedbackEntry } from './components/BetaFeedbackModal';
import { OfflineBanner } from './components/OfflineBanner';
import { MeteorologicalBriefing } from './components/MeteorologicalBriefing';
import { ConfusionSolverModal } from './components/ConfusionSolverModal';
import { LifeListModal } from './components/LifeListModal';
import { DonateModal } from './components/DonateModal';
import { LegalModal } from './components/LegalModal';
import { SponsorsModal } from './components/SponsorsModal';
import { ContactModal } from './components/ContactModal';
import { AdminMetricsModal } from './components/AdminMetricsModal';
import { DualHeroModeSelector, PerspectiveMode } from './components/DualHeroModeSelector';
import { SummitTrailConditionsView } from './components/SummitTrailConditionsView';
import { WESSEX_HOTSPOTS } from './data/hotspots';
import { RAPTOR_SPECIES } from './data/species';
import { INITIAL_SIGHTINGS } from './data/initialSightings';
import { INITIAL_DISPATCHES } from './data/dispatches';
import { LIVESTREAM_CHANNELS } from './data/livestreams';
import { INITIAL_OBSERVERS, INITIAL_SKYWATCHES, INITIAL_DISCUSSIONS } from './data/communityData';
import { Hotspot, RaptorSpecies, SightingLog, RssDispatch, VerificationStatus } from './types/raptor';
import { ObserverProfile, GroupSkywatch, CommunityDiscussion } from './types/community';
import { SectorId } from './types/sector';
import { UK_SECTORS } from './data/sectors';
import { ShieldCheck, Compass, Eye, Sparkles, Users, Info, HelpCircle, Coffee, Target, BookOpen, Plus, Scale, HeartHandshake, X, Mail, Wind, Zap, BarChart3, Mountain } from 'lucide-react';
import { tacticalAudio } from './utils/audio';

import ridgewayLandscapeImg from './assets/images/ridgeway_landscape_1788791918648.jpg';
import { evaluateCoordinatePrivacy } from './utils/schedule1Privacy';
import { trackEvent } from './utils/analytics';
import { getYouTubeChannelUrl, DEFAULT_CAMERA_VIDEO_ID } from './utils/youtube';
import { 
  seedSightingsIfEmpty, 
  seedCommunityIfEmpty,
  subscribeToSightings, 
  saveSightingToFirestore,
  addCorroborationToFirestore,
  subscribeToObservers,
  saveObserverToFirestore,
  subscribeToSkywatches,
  saveSkywatchToFirestore,
  subscribeToDiscussions,
  saveDiscussionToFirestore,
  isFakeSighting,
  isFakeObserver,
  isFakeSkywatch,
  isFakeDiscussion
} from './services/sightingsFirestore';
import { validateFirestoreConnection } from './services/firebase';
import { sendObserverSignupEmail, ADMIN_NOTIFICATION_EMAIL } from './services/emailNotification';

const CLEAN_SLATE_MIGRATION_KEY = 'raptorlens_clean_slate_v1';

function ensureCleanSlateStorage() {
  try {
    if (localStorage.getItem(CLEAN_SLATE_MIGRATION_KEY) !== 'done') {
      localStorage.removeItem('raptorlens_sightings');
      localStorage.removeItem('raptorlens_observers');
      localStorage.removeItem('raptorlens_skywatches');
      localStorage.removeItem('raptorlens_discussions');
      localStorage.removeItem('raptorlens_dispatches');
      localStorage.removeItem('raptorlens_analytics_events');
      localStorage.removeItem('raptorlens_beta_feedback');
      const existingCallsign = localStorage.getItem('raptorlens_callsign');
      if (existingCallsign === 'WESSEX-SCOUT-07') {
        localStorage.removeItem('raptorlens_callsign');
      }
      localStorage.setItem(CLEAN_SLATE_MIGRATION_KEY, 'done');
    }
  } catch {
    // Ignore storage errors
  }
}

export default function App() {
  ensureCleanSlateStorage();

  const [activeTab, setActiveTab] = useState<NavTab>('dispatches');
  const [perspectiveMode, setPerspectiveMode] = useState<PerspectiveMode>(() => {
    try {
      const saved = localStorage.getItem('raptorlens_perspective');
      if (saved === 'summit-trail' || saved === 'wildlife-radar') return saved;
      return 'summit-trail';
    } catch {
      return 'summit-trail';
    }
  });

  const handleSelectPerspective = (mode: PerspectiveMode) => {
    setPerspectiveMode(mode);
    try {
      localStorage.setItem('raptorlens_perspective', mode);
    } catch {}
    if (mode === 'summit-trail') {
      setActiveTab('dispatches');
    } else {
      setActiveTab('map');
    }
  };

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'dispatches') {
      setPerspectiveMode('summit-trail');
    } else {
      setPerspectiveMode('wildlife-radar');
    }
  };

  const [hotspots] = useState<Hotspot[]>(WESSEX_HOTSPOTS);
  const [speciesList] = useState<RaptorSpecies[]>(RAPTOR_SPECIES);

  // Dismissible First-Time Field Observer Briefing banner
  const [showFieldBrief, setShowFieldBrief] = useState<boolean>(() => {
    try {
      return localStorage.getItem('raptorlens_dismissed_field_brief') !== 'true';
    } catch {
      return true;
    }
  });

  const dismissFieldBrief = () => {
    tacticalAudio.playRadarPing(700);
    setShowFieldBrief(false);
    try {
      localStorage.setItem('raptorlens_dismissed_field_brief', 'true');
    } catch {}
  };

  // Active UK Sector State (with localStorage persistence)
  const [activeSectorId, setActiveSectorId] = useState<SectorId>(() => {
    try {
      return (localStorage.getItem('raptorlens_sector') as SectorId) || 'ridgeway-wessex';
    } catch {
      return 'ridgeway-wessex';
    }
  });

  const activeSector = useMemo(() => {
    return UK_SECTORS.find((s) => s.id === activeSectorId) || UK_SECTORS[0];
  }, [activeSectorId]);

  // Scenery & Eye-Comfort Mode
  const [sceneryMode, setSceneryMode] = useState<SceneryMode>(() => {
    try {
      return (localStorage.getItem('raptorlens_scenery') as SceneryMode) || 'ridgeway';
    } catch {
      return 'ridgeway';
    }
  });

  // Background Visibility state (default 85% for vivid, visible landscape)
  const [backgroundVisibility, setBackgroundVisibility] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('raptorlens_bg_visibility');
      return saved ? parseInt(saved, 10) : 85;
    } catch {
      return 85;
    }
  });

  // Current Observer identity
  const [currentCallsign, setCurrentCallsign] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('raptorlens_callsign');
      if (saved && saved !== 'WESSEX-SCOUT-07') return saved;
      return 'GUEST-SCOUT';
    } catch {
      return 'GUEST-SCOUT';
    }
  });

  // Community state with localStorage persistence (filtered against any legacy fake records)
  const [observers, setObservers] = useState<ObserverProfile[]>(() => {
    try {
      const saved = localStorage.getItem('raptorlens_observers');
      if (!saved) return INITIAL_OBSERVERS;
      const parsed: ObserverProfile[] = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((o) => !isFakeObserver(o)) : INITIAL_OBSERVERS;
    } catch {
      return INITIAL_OBSERVERS;
    }
  });

  const [skywatches, setSkywatches] = useState<GroupSkywatch[]>(() => {
    try {
      const saved = localStorage.getItem('raptorlens_skywatches');
      if (saved) {
        const parsed: GroupSkywatch[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((w) => !isFakeSkywatch(w));
        }
      }
      return INITIAL_SKYWATCHES;
    } catch {
      return INITIAL_SKYWATCHES;
    }
  });

  const [discussions, setDiscussions] = useState<CommunityDiscussion[]>(() => {
    try {
      const saved = localStorage.getItem('raptorlens_discussions');
      if (!saved) return INITIAL_DISCUSSIONS;
      const parsed: CommunityDiscussion[] = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((d) => !isFakeDiscussion(d)) : INITIAL_DISCUSSIONS;
    } catch {
      return INITIAL_DISCUSSIONS;
    }
  });

  // Sightings state with Firestore synchronization and Schedule 1 privacy audit
  const [sightings, setSightings] = useState<SightingLog[]>(() => {
    try {
      const saved = localStorage.getItem('raptorlens_sightings');
      if (saved) {
        const parsed: SightingLog[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((s) => !isFakeSighting(s));
        }
      }
      return INITIAL_SIGHTINGS;
    } catch {
      return INITIAL_SIGHTINGS;
    }
  });

  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);

  // Initialize Firestore connection and real-time subscription
  useEffect(() => {
    let unsubscribeSightings: (() => void) | undefined;
    let unsubscribeObservers: (() => void) | undefined;
    let unsubscribeSkywatches: (() => void) | undefined;
    let unsubscribeDiscussions: (() => void) | undefined;

    async function initFirestore() {
      const ok = await validateFirestoreConnection();
      setIsFirestoreConnected(ok);
      if (ok) {
        await seedSightingsIfEmpty();
        await seedCommunityIfEmpty();
      }

      // Realtime listener for sightings
      unsubscribeSightings = subscribeToSightings((incoming) => {
        setSightings(incoming.map((s) => {
          const rawLat = (s.coordinates && Array.isArray(s.coordinates) && s.coordinates.length >= 2) ? Number(s.coordinates[0]) : NaN;
          const rawLng = (s.coordinates && Array.isArray(s.coordinates) && s.coordinates.length >= 2) ? Number(s.coordinates[1]) : NaN;
          let safeCoords: [number, number];
          if (!Number.isFinite(rawLat) || !Number.isFinite(rawLng)) {
            const matchSpot = WESSEX_HOTSPOTS.find((h) => h.name === s.locationName);
            safeCoords = matchSpot ? [Number(matchSpot.coordinates[0]), Number(matchSpot.coordinates[1])] : [51.4835, -1.7895];
          } else {
            safeCoords = [rawLat, rawLng];
          }

          const privacy = evaluateCoordinatePrivacy(s.speciesId, safeCoords, s.locationName, s.timestamp);
          const dispLat = Number(privacy.displayCoordinates[0]);
          const dispLng = Number(privacy.displayCoordinates[1]);
          const finalCoords: [number, number] = (Number.isFinite(dispLat) && Number.isFinite(dispLng))
            ? [dispLat, dispLng]
            : [51.4835, -1.7895];

          return {
            ...s,
            coordinates: finalCoords,
            locationName: s.isFuzzed ? s.locationName : privacy.generalizedLocation,
            isSchedule1: privacy.isSensitive,
            isFuzzed: privacy.fuzzed,
            privacyRadiusKm: privacy.fuzzRadiusKm,
          };
        }));
      }, INITIAL_SIGHTINGS);

      // Realtime listener for community observers
      unsubscribeObservers = subscribeToObservers((incoming) => {
        setObservers(incoming);
      }, INITIAL_OBSERVERS);

      // Realtime listener for group skywatches
      unsubscribeSkywatches = subscribeToSkywatches((incoming) => {
        setSkywatches(incoming);
      }, INITIAL_SKYWATCHES);

      // Realtime listener for community forum discussions
      unsubscribeDiscussions = subscribeToDiscussions((incoming) => {
        setDiscussions(incoming);
      }, INITIAL_DISCUSSIONS);
    }

    initFirestore();

    return () => {
      if (unsubscribeSightings) unsubscribeSightings();
      if (unsubscribeObservers) unsubscribeObservers();
      if (unsubscribeSkywatches) unsubscribeSkywatches();
      if (unsubscribeDiscussions) unsubscribeDiscussions();
    };
  }, []);

  // Dispatches state with localStorage persistence
  const [dispatches, setDispatches] = useState<RssDispatch[]>(() => {
    try {
      const saved = localStorage.getItem('raptorlens_dispatches');
      if (!saved) return INITIAL_DISPATCHES;
      const parsed: RssDispatch[] = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter((d) => d && typeof d.id === 'string' && !/^disp-00\d$/.test(d.id))
        : INITIAL_DISPATCHES;
    } catch {
      return INITIAL_DISPATCHES;
    }
  });

  // Modal states
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isConfusionModalOpen, setIsConfusionModalOpen] = useState<boolean>(false);
  const [isLifeListModalOpen, setIsLifeListModalOpen] = useState<boolean>(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState<boolean>(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [isSponsorsModalOpen, setIsSponsorsModalOpen] = useState<boolean>(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);
  const [contactDefaultTopic, setContactDefaultTopic] = useState<'conservation' | 'camera' | 'general' | 'privacy'>('general');
  const [auditSighting, setAuditSighting] = useState<SightingLog | null>(null);

  const handleOpenContact = (topic: 'conservation' | 'camera' | 'general' | 'privacy' = 'general') => {
    setContactDefaultTopic(topic);
    setIsContactModalOpen(true);
  };

  const [logModalPrefill, setLogModalPrefill] = useState<{
    coords?: [number, number];
    locationName?: string;
    speciesId?: string;
  }>({});

  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<RaptorSpecies | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mobile / Field Scout Lite Mode (optional 1-tap pocket mode; defaults to false so mobile users see the Live Summit Cam & Radar Map immediately)
  const [isLiteMode, setIsLiteMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('raptorlens_pocket_lite_v2');
      if (saved !== null) return saved === 'true';
      return false;
    } catch {
      return false;
    }
  });

  // Map View Mode: Clean Sightings Centerpiece vs Full Aero & Weather Telemetry
  const [mapViewMode, setMapViewMode] = useState<'clean' | 'telemetry'>(() => {
    try {
      return (localStorage.getItem('raptorlens_map_view_mode') as 'clean' | 'telemetry') || 'clean';
    } catch {
      return 'clean';
    }
  });

  const handleSetMapViewMode = (mode: 'clean' | 'telemetry') => {
    tacticalAudio.playRadarPing(880);
    setMapViewMode(mode);
    try {
      localStorage.setItem('raptorlens_map_view_mode', mode);
    } catch {}
    trackEvent('map_view_mode_toggled', `Switched map view to: ${mode === 'clean' ? 'Clean Sightings Focus' : 'Aero & Weather Intel'}`, { mode });
  };

  // Admin Metrics & Telemetry Console State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  // Beta Feedback State
  const [isBetaFeedbackOpen, setIsBetaFeedbackOpen] = useState<boolean>(false);
  const [betaFeedbacks, setBetaFeedbacks] = useState<BetaFeedbackEntry[]>(() => {
    try {
      const saved = localStorage.getItem('raptorlens_beta_feedback');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Derive current observer profile
  const currentObserverProfile = observers.find(
    (o) => o.callsign.toUpperCase() === currentCallsign.toUpperCase()
  ) || null;

  // Persist scenery
  useEffect(() => {
    try {
      localStorage.setItem('raptorlens_scenery', sceneryMode);
    } catch {}
  }, [sceneryMode]);

  // Ensure scroll is reset to top when switching main tabs or entering/exiting Field Scout Lite mode
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab, isLiteMode]);

  // Deep link listener for #sponsors hash so external links open the dedicated Sponsors page directly
  useEffect(() => {
    const handleHash = () => {
      if (typeof window !== 'undefined' && window.location.hash === '#sponsors') {
        setIsSponsorsModalOpen(true);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Persist background visibility
  useEffect(() => {
    try {
      localStorage.setItem('raptorlens_bg_visibility', backgroundVisibility.toString());
    } catch {}
  }, [backgroundVisibility]);

  // Persist callsign
  useEffect(() => {
    try {
      localStorage.setItem('raptorlens_callsign', currentCallsign);
    } catch {}
  }, [currentCallsign]);

  // Persist community data
  useEffect(() => {
    try {
      localStorage.setItem('raptorlens_skywatches', JSON.stringify(skywatches));
    } catch {}
  }, [skywatches]);

  useEffect(() => {
    try {
      localStorage.setItem('raptorlens_discussions', JSON.stringify(discussions));
    } catch {}
  }, [discussions]);

  useEffect(() => {
    try {
      localStorage.setItem('raptorlens_observers', JSON.stringify(observers));
    } catch {}
  }, [observers]);

  // Persist sightings
  useEffect(() => {
    try {
      const sanitized = sightings.filter(
        (s) => s.coordinates && Number.isFinite(s.coordinates[0]) && Number.isFinite(s.coordinates[1])
      );
      localStorage.setItem('raptorlens_sightings', JSON.stringify(sanitized));
    } catch {}
  }, [sightings]);

  // Persist dispatches
  useEffect(() => {
    try {
      localStorage.setItem('raptorlens_dispatches', JSON.stringify(dispatches));
    } catch {}
  }, [dispatches]);

  // Persist Lite Mode preference
  useEffect(() => {
    try {
      localStorage.setItem('raptorlens_pocket_lite_v2', isLiteMode.toString());
    } catch {}
  }, [isLiteMode]);

  // Persist Beta feedback entries
  useEffect(() => {
    try {
      localStorage.setItem('raptorlens_beta_feedback', JSON.stringify(betaFeedbacks));
    } catch {}
  }, [betaFeedbacks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSaveSighting = (newSighting: SightingLog) => {
    const rawCoords: [number, number] = (
      Array.isArray(newSighting.coordinates) &&
      newSighting.coordinates.length >= 2 &&
      Number.isFinite(Number(newSighting.coordinates[0])) &&
      Number.isFinite(Number(newSighting.coordinates[1]))
    )
      ? [Number(newSighting.coordinates[0]), Number(newSighting.coordinates[1])]
      : [51.4835, -1.7895];

    // Schedule 1 Wildlife & Countryside Act 1981 Privacy Check
    const privacy = evaluateCoordinatePrivacy(
      newSighting.speciesId,
      rawCoords,
      newSighting.locationName,
      newSighting.timestamp
    );

    const processedSighting: SightingLog = {
      ...newSighting,
      coordinates: privacy.displayCoordinates,
      locationName: privacy.generalizedLocation,
      isSchedule1: privacy.isSensitive,
      isFuzzed: privacy.fuzzed,
      privacyRadiusKm: privacy.fuzzRadiusKm,
    };

    setSightings((prev) => [processedSighting, ...prev]);

    // Asynchronously save to Firestore database
    saveSightingToFirestore(processedSighting).catch((err) => {
      console.warn('Could not sync sighting to Firestore, retained locally:', err);
    });

    trackEvent('sighting_logged', `Sighting Logged: ${newSighting.count}x ${newSighting.speciesName} at ${newSighting.locationName}`, {
      species: newSighting.speciesName,
      location: newSighting.locationName,
      isSchedule1: processedSighting.isSchedule1,
      count: newSighting.count,
    });

    if (newSighting.markerCategory === 'sky' || newSighting.markerCategory === 'walkers') {
      showToast(`✓ Live DVR Rewind Marker saved: ${newSighting.speciesName} (${newSighting.locationName})`);
    } else if (privacy.fuzzed) {
      showToast(`🔒 Schedule 1 Protection: ${newSighting.speciesName} exact coordinates coarsened to a ${privacy.fuzzRadiusKm}km sector.`);
    } else {
      showToast(`✓ Contact confirmed: ${newSighting.count}x ${newSighting.speciesName} at ${newSighting.locationName}`);
    }
  };

  const raptorSightings = useMemo(
    () => sightings.filter((s) => !s.markerCategory || s.markerCategory === 'raptor'),
    [sightings]
  );

  const handleSubmitBetaFeedback = (entry: BetaFeedbackEntry) => {
    setBetaFeedbacks((prev) => [entry, ...prev]);
    trackEvent('beta_feedback_submitted', `Beta Telemetry: ${entry.category} from ${entry.observerCallsign}`, {
      category: entry.category,
      callsign: entry.observerCallsign,
      sector: entry.sectorName,
    });
    showToast(`✓ Field Beta Telemetry Dispatched: Thank you ${entry.observerCallsign}!`);
  };

  const handleAddDispatch = (newDispatch: RssDispatch) => {
    setDispatches((prev) => [newDispatch, ...prev]);
    showToast(`⚡ RSS Bulletin Broadcast: ${newDispatch.title}`);
  };

  // Community handlers
  const handleJoinSkywatch = (skywatchId: string) => {
    setSkywatches((prev) =>
      prev.map((w) => {
        if (w.id === skywatchId) {
          const alreadyJoined = w.attendees.includes(currentCallsign) || w.isJoined;
          const newAttendees = alreadyJoined
            ? w.attendees.filter((a) => a !== currentCallsign)
            : [...w.attendees, currentCallsign];
          
          showToast(
            alreadyJoined
              ? `Withdrawn from ${w.title}`
              : `✓ Joined skywatch: ${w.title}! See you on the Ridgeway.`
          );

          const updated: GroupSkywatch = {
            ...w,
            attendees: newAttendees,
            isJoined: !alreadyJoined,
          };
          saveSkywatchToFirestore(updated);
          return updated;
        }
        return w;
      })
    );
  };

  const handleCreateSkywatch = (newWatch: GroupSkywatch) => {
    setSkywatches((prev) => [newWatch, ...prev]);
    saveSkywatchToFirestore(newWatch);
    showToast(`✓ Group Skywatch scheduled: ${newWatch.title}`);
  };

  const handleAddDiscussion = (newDisc: CommunityDiscussion) => {
    setDiscussions((prev) => [newDisc, ...prev]);
    saveDiscussionToFirestore(newDisc);
    showToast(`✓ Question broadcast to Wessex observer network!`);
  };

  const handleAddReply = (discId: string, replyText: string) => {
    setDiscussions((prev) =>
      prev.map((d) => {
        if (d.id === discId) {
          const updated: CommunityDiscussion = {
            ...d,
            replies: [
              ...d.replies,
              {
                id: `rep-${Date.now()}`,
                authorCallsign: currentCallsign,
                authorBadge: 'Chalkland Thermal Scout',
                text: replyText,
                timestamp: 'Just now',
                upvotes: 0,
              },
            ],
          };
          saveDiscussionToFirestore(updated);
          return updated;
        }
        return d;
      })
    );
    showToast(`✓ Reply posted to discussion`);
  };

  const handleUpvoteDiscussion = (discId: string) => {
    setDiscussions((prev) =>
      prev.map((d) => {
        if (d.id === discId) {
          const nextUpvoted = !d.hasUpvoted;
          const updated: CommunityDiscussion = {
            ...d,
            upvotes: nextUpvoted ? d.upvotes + 1 : Math.max(0, d.upvotes - 1),
            hasUpvoted: nextUpvoted,
          };
          saveDiscussionToFirestore(updated);
          return updated;
        }
        return d;
      })
    );
  };

  const handleSelectSector = (sectorId: SectorId) => {
    setActiveSectorId(sectorId);
    try {
      localStorage.setItem('raptorlens_sector', sectorId);
    } catch {}
    const sec = UK_SECTORS.find((s) => s.id === sectorId);
    if (sec) {
      showToast(`📍 Operational Sector: ${sec.name}`);
      trackEvent('sector_switched', `Operational Sector: ${sec.name}`, { sectorId, sectorName: sec.name });
    }
  };

  const sectorHotspots = useMemo(() => {
    if (activeSectorId === 'all') return hotspots;
    const filtered = hotspots.filter((h) => h.sectorId === activeSectorId);
    return filtered.length > 0 ? filtered : hotspots;
  }, [hotspots, activeSectorId]);

  const handleUpdateCallsign = (newCallsign: string, homeHotspot: string) => {
    setCurrentCallsign(newCallsign);
    showToast(`✓ Observer identity updated: ${newCallsign}`);
  };

  const handleRegisterObserver = (newProfile: ObserverProfile) => {
    const isExistingUpdate = observers.some(
      (o) => o.id === newProfile.id || o.callsign.toUpperCase() === newProfile.callsign.toUpperCase()
    );
    setCurrentCallsign(newProfile.callsign);
    setObservers((prev) => {
      const idx = prev.findIndex((o) => o.id === newProfile.id || o.callsign === newProfile.callsign);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newProfile;
        return next;
      }
      return [newProfile, ...prev];
    });
    saveObserverToFirestore(newProfile);
    sendObserverSignupEmail(newProfile, isExistingUpdate);
    trackEvent('observer_registered', `New Observer Registered: ${newProfile.callsign} (${newProfile.fullName})`, {
      callsign: newProfile.callsign,
      experienceLevel: newProfile.experienceLevel,
      homeHotspot: newProfile.homeHotspot,
      notifiedAdmin: ADMIN_NOTIFICATION_EMAIL,
    });
    showToast(`✓ Observer Credentials Verified: Welcome ${newProfile.callsign}!`);
  };

  const handleResetObserverPassword = (updatedProfile: ObserverProfile) => {
    setCurrentCallsign(updatedProfile.callsign);
    setObservers((prev) => {
      const idx = prev.findIndex((o) => o.id === updatedProfile.id || o.callsign === updatedProfile.callsign);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedProfile;
        return next;
      }
      return [updatedProfile, ...prev];
    });
    saveObserverToFirestore(updatedProfile);
    showToast(`✓ Password updated and synced for ${updatedProfile.callsign}`);
  };

  // Observer Authentication & Account Handlers
  const handleLoginObserver = (profile: ObserverProfile) => {
    setCurrentCallsign(profile.callsign);
    setObservers((prev) => {
      const exists = prev.some((o) => o.callsign === profile.callsign);
      if (exists) return prev;
      return [profile, ...prev];
    });
    showToast(`✓ Authenticated: ${profile.callsign} (${profile.rank})`);
  };

  const handleLoginCustomCallsign = (callsign: string, homeHotspot?: string) => {
    setCurrentCallsign(callsign);
    showToast(`✓ Field Callsign locked: ${callsign}`);
  };

  const handleLogoutToGuest = () => {
    setCurrentCallsign('GUEST-SCOUT');
    showToast('Switched to Guest Observer. Observations will be marked for peer audit.');
  };

  // Sighting Verification & Audit Trail Handlers
  const handleInspectAudit = (sighting: SightingLog) => {
    setAuditSighting(sighting);
    setIsAuditModalOpen(true);
  };

  const handleCorroborateSighting = (sightingId: string, notes?: string) => {
    const now = new Date();
    const observerRank = currentObserverProfile?.rank || 'Field Scout';

    setSightings((prev) =>
      prev.map((s) => {
        if (s.id === sightingId) {
          const alreadyCorroborated = s.corroborations?.some(
            (c) => c.observerCallsign.toUpperCase() === currentCallsign.toUpperCase()
          );
          if (alreadyCorroborated) return s;

          const newCorrob = {
            observerCallsign: currentCallsign,
            observerRank,
            timestamp: now.toISOString(),
            notes: notes || 'Visual contact confirmed from field coordinates.',
          };

          const updatedCorroborations = [...(s.corroborations || []), newCorrob];

          const isSpecialist = Boolean(
            currentObserverProfile?.isSpecialist ||
            observerRank.includes('Specialist') ||
            observerRank.includes('Ringer') ||
            observerRank.includes('BTO')
          );

          let newStatus: VerificationStatus = s.verificationStatus || 'Pending Review';
          if (isSpecialist) {
            newStatus = 'Specialist Confirmed';
          } else if (s.verificationStatus === 'Pending Review' || !s.verificationStatus) {
            newStatus = 'Corroborated by Peers';
          }

          const updatedAuditTrail = [
            ...(s.auditTrail || []),
            {
              action: isSpecialist ? ('SPECIALIST_VERIFIED' as const) : ('PEER_CORROBORATION' as const),
              timestamp: now.toISOString(),
              actorCallsign: currentCallsign,
              actorRank: observerRank,
              details: notes || `Observer visual corroboration recorded. Verification tier updated to ${newStatus}.`,
            },
          ];

          const updatedSighting: SightingLog = {
            ...s,
            verificationStatus: newStatus,
            corroborations: updatedCorroborations,
            auditTrail: updatedAuditTrail,
          };

          if (auditSighting?.id === s.id) {
            setAuditSighting(updatedSighting);
          }

          // Persist corroboration update to Firestore
          addCorroborationToFirestore(sightingId, newCorrob).catch((err) => {
            console.warn('Could not sync corroboration to Firestore:', err);
          });

          return updatedSighting;
        }
        return s;
      })
    );

    showToast(`✓ Contact Corroborated! Observer signature [${currentCallsign}] recorded in audit log.`);
  };

  const handleFlagSighting = (sightingId: string, reason: string) => {
    const now = new Date();
    setSightings((prev) =>
      prev.map((s) => {
        if (s.id === sightingId) {
          const updatedAuditTrail = [
            ...(s.auditTrail || []),
            {
              action: 'FLAGGED' as const,
              timestamp: now.toISOString(),
              actorCallsign: currentCallsign,
              actorRank: currentObserverProfile?.rank || 'Field Scout',
              details: `Flagged for verification audit: "${reason}"`,
            },
          ];

          const updated: SightingLog = {
            ...s,
            verificationStatus: 'Flagged for Review',
            auditTrail: updatedAuditTrail,
          };

          if (auditSighting?.id === s.id) {
            setAuditSighting(updated);
          }
          return updated;
        }
        return s;
      })
    );
    showToast(`⚠ Sighting flagged for study group coordinator scrutiny.`);
  };

  const handleQuickCorroborate = (sightingId: string) => {
    if (currentCallsign === 'GUEST-SCOUT' || !currentCallsign) {
      showToast('Please sign in or identify your observer callsign to corroborate sightings.');
      setIsLoginModalOpen(true);
      return;
    }
    handleCorroborateSighting(sightingId);
  };

  // Quick action from Map: click coordinate
  const handleLogAtCoordinate = (lat: number, lng: number, locationGuess?: string) => {
    setLogModalPrefill({
      coords: [lat, lng],
      locationName: locationGuess || `Wessex Downs Sector (${lat}, ${lng})`,
    });
    setIsLogModalOpen(true);
  };

  // Quick action from Species list
  const handleLogFromSpecies = (species: RaptorSpecies) => {
    setLogModalPrefill({
      speciesId: species.id,
      locationName: species.bestHotspots[0] || 'Barbury Castle Ramparts',
    });
    setIsLogModalOpen(true);
  };

  // Quick action from Hotspot detail
  const handleLogFromHotspot = (hotspot: Hotspot) => {
    setLogModalPrefill({
      coords: hotspot.coordinates,
      locationName: hotspot.name,
    });
    setIsLogModalOpen(true);
  };

  // Fly to hotspot from detail modal or RSS
  const handleFlyToHotspot = (hotspot: Hotspot) => {
    setSelectedHotspot(hotspot);
    setActiveTab('map');
  };

  const handleLocateHotspotById = (hotspotId: string) => {
    const spot = hotspots.find((h) => h.id === hotspotId);
    if (spot) {
      handleFlyToHotspot(spot);
    } else {
      setActiveTab('map');
    }
  };

  return (
    <div className="relative min-h-screen text-neutral-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200 transition-colors">
      {/* 
        ================================================================
        ATMOSPHERIC RIDGEWAY BACKDROP (HIGH CLARITY & VISIBILITY)
        Shows the authentic Wessex chalk escarpment & Ridgeway trail
        ================================================================
      */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {sceneryMode === 'ridgeway' && (
          <>
            <img
              src={ridgewayLandscapeImg}
              alt="The Ridgeway National Trail along North Wessex Downs"
              className="w-full h-full object-cover object-center transition-all duration-700"
              style={{ opacity: backgroundVisibility / 100 }}
              referrerPolicy="no-referrer"
            />
            {/* Subtle contrast gradient: keeps typography legible while preserving vivid rolling downs & sunset sky */}
            <div 
              className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
              style={{
                backgroundColor: `rgba(10, 12, 16, ${Math.max(0.08, (100 - backgroundVisibility) / 100 * 0.6)})`,
                backgroundImage: 'linear-gradient(to bottom, rgba(10,12,16,0.3) 0%, rgba(10,12,16,0.06) 35%, rgba(10,12,16,0.35) 80%, rgba(10,12,16,0.7) 100%)'
              }}
            />
            {/* Subtle warm amber ambient horizon glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[350px] bg-amber-500/10 blur-3xl rounded-full pointer-events-none"></div>
          </>
        )}

        {sceneryMode === 'soft-mist' && (
          <>
            <img
              src={ridgewayLandscapeImg}
              alt="The Ridgeway National Trail along North Wessex Downs"
              className="w-full h-full object-cover object-center transition-all duration-700 filter saturate-75 brightness-95"
              style={{ opacity: (backgroundVisibility / 100) * 0.75 }}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0e1724]/70 via-[#131f2e]/60 to-[#0b121c]/80 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none"></div>
          </>
        )}

        {sceneryMode === 'dark' && (
          <>
            <img
              src={ridgewayLandscapeImg}
              alt="The Ridgeway National Trail along North Wessex Downs"
              className="w-full h-full object-cover object-center filter grayscale contrast-125 brightness-75"
              style={{ opacity: (backgroundVisibility / 100) * 0.35 }}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-neutral-950/85 pointer-events-none"></div>
          </>
        )}
      </div>

      {/* Relative App Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed left-3 right-3 sm:left-auto sm:right-5 bottom-20 lg:bottom-5 z-50 bg-neutral-950/95 border border-amber-500/80 text-amber-300 font-mono-tactical text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 backdrop-blur-xl animate-bounce transition-all">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Offline State & PWA Install Banner */}
        <OfflineBanner />

        {/* Main Tactical Navbar with Community & Eye-Comfort Selector */}
        <Navbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onOpenLogModal={() => {
            setLogModalPrefill({});
            setIsLogModalOpen(true);
          }}
          sightingsCount={sightings.length}
          unreadDispatchesCount={dispatches.length}
          communitySkywatchesCount={skywatches.length}
          sceneryMode={sceneryMode}
          onSceneryChange={setSceneryMode}
          backgroundVisibility={backgroundVisibility}
          onBackgroundVisibilityChange={setBackgroundVisibility}
          onOpenGuide={() => setIsGuideModalOpen(true)}
          currentCallsign={currentCallsign}
          onOpenRegister={() => setIsRegisterModalOpen(true)}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          activeSectorId={activeSectorId}
          onSelectSector={handleSelectSector}
          isLiteMode={isLiteMode}
          onToggleLiteMode={() => setIsLiteMode((prev) => !prev)}
          onOpenBetaFeedback={() => setIsBetaFeedbackOpen(true)}
          onOpenConfusionSolver={() => setIsConfusionModalOpen(true)}
          onOpenLifeList={() => setIsLifeListModalOpen(true)}
          onOpenDonate={() => setIsDonateModalOpen(true)}
          onOpenLegal={() => setIsLegalModalOpen(true)}
          onOpenContact={() => handleOpenContact('general')}
          onOpenAdminMetrics={() => setIsAdminModalOpen(true)}
        />

        {/* Main App Content View Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 md:py-6 space-y-6">
          {/* Mobile / Field Scout Lite Mode View */}
          {isLiteMode ? (
            <FieldLiteMode
              sightings={sightings}
              hotspots={hotspots}
              speciesList={speciesList}
              activeSectorId={activeSectorId}
              onSelectSector={handleSelectSector}
              currentCallsign={currentCallsign}
              onSaveSighting={handleSaveSighting}
              onSwitchToFullMode={() => setIsLiteMode(false)}
              onOpenLiveCam={() => {
                setIsLiteMode(false);
                handleTabChange('dispatches');
              }}
              onOpenBetaFeedback={() => setIsBetaFeedbackOpen(true)}
              onOpenFieldGuide={() => setIsGuideModalOpen(true)}
              onOpenDonate={() => setIsDonateModalOpen(true)}
            />
          ) : (
            <>
              {/* THE TWO DOORS: Dual-Hero Mode Switcher (Summit & Trail vs Wildlife Radar) */}
              <DualHeroModeSelector
                currentPerspective={perspectiveMode}
                onSelectPerspective={handleSelectPerspective}
                sightingsCount={sightings.length}
                activeSectorName={activeSector.name}
                activeSectorShortName={activeSector.shortName}
              />
              {/* TAB 1: TACTICAL MAP */}
              {activeTab === 'map' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Map Header Intro */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-950/80 backdrop-blur-md border border-neutral-800/80 p-4 sm:p-5 rounded-2xl shadow-xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
                    <Compass className="w-4 h-4 text-amber-400" />
                    <span>{activeSector.name} · Interactive Raptor Map</span>
                  </div>
                  <h1 className="font-display-tactical text-xl md:text-2xl font-bold text-neutral-100 tracking-tight">
                    {activeSector.shortName} Hotspots &amp; Live Sightings
                  </h1>
                  <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl leading-relaxed font-sans">
                    {mapViewMode === 'clean' 
                      ? `${activeSector.summary} Showing live raptor sightings and key viewing locations.`
                      : `${activeSector.summary} Primary soaring corridor: ${activeSector.thermalCorridorName}. Key species: ${activeSector.keyTargetRaptors.join(', ')}.`}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 self-start md:self-auto text-xs shrink-0">
                  <button
                    onClick={() => setIsGuideModalOpen(true)}
                    className="bg-neutral-900 hover:bg-neutral-800 px-3.5 py-2 rounded-xl border border-neutral-800 text-amber-300 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow"
                  >
                    <Info className="w-4 h-4 text-amber-400" />
                    <span>Site Guide</span>
                  </button>
                  <div className="bg-neutral-900 px-3.5 py-2 rounded-xl border border-neutral-800 text-right shadow">
                    <span className="text-[11px] text-neutral-400 block font-medium">Live Sightings</span>
                    <span className="text-emerald-400 font-bold text-sm">{sightings.length} Logged</span>
                  </div>
                </div>
              </div>

              {/* View Mode Toggle: Clean Sightings Centrepiece vs Aero & Weather Intel */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950/80 backdrop-blur-md border border-neutral-800 rounded-2xl p-2 sm:p-2.5 shadow-xl">
                <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 self-start sm:self-auto">
                  <button
                    id="toggle-clean-view-btn"
                    onClick={() => handleSetMapViewMode('clean')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                      mapViewMode === 'clean'
                        ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                    title="Clean Sighting View: Centrepiece map with clean sightings blips and zero noise"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Clean Sightings Focus</span>
                  </button>
                  <button
                    id="toggle-telemetry-view-btn"
                    onClick={() => handleSetMapViewMode('telemetry')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                      mapViewMode === 'telemetry'
                        ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                    title="Aero & Soaring Intel: Thermal corridors, soaring score, wind vectors, and escarpment lift predictor"
                  >
                    <Wind className="w-3.5 h-3.5" />
                    <span>Aero &amp; Weather Intel</span>
                  </button>
                </div>

                <div className="text-xs font-mono-tactical text-neutral-400 px-2 flex items-center gap-2">
                  {mapViewMode === 'clean' ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Centrepiece Active: Soaring indexes, wind vectors &amp; corridors hidden</span>
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Aero Intel Active: Thermal lift &amp; wind vectors displayed</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Dismissible Field Observer Quick Tip */}
              {showFieldBrief && (
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono-tactical text-amber-200 shadow-sm backdrop-blur-md">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong className="text-amber-300">Field Tip:</strong> Click any raptor contact on the radar to inspect soaring altitude, thermal lift, and observer notes. Press <strong className="text-neutral-100 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-750 font-mono text-[11px]">Z</strong> anytime for Full Zen Mode.
                    </span>
                  </div>
                  <button
                    onClick={dismissFieldBrief}
                    className="text-neutral-400 hover:text-amber-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0 px-2 py-1 rounded-lg hover:bg-neutral-900/60 transition-colors"
                    title="Dismiss tip"
                  >
                    <span>Got it</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* UK Sector Switcher Bar */}
              <SectorSwitcher
                activeSectorId={activeSectorId}
                onSelectSector={handleSelectSector}
              />

              {/* Real-time Sector Meteorological Briefing & Escarpment Lift Predictor (Only in Aero & Weather Intel Mode) */}
              {mapViewMode === 'telemetry' && (
                <MeteorologicalBriefing
                  activeSectorId={activeSectorId}
                  onOpenConfusionSolver={() => setIsConfusionModalOpen(true)}
                  onOpenLifeList={() => setIsLifeListModalOpen(true)}
                />
              )}

              {/* Tactical Leaflet Map Canvas */}
              <TacticalMap
                hotspots={hotspots}
                sightings={raptorSightings}
                selectedHotspot={selectedHotspot}
                onSelectHotspot={(spot) => setSelectedHotspot(spot)}
                onSelectSighting={(s) => {
                  handleInspectAudit(s);
                }}
                onInspectAudit={handleInspectAudit}
                onLogAtCoordinate={handleLogAtCoordinate}
                activeSectorId={activeSectorId}
                onSelectSector={handleSelectSector}
                onOpenLiveCam={() => setActiveTab('dispatches')}
                cleanMode={mapViewMode === 'clean'}
                onToggleCleanMode={(isClean) => handleSetMapViewMode(isClean ? 'clean' : 'telemetry')}
              />

              {/* Hotspot Quick Cards Summary for Active Sector */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs sm:text-sm text-neutral-400">
                  <span className="text-amber-400 font-bold flex items-center gap-2">
                    <Compass className="w-4 h-4" />
                    Key Viewing Locations · {activeSector.shortName}
                  </span>
                  <span>{sectorHotspots.length} Locations</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sectorHotspots.map((spot) => (
                    <div
                      key={spot.id}
                      onClick={() => {
                        tacticalAudio.playRadarPing(880);
                        setSelectedHotspot(spot);
                      }}
                      className="bg-neutral-950/75 backdrop-blur-md border border-neutral-800/80 hover:border-amber-500/60 p-4 rounded-2xl transition-all cursor-pointer group shadow-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-mono-tactical text-neutral-400 mb-1">
                          <span>{spot.gridRef}</span>
                          <span className="text-amber-400 font-bold">{spot.elevationM}m ASL</span>
                        </div>
                        <h3 className="font-display-tactical text-base font-bold text-neutral-100 group-hover:text-amber-300 transition-colors">
                          {spot.name}
                        </h3>
                        <p className="text-xs text-neutral-300 mt-1 line-clamp-2 font-sans">
                          {spot.primaryHabitat}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono-tactical">
                        <span className="text-emerald-400 font-semibold">Lift: {spot.thermalRating}</span>
                        <span className="text-neutral-400 group-hover:text-amber-300 transition-colors flex items-center gap-1 text-[11px]">
                          Inspect Dossier &rarr;
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DOOR 1: SUMMIT & TRAIL CONDITIONS (THE HIKER & WALKER'S LENS) */}
          {activeTab === 'dispatches' && (
            <SummitTrailConditionsView
              onSwitchToRadar={() => handleTabChange('map')}
              onOpenLogModal={(locationGuess) => handleLogAtCoordinate(51.4835, -1.7895, locationGuess || 'Barbury Castle Summit')}
              onOpenGuide={() => setIsGuideModalOpen(true)}
              onOpenDonate={() => setIsDonateModalOpen(true)}
              onOpenAdminMetrics={() => setIsAdminModalOpen(true)}
              activeSectorId={activeSectorId}
              currentCallsign={currentCallsign}
              onAddDispatch={handleAddDispatch}
              sightings={sightings}
              onSaveSighting={handleSaveSighting}
            />
          )}

          {/* PILLAR 3: IDENTIFY RAPTORS (SILHOUETTE KEY & DRILL QUIZ) */}
          {(activeTab === 'silhouette' || activeTab === 'quiz') && (
            <div className="space-y-6">
              {/* Clean Sub-Navigation */}
              <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-800 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 self-start">
                  <button
                    onClick={() => {
                      tacticalAudio.playRadarPing(880);
                      setActiveTab('silhouette');
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                      activeTab === 'silhouette'
                        ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Visual Silhouette Key
                  </button>
                  <button
                    onClick={() => {
                      tacticalAudio.playRadarPing(920);
                      setActiveTab('quiz');
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                      activeTab === 'quiz'
                        ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    Identification Quiz &amp; Practice
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <button
                    onClick={() => setIsConfusionModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-amber-300 flex items-center gap-1.5 cursor-pointer font-medium"
                  >
                    ⚖️ Confusion Solver
                  </button>
                  <button
                    onClick={() => setIsGuideModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-neutral-100 flex items-center gap-1.5 cursor-pointer font-medium"
                  >
                    📖 Field Guide
                  </button>
                </div>
              </div>

              {activeTab === 'silhouette' ? (
                <SilhouetteIdentifier
                  speciesList={speciesList}
                  onSelectSpecies={(sp) => setSelectedSpecies(sp)}
                  onLogSpecies={handleLogFromSpecies}
                />
              ) : (
                <SilhouetteQuiz
                  speciesList={speciesList}
                  onSelectSpecies={(sp) => setSelectedSpecies(sp)}
                />
              )}
            </div>
          )}

          {/* PILLAR 4: COMMUNITY & FIELD SIGHTINGS LOGS */}
          {(activeTab === 'community' || activeTab === 'sightings') && (
            <div className="space-y-6 pb-16 sm:pb-24">
              {/* Clean Sub-Navigation */}
              <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-800 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 self-start">
                  <button
                    onClick={() => {
                      tacticalAudio.playRadarPing(880);
                      setActiveTab('sightings');
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                      activeTab === 'sightings'
                        ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Field Sightings Log
                    <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeTab === 'sightings' ? 'bg-neutral-950 text-amber-300 font-bold' : 'bg-neutral-800 text-neutral-300'}`}>
                      {sightings.length}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      tacticalAudio.playRadarPing(920);
                      setActiveTab('community');
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                      activeTab === 'community'
                        ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Group Walks &amp; Skywatches
                    <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeTab === 'community' ? 'bg-neutral-950 text-amber-300 font-bold' : 'bg-neutral-800 text-neutral-300'}`}>
                      {skywatches.length} Walks
                    </span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    tacticalAudio.playRadarPing(950);
                    setLogModalPrefill({});
                    setIsLogModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Report Sighting</span>
                </button>
              </div>

              {activeTab === 'sightings' ? (
                <SightingLogger
                  sightings={raptorSightings}
                  hotspots={hotspots}
                  speciesList={speciesList}
                  currentCallsign={currentCallsign}
                  onOpenSightingModal={() => {
                    setLogModalPrefill({});
                    setIsLogModalOpen(true);
                  }}
                  onSelectSighting={(s) => {
                    const sp = speciesList.find((p) => p.id === s.speciesId);
                    if (sp) setSelectedSpecies(sp);
                  }}
                  onViewOnMap={(s) => {
                    const spot = hotspots.find(
                      (h) => Math.abs(h.coordinates[0] - s.coordinates[0]) < 0.05 && Math.abs(h.coordinates[1] - s.coordinates[1]) < 0.05
                    );
                    if (spot) setSelectedHotspot(spot);
                    setActiveTab('map');
                  }}
                  onInspectAudit={handleInspectAudit}
                  onCorroborateQuick={handleQuickCorroborate}
                  activeSectorId={activeSectorId}
                  onSelectSector={handleSelectSector}
                />
              ) : (
                <CommunityHub
                  observers={observers}
                  skywatches={skywatches}
                  discussions={discussions}
                  currentCallsign={currentCallsign}
                  onUpdateCallsign={handleUpdateCallsign}
                  onRegisterObserver={handleRegisterObserver}
                  onJoinSkywatch={handleJoinSkywatch}
                  onCreateSkywatch={handleCreateSkywatch}
                  onAddDiscussion={handleAddDiscussion}
                  onAddReply={handleAddReply}
                  onUpvoteDiscussion={handleUpvoteDiscussion}
                  onLocateHotspot={handleLocateHotspotById}
                />
              )}
            </div>
          )}
        </>
      )}
    </main>

        {/* Fixed Mobile Bottom Thumb-Zone Navigation Bar (Shown on < lg screens in Full Mode) */}
        {!isLiteMode && (
          <nav
            aria-label="Mobile Bottom Navigation"
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.85)]"
          >
            <div className="max-w-lg mx-auto grid grid-cols-5 gap-1 font-mono-tactical">
              <button
                type="button"
                onClick={() => {
                  tacticalAudio.playRadarPing(880);
                  handleTabChange('dispatches');
                }}
                className={`min-h-[48px] py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
                  activeTab === 'dispatches'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Mountain className="w-4 h-4 text-rose-400" />
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                </div>
                <span className="text-[10px] truncate">Live Cam</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  tacticalAudio.playRadarPing(900);
                  handleTabChange('map');
                }}
                className={`min-h-[48px] py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
                  activeTab === 'map'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Compass className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] truncate">Radar Map</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  tacticalAudio.playRadarPing(950);
                  setLogModalPrefill({});
                  setIsLogModalOpen(true);
                }}
                className="min-h-[48px] py-1 px-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold flex flex-col items-center justify-center gap-0.5 shadow-lg shadow-amber-500/25 cursor-pointer transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.8]" />
                <span className="text-[10px] truncate">Log Spot</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  tacticalAudio.playRadarPing(900);
                  handleTabChange('silhouette');
                }}
                className={`min-h-[48px] py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
                  activeTab === 'silhouette' || activeTab === 'quiz'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Eye className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] truncate">ID &amp; Calls</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  tacticalAudio.playRadarPing(900);
                  handleTabChange('community');
                }}
                className={`min-h-[48px] py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
                  activeTab === 'community' || activeTab === 'sightings'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Users className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] truncate">Community</span>
              </button>
            </div>
          </nav>
        )}

        {/* Footer & Ecological Field Protocol */}
        <footer className="bg-neutral-950/90 backdrop-blur-md border-t border-neutral-800/90 py-6 px-4 font-mono-tactical text-xs text-neutral-400 mt-auto transition-all pb-28 lg:pb-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                UK DOWNLAND RAPTOR ETHICAL PROTOCOL: Wildlife & Countryside Act 1981 Schedule 1 compliance. 150m standoff from active roosts. Keep dogs on leads during ground-nesting season (Mar–Aug).
              </span>
            </div>

            <div className="flex items-center gap-3 text-neutral-400 flex-wrap justify-center">
              <button
                id="footer-donate-btn"
                onClick={() => {
                  tacticalAudio.playRadarPing(900);
                  setIsDonateModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                title="100% Volunteer Site — Support RSPB, Wiltshire Wildlife Trust & UK Bird Charities"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
                <span>Support UK Wildlife Charities 🦅</span>
              </button>
              <span>•</span>
              <button
                id="footer-beta-btn"
                onClick={() => {
                  tacticalAudio.playRadarPing(800);
                  setIsBetaFeedbackOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold cursor-pointer transition-colors flex items-center gap-1"
                title="Send Beta Feedback or Bug Report"
              >
                <span>★ Field Beta v0.9.4 Feedback</span>
              </button>
              <span>•</span>
              <button
                id="footer-about-guide-btn"
                onClick={() => {
                  tacticalAudio.playRadarPing(850);
                  setIsGuideModalOpen(true);
                }}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline underline-offset-4 decoration-amber-500/50 hover:decoration-amber-400 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>About Us &amp; Site Guide</span>
              </button>
              <span>•</span>
              <button
                id="footer-legal-btn"
                onClick={() => {
                  tacticalAudio.playRadarPing(880);
                  setIsLegalModalOpen(true);
                }}
                className="flex items-center gap-1 text-neutral-300 hover:text-amber-300 font-semibold cursor-pointer transition-colors"
                title="Copyright Ownership, GDPR Landscape Privacy &amp; Wildlife Compliance"
              >
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>Compliance &amp; Legal</span>
              </button>
              <span>•</span>
              <button
                id="footer-contact-btn"
                onClick={() => {
                  tacticalAudio.playRadarPing(880);
                  handleOpenContact('general');
                }}
                className="flex items-center gap-1 text-neutral-300 hover:text-amber-300 font-semibold cursor-pointer transition-colors"
                title="Contact Station Operators, Conservation Desk &amp; Technical Support"
              >
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Contact Us</span>
              </button>
              <span>•</span>
              <button
                id="footer-lite-mode-btn"
                onClick={() => {
                  tacticalAudio.playConfirmChime();
                  setIsLiteMode((prev) => !prev);
                }}
                className="text-emerald-400 hover:text-emerald-300 cursor-pointer font-semibold"
              >
                {isLiteMode ? 'Full Mode' : 'Field Lite Mode'}
              </button>
              <span>•</span>
              <button
                id="footer-admin-metrics-btn"
                onClick={() => {
                  tacticalAudio.playRadarPing(880);
                  setIsAdminModalOpen(true);
                }}
                className="flex items-center gap-1 text-neutral-400 hover:text-amber-300 font-semibold cursor-pointer transition-colors"
                title="Admin Station Telemetry, Sign-Up Counters &amp; Observer Roster"
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Metrics</span>
              </button>
              <span>•</span>
              <span className="text-neutral-300">RaptorLens UK • CHALK</span>
            </div>
          </div>
        </footer>

        {/* Modals */}
        <FieldGuideModal
          isOpen={isGuideModalOpen}
          onClose={() => setIsGuideModalOpen(false)}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onOpenLogModal={() => {
            setLogModalPrefill({ coords: null, locationName: '', speciesId: 'red-kite' });
            setIsLogModalOpen(true);
          }}
          onToggleLiteMode={() => setIsLiteMode((prev) => !prev)}
          onOpenBetaFeedback={() => setIsBetaFeedbackOpen(true)}
          onOpenDonate={() => setIsDonateModalOpen(true)}
          onOpenLegal={() => setIsLegalModalOpen(true)}
          onOpenSponsors={() => {
            setIsGuideModalOpen(false);
            setIsSponsorsModalOpen(true);
          }}
          onOpenContact={() => {
            setIsGuideModalOpen(false);
            handleOpenContact('conservation');
          }}
        />

        <SightingModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          onSaveSighting={handleSaveSighting}
          hotspots={hotspots}
          speciesList={speciesList}
          initialCoordinates={logModalPrefill.coords}
          initialLocationName={logModalPrefill.locationName}
          initialSpeciesId={logModalPrefill.speciesId}
          initialSectorId={activeSectorId !== 'all' ? activeSectorId : 'ridgeway-wessex'}
          currentCallsign={currentCallsign}
          currentObserverProfile={currentObserverProfile}
        />

        <HotspotDetailModal
          hotspot={selectedHotspot}
          onClose={() => setSelectedHotspot(null)}
          onLogAtHotspot={handleLogFromHotspot}
          onFlyToMap={handleFlyToHotspot}
          onOpenLiveCam={() => setActiveTab('dispatches')}
          relatedSightings={
            selectedHotspot
              ? sightings.filter((s) => s.locationName.toLowerCase().includes(selectedHotspot.name.split(' ')[0].toLowerCase()))
              : []
          }
        />

        <SpeciesDetailModal
          species={selectedSpecies}
          onClose={() => setSelectedSpecies(null)}
          onLogSpecies={handleLogFromSpecies}
        />

        <ObserverRegistrationModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onRegister={(newProfile) => {
            handleRegisterObserver(newProfile);
          }}
          existingProfile={observers.find((o) => o.callsign === currentCallsign) || null}
          currentCallsign={currentCallsign}
        />

        {/* Observer Authentication & Callsign Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          observers={observers}
          currentCallsign={currentCallsign}
          onSelectObserver={(profile) => {
            handleLoginObserver(profile);
            setIsLoginModalOpen(false);
          }}
          onLoginCustomCallsign={(callsign, homeHotspot) => {
            handleLoginCustomCallsign(callsign, homeHotspot);
            setIsLoginModalOpen(false);
          }}
          onResetObserverPassword={(updatedProfile) => {
            handleResetObserverPassword(updatedProfile);
          }}
          onLogoutToGuest={() => {
            handleLogoutToGuest();
            setIsLoginModalOpen(false);
          }}
          onOpenRegistration={() => {
            setIsLoginModalOpen(false);
            setIsRegisterModalOpen(true);
          }}
        />

        {/* Sighting Verification & Audit Trail Modal */}
        <SightingAuditModal
          isOpen={isAuditModalOpen}
          onClose={() => {
            setIsAuditModalOpen(false);
            setAuditSighting(null);
          }}
          sighting={auditSighting}
          currentCallsign={currentCallsign}
          currentObserverProfile={currentObserverProfile}
          onCorroborate={(sId, notes) => {
            handleCorroborateSighting(sId, notes);
          }}
          onFlagSighting={(sId, reason) => {
            handleFlagSighting(sId, reason);
          }}
          onOpenLogin={() => {
            setIsAuditModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />

        {/* Beta Telemetry Feedback Modal */}
        <BetaFeedbackModal
          isOpen={isBetaFeedbackOpen}
          onClose={() => setIsBetaFeedbackOpen(false)}
          currentCallsign={currentCallsign}
          activeSectorName={activeSector.name}
          onSubmitFeedback={handleSubmitBetaFeedback}
        />

        {/* Side-by-Side Raptor Confusion Solver */}
        <ConfusionSolverModal
          isOpen={isConfusionModalOpen}
          onClose={() => setIsConfusionModalOpen(false)}
          speciesList={speciesList}
          onLogSpecies={(species) => {
            setIsConfusionModalOpen(false);
            handleLogFromSpecies(species);
          }}
        />

        {/* Personal Life List & Field Scout Badges */}
        <LifeListModal
          isOpen={isLifeListModalOpen}
          onClose={() => setIsLifeListModalOpen(false)}
          speciesList={speciesList}
          sightings={sightings}
          currentCallsign={currentCallsign}
          onLogSpecies={(species) => {
            setIsLifeListModalOpen(false);
            handleLogFromSpecies(species);
          }}
        />

        {/* Community Fund & Radar Support Modal */}
        <DonateModal
          isOpen={isDonateModalOpen}
          onClose={() => setIsDonateModalOpen(false)}
          currentCallsign={currentCallsign}
          onOpenSponsors={() => {
            setIsDonateModalOpen(false);
            setIsSponsorsModalOpen(true);
          }}
        />

        {/* Copyright, Privacy by Design & Wildlife Law Compliance Modal */}
        <LegalModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
        />

        {/* Dedicated Sponsors & Conservation Partners Directory */}
        <SponsorsModal
          isOpen={isSponsorsModalOpen}
          onClose={() => {
            setIsSponsorsModalOpen(false);
            if (typeof window !== 'undefined' && window.location.hash === '#sponsors') {
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
          }}
          onOpenDonate={() => {
            setIsSponsorsModalOpen(false);
            setIsDonateModalOpen(true);
          }}
        />

        {/* Contact & Station Liaison Modal */}
        <ContactModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          currentCallsign={currentCallsign}
          defaultTopic={contactDefaultTopic}
        />

        {/* Admin Station Telemetry & Metrics Console */}
        <AdminMetricsModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          observers={observers}
          onAddObserver={(newProfile) => handleRegisterObserver(newProfile)}
          sightings={sightings}
          betaFeedbacks={betaFeedbacks}
          currentCallsign={currentCallsign}
          activeSectorId={activeSectorId !== 'all' ? activeSectorId : 'ridgeway-wessex'}
          mapViewMode={mapViewMode}
        />
      </div>
    </div>
  );
}
