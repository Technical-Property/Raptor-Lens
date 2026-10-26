import React, { useState, useEffect, useRef } from 'react';
import { 
  Mountain, 
  Wind, 
  Eye, 
  Thermometer, 
  Car, 
  MapPin, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  Navigation, 
  Radio, 
  ChevronRight, 
  MessageSquare, 
  Compass,
  Settings,
  Video,
  ExternalLink,
  Tv,
  Play,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  X,
  Camera,
  FlipHorizontal,
  ZoomIn,
  ZoomOut,
  Wifi,
  Info,
  Target,
  Download,
  Coffee,
  Share2,
  Check,
  Binoculars,
  Volume2,
  Moon,
  Sun,
  TrendingUp,
  Key,
  Copy
} from 'lucide-react';
import { LivestreamCam, RssDispatch, SightingLog } from '../types/raptor';
import { LIVESTREAM_CHANNELS } from '../data/livestreams';
import { BARBURY_PTZ_PRESETS, BARBURY_SUMMIT_WEATHER, BarburySummitWeather } from '../data/camPresets';
import { RECOMMENDED_FIELD_KIT, buildAmazonUkAffiliateUrl } from '../data/affiliateKit';
import { fetchLiveBarburyWeather } from '../services/weatherService';
import { subscribeToStationStreamConfig, saveStationStreamConfigToFirestore } from '../services/sightingsFirestore';
import { tacticalAudio } from '../utils/audio';
import { SectorId } from '../types/sector';
import { 
  extractYouTubeVideoId, 
  extractYouTubeChannelInfo, 
  getYouTubeChannelUrl, 
  buildYouTubeEmbedSrc,
  checkYouTubeVideoEmbeddable,
  StreamPlayMode,
  DEFAULT_CAMERA_VIDEO_ID,
  CHALKTECH_CHANNEL_ID,
  CHALKTECH_VERIFIED_EMBED_ID,
  DEMO_NATURE_VIDEO_ID,
  POPULAR_CAMERA_PRESETS,
  PEREGRINE_UK_VIDEO_ID,
  EAGLE_LIVE_VIDEO_ID,
  isLocalIpAddress,
  formatLocalIpUrl,
  isRtmpStreamKeyOrUrl,
  getActiveStreamKey,
  setActiveStreamKey,
  ACTIVE_STATION_STREAM_KEY
} from '../utils/youtube';

interface SummitTrailConditionsViewProps {
  onSwitchToRadar: () => void;
  onOpenLogModal: (locationGuess?: string) => void;
  onOpenGuide: () => void;
  onOpenDonate?: () => void;
  activeSectorId?: SectorId;
  currentCallsign?: string;
  onAddDispatch?: (dispatch: RssDispatch) => void;
  sightings?: SightingLog[];
  onSaveSighting?: (sighting: SightingLog) => void;
}

export const SummitTrailConditionsView: React.FC<SummitTrailConditionsViewProps> = ({
  onSwitchToRadar,
  onOpenLogModal,
  onOpenGuide,
  onOpenDonate,
  activeSectorId = 'ridgeway-wessex',
  currentCallsign = 'RIDGE-WALKER',
  onAddDispatch,
  sightings = [],
  onSaveSighting,
}) => {
  const currentCam = LIVESTREAM_CHANNELS[0];
  const [playerRefreshKey, setPlayerRefreshKey] = useState<number>(0);
  const [stationPrimaryVideoId, setStationPrimaryVideoId] = useState<string>(DEFAULT_CAMERA_VIDEO_ID);
  const [isPrimaryEmbedBlocked, setIsPrimaryEmbedBlocked] = useState<boolean>(false);
  const [forceDirectLiveEmbed, setForceDirectLiveEmbed] = useState<boolean>(false);
  const [quickLinkDraft, setQuickLinkDraft] = useState<string>('');
  const [showQuickLinkBar, setShowQuickLinkBar] = useState<boolean>(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);
  const [customVideoId, setCustomVideoId] = useState<string>(() => {
    try {
      const migrated = localStorage.getItem('raptorlens_stream_migration_v6');
      if (migrated !== DEFAULT_CAMERA_VIDEO_ID) {
        localStorage.setItem('raptorlens_stream_migration_v6', DEFAULT_CAMERA_VIDEO_ID);
        localStorage.setItem('raptorlens_custom_cam', DEFAULT_CAMERA_VIDEO_ID);
        localStorage.setItem('raptorlens_channel_url', `https://youtube.com/live/${DEFAULT_CAMERA_VIDEO_ID}`);
        localStorage.setItem('raptorlens_stream_mode', 'video');
        return DEFAULT_CAMERA_VIDEO_ID;
      }
      const saved = localStorage.getItem('raptorlens_custom_cam') || '';
      if (!saved || saved === '9gkrkcqHQ78' || saved === 'GAxREl6-fJs' || saved === 'wUmvCR2YBMQ' || isRtmpStreamKeyOrUrl(saved)) {
        return DEFAULT_CAMERA_VIDEO_ID;
      }
      return saved;
    } catch {
      return DEFAULT_CAMERA_VIDEO_ID;
    }
  });
  const [customChannelInput, setCustomChannelInput] = useState<string>(() => {
    try {
      const savedUrl = localStorage.getItem('raptorlens_channel_url') || '';
      if (!savedUrl || savedUrl.includes('wUmvCR2YBMQ') || savedUrl.includes('D9NvW7EA1B0')) return `https://youtube.com/live/${DEFAULT_CAMERA_VIDEO_ID}`;
      return savedUrl;
    } catch {
      return `https://youtube.com/live/${DEFAULT_CAMERA_VIDEO_ID}`;
    }
  });
  const [streamMode, setStreamMode] = useState<StreamPlayMode>(() => {
    try {
      const saved = localStorage.getItem('raptorlens_stream_mode');
      if (saved === 'video' || saved === 'webcam' || saved === 'channel') return saved;
      return 'video';
    } catch {
      return 'video';
    }
  });
  const [showFeedInput, setShowFeedInput] = useState<boolean>(false);
  const [showTroubleshootModal, setShowTroubleshootModal] = useState<boolean>(false);
  const [weather, setWeather] = useState<BarburySummitWeather>(BARBURY_SUMMIT_WEATHER);
  const [isWeatherLive, setIsWeatherLive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'parking' | 'distances' | 'dispatches' | 'kit'>('parking');
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);
  const [activeTrailDistance, setActiveTrailDistance] = useState<'hackpen' | 'avebury' | 'liddington' | 'fyfield'>('hackpen');
  const [showQuickSpotModal, setShowQuickSpotModal] = useState<boolean>(false);
  const [quickSpotSpecies, setQuickSpotSpecies] = useState<string>('Red Kite');
  const [quickSpotCount, setQuickSpotCount] = useState<number>(1);
  const [quickSpotZone, setQuickSpotZone] = useState<string>('Hackpen Hill View');
  const [quickSpotNotes, setQuickSpotNotes] = useState<string>('');
  const [dvrFlagToast, setDvrFlagToast] = useState<string | null>(null);
  const [dvrMarkerTab, setDvrMarkerTab] = useState<'raptor' | 'sky' | 'walkers'>('raptor');
  const [dvrFilterTab, setDvrFilterTab] = useState<'all' | 'raptor' | 'sky' | 'walkers'>('all');
  const [customDvrNote, setCustomDvrNote] = useState<string>('');
  const [customDvrZone, setCustomDvrZone] = useState<string>('Barbury Fort View');
  const [activeRewindMarker, setActiveRewindMarker] = useState<{
    id: string;
    title: string;
    zone: string;
    rewindText: string;
    timeUk: string;
    category: 'raptor' | 'sky' | 'walkers';
    offsetSeconds: number;
  } | null>(null);

  // YouTube IFrame Player API refs for real-time DVR stream rewinding
  const youtubeIframeRef = useRef<HTMLIFrameElement | null>(null);
  const liveEdgeSecondsRef = useRef<number>(0);
  const currentPlayheadRef = useRef<number>(0);
  const pendingSeekOffsetRef = useRef<number | null>(null);
  const sessionStartRef = useRef<number>(Date.now());

  const [isBreezeActive, setIsBreezeActive] = useState<boolean>(tacticalAudio.isAmbientPlaying);
  const [activeAudioCall, setActiveAudioCall] = useState<string | null>(null);

  // Device Camera (Webcam / Smartphone Camera) State
  const [isDeviceCamActive, setIsDeviceCamActive] = useState<boolean>(false);
  const [deviceCamFacing, setDeviceCamFacing] = useState<'environment' | 'user'>('environment');
  const [deviceCamZoom, setDeviceCamZoom] = useState<number>(1);
  const [deviceCamError, setDeviceCamError] = useState<string | null>(null);
  const [deviceCamLoading, setDeviceCamLoading] = useState<boolean>(false);
  const [isReticleActive, setIsReticleActive] = useState<boolean>(true);
  const [snapshotSuccess, setSnapshotSuccess] = useState<string | null>(null);
  const deviceVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startDeviceCamera = async (facing: 'environment' | 'user' = deviceCamFacing) => {
    setDeviceCamLoading(true);
    setDeviceCamError(null);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      mediaStreamRef.current = stream;
      if (deviceVideoRef.current) {
        deviceVideoRef.current.srcObject = stream;
        deviceVideoRef.current.play().catch(() => {});
      }
      setIsDeviceCamActive(true);
      setStreamMode('webcam');
      tacticalAudio.playConfirmChime();
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      let msg = 'Could not access device camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in your browser address bar.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No video camera was found on this device.';
      } else if (err.name === 'NotReadableError') {
        msg = 'Your camera is already in use by another application.';
      }
      setDeviceCamError(msg);
    } finally {
      setDeviceCamLoading(false);
    }
  };

  const stopDeviceCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (deviceVideoRef.current) {
      deviceVideoRef.current.srcObject = null;
    }
    setIsDeviceCamActive(false);
    setStreamMode('video');
    setDeviceCamError(null);
    tacticalAudio.playRadarPing(700);
  };

  const toggleFacingMode = () => {
    const nextFacing = deviceCamFacing === 'environment' ? 'user' : 'environment';
    setDeviceCamFacing(nextFacing);
    tacticalAudio.playRadarPing(850);
    startDeviceCamera(nextFacing);
  };

  const takeSnapshot = () => {
    if (!deviceVideoRef.current) return;
    try {
      tacticalAudio.playRadarPing(950);
      const video = deviceVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const link = document.createElement('a');
        link.download = `raptorlens-spotter-${Date.now()}.jpg`;
        link.href = dataUrl;
        link.click();
        setSnapshotSuccess('Photo captured and saved to your downloads!');
        setTimeout(() => setSnapshotSuccess(null), 4000);
      }
    } catch (e) {
      console.warn('Snapshot error:', e);
    }
  };

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Sync stream to device video ref if active
  useEffect(() => {
    if (isDeviceCamActive && mediaStreamRef.current && deviceVideoRef.current) {
      deviceVideoRef.current.srcObject = mediaStreamRef.current;
      deviceVideoRef.current.play().catch(() => {});
    }
  }, [isDeviceCamActive]);

  useEffect(() => {
    try {
      if (customVideoId) {
        localStorage.setItem('raptorlens_custom_cam', customVideoId);
      } else {
        localStorage.removeItem('raptorlens_custom_cam');
      }
    } catch {}
  }, [customVideoId]);

  useEffect(() => {
    try {
      if (customChannelInput) {
        localStorage.setItem('raptorlens_channel_url', customChannelInput);
      } else {
        localStorage.removeItem('raptorlens_channel_url');
      }
    } catch {}
  }, [customChannelInput]);

  useEffect(() => {
    try {
      localStorage.setItem('raptorlens_stream_mode', streamMode);
    } catch {}
  }, [streamMode]);

  // Subscribe to real-time station stream config in Firestore so when operator updates the YouTube Live link, all visitors get it immediately
  useEffect(() => {
    const unsub = subscribeToStationStreamConfig((config) => {
      if (config.videoId && !isRtmpStreamKeyOrUrl(config.videoId)) {
        setStationPrimaryVideoId(config.videoId);
        setCustomVideoId((prev) => {
          // If viewing primary station cam (or default), auto-update to the latest synced live stream ID
          const isGuestCam = POPULAR_CAMERA_PRESETS.slice(1).some((p) => p.videoId === prev);
          if (!isGuestCam) {
            return config.videoId;
          }
          return prev;
        });
        if (config.channelUrl) {
          setCustomChannelInput(config.channelUrl);
        }
      }
    });
    return () => unsub();
  }, []);

  const handleSyncStationStream = async (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    // If an RTMP stream key is entered (e.g. xxxx-xxxx-xxxx-xxxx-xxxx):
    if (isRtmpStreamKeyOrUrl(trimmed)) {
      tacticalAudio.playConfirmChime();
      setActiveStreamKey(trimmed);
      const nextChannelUrl = `https://www.youtube.com/channel/${CHALKTECH_CHANNEL_ID}/live`;
      setStationPrimaryVideoId(CHALKTECH_CHANNEL_ID);
      setCustomVideoId(CHALKTECH_CHANNEL_ID);
      setCustomChannelInput(nextChannelUrl);
      setStreamMode('channel');
      setPlayerRefreshKey((prev) => prev + 1);
      setQuickLinkDraft('');
      setShowQuickLinkBar(false);

      await saveStationStreamConfigToFirestore({
        videoId: CHALKTECH_CHANNEL_ID,
        channelId: CHALKTECH_CHANNEL_ID,
        channelUrl: nextChannelUrl,
        mode: 'channel',
        callsign: currentCallsign,
      });

      setSyncSuccessToast(`✓ Stream Key (${trimmed}) received & linked! Live feed playing now via your official @chalktech channel.`);
      setTimeout(() => setSyncSuccessToast(null), 6000);
      return;
    }

    const extractedId = extractYouTubeVideoId(trimmed);
    if (!extractedId) return;

    tacticalAudio.playConfirmChime();
    const nextChannelUrl = /^UC[a-zA-Z0-9_-]{22}$/.test(extractedId)
      ? `https://www.youtube.com/channel/${extractedId}/live`
      : `https://youtube.com/live/${extractedId}`;

    setStationPrimaryVideoId(extractedId);
    setCustomVideoId(extractedId);
    setCustomChannelInput(nextChannelUrl);
    setStreamMode('video');
    setPlayerRefreshKey((prev) => prev + 1);
    setQuickLinkDraft('');
    setShowQuickLinkBar(false);

    await saveStationStreamConfigToFirestore({
      videoId: extractedId,
      channelUrl: nextChannelUrl,
      callsign: currentCallsign,
    });

    setSyncSuccessToast(`✓ Live Stream synced to app (${extractedId})! Playing live now.`);
    setTimeout(() => setSyncSuccessToast(null), 5000);
  };

  // Live Open-Meteo Barbury / Hackpen Weather & Sunset Sync
  useEffect(() => {
    let isMounted = true;
    const syncWeather = async () => {
      try {
        const liveData = await fetchLiveBarburyWeather();
        if (isMounted && liveData) {
          setWeather(liveData);
          setIsWeatherLive(true);
        }
      } catch {}
    };
    syncWeather();
    const interval = setInterval(syncWeather, 5 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const activeVideoId = customVideoId.trim() || stationPrimaryVideoId || currentCam.youtubeId || DEFAULT_CAMERA_VIDEO_ID;
  const isViewingPrimaryStation = activeVideoId === DEFAULT_CAMERA_VIDEO_ID || activeVideoId === stationPrimaryVideoId || activeVideoId === CHALKTECH_VERIFIED_EMBED_ID;

  // Automatically check if YouTube has "Allow embedding" enabled on the target stream;
  // If "Allow embedding" is unchecked (HTTP 401 on oEmbed), automatically play the verified @chalktech Barbury stream (D9NvW7EA1B0)
  // while polling every 15s so it switches to 36w5VpxTmtk the instant "Allow embedding" is ticked in YouTube Studio!
  useEffect(() => {
    let isMounted = true;
    const verifyEmbedStatus = async () => {
      if (!activeVideoId || isLocalIpAddress(activeVideoId) || isRtmpStreamKeyOrUrl(activeVideoId)) {
        return;
      }
      const embedOk = await checkYouTubeVideoEmbeddable(activeVideoId);
      if (isMounted) {
        setIsPrimaryEmbedBlocked(!embedOk);
      }
    };
    verifyEmbedStatus();
    const timer = setInterval(verifyEmbedStatus, 15000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [activeVideoId, playerRefreshKey]);

  const effectiveEmbedVideoId =
    isRtmpStreamKeyOrUrl(activeVideoId)
      ? CHALKTECH_CHANNEL_ID
      : isPrimaryEmbedBlocked && !forceDirectLiveEmbed && activeVideoId === DEFAULT_CAMERA_VIDEO_ID
      ? CHALKTECH_VERIFIED_EMBED_ID
      : activeVideoId;

  const channelInfo = extractYouTubeChannelInfo(customChannelInput || currentCam.channelUrl || '');
  const resolvedChannelUrl = getYouTubeChannelUrl(customChannelInput || currentCam.channelUrl, activeVideoId);
  const activeEmbedSrc = buildYouTubeEmbedSrc({
    videoId: effectiveEmbedVideoId,
    channelId: channelInfo.channelId,
    mode: streamMode,
  });

  const trailDestinations = [
    {
      id: 'hackpen',
      name: 'Hackpen Hill & White Horse',
      distance: '3.2 miles (5.1 km)',
      time: '~1 hr 15 mins',
      difficulty: 'Moderate',
      surface: 'Grass track & chalk gallops',
      highlights: 'Chalk White Horse, 271m summit, panoramic Thames Valley vista, perched kestrels.',
      hazards: 'Exposed to westerly headwinds; racehorses training on gallops before 11:00 AM.',
    },
    {
      id: 'avebury',
      name: 'Avebury Megalithic Stone Circle',
      distance: '5.8 miles (9.3 km)',
      time: '~2 hrs 10 mins',
      difficulty: 'Moderate-Long',
      surface: 'Ridgeway byway & downland field paths',
      highlights: 'World Heritage prehistoric stone henge, Red Kites foraging low over Kennet avenues.',
      hazards: 'Occasional farm vehicles on Byway (BOAT); muddy near West Kennet in winter.',
    },
    {
      id: 'liddington',
      name: 'Liddington Castle Iron Age Fort',
      distance: '6.1 miles (9.8 km)',
      time: '~2 hrs 20 mins',
      difficulty: 'Moderate',
      surface: 'Ridgeway ancient crestway, chalk turf',
      highlights: 'Second highest Iron Age earthwork in Wiltshire (277m ASL), Jefferies memorial stone.',
      hazards: 'Remote downland with zero shelter between Barbury and Liddington.',
    },
    {
      id: 'fyfield',
      name: 'Fyfield Down National Nature Reserve',
      distance: '4.5 miles (7.2 km)',
      time: '~1 hr 45 mins',
      difficulty: 'Easy-Moderate',
      surface: 'Ancient sarsen valley, dry calcareous turf',
      highlights: 'Largest natural deposit of prehistoric sarsen boulders in England; Little Owls on stones.',
      hazards: 'Grazing cattle; uneven rocky turf amongst Mother Sarsen stones.',
    },
  ];

  const selectedTrail = trailDestinations.find((t) => t.id === activeTrailDistance) || trailDestinations[0];

  const handleQuickSpotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    tacticalAudio.playConfirmChime();

    const now = new Date();
    const speciesIdMap: Record<string, string> = {
      'Red Kite': 'red-kite',
      'Common Buzzard': 'common-buzzard',
      'Common Kestrel': 'kestrel',
      'Peregrine Falcon': 'peregrine-falcon',
      'Hen Harrier': 'hen-harrier',
      'Barn Owl': 'barn-owl',
      'Raven': 'common-buzzard',
    };

    const resolvedLocation = `Barbury Cam (${quickSpotZone})`;
    const resolvedSummary =
      quickSpotNotes.trim() ||
      `Spotted ${quickSpotCount}x ${quickSpotSpecies} on ${quickSpotZone} along the Barbury Ridgeway scarp.`;

    if (onSaveSighting) {
      const newSighting: SightingLog = {
        id: `log-cam-${Date.now()}`,
        timestamp: now.toISOString(),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        speciesId: speciesIdMap[quickSpotSpecies] || 'red-kite',
        speciesName: quickSpotSpecies,
        locationName: resolvedLocation,
        sectorId: (activeSectorId || 'ridgeway-wessex') as SectorId,
        coordinates: [51.4835, -1.7895],
        count: quickSpotCount,
        behavior:
          quickSpotZone === 'Perch View'
            ? 'Perched on Post/Sarsen'
            : quickSpotSpecies === 'Common Kestrel'
            ? 'Hover Hunting'
            : 'Escarpment Lift',
        altitudeM: quickSpotZone === 'Perch View' ? 5 : 45,
        opticalGear: 'Station Cam / Trail Spotter',
        observerCallsign: currentCallsign,
        observerRank: 'Verified Spotter',
        notes: resolvedSummary,
        confidence: 'High (80%)',
        windDirection: weather.windDirection,
        windSpeedMph: Math.round(weather.windSpeedKt * 1.15),
        thermalStrength: weather.soaringLiftRating === 'EXCELLENT' ? 'Strong' : 'Moderate',
        verificationStatus: 'Corroborated by Peers',
        corroborations: [],
        auditTrail: [
          {
            timestamp: now.toISOString(),
            action: 'INITIAL_LOG',
            actorCallsign: currentCallsign,
            details: `Logged via Station Camera & Trail Watch (${quickSpotZone})`,
          },
        ],
      };
      onSaveSighting(newSighting);
    }

    if (onAddDispatch) {
      const autoDispatch: RssDispatch = {
        id: `disp-trail-${Date.now()}`,
        title: `CAM/TRAIL SPOT: ${quickSpotCount}x ${quickSpotSpecies.toUpperCase()} (${quickSpotZone.toUpperCase()})`,
        timestamp: now.toISOString(),
        timeAgo: 'Just now',
        source: 'Barbury Ridge Trail Watch',
        category: 'SIGHTING ALERT',
        priority: 'HIGH',
        summary: resolvedSummary,
        hotspotRef: 'barbury-castle',
        author: `Spotter: ${currentCallsign}`,
        verified: true,
        speciesMentioned: [quickSpotSpecies],
      };
      onAddDispatch(autoDispatch);
    }

    setActiveTab('dispatches');
    setShowQuickSpotModal(false);
    setQuickSpotNotes('');
  };

  // Send a YouTube IFrame Player API command via postMessage
  const sendYouTubeCommand = (func: string, args: any[] = []) => {
    const win = youtubeIframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage(
        JSON.stringify({
          event: 'command',
          func,
          args,
        }),
        '*'
      );
    } catch {}
  };

  // Register listening handshake with YouTube embed so it streams currentTime/duration telemetry
  const initYouTubeDvrBridge = () => {
    const win = youtubeIframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage(
        JSON.stringify({
          event: 'listening',
          id: 'raptorlens-dvr',
          channel: 'widget',
        }),
        '*'
      );
    } catch {}
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('youtube.com') && !event.origin.includes('youtube-nocookie.com')) {
        return;
      }
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.event === 'infoDelivery' && data.info) {
          const ct = typeof data.info.currentTime === 'number' ? data.info.currentTime : 0;
          const dur = typeof data.info.duration === 'number' ? data.info.duration : 0;

          if (ct > 0) {
            currentPlayheadRef.current = ct;
          }
          const latestEdge = Math.max(liveEdgeSecondsRef.current, dur, ct);
          if (latestEdge > 0) {
            liveEdgeSecondsRef.current = latestEdge;
          }

          // If a user clicked a rewind marker before the first telemetry packet arrived, execute seek immediately
          if (pendingSeekOffsetRef.current !== null && liveEdgeSecondsRef.current > 0) {
            const offset = pendingSeekOffsetRef.current;
            pendingSeekOffsetRef.current = null;
            const target = Math.max(0, liveEdgeSecondsRef.current - offset);
            sendYouTubeCommand('seekTo', [target, true]);
            sendYouTubeCommand('playVideo', []);
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    const heartbeat = setInterval(() => {
      if (liveEdgeSecondsRef.current === 0) {
        initYouTubeDvrBridge();
      } else {
        // Advance live edge by 2s every 2s so relative rewind stays accurate even while rewound
        liveEdgeSecondsRef.current += 2;
      }
    }, 2000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(heartbeat);
    };
  }, []);

  // Programmatically rewind the live YouTube stream to a specific DVR marker
  const handleSeekToDvrMarker = (marker: {
    id: string;
    speciesName: string;
    locationName: string;
    rewindText: string;
    time: string;
    diffSeconds: number;
    markerCategory?: 'raptor' | 'sky' | 'walkers';
  }) => {
    tacticalAudio.playConfirmChime();

    // Ensure we are on the video stream mode
    if (streamMode === 'webcam') {
      stopDeviceCamera();
    }

    // Add a 10-second lead-in buffer so the viewer sees the bird, sky, or walkers arrive
    const leadInSeconds = marker.diffSeconds > 15 ? marker.diffSeconds + 10 : Math.max(5, marker.diffSeconds);

    initYouTubeDvrBridge();

    if (liveEdgeSecondsRef.current > 0) {
      const targetTime = Math.max(0, liveEdgeSecondsRef.current - leadInSeconds);
      sendYouTubeCommand('seekTo', [targetTime, true]);
      sendYouTubeCommand('playVideo', []);
      currentPlayheadRef.current = targetTime;
    } else {
      // Queue seek for instant execution when player responds, and send a 12h DVR baseline seek
      pendingSeekOffsetRef.current = leadInSeconds;
      const fallbackDvrEdge = 43200; // Standard 12-hour YouTube Live DVR window in seconds
      sendYouTubeCommand('seekTo', [Math.max(0, fallbackDvrEdge - leadInSeconds), true]);
      sendYouTubeCommand('playVideo', []);
    }

    const cleanZone = marker.locationName.replace('Station Cam ', '').replace('Barbury Cam ', '').replace(/[()]/g, '');

    setActiveRewindMarker({
      id: marker.id,
      title: marker.speciesName,
      zone: cleanZone,
      rewindText: marker.rewindText,
      timeUk: marker.time || 'Today',
      category: marker.markerCategory || 'raptor',
      offsetSeconds: leadInSeconds,
    });

    setDvrFlagToast(
      `⏪ Rewinding live stream ${marker.rewindText} to "${marker.speciesName}" (${cleanZone})...`
    );
    setTimeout(() => setDvrFlagToast(null), 5000);
  };

  // Nudge the rewound stream backward or forward by deltaSeconds (e.g., -30s or +30s)
  const handleNudgeRewind = (deltaSeconds: number) => {
    tacticalAudio.playRadarPing(840);
    if (!activeRewindMarker) return;

    const nextOffset = Math.max(0, activeRewindMarker.offsetSeconds - deltaSeconds);
    if (nextOffset <= 5) {
      handleReturnToLiveEdge();
      return;
    }

    const edge = liveEdgeSecondsRef.current > 0 ? liveEdgeSecondsRef.current : 43200;
    const targetTime = Math.max(0, edge - nextOffset);
    sendYouTubeCommand('seekTo', [targetTime, true]);
    sendYouTubeCommand('playVideo', []);

    const mins = Math.round(nextOffset / 60);
    const nextText = mins < 1 ? `-${nextOffset}s` : mins < 60 ? `-${mins}m` : `-${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;

    setActiveRewindMarker({
      ...activeRewindMarker,
      offsetSeconds: nextOffset,
      rewindText: nextText,
    });
  };

  // Snap the YouTube player back to the real-time live broadcast edge
  const handleReturnToLiveEdge = () => {
    tacticalAudio.playRadarPing(920);
    const edge = liveEdgeSecondsRef.current > 0 ? liveEdgeSecondsRef.current + 30 : 999999;
    sendYouTubeCommand('seekTo', [edge, true]);
    sendYouTubeCommand('playVideo', []);
    setActiveRewindMarker(null);
    setDvrFlagToast('🔴 Returned to real-time live camera broadcast.');
    setTimeout(() => setDvrFlagToast(null), 3500);
  };

  // Instant 1-Click Live DVR Marker Handler (Supports Raptors, Sky Conditions, and Summit Walkers)
  const handleInstantDvrFlag = (
    zoneName: string,
    labelName: string,
    category: 'raptor' | 'sky' | 'walkers' = 'raptor'
  ) => {
    tacticalAudio.playConfirmChime();
    const now = new Date();
    const ukTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
    const speciesIdMap: Record<string, string> = {
      'Red Kite': 'red-kite',
      'Common Buzzard': 'common-buzzard',
      'Common Kestrel': 'kestrel',
      'Peregrine Falcon': 'peregrine-falcon',
    };

    const privacyNote =
      category === 'walkers'
        ? ' • Distant 3.0 km ridge silhouette only (no facial or personal ID possible).'
        : category === 'sky'
        ? ' • Atmospheric downland sky & visibility marker.'
        : '';

    if (onSaveSighting) {
      const dvrSighting: SightingLog = {
        id: `dvr-cam-${Date.now()}`,
        timestamp: now.toISOString(),
        date: now.toISOString().split('T')[0],
        time: ukTime,
        speciesId: speciesIdMap[labelName] || 'red-kite',
        speciesName: labelName,
        locationName: `Station Cam (${zoneName})`,
        sectorId: (activeSectorId || 'ridgeway-wessex') as SectorId,
        coordinates: [51.4835, -1.7895],
        count: 1,
        behavior: zoneName.includes('Perch') ? 'Perched on Post/Sarsen' : 'Escarpment Lift',
        altitudeM: zoneName.includes('Perch') ? 5 : 40,
        opticalGear: 'Station Cam Live DVR',
        observerCallsign: currentCallsign,
        observerRank: 'Verified Spotter',
        notes: `Live DVR Timestamp Flagged: ${labelName} on ${zoneName} at ${ukTime} UK.${privacyNote}`,
        confidence: 'High (80%)',
        windDirection: weather.windDirection,
        windSpeedMph: Math.round(weather.windSpeedKt * 1.15),
        thermalStrength: weather.soaringLiftRating === 'EXCELLENT' ? 'Strong' : 'Moderate',
        verificationStatus: 'Corroborated by Peers',
        corroborations: [],
        markerCategory: category,
        auditTrail: [
          {
            timestamp: now.toISOString(),
            action: 'INITIAL_LOG',
            actorCallsign: currentCallsign,
            details: `1-Click Live DVR Marker (${category.toUpperCase()}: ${labelName} • ${zoneName})`,
          },
        ],
      };
      onSaveSighting(dvrSighting);
    }

    if (onAddDispatch) {
      const catBadge =
        category === 'sky' ? 'SKY & VISIBILITY' : category === 'walkers' ? 'SUMMIT TRAIL ACTIVITY' : 'CAM SIGHTING';
      const autoDispatch: RssDispatch = {
        id: `disp-dvr-${Date.now()}`,
        title: `DVR MARKER (${catBadge}): ${labelName.toUpperCase()} AT ${zoneName.toUpperCase()}`,
        timestamp: now.toISOString(),
        timeAgo: 'Just now',
        source: 'Station Cam Live DVR',
        category: category === 'raptor' ? 'SIGHTING ALERT' : 'FIELD BULLETIN',
        priority: 'NORMAL',
        summary: `${labelName} marked on ${zoneName} at ${ukTime} UK by ${currentCallsign}.${privacyNote}`,
        hotspotRef: 'barbury-castle',
        author: `Spotter: ${currentCallsign}`,
        verified: true,
      };
      onAddDispatch(autoDispatch);
    }

    setDvrFlagToast(`✓ DVR Rewind Marker saved: "${labelName}" (${zoneName} at ${ukTime} UK)! Click any marker below to rewind.`);
    setTimeout(() => setDvrFlagToast(null), 5000);
  };

  const handleCustomDvrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customDvrNote.trim();
    if (!trimmed) return;
    handleInstantDvrFlag(customDvrZone, trimmed, dvrMarkerTab);
    setCustomDvrNote('');
  };

  // Track cleared timestamp and individually dismissed marker IDs so the DVR timeline starts clean and can be cleared anytime
  const [dvrClearedAt, setDvrClearedAt] = useState<number>(() => {
    try {
      const cleanV1 = localStorage.getItem('raptorlens_dvr_clean_v1');
      if (!cleanV1) {
        const nowTs = Date.now();
        localStorage.setItem('raptorlens_dvr_clean_v1', 'true');
        localStorage.setItem('raptorlens_dvr_cleared_at', String(nowTs));
        return nowTs;
      }
      const saved = localStorage.getItem('raptorlens_dvr_cleared_at');
      return saved ? Number(saved) : 0;
    } catch {
      return Date.now();
    }
  });

  const [dismissedMarkerIds, setDismissedMarkerIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('raptorlens_dvr_dismissed_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleClearAllDvrMarkers = () => {
    tacticalAudio.playRadarPing(740);
    const nowTs = Date.now();
    setDvrClearedAt(nowTs);
    setActiveRewindMarker(null);
    try {
      localStorage.setItem('raptorlens_dvr_cleared_at', String(nowTs));
    } catch {}
    setDvrFlagToast('✓ All DVR rewind markers cleared.');
    setTimeout(() => setDvrFlagToast(null), 3500);
  };

  const handleDismissSingleMarker = (e: React.MouseEvent, markerId: string) => {
    e.stopPropagation();
    tacticalAudio.playRadarPing(760);
    setDismissedMarkerIds((prev) => {
      const next = [...prev, markerId];
      try {
        localStorage.setItem('raptorlens_dvr_dismissed_ids', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (activeRewindMarker?.id === markerId) {
      setActiveRewindMarker(null);
    }
  };

  // Filter live DVR markers logged after the last clear action within the 12-hour (720 min) YouTube DVR window
  const allActiveDvrMarkers = sightings
    .filter(
      (s) =>
        (s.id.startsWith('dvr-cam-') || s.opticalGear === 'Station Cam Live DVR') &&
        !dismissedMarkerIds.includes(s.id)
    )
    .map((s) => {
      const ts = new Date(s.timestamp).getTime();
      const diffSeconds = Math.max(0, Math.round((Date.now() - ts) / 1000));
      const diffMins = Math.floor(diffSeconds / 60);
      let rewindText = 'LIVE NOW';
      if (diffSeconds >= 15 && diffMins < 1) {
        rewindText = `-${diffSeconds}s`;
      } else if (diffMins >= 1 && diffMins < 60) {
        rewindText = `-${diffMins}m`;
      } else if (diffMins >= 60) {
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        rewindText = `-${hrs}h ${String(mins).padStart(2, '0')}m`;
      }

      let inferredCategory: 'raptor' | 'sky' | 'walkers' = s.markerCategory || 'raptor';
      const lowerName = s.speciesName.toLowerCase();
      if (!s.markerCategory) {
        if (lowerName.includes('walker') || lowerName.includes('hiker') || lowerName.includes('rider')) {
          inferredCategory = 'walkers';
        } else if (
          lowerName.includes('sky') ||
          lowerName.includes('cloud') ||
          lowerName.includes('sunset') ||
          lowerName.includes('sunbeam') ||
          lowerName.includes('visibility')
        ) {
          inferredCategory = 'sky';
        }
      }

      return {
        ...s,
        ts,
        markerCategory: inferredCategory,
        diffSeconds,
        diffMins,
        rewindText,
      };
    })
    .filter((s) => !Number.isNaN(s.diffMins) && s.diffMins <= 720 && s.ts > dvrClearedAt);

  const recentDvrMarkers = allActiveDvrMarkers
    .filter((s) => (dvrFilterTab === 'all' ? true : s.markerCategory === dvrFilterTab))
    .slice(0, 6);

  return (
    <div className="space-y-4 max-w-6xl mx-auto animate-fadeIn">
      {/* 1. Live Summit Camera & Optical Spotter Stage */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Stream Header & Clean Actions */}
        <div className="bg-neutral-900/95 border-b border-neutral-800 px-3.5 sm:px-5 py-3 flex items-center justify-between text-xs sm:text-sm flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="font-bold text-neutral-100">
              {isLocalIpAddress(activeVideoId)
                ? 'Station Hardware (Local LAN)'
                : activeVideoId === DEFAULT_CAMERA_VIDEO_ID
                ? 'Live Ridgeway Station Webcam'
                : POPULAR_CAMERA_PRESETS.find((p) => p.videoId === activeVideoId)?.name || 'Live Raptor Camera'}
            </span>
            <span className="text-xs text-amber-300/90 hidden sm:inline">
              {activeVideoId === DEFAULT_CAMERA_VIDEO_ID
                ? '· Hackpen Hill · Barbury Fort · Field · Perch'
                : `· ${POPULAR_CAMERA_PRESETS.find((p) => p.videoId === activeVideoId)?.location || '24/7 Live Feed'}`}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                setCustomVideoId(stationPrimaryVideoId);
                setStreamMode('video');
                setPlayerRefreshKey((prev) => prev + 1);
              }}
              className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Reload live stream player"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Reload</span>
            </button>

            <button
              type="button"
              onClick={() => {
                tacticalAudio.playRadarPing(840);
                setShowQuickLinkBar((prev) => !prev);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border ${
                showQuickLinkBar
                  ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold'
                  : 'bg-neutral-800 hover:bg-neutral-750 text-amber-300 border-amber-500/40'
              }`}
              title="Paste your new YouTube Live link to update the app immediately"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Link New Stream</span>
            </button>

            <button
              onClick={() => {
                tacticalAudio.playRadarPing(800);
                setShowTroubleshootModal(true);
              }}
              className="bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Switch cameras or troubleshoot feed"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Stream Help</span>
            </button>

            <button
              onClick={() => {
                tacticalAudio.playRadarPing(760);
                setShowFeedInput(!showFeedInput);
              }}
              className="bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Configure station stream or explore guest raptor cameras"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-400" />
              <span>{showFeedInput ? 'Close Settings' : 'More Cams'}</span>
            </button>

            <button
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                setShowQuickSpotModal(true);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-neutral-950 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Log Sighting</span>
            </button>
          </div>
        </div>

        {/* Instant 1-Click "Link New YouTube Stream" Sync Bar */}
        {showQuickLinkBar && (
          <div className="bg-neutral-900 border-b border-amber-500/40 px-3.5 sm:px-5 py-3 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-amber-400" />
                <span>Paste Your Live YouTube Watch Link or Channel ID:</span>
              </span>
              <span className="text-[11px] text-neutral-400">
                Playing: <code className="text-emerald-400 font-mono">{isRtmpStreamKeyOrUrl(activeVideoId) ? CHALKTECH_CHANNEL_ID : activeVideoId}</code>
              </span>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSyncStationStream(quickLinkDraft || customVideoId);
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <input
                type="text"
                value={quickLinkDraft}
                onChange={(e) => setQuickLinkDraft(e.target.value)}
                placeholder="Paste YouTube Stream Link (https://youtube.com/live/...) or Channel ID (UC...)"
                className="flex-1 bg-neutral-950 border border-neutral-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 font-mono focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs cursor-pointer transition-colors whitespace-nowrap shadow"
                >
                  ✓ Sync Live to App
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickLinkBar(false)}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </form>

            <div className="text-[11px] text-neutral-400 flex items-center justify-between gap-2 flex-wrap pt-1 font-sans">
              <span>
                🔒 <strong className="text-neutral-300">Station Operator:</strong> Private RTMP keys are protected and managed inside the password-protected <strong>Admin Console</strong>.
              </span>
              <span className="text-neutral-500">
                Embedding must be set to Public with &ldquo;Allow embedding&rdquo; enabled in YouTube Studio.
              </span>
            </div>
          </div>
        )}

        {syncSuccessToast && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/50 px-4 py-2 text-xs font-mono-tactical text-emerald-300 flex items-center justify-between">
            <span>{syncSuccessToast}</span>
            <button onClick={() => setSyncSuccessToast(null)} className="text-emerald-400 hover:text-white font-bold cursor-pointer">✕</button>
          </div>
        )}

        {/* Automatic YouTube "Allow Embedding" Diagnostic & Seamless Fallback Banner */}
        {isPrimaryEmbedBlocked && activeVideoId === DEFAULT_CAMERA_VIDEO_ID && (
          <div className="bg-amber-950/80 border-b border-amber-500/50 px-3.5 sm:px-5 py-3 text-xs space-y-2 animate-fadeIn">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-amber-200">
                    Playing Your @chalktech Barbury &amp; Hackpen Feed (<code className="text-emerald-300">{CHALKTECH_VERIFIED_EMBED_ID}</code>) Inside the App
                  </div>
                  <p className="text-[11px] text-neutral-200 leading-relaxed">
                    Your new live stream (<code className="text-amber-300 font-mono">{activeVideoId}</code>) is live on YouTube, but <strong>&ldquo;Allow embedding&rdquo; is currently unticked</strong> in YouTube Studio for <code className="text-amber-300 font-mono">{activeVideoId}</code>. Tick <strong>Allow embedding</strong> in YouTube Studio (under <em>Edit &rarr; Customization / Show More</em>) and this player will automatically switch to <code className="text-amber-300 font-mono">{activeVideoId}</code>!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <a
                  href={`https://studio.youtube.com/video/${activeVideoId}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow"
                >
                  <span>1. Enable Embedding in YouTube Studio ↗</span>
                </a>
                <a
                  href={`https://www.youtube.com/live/${activeVideoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow"
                >
                  <span>Watch {activeVideoId} on YouTube ↗</span>
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    tacticalAudio.playRadarPing(880);
                    const ok = await checkYouTubeVideoEmbeddable(activeVideoId);
                    setIsPrimaryEmbedBlocked(!ok);
                    if (ok) {
                      setForceDirectLiveEmbed(false);
                      setPlayerRefreshKey((prev) => prev + 1);
                      setSyncSuccessToast(`✓ Embedding detected! Now playing live stream ${activeVideoId}.`);
                    } else {
                      setSyncSuccessToast(`Still waiting for "Allow embedding" to be saved on ${activeVideoId} in YouTube Studio.`);
                    }
                    setTimeout(() => setSyncSuccessToast(null), 5000);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-emerald-300 font-semibold text-xs cursor-pointer transition-colors"
                >
                  ↻ Re-Check Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Station Cam + Free Live Raptor Cams Bar */}
        <div className="bg-neutral-900/90 border-b border-neutral-800 px-3.5 sm:px-5 py-2.5 flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 w-full">
            <span className="text-xs text-neutral-400 font-semibold mr-1 shrink-0">
              Select Camera:
            </span>
            {POPULAR_CAMERA_PRESETS.map((cam) => {
              const isSelected = activeVideoId === cam.videoId;
              const isPrimaryStation = cam.videoId === DEFAULT_CAMERA_VIDEO_ID;
              return (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => {
                    tacticalAudio.playRadarPing(880);
                    setCustomVideoId(cam.videoId);
                    setCustomChannelInput(cam.channelUrl);
                    setStreamMode('video');
                  }}
                  className={`min-h-[36px] sm:min-h-0 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? isPrimaryStation
                        ? 'bg-emerald-500 text-neutral-950 border-emerald-400 font-bold shadow-sm'
                        : 'bg-amber-500 text-neutral-950 border-amber-400 font-bold shadow-sm'
                      : isPrimaryStation
                      ? 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40 font-semibold'
                      : 'bg-neutral-950 hover:bg-neutral-850 text-neutral-300 border-neutral-800 hover:border-amber-500/40 hover:text-amber-200'
                  }`}
                  title={`${cam.name} — ${cam.location}`}
                >
                  <span>{cam.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* All Cameras & Station Configuration Drawer */}
        {showFeedInput && (
          <div className="p-3.5 bg-neutral-900 border-b border-neutral-800 space-y-3 font-mono-tactical text-xs animate-fadeIn">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-amber-400" />
                Station Camera &amp; Verified Live Raptor Streams:
              </span>
              <span className="text-neutral-400 font-mono text-[11px]">
                Active Feed: <strong className="text-amber-400">{activeVideoId}</strong>
              </span>
            </div>

            {/* Quick Presets Carousel */}
            <div className="space-y-1.5">
              <span className="text-neutral-400 text-[11px] block">Select Primary Station Cam or Guest Live Raptor Cams:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {POPULAR_CAMERA_PRESETS.map((preset) => {
                  const isCurrent = activeVideoId === preset.videoId;
                  const isPrimary = preset.videoId === DEFAULT_CAMERA_VIDEO_ID;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        tacticalAudio.playRadarPing(880);
                        setCustomVideoId(preset.videoId);
                        setCustomChannelInput(preset.channelUrl);
                        setStreamMode('video');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isCurrent
                          ? isPrimary
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100 font-bold ring-1 ring-emerald-500/50'
                            : 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold ring-1 ring-amber-500/50'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className={isPrimary ? 'text-emerald-400 font-bold uppercase' : 'text-amber-400 font-bold uppercase'}>
                          {preset.badge}
                        </span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          LIVE
                        </span>
                      </div>
                      <div className="font-bold text-xs truncate">{preset.name}</div>
                      <div className="text-[10px] text-neutral-400 truncate">{preset.location}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field 1: Custom Video / Livestream Input */}
            <div className="space-y-2 pt-1 border-t border-neutral-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-[11px] text-neutral-300 font-medium">
                  Custom YouTube Stream Link or Video ID:
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Paste YouTube livestream URL (watch / live) or 11-char ID..."
                  value={customVideoId}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const val = isLocalIpAddress(raw) || isRtmpStreamKeyOrUrl(raw) ? raw.trim() : extractYouTubeVideoId(raw);
                    setCustomVideoId(val);
                  }}
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    tacticalAudio.playRadarPing(880);
                    setCustomVideoId(DEFAULT_CAMERA_VIDEO_ID);
                    setStreamMode('video');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-amber-300 text-xs font-mono cursor-pointer transition-colors whitespace-nowrap"
                >
                  Reset Default
                </button>
                {customVideoId && (
                  <button
                    type="button"
                    onClick={() => setCustomVideoId('')}
                    className="px-2 py-1.5 text-neutral-400 hover:text-rose-400 text-xs font-bold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Field 2: YouTube Channel Link */}
            <div className="space-y-1">
              <label className="text-[11px] text-neutral-300 font-medium flex items-center justify-between">
                <span>YouTube Channel URL or Handle (@name):</span>
                <span className="text-[10px] text-neutral-400 font-sans">Connects the "Visit Channel" button directly</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Paste YouTube Channel URL (e.g. https://youtube.com/@channelName) or watch link..."
                  value={customChannelInput}
                  onChange={(e) => setCustomChannelInput(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-500 font-mono text-xs"
                />
                <a
                  href={resolvedChannelUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => tacticalAudio.playRadarPing(880)}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shadow-sm"
                >
                  <span>Open ↗</span>
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/80 flex-wrap gap-2">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Camera choice automatically persists across visits.</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  tacticalAudio.playRadarPing(700);
                  setShowFeedInput(false);
                }}
                className="text-amber-400 hover:text-amber-300 underline cursor-pointer font-bold"
              >
                Done / Save
              </button>
            </div>
          </div>
        )}

        {/* Video Player & Optical Stage Canvas */}
        <div className="relative aspect-video bg-black overflow-hidden group">
          {/* CASE A: Device Camera (Webcam / Phone Spotter) */}
          {streamMode === 'webcam' ? (
            <div className="relative w-full h-full bg-neutral-950 overflow-hidden flex items-center justify-center">
              {deviceCamLoading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-950/90 text-neutral-300 space-y-2">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="font-mono-tactical text-xs">Initializing device camera stream...</p>
                </div>
              )}

              {deviceCamError ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-neutral-950 text-neutral-200">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h4 className="font-display-tactical text-base font-bold text-rose-300">
                    Camera Access Needed
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-md leading-relaxed font-sans">
                    {deviceCamError}
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => startDeviceCamera()}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs cursor-pointer transition-colors"
                    >
                      Retry Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        stopDeviceCamera();
                        setStreamMode('video');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-750 text-neutral-300 text-xs cursor-pointer hover:bg-neutral-800"
                    >
                      Return to Live Stream
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black">
                  <video
                    ref={deviceVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transition-transform duration-200"
                    style={{ transform: `scale(${deviceCamZoom})` }}
                  />

                  {/* Optical Reticle Crosshair */}
                  {isReticleActive && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative w-32 h-32 border border-cyan-400/40 rounded-full flex items-center justify-center">
                        <div className="w-full h-[1px] bg-cyan-400/40"></div>
                        <div className="h-full w-[1px] bg-cyan-400/40 absolute"></div>
                        <div className="w-3 h-3 border border-cyan-300/80 rounded-full"></div>
                      </div>
                      <div className="absolute top-4 left-4 bg-neutral-950/80 px-2.5 py-1 rounded-lg border border-cyan-500/40 font-mono-tactical text-[10px] text-cyan-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                        <span>SPOTTER HUD • {deviceCamZoom.toFixed(1)}x MAGNIFICATION</span>
                      </div>
                    </div>
                  )}

                  {/* On-Screen Zoom & Optics Toolbar (Bottom floating) */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-neutral-950/85 backdrop-blur-md border border-neutral-700/80 px-3 py-1.5 rounded-2xl flex items-center gap-3 text-xs font-mono-tactical text-neutral-200 shadow-2xl">
                    <div className="flex items-center gap-1.5">
                      <ZoomOut className="w-3.5 h-3.5 text-neutral-400" />
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.1"
                        value={deviceCamZoom}
                        onChange={(e) => setDeviceCamZoom(parseFloat(e.target.value))}
                        className="w-20 sm:w-28 accent-cyan-400 cursor-pointer"
                        title="Digital Zoom Magnification"
                      />
                      <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-cyan-300 font-bold min-w-[32px] text-[11px]">
                        {deviceCamZoom.toFixed(1)}x
                      </span>
                    </div>

                    <span className="text-neutral-600">|</span>

                    <button
                      type="button"
                      onClick={() => setIsReticleActive(!isReticleActive)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        isReticleActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-neutral-400'
                      }`}
                    >
                      Reticle: {isReticleActive ? 'ON' : 'OFF'}
                    </button>

                    <button
                      type="button"
                      onClick={takeSnapshot}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow"
                      title="Take snapshot photo"
                    >
                      <Download className="w-3 h-3" />
                      <span className="hidden sm:inline">Snap</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : isLocalIpAddress(activeVideoId) ? (
            /* CASE B: Local IP entered */
            <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 text-neutral-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Video className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="font-display-tactical text-base font-bold text-neutral-100">
                  Local Network IP Camera
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                  Local IP addresses (e.g. 192.168.x.x) can only be viewed on your local home network. To share your feed with birders across Britain, stream to YouTube Live using your RTMP stream key.
                </p>
              </div>
              <button
                onClick={() => {
                  tacticalAudio.playRadarPing(800);
                  setCustomVideoId(DEFAULT_CAMERA_VIDEO_ID);
                  setStreamMode('video');
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs font-mono-tactical transition-colors cursor-pointer"
              >
                Return to Station Cam
              </button>
            </div>
          ) : (
            /* CASE C: Standard Embed Player */
            <>
              <iframe
                ref={youtubeIframeRef}
                onLoad={initYouTubeDvrBridge}
                key={`${activeEmbedSrc}-${playerRefreshKey}`}
                title="Barbury Castle Summit Live Cam"
                src={activeEmbedSrc}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />

              {/* Clean Camera Label */}
              <div className="absolute bottom-2 left-2 pointer-events-none bg-neutral-950/85 backdrop-blur-md border border-neutral-800 px-2.5 py-1 rounded-lg text-[10px] font-mono-tactical text-neutral-300 flex items-center gap-2 shadow-lg">
                {activeRewindMarker ? (
                  <>
                    <span className="text-rose-400 font-bold animate-pulse">⏪ DVR REWIND ({activeRewindMarker.rewindText})</span>
                    <span className="text-neutral-600 hidden sm:inline">|</span>
                    <span className="text-amber-300 font-bold hidden sm:inline">{activeRewindMarker.title}</span>
                  </>
                ) : isRtmpStreamKeyOrUrl(activeVideoId) ? (
                  <>
                    <span className="text-emerald-400 font-bold">PRIMARY STATION CAM</span>
                    <span className="text-neutral-600 hidden sm:inline">|</span>
                    <span className="text-neutral-300 hidden sm:inline">Hackpen Hill &amp; Barbury Castle • @chalktech</span>
                  </>
                ) : activeVideoId === DEFAULT_CAMERA_VIDEO_ID ? (
                  <>
                    <span className="text-emerald-400 font-bold">ROLLING STATION CAM</span>
                    <span className="text-neutral-600 hidden sm:inline">|</span>
                    <span className="text-neutral-300 hidden sm:inline">Hackpen Hill • Barbury Fort • Field • Perch</span>
                  </>
                ) : (
                  <>
                    <span className="text-amber-400 font-bold">GUEST RAPTOR CAM</span>
                    <span className="text-neutral-600">|</span>
                    <span className="text-neutral-200">{POPULAR_CAMERA_PRESETS.find((p) => p.videoId === activeVideoId)?.name || 'Live Stream'}</span>
                  </>
                )}
              </div>

              {/* Live Watermark / Channel Link (Bottom-Right overlay) */}
              <div className="absolute bottom-2 right-2 bg-neutral-950/85 backdrop-blur-md border border-neutral-800 px-2.5 py-1 rounded-lg text-[10px] font-mono-tactical text-neutral-300 flex items-center gap-1.5 shadow-lg">
                <a
                  href={resolvedChannelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </>
          )}
        </div>

        {/* Active DVR Rewind Playback Control Strip (Appears when viewing a rewound marker) */}
        {activeRewindMarker && (
          <div className="px-3.5 py-2.5 bg-rose-950/75 border-t border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono-tactical animate-fadeIn">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-rose-500 text-neutral-950 font-bold text-[10px] flex items-center gap-1">
                ⏪ DVR REWIND ACTIVE ({activeRewindMarker.rewindText})
              </span>
              <span className="text-neutral-100 font-bold text-xs">
                {activeRewindMarker.title}
              </span>
              <span className="text-neutral-300 text-[11px]">
                • {activeRewindMarker.zone} ({activeRewindMarker.timeUk} UK)
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleNudgeRewind(-30)}
                className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold text-[11px] cursor-pointer transition-colors"
                title="Rewind 30 seconds further back"
              >
                ⏪ -30s
              </button>
              <button
                type="button"
                onClick={() => handleNudgeRewind(30)}
                className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold text-[11px] cursor-pointer transition-colors"
                title="Fast-forward 30 seconds"
              >
                ⏩ +30s
              </button>
              <button
                type="button"
                onClick={handleReturnToLiveEdge}
                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                title="Jump back to live real-time camera stream"
              >
                <span className="w-2 h-2 rounded-full bg-neutral-950 animate-ping"></span>
                <span>Return to Live</span>
              </button>
            </div>
          </div>
        )}

        {/* Smart After-Dark / Night Operations Notice (Auto-activates after UK sunset) */}
        {activeVideoId === DEFAULT_CAMERA_VIDEO_ID && weather.isAfterDark && (
          <div className="px-3.5 py-2.5 bg-indigo-950/60 border-t border-indigo-500/30 flex items-center justify-between gap-3 flex-wrap text-xs font-mono-tactical">
            <div className="flex items-center gap-2.5">
              <Moon className="w-4 h-4 text-indigo-300 shrink-0" />
              <div className="text-[11px] text-indigo-100 leading-snug">
                <strong className="text-indigo-300">Night Operations on the Ridgeway:</strong> The Wiltshire camera is currently in after-dark mode (Next sunrise: <strong>{weather.sunriseTime || '07:35'} UK</strong>). Click any DVR Rewind Marker below to jump straight to today&apos;s daylight sightings!
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                setCustomVideoId(EAGLE_LIVE_VIDEO_ID);
                setStreamMode('video');
              }}
              className="px-2.5 py-1 rounded-lg bg-indigo-500/25 hover:bg-indigo-500/40 border border-indigo-400/50 text-indigo-200 font-bold text-[10px] cursor-pointer transition-colors whitespace-nowrap"
            >
              ☀️ Switch to Daylight Eagle Cam (USA)
            </button>
          </div>
        )}

        {/* Station Cam Rolling 4-View Reference Guide + Live DVR Rewind Markers */}
        {activeVideoId === DEFAULT_CAMERA_VIDEO_ID ? (
          <div className="p-3 sm:p-4 bg-neutral-900/90 border-t border-neutral-800 space-y-3.5 text-xs font-mono-tactical">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-neutral-200 font-bold text-[11px]">
                  Rolling Camera Sweep — 4 Areas Covered Automatically by This Stream:
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-sans">
                Camera pans continuously across all 4 downland zones
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
              {BARBURY_PTZ_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="p-2.5 rounded-xl bg-neutral-950/90 border border-neutral-800/90 space-y-1"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-amber-400 font-bold truncate">
                      {preset.icon} {preset.name.replace(/^\d+\.\s*/, '')}
                    </span>
                    <span className="text-[9px] text-cyan-300 shrink-0">{preset.distanceKm}</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-sans leading-snug">
                    {preset.target}
                  </p>
                </div>
              ))}
            </div>

            {/* Multi-Category Live DVR Rewind Marker Deck (Birds, Sky Conditions & Summit Walkers) */}
            <div className="pt-3 border-t border-neutral-800/90 space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0"></span>
                    <span className="text-neutral-100 font-bold text-xs">
                      Drop a Live DVR Rewind Marker on the Stream:
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-sans">
                    Mark a bird sighting, dramatic Ridgeway sky conditions, or walkers silhouetted on the summit of Barbury Fort so visitors can rewind with 1 click.
                  </p>
                </div>

                {/* Category Selector Tabs for Marking */}
                <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 self-start lg:self-auto flex-wrap">
                  {[
                    { id: 'raptor' as const, label: '🦅 Bird on Cam', activeClass: 'bg-rose-500 text-neutral-950 font-bold' },
                    { id: 'sky' as const, label: '🌅 Great Sky & Weather', activeClass: 'bg-amber-500 text-neutral-950 font-bold' },
                    { id: 'walkers' as const, label: '🥾 Summit Walkers (3km)', activeClass: 'bg-cyan-500 text-neutral-950 font-bold' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        tacticalAudio.playRadarPing(820);
                        setDvrMarkerTab(tab.id);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                        dvrMarkerTab === tab.id
                          ? tab.activeClass
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 1-Click Preset Buttons for Selected Marker Category */}
              {dvrMarkerTab === 'raptor' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: '🦅 Kestrel / Owl on Perch', zone: 'Perch View', title: 'Common Kestrel' },
                    { label: '🌾 Buzzard on Field View', zone: 'Field View', title: 'Common Buzzard' },
                    { label: '⛰️ Red Kite over Hackpen', zone: 'Hackpen Hill View', title: 'Red Kite' },
                    { label: '🏰 Raptor over Barbury Fort', zone: 'Barbury Fort View', title: 'Red Kite' },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => handleInstantDvrFlag(btn.zone, btn.title, 'raptor')}
                      className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 hover:text-white font-bold text-[11px] cursor-pointer transition-all shadow-sm flex items-center justify-center text-center"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}

              {dvrMarkerTab === 'sky' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: '🌅 Golden Hour / Sunset Glow', zone: 'Hackpen Hill View', title: 'Golden Hour Sunset Sky' },
                    { label: '☁️ Cloud Inversion & Mist', zone: 'Barbury Fort View', title: 'Ridge Cloud Inversion & Mist' },
                    { label: '⛅ Dramatic Sunbeams & Clouds', zone: 'Field View', title: 'Dramatic Sunbeams & Clouds' },
                    { label: '🔭 Crystal 30km Visibility', zone: 'Hackpen Hill View', title: 'Crystal 30km Downland Visibility' },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => handleInstantDvrFlag(btn.zone, btn.title, 'sky')}
                      className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 hover:text-white font-bold text-[11px] cursor-pointer transition-all shadow-sm flex items-center justify-center text-center"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}

              {dvrMarkerTab === 'walkers' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: '🥾 Walkers on Barbury Summit', zone: 'Barbury Fort View', title: 'Walkers on Barbury Summit (Silhouette)' },
                      { label: '🚶 Ridgeway Crest Hikers', zone: 'Hackpen Hill View', title: 'Ridgeway Trail Hikers on Crest' },
                      { label: '🐕 Dog Walkers on Ramparts', zone: 'Barbury Fort View', title: 'Dog Walkers on Barbury Ramparts' },
                      { label: '🐎 Riders on Hackpen Gallops', zone: 'Hackpen Hill View', title: 'Riders on Hackpen Chalk Gallops' },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => handleInstantDvrFlag(btn.zone, btn.title, 'walkers')}
                        className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 hover:text-white font-bold text-[11px] cursor-pointer transition-all shadow-sm flex items-center justify-center text-center"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-[10px] font-sans flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      <strong>100% Privacy Safe (3.0 km Distance):</strong> At 3 km range, walkers on Barbury Fort and Hackpen Hill appear solely as tiny distant skyline silhouettes — zero faces or personal identities can ever be seen.
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Custom Moment Input */}
              <form onSubmit={handleCustomDvrSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-0.5">
                <input
                  type="text"
                  value={customDvrNote}
                  onChange={(e) => setCustomDvrNote(e.target.value)}
                  placeholder={
                    dvrMarkerTab === 'sky'
                      ? 'Or type a custom sky moment (e.g. Pink sunset clouds over Hackpen)...'
                      : dvrMarkerTab === 'walkers'
                      ? 'Or type a custom summit moment (e.g. Group of walkers on top of Barbury Fort)...'
                      : 'Or type a custom cam moment (e.g. Two Red Kites circling low over field)...'
                  }
                  className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 font-sans focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={customDvrZone}
                    onChange={(e) => setCustomDvrZone(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Barbury Fort View">Barbury Fort View</option>
                    <option value="Hackpen Hill View">Hackpen Hill View</option>
                    <option value="Field View">Field View</option>
                    <option value="Perch View">Perch View</option>
                  </select>
                  <button
                    type="submit"
                    disabled={!customDvrNote.trim()}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold text-xs cursor-pointer transition-colors whitespace-nowrap shadow-sm"
                  >
                    + Mark Rewind
                  </button>
                </div>
              </form>

              {dvrFlagToast && (
                <div className="px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{dvrFlagToast}</span>
                  </div>
                  {activeRewindMarker && (
                    <button
                      type="button"
                      onClick={handleReturnToLiveEdge}
                      className="text-[10px] underline text-amber-300 hover:text-amber-200 shrink-0 cursor-pointer"
                    >
                      Return to Live
                    </button>
                  )}
                </div>
              )}

              {/* Clickable DVR Rewind Timeline Markers (Last 12 Hours) */}
              {allActiveDvrMarkers.length > 0 ? (
                <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-neutral-200 font-bold text-[11px]">
                        Click Any Marker Below to Automatically Rewind the Video Stream:
                      </span>
                    </div>

                    {/* Filter Pills + Clear All Button for Rewind Timeline */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      {[
                        { id: 'all' as const, label: 'All Moments' },
                        { id: 'raptor' as const, label: '🦅 Birds' },
                        { id: 'sky' as const, label: '🌅 Sky' },
                        { id: 'walkers' as const, label: '🥾 Walkers' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            tacticalAudio.playRadarPing(780);
                            setDvrFilterTab(f.id);
                          }}
                          className={`px-2 py-0.5 rounded-lg border cursor-pointer transition-colors ${
                            dvrFilterTab === f.id
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={handleClearAllDvrMarkers}
                        className="px-2 py-0.5 rounded-lg border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white font-semibold cursor-pointer transition-colors ml-1"
                        title="Clear all DVR rewind markers"
                      >
                        Clear Markers
                      </button>
                    </div>
                  </div>

                  {recentDvrMarkers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {recentDvrMarkers.map((marker) => {
                        const isCurrentlyRewound = activeRewindMarker?.id === marker.id;
                        const catIcon =
                          marker.markerCategory === 'sky'
                            ? '🌅'
                            : marker.markerCategory === 'walkers'
                            ? '🥾'
                            : '🦅';
                        const catBadgeColor =
                          marker.markerCategory === 'sky'
                            ? 'text-amber-300'
                            : marker.markerCategory === 'walkers'
                            ? 'text-cyan-300'
                            : 'text-rose-300';

                        return (
                          <div
                            key={marker.id}
                            onClick={() => handleSeekToDvrMarker(marker)}
                            className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 text-[11px] cursor-pointer transition-all group ${
                              isCurrentlyRewound
                                ? 'bg-rose-950/60 border-rose-500 ring-1 ring-rose-500/40 shadow-lg'
                                : 'bg-neutral-950 hover:bg-neutral-900 border-neutral-800/90 hover:border-amber-500/50'
                            }`}
                            title={`Click to automatically rewind stream by ${marker.rewindText} to watch "${marker.speciesName}"`}
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5 truncate">
                                <span>{catIcon}</span>
                                <span className={`font-bold truncate ${catBadgeColor} group-hover:text-white transition-colors`}>
                                  {marker.speciesName}
                                </span>
                              </div>
                              <div className="text-[10px] text-neutral-400 truncate flex items-center gap-1.5 font-sans">
                                <span>{marker.locationName.replace('Station Cam ', '').replace('Barbury Cam ', '')}</span>
                                {marker.time && (
                                  <>
                                    <span>•</span>
                                    <span>{marker.time} UK</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <span
                                className={`px-2 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all ${
                                  isCurrentlyRewound
                                    ? 'bg-rose-500 text-neutral-950'
                                    : 'bg-rose-500/20 group-hover:bg-rose-500 border border-rose-500/40 text-rose-300 group-hover:text-neutral-950'
                                }`}
                              >
                                <span>⏪ {marker.rewindText}</span>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleDismissSingleMarker(e, marker.id)}
                                className="p-1 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800/80 transition-colors cursor-pointer"
                                title="Remove this marker"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[11px] text-neutral-400 font-sans py-1">
                      No markers in this category yet. Switch to &ldquo;All Moments&rdquo; or drop a new marker above.
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2 text-[11px] text-neutral-400 font-sans">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span>No active rewind markers — drop a marker above whenever you spot a bird, great sky, or walkers on the summit.</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-neutral-900/90 border-t border-neutral-800 flex items-center justify-between gap-3 flex-wrap text-xs font-mono-tactical">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                  {POPULAR_CAMERA_PRESETS.find((p) => p.videoId === activeVideoId)?.badge || 'GUEST RAPTOR STREAM'}
                </span>
                <span className="font-bold text-neutral-100">
                  {POPULAR_CAMERA_PRESETS.find((p) => p.videoId === activeVideoId)?.name || 'External Live Raptor Feed'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-sans">
                {POPULAR_CAMERA_PRESETS.find((p) => p.videoId === activeVideoId)?.description || 'Watching partner live wildlife camera broadcast.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                setCustomVideoId(DEFAULT_CAMERA_VIDEO_ID);
                setStreamMode('video');
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs cursor-pointer transition-colors shadow-sm whitespace-nowrap"
            >
              ↩ Back to Station Cam (Rolling Tour)
            </button>
          </div>
        )}

        {/* Official YouTube Channel & Broadcast Info Card */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-800/90 flex items-center justify-between gap-3 text-xs font-mono-tactical flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600/15 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-100">
                  {POPULAR_CAMERA_PRESETS.find((p) => p.videoId === activeVideoId)?.channelName || currentCam.channelName}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {activeVideoId === DEFAULT_CAMERA_VIDEO_ID ? 'OFFICIAL STATION CAM' : 'PARTNER RAPTOR CAM'}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-sans mt-0.5">
                {activeVideoId === DEFAULT_CAMERA_VIDEO_ID
                  ? `Rolling PTZ tour: Hackpen Hill • Barbury Fort • Field • Perch (ID: ${activeVideoId})`
                  : `${POPULAR_CAMERA_PRESETS.find((p) => p.videoId === activeVideoId)?.location || 'Live Raptor Broadcast'} • Stream ID: ${activeVideoId}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenDonate && (
              <button
                type="button"
                onClick={() => {
                  tacticalAudio.playConfirmChime();
                  onOpenDonate();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                title="Support the 24/7 Barbury & Hackpen Hill live camera"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                <span>Support Cam</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                const shareUrl = 'https://raptorlens.org';
                const shareText = `Watch the live Hackpen Hill, Barbury Castle & Ridgeway Raptor Cam + live summit weather on ${shareUrl}`;
                if (navigator.share) {
                  navigator.share({
                    title: 'RaptorLens UK — Live Hackpen Hill & Barbury Castle Cam',
                    text: shareText,
                    url: shareUrl,
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    setCopiedShareLink(true);
                    setTimeout(() => setCopiedShareLink(false), 3000);
                  }).catch(() => {});
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              title="Share live camera link with walkers & birders"
            >
              {copiedShareLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Share Cam</span>
                </>
              )}
            </button>

            <a
              href={resolvedChannelUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => tacticalAudio.playRadarPing(880)}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Open on YouTube</span>
              <ExternalLink className="w-3 h-3 text-red-200" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. The 3-Second Glanceable Weather Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
        {/* Card 1: Ridge Wind */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span>Summit Wind</span>
              {isWeatherLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Live Open-Meteo Telemetry"></span>}
            </span>
            <Wind className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1.5">
            <div className="text-lg sm:text-xl font-bold text-neutral-100">
              {weather.windDirection} {weather.windSpeedKt} <span className="text-xs font-normal text-neutral-400">kts</span>
            </div>
            <div className="text-xs text-amber-300/90 mt-0.5">
              Gusts to {weather.windGustKt} kts · Lift: {weather.soaringLiftRating}
            </div>
          </div>
        </div>

        {/* Card 2: Visibility & Fog */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Horizon View</span>
            <Eye className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1.5">
            <div className="text-lg sm:text-xl font-bold text-emerald-400">
              {weather.visibilityKm >= 25 ? `Clear (${weather.visibilityKm} km)` : `${weather.visibilityKm} km View`}
            </div>
            <div className="text-xs text-neutral-300 truncate mt-0.5" title={weather.cloudCover}>
              {weather.cloudCover}
            </div>
          </div>
        </div>

        {/* Card 3: Temp & Air */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Temperature</span>
            <Thermometer className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-1.5">
            <div className="text-lg sm:text-xl font-bold text-neutral-100">
              {weather.temperatureC}°<span className="text-xs font-normal text-neutral-400">C</span>
            </div>
            <div className="text-xs text-cyan-300/90 mt-0.5">
              Feels like {weather.windChillC}°C on the ridge
            </div>
          </div>
        </div>

        {/* Card 4: Footing & Trailhead */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Trail &amp; Sunset</span>
            <Mountain className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1.5">
            <div className="text-lg sm:text-xl font-bold text-neutral-100">
              Dry &amp; Firm <span className="text-emerald-400 text-xs font-normal">(9/10)</span>
            </div>
            <div className="text-xs text-emerald-400 font-medium mt-0.5">
              Sunset {weather.sunsetTime || '19:52'} · Golden Hr {weather.goldenHourTime || '18:55'}
            </div>
          </div>
        </div>
      </div>

      {/* 2B. Hourly "Best Raptor Soaring Window" & Interactive Real Bird Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-xs">
        {/* Left 7 Cols: Hourly Raptor Soaring Forecast */}
        <div className="lg:col-span-7 bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-neutral-100 font-bold text-xs sm:text-sm">
                Today&apos;s Raptor Soaring Forecast
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              Best Time: {weather.peakSoaringWindow || '12:00 – 15:00 UK (88% Lift)'}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
            {(weather.hourlySoaring && weather.hourlySoaring.length > 0
              ? weather.hourlySoaring
              : [
                  { time: '10:00', tempC: 12, windSpeedKt: 13, windDirection: 'SW', rainProb: 5, liftScore: 84, isDay: true },
                  { time: '11:00', tempC: 13, windSpeedKt: 14, windDirection: 'SW', rainProb: 5, liftScore: 88, isDay: true },
                  { time: '12:00', tempC: 14, windSpeedKt: 15, windDirection: 'WSW', rainProb: 0, liftScore: 92, isDay: true },
                  { time: '13:00', tempC: 15, windSpeedKt: 16, windDirection: 'WSW', rainProb: 0, liftScore: 94, isDay: true },
                  { time: '14:00', tempC: 15, windSpeedKt: 15, windDirection: 'WSW', rainProb: 10, liftScore: 89, isDay: true },
                  { time: '15:00', tempC: 14, windSpeedKt: 14, windDirection: 'SW', rainProb: 10, liftScore: 82, isDay: true },
                ]
            ).map((slot) => (
              <div
                key={slot.time}
                className="p-2 rounded-lg bg-neutral-900/80 border border-neutral-800/90 text-center space-y-0.5"
              >
                <div className="text-neutral-300 font-semibold">{slot.time}</div>
                <div
                  className={`text-xs sm:text-sm font-bold ${
                    slot.liftScore >= 80
                      ? 'text-emerald-400'
                      : slot.liftScore >= 60
                      ? 'text-amber-300'
                      : 'text-neutral-400'
                  }`}
                >
                  {slot.liftScore}% Lift
                </div>
                <div className="text-[11px] text-neutral-400">
                  {slot.windDirection} {slot.windSpeedKt}kt
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Cols: Real Bird Call Audio Guide */}
        <div className="lg:col-span-5 bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2.5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span className="text-neutral-100 font-bold text-xs sm:text-sm">
                Listen to Real Bird Calls
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                tacticalAudio.setMuted(false);
                const playing = tacticalAudio.toggleDownlandBreeze();
                setIsBreezeActive(playing);
              }}
              className={`min-h-[32px] px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                isBreezeActive
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-neutral-100'
              }`}
              title="Play gentle ambient Wiltshire downland breeze while watching the live camera"
            >
              {isBreezeActive ? '🌬️ Breeze: On' : '🌬️ Hilltop Breeze'}
            </button>
          </div>

          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs">
            {[
              { id: 'red-kite', name: 'Red Kite', hint: 'Play Call' },
              { id: 'buzzard', name: 'Buzzard', hint: 'Play Call' },
              { id: 'kestrel', name: 'Kestrel', hint: 'Play Call' },
              { id: 'peregrine', name: 'Peregrine', hint: 'Play Call' },
              { id: 'barn-owl', name: 'Barn Owl', hint: 'Play Call' },
            ].map((bird) => {
              const isPlaying = activeAudioCall === bird.id;
              return (
                <button
                  key={bird.id}
                  type="button"
                  onClick={() => {
                    tacticalAudio.setMuted(false);
                    const started = tacticalAudio.playSpeciesCall(bird.id, () => {
                      setActiveAudioCall((prev) => (prev === bird.id ? null : prev));
                    });
                    setActiveAudioCall(started ? bird.id : null);
                  }}
                  className={`min-h-[48px] p-2 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                    isPlaying
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-bold scale-[1.02] ring-1 ring-amber-400/50'
                      : 'bg-neutral-900/80 border-neutral-800 text-neutral-200 hover:border-amber-500/40 hover:text-amber-300'
                  }`}
                  title={`Play real recorded ${bird.name} call (Click again to stop)`}
                >
                  <div className="font-bold truncate">
                    {isPlaying ? '⏹️ ' : '🔊 '}
                    {bird.name.split(' ').pop()}
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate">
                    {isPlaying ? 'Playing...' : bird.hint}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Clean Progressive Detail Tabs (No Endless Scrolling) */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Tab Headers */}
        <div className="grid grid-cols-2 sm:flex sm:items-center border-b border-neutral-850 bg-neutral-900/50 p-1.5 gap-1.5 font-mono-tactical text-xs">
          <button
            onClick={() => {
              tacticalAudio.playRadarPing(800);
              setActiveTab('parking');
            }}
            className={`min-h-[42px] px-3 py-2 rounded-xl flex items-center justify-center sm:justify-start gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'parking'
                ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 font-bold'
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900/40 sm:bg-transparent'
            }`}
          >
            <Car className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Parking &amp; Access</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(800);
              setActiveTab('distances');
            }}
            className={`min-h-[42px] px-3 py-2 rounded-xl flex items-center justify-center sm:justify-start gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'distances'
                ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 font-bold'
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900/40 sm:bg-transparent'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Trail Distances</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(800);
              setActiveTab('dispatches');
            }}
            className={`min-h-[42px] px-3 py-2 rounded-xl flex items-center justify-center sm:justify-start gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'dispatches'
                ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 font-bold'
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900/40 sm:bg-transparent'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Spotter Reports</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(800);
              setActiveTab('kit');
            }}
            className={`min-h-[42px] px-3 py-2 rounded-xl flex items-center justify-center sm:justify-start gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'kit'
                ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 font-bold'
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900/40 sm:bg-transparent'
            }`}
          >
            <Binoculars className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Optics &amp; Trail Kit</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5">
          {/* TAB 1: Parking & Trailhead Access */}
          {activeTab === 'parking' && (
            <div className="space-y-4 text-xs font-mono-tactical text-neutral-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-neutral-900/70 p-3.5 rounded-xl border border-neutral-800 space-y-1">
                  <div className="text-neutral-400 text-[10px] uppercase font-bold">CAR PARK RULES</div>
                  <div className="text-sm font-bold text-neutral-100">Barbury Castle Country Park</div>
                  <p className="text-neutral-400 font-sans leading-relaxed text-[11px]">
                    <strong>Free parking</strong> managed by Wiltshire Council. Open dawn until dusk daily. 2.1m height barrier at main vehicle entrance.
                  </p>
                  <div className="text-amber-400 font-semibold pt-1">Postcode: SN4 0QH</div>
                </div>

                <div className="bg-neutral-900/70 p-3.5 rounded-xl border border-neutral-800 space-y-1">
                  <div className="text-amber-400 text-[10px] uppercase font-bold">COUNTRYSIDE CODE &amp; DOGS</div>
                  <div className="text-sm font-bold text-neutral-100">Grazing Sheep &amp; Chalk Turf</div>
                  <p className="text-neutral-400 font-sans leading-relaxed text-[11px]">
                    Free-roaming sheep and cattle graze the Iron Age earthworks. <strong>Dogs must be kept on short leads</strong>. Please close all deer gates.
                  </p>
                  <div className="text-emerald-400 font-semibold pt-1">Bins &amp; dog waste points at car park gate</div>
                </div>
              </div>

              <div className="bg-neutral-900/40 p-3 rounded-xl border border-neutral-850 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Sunset today: <strong className="text-neutral-100">{weather.sunsetTime || '19:52'} UK</strong> (Golden hour starts {weather.goldenHourTime || '18:55'}) • <span className="text-emerald-400">{weather.walkerAdvisory}</span>
                  </span>
                </div>
                <button
                  onClick={() => onOpenLogModal('Barbury Castle')}
                  className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  + Log bird seen from car park &rarr;
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Ridgeway Trail Distances */}
          {activeTab === 'distances' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono-tactical text-xs">
                {trailDestinations.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      tacticalAudio.playRadarPing(800);
                      setActiveTrailDistance(t.id as any);
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                      activeTrailDistance === t.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <div className="text-neutral-200 truncate">{t.name.split(' ')[0]}</div>
                    <div className="text-[10px] text-amber-400">{t.distance}</div>
                  </button>
                ))}
              </div>

              <div className="bg-neutral-900/70 p-4 rounded-xl border border-neutral-800 text-xs font-mono-tactical space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-neutral-100">{selectedTrail.name}</h4>
                  <span className="text-amber-400 font-bold">{selectedTrail.distance} • {selectedTrail.time}</span>
                </div>
                <div className="text-neutral-400 font-sans text-[11px] leading-relaxed">
                  <strong>Trail Surface:</strong> {selectedTrail.surface} ({selectedTrail.difficulty})
                </div>
                <div className="text-neutral-300 font-sans text-[11px] leading-relaxed">
                  <strong>Highlights:</strong> {selectedTrail.highlights}
                </div>
                <div className="text-amber-300 font-sans text-[11px] leading-relaxed">
                  <strong>Trail Advisory:</strong> {selectedTrail.hazards}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Live Firestore Community Spotter Reports */}
          {activeTab === 'dispatches' && (
            <div className="space-y-3 font-mono-tactical text-xs">
              <div className="flex items-center justify-between border-b border-neutral-850 pb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-neutral-300 font-bold">LIVE COMMUNITY CAMERA &amp; TRAIL SIGHTINGS</span>
                </div>
                <button
                  onClick={() => setShowQuickSpotModal(true)}
                  className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  + Add Sighting Report
                </button>
              </div>

              <div className="space-y-2">
                {sightings.length > 0 ? (
                  sightings.slice(0, 6).map((s) => (
                    <div key={s.id} className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-neutral-100 font-bold">
                          {s.count}x {s.speciesName} <span className="text-[10px] text-amber-400 font-normal">({s.locationName})</span>
                        </div>
                        <div className="text-[11px] text-neutral-400 font-sans mt-0.5">{s.notes}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-neutral-400 text-[10px]">{s.date} {s.time}</div>
                        <div className="text-emerald-400 text-[10px] font-bold">{s.observerCallsign}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-neutral-900/40 border border-dashed border-neutral-800 text-center space-y-2">
                    <div className="text-neutral-300 font-bold text-xs">No sightings logged yet</div>
                    <p className="text-[11px] text-neutral-400 font-sans">
                      Fake sample sightings have been cleared so the station starts fresh. Spot a bird on the live cam or trail and click <strong>+ Add Sighting Report</strong> to log the first real sighting!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Recommended Field Optics & Trail Kit (Affiliate Ready) */}
          {activeTab === 'kit' && (
            <div className="space-y-3.5 font-mono-tactical text-xs">
              <div className="flex items-center justify-between border-b border-neutral-850 pb-2 flex-wrap gap-2">
                <div>
                  <span className="text-emerald-400 font-bold">RECOMMENDED RIDGEWAY OPTICS &amp; FIELD KIT</span>
                  <p className="text-[11px] text-neutral-400 font-sans mt-0.5">
                    Field-tested binoculars, OS maps, and identification guides for Barbury Castle, Hackpen Hill &amp; the Marlborough Downs.
                  </p>
                </div>
                {onOpenDonate && (
                  <button
                    type="button"
                    onClick={onOpenDonate}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Coffee className="w-3.5 h-3.5" />
                    <span>Support Station Cam</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RECOMMENDED_FIELD_KIT.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-neutral-900/70 border border-neutral-800 hover:border-emerald-500/40 transition-colors flex flex-col justify-between gap-2.5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9px] font-bold">
                          {item.badge}
                        </span>
                        <span className="text-amber-300 font-bold text-[11px]">{item.priceRange}</span>
                      </div>
                      <h4 className="font-bold text-neutral-100 text-xs sm:text-sm pt-0.5">{item.name}</h4>
                      <div className="text-[10px] text-cyan-300">Best for: {item.bestFor}</div>
                      <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">{item.summary}</p>
                    </div>
                    <div className="pt-1 flex items-center justify-between border-t border-neutral-800/80">
                      <span className="text-[10px] text-neutral-500">{item.category}</span>
                      <a
                        href={buildAmazonUkAffiliateUrl(item.amazonSearchQuery)}
                        target="_blank"
                        rel="noreferrer sponsored"
                        onClick={() => tacticalAudio.playRadarPing(880)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>View on Amazon UK</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[10px] text-neutral-500 font-sans text-center pt-1">
                As an Amazon Associate I earn from qualifying purchases — helping fund 24/7 live camera bandwidth and station maintenance at no extra cost to you.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. SEO & Local Walker Guide: Barbury Castle, Hackpen Hill & The Ridgeway */}
      <section
        aria-label="Barbury Castle and Hackpen Hill Live Camera and Trail Guide"
        className="bg-neutral-950/90 border border-neutral-850 rounded-2xl p-4 sm:p-5 space-y-3 text-xs font-mono-tactical"
      >
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-neutral-850 pb-2.5">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <h2 className="text-neutral-100 font-bold text-xs sm:text-sm uppercase tracking-wider">
              Barbury Castle, Hackpen Hill &amp; Ridgeway Live Guide (Wiltshire, UK)
            </h2>
          </div>
          <span className="text-[10px] text-neutral-400">North Wessex Downs National Landscape • 262m ASL</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-sans text-[11px] text-neutral-300 leading-relaxed">
          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/90 space-y-1">
            <h3 className="font-mono-tactical font-bold text-amber-300 text-xs">
              What does the live camera show?
            </h3>
            <p className="text-neutral-400">
              Our 24/7 rolling station camera broadcasts live across four views on the Marlborough Downs: <strong>Hackpen Hill &amp; White Horse</strong>, <strong>Barbury Castle Iron Age Hillfort</strong>, the chalk downland <strong>Field View</strong>, and the close-up <strong>Perch View</strong>.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/90 space-y-1">
            <h3 className="font-mono-tactical font-bold text-emerald-300 text-xs">
              Which birds of prey can I spot here?
            </h3>
            <p className="text-neutral-400">
              The north-facing chalk scarp generates strong updrafts for <strong>Red Kites</strong>, <strong>Common Buzzards</strong>, wind-hovering <strong>Common Kestrels</strong>, <strong>Peregrine Falcons</strong>, and wintering <strong>Hen Harriers</strong> and <strong>Short-eared Owls</strong>.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/90 space-y-1">
            <h3 className="font-mono-tactical font-bold text-cyan-300 text-xs">
              Checking Ridgeway weather before you walk
            </h3>
            <p className="text-neutral-400">
              Check the live video and summit telemetry above before driving to <strong>Barbury Castle Country Park (SN4 0QH)</strong> or <strong>Hackpen Hill</strong> to verify hill fog, wind chill, and sunset times along The Ridgeway National Trail.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Spot on Trail Modal */}
      {showQuickSpotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-neutral-900 border border-amber-500/50 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-display-tactical text-base font-bold text-neutral-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Spotted on Trail or Cam!
              </h3>
              <button
                onClick={() => setShowQuickSpotModal(false)}
                className="text-neutral-400 hover:text-neutral-100 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickSpotSubmit} className="space-y-3 font-mono-tactical text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">RAPTOR OR WILDLIFE SPECIES</label>
                <select
                  value={quickSpotSpecies}
                  onChange={(e) => setQuickSpotSpecies(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-sans text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="Red Kite">Red Kite (Forked tail, kettling)</option>
                  <option value="Common Buzzard">Common Buzzard (Broad fan tail)</option>
                  <option value="Common Kestrel">Common Kestrel (Wind-hovering)</option>
                  <option value="Peregrine Falcon">Peregrine Falcon (High-speed stoop)</option>
                  <option value="Hen Harrier">Hen Harrier (Ground-quartering)</option>
                  <option value="Barn Owl">Barn Owl (Crepuscular ghost)</option>
                  <option value="Raven">Common Raven (Diamond tail)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-neutral-400 block mb-1">CAMERA VIEW / ZONE</label>
                  <select
                    value={quickSpotZone}
                    onChange={(e) => setQuickSpotZone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-sans text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Hackpen Hill View">Hackpen Hill View</option>
                    <option value="Barbury Fort View">Barbury Fort View</option>
                    <option value="Field View">Field View</option>
                    <option value="Perch View">Perch View</option>
                    <option value="Ridgeway Trail">Ridgeway Trail (On Foot)</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">INDIVIDUAL COUNT</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={quickSpotCount}
                    onChange={(e) => setQuickSpotCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">OBSERVER NOTES</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Spotted soaring above northern rampart ditch..."
                  value={quickSpotNotes}
                  onChange={(e) => setQuickSpotNotes(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-sans text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickSpotModal(false)}
                  className="text-neutral-400 hover:text-neutral-200 underline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold cursor-pointer transition-colors"
                >
                  Publish Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stream Troubleshooting & Setup Modal */}
      {showTroubleshootModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-display-tactical text-base sm:text-lg font-bold text-neutral-100">
                  Why is my stream black or "Video unavailable"?
                </h3>
              </div>
              <button
                onClick={() => setShowTroubleshootModal(false)}
                className="text-neutral-400 hover:text-neutral-100 text-sm font-bold cursor-pointer p-1 rounded-lg hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-sans text-xs text-neutral-300 leading-relaxed">
              <p>
                If your camera stream is black or says <strong>"Video unavailable"</strong>, here is why and how to fix it immediately:
              </p>

              {/* 1-Click Instant Solutions */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <span className="font-bold text-amber-300 flex items-center gap-1.5 font-mono-tactical text-[11px]">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>1-Click Live Raptor Feeds:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono-tactical text-xs">
                  {POPULAR_CAMERA_PRESETS.slice(0, 4).map((cam) => (
                    <button
                      key={cam.id}
                      type="button"
                      onClick={() => {
                        tacticalAudio.playRadarPing(880);
                        setCustomVideoId(cam.videoId);
                        setCustomChannelInput(cam.channelUrl);
                        setStreamMode('video');
                        setShowTroubleshootModal(false);
                      }}
                      className="p-2 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-amber-500/50 text-amber-300 text-left cursor-pointer flex items-center justify-between"
                    >
                      <span className="truncate">{cam.shortLabel}</span>
                      <span className="text-[10px] text-emerald-400 font-bold shrink-0 ml-1">LIVE</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 font-mono-tactical text-[11px]">
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span>1. Rolling Station Cam Tour:</span>
                  </div>
                  <p className="font-sans text-neutral-400">
                    The primary Station Cam automatically cycles across four views: <strong>Hackpen Hill View</strong>, <strong>Barbury Fort View</strong>, <strong>Field View</strong>, and <strong>Perch View</strong>.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span>2. Guest UK &amp; International Raptor Cams:</span>
                  </div>
                  <p className="font-sans text-neutral-400">
                    During night hours or heavy hill fog on the Marlborough Downs, you can switch at any time to partner 24/7 live cameras including the <strong>UK Barn Owl &amp; Kestrel Cam</strong>, <strong>UK Peregrine Cam</strong>, <strong>UK Rutland Osprey Cam</strong>, or <strong>Big Bear Bald Eagle Nest</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-800 flex-wrap">
              <a
                href={`https://www.youtube.com/watch?v=${activeVideoId}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-amber-300 border border-neutral-700 text-xs font-mono-tactical font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Watch on YouTube ↗</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    tacticalAudio.playRadarPing(880);
                    setCustomVideoId(DEFAULT_CAMERA_VIDEO_ID);
                    setStreamMode('video');
                    setShowTroubleshootModal(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono-tactical cursor-pointer transition-colors shadow-sm"
                >
                  📡 Reset to Station Cam
                </button>
                <button
                  type="button"
                  onClick={() => setShowTroubleshootModal(false)}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-mono-tactical cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
