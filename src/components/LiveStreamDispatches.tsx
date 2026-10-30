import React, { useState, useEffect } from 'react';
import { LivestreamCam, RssDispatch, LiveCamSpotterReport } from '../types/raptor';
import { 
  Radio, 
  Video, 
  Send, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Plus, 
  Check, 
  Compass, 
  Wind, 
  Eye, 
  ZoomIn, 
  Target, 
  Binoculars, 
  Maximize2, 
  Sparkles, 
  MessageSquare,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  Grid,
  Wifi,
  Globe,
  Info,
  Lock,
  GraduationCap,
  CloudSun,
  Play,
  Pause,
  TrendingUp,
  Sun,
  Tv,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';
import { BARBURY_PTZ_PRESETS, BARBURY_SUMMIT_WEATHER, PtzPreset, BarburySummitWeather } from '../data/camPresets';
import { EducationalCamIdModal } from './EducationalCamIdModal';
import { StationCamOperatorGuideModal } from './StationCamOperatorGuideModal';
import { fetchLiveBarburyWeather } from '../services/weatherService';
import { subscribeToStationStreamConfig, saveStationStreamConfigToFirestore } from '../services/sightingsFirestore';
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
  isRtmpStreamKeyOrUrl,
  setActiveStreamKey
} from '../utils/youtube';

export const isLocalIpAddress = (val: string): boolean => {
  const trimmed = val.trim();
  return /^(https?:\/\/)?(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.|localhost)/i.test(trimmed);
};

export const formatLocalIpUrl = (val: string): string => {
  const trimmed = val.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
};

interface LiveStreamDispatchesProps {
  channels: LivestreamCam[];
  dispatches: RssDispatch[];
  onAddDispatch: (dispatch: RssDispatch) => void;
  onLocateHotspot: (hotspotId: string) => void;
  onLogSightingFromCam?: (prefill: { speciesId?: string; locationName: string; behavior: any; notes: string }) => void;
  onOpenContact?: () => void;
  currentCallsign?: string;
}

export const LiveStreamDispatches: React.FC<LiveStreamDispatchesProps> = ({
  channels,
  dispatches,
  onAddDispatch,
  onLocateHotspot,
  onLogSightingFromCam,
  onOpenContact,
  currentCallsign = 'FIELD-SCOUT',
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>(channels[0]?.id || 'stream-barbury-castle-livecam');
  const [stationPrimaryVideoId, setStationPrimaryVideoId] = useState<string>(() => {
    try {
      return localStorage.getItem('raptorlens_station_primary_id') || localStorage.getItem('raptorlens_custom_cam') || DEFAULT_CAMERA_VIDEO_ID;
    } catch {
      return DEFAULT_CAMERA_VIDEO_ID;
    }
  });
  const [customVideoId, setCustomVideoId] = useState<string>(() => {
    try {
      const savedPrimary = localStorage.getItem('raptorlens_station_primary_id') || '';
      if (savedPrimary) return savedPrimary;
      const saved = localStorage.getItem('raptorlens_custom_cam') || '';
      if (!saved || saved === '9gkrkcqHQ78' || saved === 'GAxREl6-fJs' || saved === 'wUmvCR2YBMQ' || saved === 'D9NvW7EA1B0') return DEFAULT_CAMERA_VIDEO_ID;
      return saved;
    } catch {
      return DEFAULT_CAMERA_VIDEO_ID;
    }
  });
  const [customChannelInput, setCustomChannelInput] = useState<string>('');
  const [streamMode, setStreamMode] = useState<StreamPlayMode>(() => {
    try {
      const saved = localStorage.getItem('raptorlens_stream_mode');
      if (saved === 'video' || saved === 'channel') return saved;
      return 'video';
    } catch {
      return 'video';
    }
  });
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [showIpCamHelp, setShowIpCamHelp] = useState<boolean>(false);
  const [showTroubleshootModal, setShowTroubleshootModal] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeToStationStreamConfig((config) => {
      if (config.videoId) {
        setStationPrimaryVideoId(config.videoId);
        setCustomVideoId(config.videoId);
        if (config.channelUrl) {
          setCustomChannelInput(config.channelUrl);
        }
      }
    });
    const handleWindowSync = (e: Event) => {
      const customEvt = e as CustomEvent<{ videoId: string; channelUrl?: string; mode?: 'video' | 'channel' }>;
      if (customEvt.detail?.videoId) {
        setStationPrimaryVideoId(customEvt.detail.videoId);
        setCustomVideoId(customEvt.detail.videoId);
      }
    };
    window.addEventListener('raptorlens-station-stream-synced', handleWindowSync);
    return () => {
      unsub();
      window.removeEventListener('raptorlens-station-stream-synced', handleWindowSync);
    };
  }, []);

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
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [isBreezePlaying, setIsBreezePlaying] = useState<boolean>(false);
  const [opticalFilterMode, setOpticalFilterMode] = useState<'Standard' | 'Chalk Contrast' | 'Low-Light Twilight'>('Standard');
  const [isReticleActive, setIsReticleActive] = useState<boolean>(true);

  // Spotter Sighting on Cam state
  const [spotterReports, setSpotterReports] = useState<Record<string, LiveCamSpotterReport[]>>(() => {
    const map: Record<string, LiveCamSpotterReport[]> = {};
    channels.forEach((c) => {
      if (c.spotterReports) {
        map[c.id] = c.spotterReports;
      }
    });
    return map;
  });

  const [showQuickSpotModal, setShowQuickSpotModal] = useState<boolean>(false);
  const [quickSpotSpecies, setQuickSpotSpecies] = useState<string>('Red Kite');
  const [quickSpotCount, setQuickSpotCount] = useState<number>(1);
  const [quickSpotQuadrant, setQuickSpotQuadrant] = useState<'Northern Ramparts' | 'North-West Escarpment' | 'Chalk Valley Bottom' | 'High Airspace' | 'Tree Line' | 'Boundary Fence Post' | 'Garden Perch / Roost'>('Northern Ramparts');
  const [quickSpotDescription, setQuickSpotDescription] = useState<string>('');

  // Live Barbury Castle Summit Weather State (synced with Open-Meteo & UK Met Office)
  const [barburyWeather, setBarburyWeather] = useState<BarburySummitWeather>(BARBURY_SUMMIT_WEATHER);
  const [isWeatherRefreshing, setIsWeatherRefreshing] = useState<boolean>(false);

  const loadBarburyWeather = async () => {
    setIsWeatherRefreshing(true);
    try {
      const live = await fetchLiveBarburyWeather();
      setBarburyWeather(live);
    } catch (err) {
      console.warn('Real-time weather query fell back to baseline downland telemetry:', err);
    } finally {
      setIsWeatherRefreshing(false);
    }
  };

  useEffect(() => {
    loadBarburyWeather();
    const weatherTimer = setInterval(loadBarburyWeather, 5 * 60 * 1000); // Poll live weather every 5 mins
    return () => clearInterval(weatherTimer);
  }, []);

  // PTZ Moving Camera & Auto-Patrol State
  const [activePtzPresetId, setActivePtzPresetId] = useState<string>('ramparts');
  const [isAutoPatrolActive, setIsAutoPatrolActive] = useState<boolean>(true);
  const [patrolCountdown, setPatrolCountdown] = useState<number>(45);

  // Modals for Educational ID and Station Operator Guide
  const [showEducationalIdModal, setShowEducationalIdModal] = useState<boolean>(false);
  const [showOperatorGuideModal, setShowOperatorGuideModal] = useState<boolean>(false);

  const activePtzPreset: PtzPreset = 
    BARBURY_PTZ_PRESETS.find((p) => p.id === activePtzPresetId) || BARBURY_PTZ_PRESETS[0];

  // Auto-Patrol Guard Tour Effect: Automatically cycles between presets with dwell timer
  useEffect(() => {
    if (!isAutoPatrolActive) return;
    const timer = setInterval(() => {
      setPatrolCountdown((prev) => {
        if (prev <= 1) {
          const currentIdx = BARBURY_PTZ_PRESETS.findIndex((p) => p.id === activePtzPresetId);
          const nextIdx = (currentIdx + 1) % BARBURY_PTZ_PRESETS.length;
          const nextPreset = BARBURY_PTZ_PRESETS[nextIdx];
          setActivePtzPresetId(nextPreset.id);
          tacticalAudio.playRadarPing(720 + nextIdx * 40);
          return nextPreset.dwellSeconds || 45;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isAutoPatrolActive, activePtzPresetId]);

  const handleSelectPreset = (presetId: string) => {
    tacticalAudio.playRadarPing(880);
    setActivePtzPresetId(presetId);
    const found = BARBURY_PTZ_PRESETS.find((p) => p.id === presetId);
    setPatrolCountdown(found?.dwellSeconds || 45);
  };

  const handleToggleAutoPatrol = () => {
    const nextState = !isAutoPatrolActive;
    if (nextState) tacticalAudio.playConfirmChime();
    else tacticalAudio.playRadarPing(650);
    setIsAutoPatrolActive(nextState);
  };

  // New Dispatch Form State
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [newDispatchTitle, setNewDispatchTitle] = useState('');
  const [newDispatchSummary, setNewDispatchSummary] = useState('');
  const [newDispatchCategory, setNewDispatchCategory] = useState<'SIGHTING ALERT' | 'MIGRATION SURGE' | 'THERMAL WATCH' | 'NESTING STATUS' | 'FIELD BULLETIN'>('SIGHTING ALERT');
  const [newDispatchPriority, setNewDispatchPriority] = useState<'CRITICAL' | 'HIGH' | 'NORMAL'>('HIGH');
  const [newDispatchHotspot, setNewDispatchHotspot] = useState('barbury-castle');

  const [isPrimaryEmbedBlocked, setIsPrimaryEmbedBlocked] = useState<boolean>(false);
  const currentChannel = channels.find((c) => c.id === selectedChannelId) || channels[0];
  const activeVideoId = customVideoId.trim() || stationPrimaryVideoId || currentChannel.youtubeId;

  useEffect(() => {
    let isMounted = true;
    const verifyEmbed = async () => {
      if (!activeVideoId || isLocalIpAddress(activeVideoId) || isRtmpStreamKeyOrUrl(activeVideoId)) return;
      const ok = await checkYouTubeVideoEmbeddable(activeVideoId);
      if (isMounted) setIsPrimaryEmbedBlocked(!ok);
    };
    verifyEmbed();
    const timer = setInterval(verifyEmbed, 15000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [activeVideoId]);

  const effectiveEmbedVideoId =
    isRtmpStreamKeyOrUrl(activeVideoId)
      ? CHALKTECH_CHANNEL_ID
      : activeVideoId;

  const channelInfo = extractYouTubeChannelInfo(customChannelInput || currentChannel.channelUrl || '');
  const resolvedChannelUrl = getYouTubeChannelUrl(customChannelInput || currentChannel.channelUrl, activeVideoId);
  const activeEmbedSrc = buildYouTubeEmbedSrc({
    videoId: effectiveEmbedVideoId,
    channelId: channelInfo.channelId,
    mode: streamMode,
  });

  const currentChannelIndex = channels.findIndex((c) => c.id === currentChannel.id);
  const handlePrevChannel = () => {
    tacticalAudio.playRadarPing(800);
    const newIdx = (currentChannelIndex - 1 + channels.length) % channels.length;
    setSelectedChannelId(channels[newIdx].id);
    setCustomVideoId('');
  };
  const handleNextChannel = () => {
    tacticalAudio.playRadarPing(880);
    const newIdx = (currentChannelIndex + 1) % channels.length;
    setSelectedChannelId(channels[newIdx].id);
    setCustomVideoId('');
  };

  const currentChannelReports = spotterReports[currentChannel.id] || [];

  const filteredDispatches = dispatches.filter((d) => {
    if (activeCategory === 'ALL') return true;
    return d.category === activeCategory;
  });

  const handleToggleBreeze = () => {
    const isPlaying = tacticalAudio.toggleDownlandBreeze();
    setIsBreezePlaying(isPlaying);
  };

  const handleQuickSpotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSpotSpecies) return;

    tacticalAudio.playConfirmChime();
    const newReport: LiveCamSpotterReport = {
      id: `spot-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeAgo: 'Just now',
      callsign: currentCallsign,
      speciesName: quickSpotSpecies,
      count: quickSpotCount,
      sectorQuadrant: quickSpotQuadrant,
      description: quickSpotDescription || `${quickSpotCount}x ${quickSpotSpecies} observed in ${quickSpotQuadrant} quadrant via 30x telephoto optical cam.`,
      verified: true,
    };

    setSpotterReports((prev) => ({
      ...prev,
      [currentChannel.id]: [newReport, ...(prev[currentChannel.id] || [])]
    }));

    // Also optionally fire into the overall dispatches wire
    const autoDispatch: RssDispatch = {
      id: `disp-cam-${Date.now()}`,
      title: `LIVE CAM SPOT: ${quickSpotCount}x ${quickSpotSpecies.toUpperCase()} AT ${quickSpotQuadrant.toUpperCase()}`,
      timestamp: new Date().toISOString(),
      timeAgo: 'Just now',
      source: `Barbury Field Cam (30x Optical Feed)`,
      category: 'SIGHTING ALERT',
      priority: 'HIGH',
      summary: quickSpotDescription || `${quickSpotCount}x ${quickSpotSpecies} observed via 30x telephoto lens looking across the 3km field toward Barbury Castle (${quickSpotQuadrant}).`,
      hotspotRef: 'barbury-castle',
      author: `Cam Spotter: ${currentCallsign}`,
      verified: true,
      speciesMentioned: [quickSpotSpecies]
    };
    onAddDispatch(autoDispatch);

    setShowQuickSpotModal(false);
    setQuickSpotDescription('');
  };

  const handleLogIdentifiedSpecies = (data: {
    speciesName: string;
    count: number;
    quadrant: string;
    description: string;
  }) => {
    tacticalAudio.playConfirmChime();
    const newReport: LiveCamSpotterReport = {
      id: `spot-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeAgo: 'Just now',
      callsign: currentCallsign,
      speciesName: data.speciesName,
      count: data.count,
      sectorQuadrant: data.quadrant,
      description: data.description,
      verified: true,
    };

    setSpotterReports((prev) => ({
      ...prev,
      [currentChannel.id]: [newReport, ...(prev[currentChannel.id] || [])]
    }));

    const autoDispatch: RssDispatch = {
      id: `disp-cam-edu-${Date.now()}`,
      title: `EDUCATIONAL CAM SPOT: ${data.count}x ${data.speciesName.toUpperCase()} (${data.quadrant.toUpperCase()})`,
      timestamp: new Date().toISOString(),
      timeAgo: 'Just now',
      source: `Barbury Castle Field Cam (Educational ID)`,
      category: 'SIGHTING ALERT',
      priority: 'HIGH',
      summary: data.description,
      hotspotRef: 'barbury-castle',
      author: `Cam Spotter: ${currentCallsign}`,
      verified: true,
      speciesMentioned: [data.speciesName]
    };
    onAddDispatch(autoDispatch);
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDispatchTitle.trim() || !newDispatchSummary.trim()) return;

    tacticalAudio.playConfirmChime();
    const newDispatch: RssDispatch = {
      id: `disp-${Date.now()}`,
      title: newDispatchTitle.toUpperCase(),
      timestamp: new Date().toISOString(),
      timeAgo: 'Just now',
      source: 'SkyScout UK Observer Net (Live RSS Dispatch)',
      category: newDispatchCategory,
      priority: newDispatchPriority,
      summary: newDispatchSummary,
      hotspotRef: newDispatchHotspot,
      author: `Observer Callsign: ${currentCallsign}`,
      verified: true,
    };

    onAddDispatch(newDispatch);
    setShowBroadcastModal(false);
    setNewDispatchTitle('');
    setNewDispatchSummary('');
  };

  return (
    <div className="space-y-8">
      {/* Top Banner with Barbury Castle Telephoto Highlights */}
      <div className="bg-neutral-950/85 backdrop-blur-md border border-neutral-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-850 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-xs font-mono-tactical uppercase tracking-wider text-rose-400 font-bold">
                LIVE FIELD CAM • BARBURY CASTLE
              </span>
              <span className="text-neutral-600">|</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-tactical font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Target className="w-3 h-3 text-amber-400" />
                30x Optical Zoom • 3.0km Distance to Ramparts
              </span>
            </div>
            <h2 className="font-display-tactical text-xl md:text-2xl font-bold text-neutral-100">
              Barbury Castle Field Cam &amp; Wildlife Notice Wire
            </h2>
            <p className="text-xs text-neutral-300 max-w-3xl leading-relaxed font-sans mt-1">
              Real-time optical feed trained south across Wiltshire chalk pasture towards the ancient Iron Age ramparts of <strong>Barbury Castle</strong> (3.0 km distance, 268m ASL). Track Red Kite kettles forming along the northern escarpment slope lift, scan pasture margin for Buzzards, and log instant sightings straight into the Wessex community log.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto shrink-0 flex-wrap">
            <button
              onClick={handleToggleBreeze}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono-tactical flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                isBreezePlaying
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {isBreezePlaying ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-500" />}
              {isBreezePlaying ? 'Downland Audio: ON' : 'Wind Audio'}
            </button>

            <button
              onClick={() => {
                tacticalAudio.playRadarPing(900);
                setShowEducationalIdModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 font-display-tactical text-xs font-bold tracking-wider flex items-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95"
              title="Interactive 3-Step Educational Cam Identification Wizard & Daily Downland Quiz"
            >
              <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Educational Cam ID</span>
            </button>

            <button
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                setShowOperatorGuideModal(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 hover:border-amber-500/50 text-neutral-300 hover:text-amber-300 text-xs font-mono-tactical flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Station Operator Guide: 4G Solar PTZ Patrol, Summit Weather & Traffic Growth Playbook"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>PTZ &amp; Traffic Guide</span>
            </button>

            <button
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                setShowBroadcastModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display-tactical text-xs font-bold tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20 transition-transform active:scale-95"
            >
              <Radio className="w-3.5 h-3.5" /> Post Field Notice
            </button>

            {onOpenContact && (
              <button
                id="header-contact-btn"
                onClick={() => {
                  tacticalAudio.playRadarPing(850);
                  onOpenContact();
                }}
                className="px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 hover:border-amber-500/50 text-neutral-300 hover:text-amber-300 text-xs font-mono-tactical flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Contact Station Operators, Conservation Desk or Report Camera Feed Issue"
              >
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Contact Operators</span>
              </button>
            )}
          </div>
        </div>

        {/* Full-Visibility Live Field Camera Stations Deck */}
        <div className="pt-4 border-t border-neutral-850/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 className="font-display-tactical text-xs font-bold uppercase tracking-wider text-neutral-200">
                ACTIVE FIELD OPTICAL CAMERAS ({channels.length + (customVideoId ? 1 : 0)} ONLINE)
              </h3>
              <span className="text-[10px] text-amber-400/90 font-mono hidden md:inline">• Official Station Feed (CAM 01)</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-tactical text-emerald-400 font-semibold">
                24/7 Downland Telemetry Active
              </span>
            </div>
          </div>

          {/* Compliance & Ownership Notice */}
          <div className="px-3.5 py-2 rounded-xl bg-neutral-900/50 border border-neutral-800/80 text-[11px] font-sans text-neutral-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-neutral-200 font-mono-tactical text-[10px] uppercase tracking-wide">BROADCAST &amp; ETHICS COMPLIANCE:</strong> CAM 01 is the sole live camera directly owned and operated by this station. To protect wildlife charity IP and maintain a purely non-commercial platform, this site strictly excludes commercial advertisements, ticketed tourist promotions, and syndicated commercial feeds.
              </span>
            </div>
            <span className="text-[10px] font-mono-tactical text-emerald-400 font-semibold shrink-0 hidden sm:inline">
              CDPA 1988 &sect;9(3)
            </span>
          </div>

          {/* Station Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {channels.map((ch, idx) => {
              const isSelected = selectedChannelId === ch.id && !customVideoId;
              return (
                <button
                  key={ch.id}
                  id={`field-cam-btn-${ch.id}`}
                  onClick={() => {
                    tacticalAudio.playRadarPing(800 + idx * 50);
                    setSelectedChannelId(ch.id);
                    setCustomVideoId(stationPrimaryVideoId);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer relative group ${
                    isSelected
                      ? 'bg-neutral-900/95 border-amber-500 text-neutral-100 shadow-xl ring-2 ring-amber-500/40'
                      : 'bg-neutral-950/70 border-neutral-800/90 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60 hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-1.5 w-full">
                    <div className="flex items-center justify-between gap-1 text-[10px] font-mono-tactical">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 ${
                        isSelected 
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50' 
                          : 'bg-neutral-850 text-neutral-400 border border-neutral-750'
                      }`}>
                        CAM 01 • OFFICIAL STATION RIG
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        LIVE &bull; VERIFIED
                      </span>
                    </div>

                    <h4 className={`font-display-tactical text-sm font-bold leading-snug line-clamp-2 transition-colors ${
                      isSelected ? 'text-amber-300' : 'text-neutral-200 group-hover:text-neutral-100'
                    }`}>
                      {ch.title}
                    </h4>

                    <p className="text-[11px] text-neutral-300 font-sans line-clamp-2">
                      {ch.description}
                    </p>

                    <div className="pt-1 flex items-center gap-2 text-[10px] font-mono-tactical text-neutral-400">
                      <span>{ch.opticalZoom || '30x Telephoto'}</span>
                      <span>&bull;</span>
                      <span>{ch.elevation || '268m ASL'}</span>
                      <span>&bull;</span>
                      <span>{ch.panBearing || '195° SSW'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] font-mono-tactical w-full">
                    <span className="text-neutral-400 font-mono">
                      {ch.viewers} observers watching
                    </span>
                    {isSelected ? (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> ACTIVE FEED
                      </span>
                    ) : (
                      <span className="text-neutral-500 group-hover:text-amber-300 transition-colors">
                        Switch to Station Cam &rarr;
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Custom Stream Card (if custom video ID or IP is set) */}
            {customVideoId && (
              <div
                onClick={() => {
                  tacticalAudio.playRadarPing(880);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 bg-neutral-900/95 shadow-xl ring-2 ${
                  isLocalIpAddress(customVideoId)
                    ? 'border-cyan-500/80 ring-cyan-500/30'
                    : 'border-amber-500/80 ring-amber-500/30'
                }`}
              >
                <div className="space-y-1.5 w-full">
                  <div className="flex items-center justify-between gap-1 text-[10px] font-mono-tactical">
                    <span className="px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-cyan-500/25 text-cyan-300 border border-cyan-500/50">
                      CAM 02 &bull; {isLocalIpAddress(customVideoId) ? 'LOCAL IP RIG' : 'SECONDARY RIG'}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400">
                      {isLocalIpAddress(customVideoId) ? 'HOME LAN' : 'CUSTOM FEED'}
                    </span>
                  </div>

                  <h4 className="font-display-tactical text-sm font-bold text-cyan-300 truncate">
                    {isLocalIpAddress(customVideoId) ? `Local IP Camera (${formatLocalIpUrl(customVideoId)})` : `Secondary Field Feed (${customVideoId})`}
                  </h4>

                  <p className="text-[11px] text-neutral-300 font-sans">
                    {isLocalIpAddress(customVideoId)
                      ? 'Local Wi-Fi static IP camera feed. Accessible directly on your home network.'
                      : 'Custom stream feed connected via YouTube/IP address.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] font-mono-tactical w-full">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCustomVideoId('');
                    }}
                    className="text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                  >
                    Disconnect
                  </button>
                  {isLocalIpAddress(customVideoId) ? (
                    <a
                      href={formatLocalIpUrl(customVideoId)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 underline cursor-pointer"
                    >
                      <span>Open Cam Web UI</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-cyan-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> ON AIR
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Custom Stream Input Box */}
          {showCustomInput && (
            <div className="p-3.5 bg-neutral-900/95 border border-neutral-800 rounded-xl space-y-3 text-xs font-mono-tactical animate-fadeIn">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-neutral-300 font-bold flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-amber-400" />
                  <span>Connect Stream &amp; YouTube Channel Links</span>
                </span>
                <span className="text-[10px] text-neutral-400">YouTube stream ID, Channel URL, or local IP</span>
              </div>

              {/* Input 1: Video / Stream Link */}
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 font-medium">Camera Livestream URL / Studio ID / IP:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Paste YouTube Stream ID, URL (watch / studio / live), or Local IP..."
                    value={customVideoId}
                    onChange={(e) => {
                      let val = e.target.value.trim();
                      if (isRtmpStreamKeyOrUrl(val)) {
                        setActiveStreamKey(val);
                      } else if (!isLocalIpAddress(val)) {
                        val = extractYouTubeVideoId(val);
                      }
                      setCustomVideoId(val);
                    }}
                    className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-mono text-xs"
                  />
                  {customVideoId && (
                    <button
                      onClick={() => setCustomVideoId('')}
                      className="text-neutral-400 hover:text-rose-400 px-2 cursor-pointer font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Input 2: YouTube Channel URL */}
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 font-medium">YouTube Channel URL / Handle (@name) / Channel ID (UC...):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Paste YouTube Channel URL (e.g. https://youtube.com/@channel or UC...)..."
                    value={customChannelInput}
                    onChange={(e) => setCustomChannelInput(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-500 font-mono text-xs"
                  />
                  <a
                    href={resolvedChannelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shadow-sm"
                  >
                    <span>Visit Channel ↗</span>
                  </a>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="text-neutral-500">Quick link:</span>
                <button
                  type="button"
                  onClick={() => {
                    tacticalAudio.playRadarPing(880);
                    setCustomVideoId(stationPrimaryVideoId);
                  }}
                  className="px-2 py-0.5 rounded bg-neutral-950 hover:bg-neutral-800 border border-emerald-500/50 text-emerald-300 font-mono text-[10px] cursor-pointer transition-colors"
                >
                  + Official Station Cam ({stationPrimaryVideoId})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barbury Castle Summit Live Weather & Ridge Telemetry Bar */}
      <div className="bg-neutral-950/90 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-4 shadow-xl space-y-3 font-mono-tactical text-xs animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-850 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <CloudSun className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display-tactical text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-100">
                  Barbury Castle Summit Live Weather &amp; Ridge Telemetry (268m ASL)
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <span className="text-[10px] text-neutral-400 font-sans">
                Wessex Downland Scarp Micro-Climate • The Ridgeway National Trail Check
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-neutral-400 shrink-0">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              SOARING LIFT: {barburyWeather.soaringLiftRating}
            </span>
            <span>•</span>
            <span className="text-neutral-400">{barburyWeather.lastUpdated}</span>
            <button
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                loadBarburyWeather();
              }}
              disabled={isWeatherRefreshing}
              className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-cyan-300 border border-neutral-750 cursor-pointer transition-all active:scale-95"
              title="Refresh live summit weather from Open-Meteo & UK Met Office"
            >
              <RefreshCw className={`w-3 h-3 text-cyan-400 ${isWeatherRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 6-Metric Weather Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
          {/* 1. Temp & Windchill */}
          <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-0.5">
            <span className="text-[9px] text-neutral-500 uppercase tracking-wider block">SUMMIT TEMP</span>
            <div className="text-base font-bold text-neutral-100 flex items-baseline gap-1">
              <span>{barburyWeather.temperatureC}°C</span>
              <span className="text-[10px] font-normal text-neutral-400">({barburyWeather.windChillC}°C chill)</span>
            </div>
          </div>

          {/* 2. Wind & Gusts */}
          <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-0.5">
            <span className="text-[9px] text-neutral-500 uppercase tracking-wider block">SCARP WIND</span>
            <div className="text-base font-bold text-cyan-300 flex items-baseline gap-1">
              <span>{barburyWeather.windSpeedKt} kt</span>
              <span className="text-[10px] text-amber-400 font-semibold">G{barburyWeather.windGustKt}</span>
              <span className="text-[10px] text-neutral-400 font-normal">({barburyWeather.windDirection})</span>
            </div>
          </div>

          {/* 3. Cloud Base */}
          <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-0.5">
            <span className="text-[9px] text-neutral-500 uppercase tracking-wider block">CLOUD CEILING</span>
            <div className="text-base font-bold text-emerald-400 flex items-baseline gap-1">
              <span>{barburyWeather.cloudBaseM}m</span>
              <span className="text-[10px] text-neutral-400 font-normal">AGL</span>
            </div>
          </div>

          {/* 4. Visibility */}
          <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-0.5">
            <span className="text-[9px] text-neutral-500 uppercase tracking-wider block">SCARP VISIBILITY</span>
            <div className="text-base font-bold text-neutral-100 flex items-baseline gap-1">
              <span>{barburyWeather.visibilityKm} km</span>
              <span className="text-[10px] text-emerald-400 font-normal">Downland</span>
            </div>
          </div>

          {/* 5. Pressure */}
          <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-0.5">
            <span className="text-[9px] text-neutral-500 uppercase tracking-wider block">BAROMETER</span>
            <div className="text-base font-bold text-neutral-100 flex items-baseline gap-1">
              <span>{barburyWeather.pressureHpa}</span>
              <span className="text-[10px] text-neutral-400 font-normal">hPa ({barburyWeather.pressureTendency})</span>
            </div>
          </div>

          {/* 6. Current Preset Zone */}
          <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-0.5">
            <span className="text-[9px] text-amber-400 uppercase tracking-wider block">CAMERA FOCAL TARGET</span>
            <div className="text-xs font-bold text-amber-300 truncate mt-1">
              {activePtzPreset.icon} {activePtzPreset.shortName}
            </div>
          </div>
        </div>

        {/* Walker & Spotter Advisory Note */}
        <div className="p-2.5 rounded-xl bg-neutral-900/50 border border-neutral-800/80 text-[11px] font-sans flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-mono-tactical font-bold text-[10px] uppercase tracking-wide">
              🥾 RIDGEWAY ADVISORY:
            </span>
            <span className="text-neutral-300">
              {barburyWeather.walkerAdvisory}
            </span>
          </div>
          <span className="text-[10px] font-mono-tactical text-neutral-500 shrink-0 hidden md:inline">
            Summit 268m ASL • Sky: {barburyWeather.cloudCover}
          </span>
        </div>
      </div>

      {/* Main Grid: YouTube Optical Stage (Left) + RSS Dispatches Wire (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Video Player & Tactical Telephoto HUD */}
        <div className="lg:col-span-7 space-y-3">
          {/* Tactical Optics & Camera Control Bar (Always visible above video on all screen sizes) */}
          <div className="bg-neutral-950/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-2.5 sm:px-4 sm:py-3 shadow-xl flex flex-wrap items-center justify-between gap-2.5 font-mono-tactical text-xs">
            {/* Quick Prev / Next Camera Navigation or Station Badge */}
            <div className="flex items-center gap-2">
              {channels.length > 1 || customVideoId ? (
                <>
                  <button
                    id="cam-prev-btn"
                    onClick={handlePrevChannel}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    title="Switch to Previous Camera Station"
                  >
                    <ChevronLeft className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline font-bold text-[11px]">Prev</span>
                  </button>

                  <div className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-amber-300 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{customVideoId ? 'CAM 02 (Custom)' : 'CAM 01 (Barbury)'}</span>
                  </div>

                  <button
                    id="cam-next-btn"
                    onClick={handleNextChannel}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    title="Switch to Next Camera Station"
                  >
                    <span className="hidden sm:inline font-bold text-[11px]">Next</span>
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  </button>
                </>
              ) : (
                <div className="px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-750 text-[11px] text-amber-300 font-bold flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>CAM 01 &bull; Barbury Castle 30x Optical Rig (Official Feed)</span>
                </div>
              )}
            </div>

            {/* In-Frame Optics Controls: Reticle & Filter */}
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              <button
                id="optics-reticle-toggle-btn"
                onClick={() => {
                  tacticalAudio.playRadarPing(800);
                  setIsReticleActive(!isReticleActive);
                }}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono-tactical flex items-center gap-1.5 transition-all cursor-pointer ${
                  isReticleActive
                    ? 'bg-amber-500/25 border-amber-500 text-amber-300 font-bold shadow-sm'
                    : 'bg-neutral-900 border-neutral-750 text-neutral-400 hover:text-neutral-200'
                }`}
                title="Toggle Rangefinder Reticle & Azimuth Overlay"
              >
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>Reticle: {isReticleActive ? 'ON' : 'OFF'}</span>
              </button>

              <button
                id="optics-filter-toggle-btn"
                onClick={() => {
                  tacticalAudio.playRadarPing(850);
                  const modes: Array<'Standard' | 'Chalk Contrast' | 'Low-Light Twilight'> = ['Standard', 'Chalk Contrast', 'Low-Light Twilight'];
                  const next = modes[(modes.indexOf(opticalFilterMode) + 1) % modes.length];
                  setOpticalFilterMode(next);
                }}
                className="px-2.5 py-1.5 rounded-xl border border-neutral-750 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-300 text-[11px] font-mono-tactical flex items-center gap-1.5 transition-all cursor-pointer"
                title="Cycle Optical Filters for Chalk Contrast and Twilight Raptor Silhouettes"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Filter: {opticalFilterMode}</span>
              </button>
            </div>
          </div>

          <div className="relative aspect-video w-full bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl group">
            {isLocalIpAddress(activeVideoId) ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-5 sm:p-8 text-center bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 text-neutral-200 space-y-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-500/10">
                  <Wifi className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse" />
                </div>

                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    <span className="text-[10px] sm:text-[11px] font-mono-tactical font-bold text-cyan-300 uppercase tracking-wider">
                      LOCAL HOME NETWORK CAMERA (STATIC IP)
                    </span>
                  </div>
                  <h3 className="font-display-tactical text-base sm:text-xl font-bold text-neutral-100 font-mono">
                    {formatLocalIpUrl(activeVideoId)}
                  </h3>
                  <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                    This camera is on your private home network. Modern web browsers block secure HTTPS websites from embedding insecure HTTP local devices in iframes, but you can launch your camera's live dashboard directly in a new tab:
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <a
                    href={formatLocalIpUrl(activeVideoId)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-display-tactical text-xs font-bold tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    <span>Open Camera Live View ({formatLocalIpUrl(activeVideoId)})</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => {
                      tacticalAudio.playRadarPing(800);
                      setCustomVideoId('');
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-neutral-300 hover:text-amber-300 text-xs font-mono-tactical transition-colors cursor-pointer"
                  >
                    Return to Station Cam (CAM 01)
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-400 max-w-lg text-left space-y-1.5 font-sans">
                  <span className="text-amber-300 font-bold flex items-center gap-1 font-mono-tactical text-[10px]">
                    <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>BROADCASTING TO OTHER OBSERVERS:</span>
                  </span>
                  <p className="leading-relaxed">
                    To let all RaptorLens birders across Britain watch your camera feed: grab the camera's RTSP stream (e.g. using free OBS Studio on your home PC or your camera's RTMP setting) and stream it to YouTube Live (public or unlisted), then paste that stream URL here.
                  </p>
                </div>
              </div>
            ) : (
              <iframe
                title={currentChannel.title}
                src={activeEmbedSrc}
                className={`w-full h-full border-0 transition-all duration-300 ${
                  opticalFilterMode === 'Chalk Contrast'
                    ? 'contrast-125 saturate-110'
                    : opticalFilterMode === 'Low-Light Twilight'
                    ? 'brightness-110 contrast-115 hue-rotate-15'
                    : ''
                }`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            )}

            {/* Tactical Stream HUD Overlay (Top-Left) */}
            <div className="absolute top-3 left-3 pointer-events-none bg-neutral-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-700/60 flex items-center gap-2 text-[10px] font-mono-tactical text-neutral-200 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-rose-400 font-bold uppercase">OPTICAL TELEMETRY</span>
              <span className="text-neutral-600">|</span>
              <span className="text-amber-300 font-bold">{activePtzPreset.zoom}</span>
              <span className="text-neutral-600">|</span>
              <span>{activePtzPreset.distanceKm} Range</span>
            </div>

            {/* Tactical PTZ Preset & Auto-Patrol Badge (Top-Right) */}
            <div className="absolute top-3 right-3 pointer-events-none bg-neutral-950/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-neutral-700/60 flex items-center gap-2 text-[10px] font-mono-tactical shadow-xl">
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <span>{activePtzPreset.icon}</span>
                <span>{activePtzPreset.shortName}</span>
              </span>
              {isAutoPatrolActive && (
                <>
                  <span className="text-neutral-600">|</span>
                  <span className="text-cyan-400 font-mono text-[9px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    Patrol: {patrolCountdown}s
                  </span>
                </>
              )}
            </div>

            {/* Permanent CHALK Station Bug & Copyright Protection Watermark (Bottom-Left) */}
            <div className="absolute bottom-3 left-3 pointer-events-none bg-neutral-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-neutral-800 flex items-center gap-2 text-[9px] font-mono-tactical text-neutral-300 select-none shadow-lg">
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-bold">
                CHALK-01
              </span>
              <span className="text-neutral-200 font-bold">RAPTORLENS</span>
              <span className="text-neutral-600">•</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                GDPR MASKED
              </span>
              <span className="text-neutral-600">•</span>
              <span className="text-neutral-500">&copy; CHALK</span>
            </div>

            {/* Tactical Crosshair / Optical Rangefinder Reticle (Toggleable) */}
            {isReticleActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Center crosshairs */}
                <div className="relative w-24 h-24 border border-amber-500/25 rounded-full flex items-center justify-center">
                  <div className="w-full h-[1px] bg-amber-500/30"></div>
                  <div className="h-full w-[1px] bg-amber-500/30 absolute"></div>
                  <div className="w-2 h-2 border border-amber-400/60 rounded-full"></div>
                </div>
                {/* Milliradian Rangefinder Ticks */}
                <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-3 font-mono-tactical text-[8px] text-amber-400/40 select-none">
                  <span>+10 MIL</span>
                  <span>+05 MIL</span>
                  <span className="text-amber-400 font-bold">00 HORIZON</span>
                  <span>-05 MIL</span>
                  <span>-10 MIL</span>
                </div>
                {/* Sector Bearing Compass Overlay at bottom-center */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-neutral-950/90 backdrop-blur-md border border-neutral-700/70 px-2.5 py-1 rounded-lg text-[9px] font-mono-tactical text-neutral-300 flex items-center gap-2 select-none shadow-lg">
                  <Compass className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-300 font-bold">AZIMUTH: {activePtzPreset.azimuth}</span>
                  <span className="text-neutral-500">|</span>
                  <span className="truncate max-w-[200px] sm:max-w-none">{activePtzPreset.target.toUpperCase()}</span>
                </div>
              </div>
            )}
          </div>

          {/* PTZ Guard Tour & Preset Controller */}
          <div className="bg-neutral-950/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-3.5 shadow-xl space-y-2.5 font-mono-tactical text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-850 pb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <span className="font-display-tactical font-bold text-neutral-200 uppercase text-xs">
                  PTZ Guard Tour &amp; Focal Presets (Active Patrol):
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleAutoPatrol}
                  className={`px-3 py-1 rounded-xl border text-[11px] font-mono-tactical flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${
                    isAutoPatrolActive
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Toggle automated cruise tour between the 4 downland presets"
                >
                  {isAutoPatrolActive ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-neutral-400" />}
                  <span>{isAutoPatrolActive ? `Auto-Patrol (${patrolCountdown}s)` : 'Resume Auto-Patrol'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              {BARBURY_PTZ_PRESETS.map((preset) => {
                const isSelected = activePtzPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-neutral-100 shadow-md ring-2 ring-amber-500/40'
                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-neutral-200 text-xs">
                        <span>{preset.icon}</span>
                        <span className="truncate">{preset.shortName}</span>
                      </span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-1">
                      <span>{preset.zoom}</span>
                      <span>{preset.azimuth.split(' ')[0]}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active preset details */}
            <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-sans">
              <div>
                <strong className="text-amber-400 font-mono-tactical text-xs">{activePtzPreset.name}:</strong>{' '}
                <span className="text-neutral-300">{activePtzPreset.description}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono-tactical text-neutral-400">
                <span className="text-neutral-500">Typical:</span>
                <span className="text-neutral-200 font-bold">{activePtzPreset.typicalSpecies.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Bar Under Video: Log Sighting on Cam & Telemetry Summary */}
          <div className="bg-neutral-950/85 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 space-y-3 font-mono-tactical text-xs shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-850 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display-tactical text-base font-bold text-neutral-100">
                    {currentChannel.title}
                  </h3>
                  {currentChannel.isCommunityFieldCam && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      BARBURY FIELD RIG
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-amber-400 font-bold block mt-0.5">
                  Elevation: {currentChannel.elevation} • Target: Barbury Castle Country Park (3.0 km distance)
                </span>
              </div>

              {/* Instant Action Buttons: Spotted on Cam + Educational ID Wizard */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    tacticalAudio.playRadarPing(900);
                    setShowEducationalIdModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 font-display-tactical text-xs font-bold tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
                  title="3-Step Educational Cam Identification Wizard & Downland Raptor Quiz"
                >
                  <GraduationCap className="w-4 h-4 text-cyan-400" />
                  <span>Identify on Cam</span>
                </button>

                <button
                  onClick={() => {
                    tacticalAudio.playRadarPing(920);
                    setShowQuickSpotModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-display-tactical text-xs font-bold tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  <Binoculars className="w-4 h-4" />
                  Spotted on Cam!
                </button>
              </div>
            </div>

            <p className="text-neutral-300 text-xs leading-relaxed font-sans">
              {currentChannel.description}
            </p>

            {/* Downland Weather & Solar Thermal Micro-Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono-tactical text-[11px]">
              <div className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <span className="text-[9px] uppercase tracking-wider text-neutral-500 block">OPTICAL HARDWARE</span>
                <span className="text-neutral-200 font-bold">{currentChannel.opticalZoom || '30x Optical Zoom'}</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <span className="text-[9px] uppercase tracking-wider text-neutral-500 block">TARGET BEARING</span>
                <span className="text-amber-400 font-bold">{currentChannel.panBearing || '195° SSW Escarpment'}</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <span className="text-[9px] uppercase tracking-wider text-neutral-500 block">THERMAL SOARING</span>
                <span className="text-emerald-400 font-bold">OPTIMAL (11:00-16:00)</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <span className="text-[9px] uppercase tracking-wider text-neutral-500 block">PRIVACY &amp; MASKING</span>
                <span className="text-emerald-400 font-bold">HARDWARE 3D MASKED</span>
              </div>
            </div>

            {/* Chalk Station Legal & Technical Banner */}
            <div className="p-2.5 rounded-xl bg-neutral-900/50 border border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono-tactical text-neutral-400">
              <span className="flex items-center gap-1.5 text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <strong>Chalk Station 01</strong>: Barbury Escarpment North Relay
              </span>
              <div className="flex items-center gap-3">
                <span className="text-neutral-500 hidden sm:inline">
                  GDPR/ICO Compliant • Skyline Elevation Bound • &copy; CHALK
                </span>
                {onOpenContact && (
                  <button
                    onClick={() => {
                      tacticalAudio.playRadarPing(850);
                      onOpenContact();
                    }}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Contact Operators</span>
                  </button>
                )}
              </div>
            </div>

            {/* Footer Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-850 text-neutral-400 text-[10px]">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span className="text-neutral-300">{currentChannel.location}</span>
                <span>•</span>
                <span>GRID: {currentChannel.gridRef}</span>
              </div>
              <button
                onClick={() => {
                  tacticalAudio.playRadarPing(880);
                  onLocateHotspot('barbury-castle');
                }}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-bold"
              >
                Fly to Barbury Castle on Map &rarr;
              </button>
            </div>
          </div>

          {/* Live Cam Community Spotter Log (Recent Raptor Detections from Stream Observers) */}
          <div className="bg-neutral-950/85 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-2.5">
              <div className="flex items-center gap-2">
                <Binoculars className="w-4 h-4 text-amber-400" />
                <h3 className="font-display-tactical text-sm font-bold text-neutral-100 uppercase tracking-wide">
                  Live Cam Spotter Reel ({currentChannelReports.length} Detections)
                </h3>
              </div>
              <span className="text-[10px] font-mono-tactical text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                COMMUNITY WATCH
              </span>
            </div>

            {currentChannelReports.length === 0 ? (
              <p className="text-xs text-neutral-400 italic py-2">
                No sightings flagged on camera in the last 2 hours. Keep watch across the ramparts and hit "Spotted on Cam!" when you see a raptor.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {currentChannelReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-2.5 rounded-xl bg-neutral-900/70 border border-neutral-800/80 hover:border-amber-500/40 transition-colors space-y-1 font-mono-tactical text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-neutral-100 flex items-center gap-1.5">
                        <span className="text-amber-400">●</span> {report.count}x {report.speciesName}
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-amber-300 border border-neutral-700">
                          {report.sectorQuadrant}
                        </span>
                      </span>
                      <span className="text-[10px] text-neutral-400">{report.timeAgo}</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 font-sans leading-relaxed">
                      {report.description}
                    </p>
                    <div className="flex items-center justify-between text-[9px] text-neutral-500 pt-0.5">
                      <span>Observer: {report.callsign}</span>
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Cam Logged
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Channel RSS Feed Dispatches */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-neutral-950/85 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-2.5">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <h3 className="font-display-tactical text-base font-bold text-neutral-100">
                  Community Notices &amp; Live Wire
                </h3>
              </div>
              <span className="text-[10px] font-mono-tactical text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                LIVE WIRE
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono-tactical">
              {['ALL', 'SIGHTING ALERT', 'MIGRATION SURGE', 'THERMAL WATCH', 'FIELD BULLETIN'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    tacticalAudio.playRadarPing(800);
                    setActiveCategory(cat);
                  }}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                    activeCategory === cat
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                      : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Dispatches Stream List */}
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {filteredDispatches.map((dispatch) => (
                <div
                  key={dispatch.id}
                  className="bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/50 rounded-xl p-3.5 transition-all space-y-2 group shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-mono-tactical font-bold ${
                          dispatch.priority === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : dispatch.priority === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                        }`}
                      >
                        {dispatch.category}
                      </span>
                      {dispatch.verified && (
                        <span className="flex items-center gap-0.5 text-[9px] font-mono-tactical text-emerald-400">
                          <ShieldCheck className="w-3 h-3" /> VERIFIED
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono-tactical text-neutral-400">
                      {dispatch.timeAgo}
                    </span>
                  </div>

                  <h4 className="font-display-tactical text-xs font-bold text-neutral-100 group-hover:text-amber-300 transition-colors leading-snug">
                    {dispatch.title}
                  </h4>

                  <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
                    {dispatch.summary}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono-tactical text-neutral-400 pt-1.5 border-t border-neutral-800">
                    <span className="text-neutral-500 truncate max-w-[180px]">
                      {dispatch.author}
                    </span>
                    {dispatch.hotspotRef && (
                      <button
                        onClick={() => {
                          tacticalAudio.playRadarPing(880);
                          onLocateHotspot(dispatch.hotspotRef!);
                        }}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer shrink-0 font-bold"
                      >
                        <MapPin className="w-2.5 h-2.5" /> Sector Map
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* "Spotted on Cam!" Quick Sighting Modal */}
      {showQuickSpotModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/85 backdrop-blur-md p-4 flex justify-center items-start overscroll-contain">
          <div className="w-full max-w-md my-4 sm:my-8 bg-neutral-950 border border-amber-500/50 rounded-2xl p-5 shadow-2xl space-y-4 font-mono-tactical text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Binoculars className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-display-tactical text-base font-bold text-neutral-100">
                    Spotted on Live Cam
                  </h3>
                  <span className="text-[10px] text-amber-400">
                    30x Telephoto Stream • Facing Barbury Castle (3km range)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowQuickSpotModal(false)}
                className="text-neutral-400 hover:text-neutral-200 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickSpotSubmit} className="space-y-3">
              <div>
                <label className="text-neutral-300 block mb-1 font-bold">SPECIES DETECTED</label>
                <select
                  value={quickSpotSpecies}
                  onChange={(e) => setQuickSpotSpecies(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-amber-500 font-sans"
                >
                  <option value="Red Kite">Red Kite (Milvus milvus)</option>
                  <option value="Common Buzzard">Common Buzzard (Buteo buteo)</option>
                  <option value="Common Kestrel">Common Kestrel (Falco tinnunculus)</option>
                  <option value="Peregrine Falcon">Peregrine Falcon (Falco peregrinus)</option>
                  <option value="Eurasian Hobby">Eurasian Hobby (Falco subbuteo)</option>
                  <option value="Hen Harrier">Hen Harrier (Circus cyaneus)</option>
                  <option value="Short-eared Owl">Short-eared Owl (Asio flammeus)</option>
                  <option value="Barn Owl">Barn Owl (Tyto alba)</option>
                  <option value="Unidentified Raptor">Unidentified Raptor (Needs Peer Check)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 block mb-1 font-bold">INDIVIDUAL COUNT</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={quickSpotCount}
                    onChange={(e) => setQuickSpotCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-neutral-300 block mb-1 font-bold">CAM QUADRANT</label>
                  <select
                    value={quickSpotQuadrant}
                    onChange={(e) => setQuickSpotQuadrant(e.target.value as any)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2 text-neutral-100 focus:outline-none focus:border-amber-500 font-sans"
                  >
                    <option value="Northern Ramparts">Northern Ramparts</option>
                    <option value="North-West Escarpment">North-West Escarpment</option>
                    <option value="Chalk Valley Bottom">Chalk Valley Bottom</option>
                    <option value="High Airspace">High Airspace (&gt;300m)</option>
                    <option value="Tree Line">Tree Line / Gallops</option>
                    <option value="Boundary Fence Post">Boundary Fence Post</option>
                    <option value="Garden Perch / Roost">Garden Perch / Roost Post</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-neutral-300 block mb-1 font-bold">QUICK NOTES / SIGHTING BEHAVIOUR</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Buzzard resting on fence post preening, or Kestrel surveying grass for voles..."
                  value={quickSpotDescription}
                  onChange={(e) => setQuickSpotDescription(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-amber-500 resize-none font-sans text-xs"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-[10px] text-neutral-400 space-y-1">
                <span className="text-amber-300 font-bold block">Telemetry Stamp:</span>
                <p>
                  Logged from 30x Optical Telephoto Feed • Azimuth 195° SSW • Observer: <strong>{currentCallsign}</strong>. Will post to the live cam spotter log and channel RSS wire.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowQuickSpotModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-display-tactical flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Check className="w-3.5 h-3.5" /> Submit Cam Sighting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Dispatch Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/85 backdrop-blur-md p-4 flex justify-center items-start overscroll-contain">
          <div className="w-full max-w-lg my-4 sm:my-8 bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4 font-mono-tactical text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <h3 className="font-display-tactical text-base font-bold text-neutral-100">
                  Transmit Live Field Dispatch
                </h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-3">
              <div>
                <label className="text-neutral-400 block mb-1 font-bold">DISPATCH HEADLINE</label>
                <input
                  type="text"
                  placeholder="e.g. OSPREY PASSAGE MIGRATION OVER HACKPEN RIDGE..."
                  value={newDispatchTitle}
                  onChange={(e) => setNewDispatchTitle(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-amber-500 uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-400 block mb-1 font-bold">CATEGORY</label>
                  <select
                    value={newDispatchCategory}
                    onChange={(e) => setNewDispatchCategory(e.target.value as any)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2 text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="SIGHTING ALERT">SIGHTING ALERT</option>
                    <option value="MIGRATION SURGE">MIGRATION SURGE</option>
                    <option value="THERMAL WATCH">THERMAL WATCH</option>
                    <option value="NESTING STATUS">NESTING STATUS</option>
                    <option value="FIELD BULLETIN">FIELD BULLETIN</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1 font-bold">PRIORITY</label>
                  <select
                    value={newDispatchPriority}
                    onChange={(e) => setNewDispatchPriority(e.target.value as any)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2 text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-bold">HOTSPOT / SECTOR</label>
                <select
                  value={newDispatchHotspot}
                  onChange={(e) => setNewDispatchHotspot(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2 text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="barbury-castle">Barbury Castle Country Park</option>
                  <option value="hackpen-hill">Hackpen Hill &amp; White Horse</option>
                  <option value="avebury-henge">Avebury Henge &amp; Stone Circle</option>
                  <option value="fyfield-down">Fyfield Down Nature Reserve</option>
                  <option value="silbury-hill">Silbury Hill &amp; Kennet Basin</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-bold">DISPATCH SUMMARY / FIELD REPORT</label>
                <textarea
                  rows={3}
                  placeholder="Detail exact flight trajectory, number of individuals, behaviour, optical gear..."
                  value={newDispatchSummary}
                  onChange={(e) => setNewDispatchSummary(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-amber-500 resize-none font-sans"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-display-tactical flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Send className="w-3.5 h-3.5" /> Broadcast Wire
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Educational Cam Identification Wizard & Daily Downland Quiz Modal */}
      <EducationalCamIdModal
        isOpen={showEducationalIdModal}
        onClose={() => setShowEducationalIdModal(false)}
        onLogIdentifiedSpecies={handleLogIdentifiedSpecies}
        currentCallsign={currentCallsign}
      />

      {/* Station Operator Guide: PTZ Guard Tour, Solar Power & Traffic Playbook */}
      <StationCamOperatorGuideModal
        isOpen={showOperatorGuideModal}
        onClose={() => setShowOperatorGuideModal(false)}
      />

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
                Your camera link was entered as <code className="text-amber-300 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800 font-mono text-[11px]">{activeVideoId}</code>. In YouTube, embedded website streams require 3 quick checks:
              </p>

              <div className="space-y-2.5 font-mono-tactical text-[11px]">
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span>1. Encoder Not Streaming Yet:</span>
                  </div>
                  <p className="font-sans text-neutral-400">
                    YouTube Studio creates the link ahead of time, but the player stays black until your camera or OBS streaming software clicks <strong>"Start Streaming"</strong> and sends video packets to YouTube.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span>2. Stream Visibility Must Be "Public" or "Unlisted":</span>
                  </div>
                  <p className="font-sans text-neutral-400">
                    If set to <strong>"Private"</strong> in YouTube Studio, YouTube blocks embedding on other websites. Set it to <strong>"Public"</strong> (visible everywhere) or <strong>"Unlisted"</strong> (only visible on your website).
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span>3. Enable "Allow Embedding":</span>
                  </div>
                  <p className="font-sans text-neutral-400">
                    In YouTube Studio &gt; Stream Settings &gt; Additional Settings &gt; make sure the <strong>"Allow embedding"</strong> box is checked.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 space-y-1 text-xs">
                <span className="font-bold flex items-center gap-1.5 font-mono-tactical text-[11px] text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verify Website Video Playback Right Now:</span>
                </span>
                <p className="font-sans text-neutral-300 text-[11px]">
                  Click <strong>"Test Demo Stream"</strong> to verify that this website and your browser play video and audio with full 4K optics controls!
                </p>
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
                    tacticalAudio.playRadarPing(920);
                    setStreamMode('demo');
                    setShowTroubleshootModal(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono-tactical cursor-pointer transition-colors shadow-sm"
                >
                  Test Demo Stream ▶
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
