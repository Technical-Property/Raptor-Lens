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
  Download
} from 'lucide-react';
import { LivestreamCam, RssDispatch } from '../types/raptor';
import { LIVESTREAM_CHANNELS } from '../data/livestreams';
import { BARBURY_PTZ_PRESETS, BARBURY_SUMMIT_WEATHER } from '../data/camPresets';
import { tacticalAudio } from '../utils/audio';
import { SectorId } from '../types/sector';
import { 
  extractYouTubeVideoId, 
  extractYouTubeChannelInfo, 
  getYouTubeChannelUrl, 
  buildYouTubeEmbedSrc,
  StreamPlayMode,
  DEFAULT_CAMERA_VIDEO_ID,
  DEMO_NATURE_VIDEO_ID,
  POPULAR_CAMERA_PRESETS,
  PEREGRINE_UK_VIDEO_ID,
  EAGLE_LIVE_VIDEO_ID,
  isLocalIpAddress,
  formatLocalIpUrl,
  HIKVISION_CAMERA_LAN_IP,
  HIKVISION_NVR_LAN_IP,
  isRtmpStreamKeyOrUrl
} from '../utils/youtube';

interface SummitTrailConditionsViewProps {
  onSwitchToRadar: () => void;
  onOpenLogModal: (locationGuess?: string) => void;
  onOpenGuide: () => void;
  activeSectorId?: SectorId;
  currentCallsign?: string;
  onAddDispatch?: (dispatch: RssDispatch) => void;
}

export const SummitTrailConditionsView: React.FC<SummitTrailConditionsViewProps> = ({
  onSwitchToRadar,
  onOpenLogModal,
  onOpenGuide,
  activeSectorId = 'ridgeway-wessex',
  currentCallsign = 'RIDGE-WALKER',
  onAddDispatch,
}) => {
  const currentCam = LIVESTREAM_CHANNELS[0];
  const [customVideoId, setCustomVideoId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('raptorlens_custom_cam') || '';
      // Ensure previous placeholder IDs migrate to the official wUmvCR2YBMQ stream
      if (saved === '9gkrkcqHQ78' || saved === 'GAxREl6-fJs') return DEFAULT_CAMERA_VIDEO_ID;
      return saved;
    } catch {
      return '';
    }
  });
  const [customChannelInput, setCustomChannelInput] = useState<string>(() => {
    try {
      return localStorage.getItem('raptorlens_channel_url') || '';
    } catch {
      return '';
    }
  });
  const [streamMode, setStreamMode] = useState<StreamPlayMode>(() => {
    try {
      const saved = localStorage.getItem('raptorlens_stream_mode');
      if (saved === 'video' || saved === 'channel' || saved === 'demo' || saved === 'webcam') return saved;
      return 'video';
    } catch {
      return 'video';
    }
  });
  const [showFeedInput, setShowFeedInput] = useState<boolean>(false);
  const [showTroubleshootModal, setShowTroubleshootModal] = useState<boolean>(false);
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'parking' | 'distances' | 'dispatches'>('parking');
  const [activeTrailDistance, setActiveTrailDistance] = useState<'hackpen' | 'avebury' | 'liddington' | 'fyfield'>('hackpen');
  const [showQuickSpotModal, setShowQuickSpotModal] = useState<boolean>(false);
  const [quickSpotSpecies, setQuickSpotSpecies] = useState<string>('Red Kite');
  const [quickSpotCount, setQuickSpotCount] = useState<number>(1);
  const [quickSpotNotes, setQuickSpotNotes] = useState<string>('');

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

  const activeVideoId = customVideoId.trim() || currentCam.youtubeId || DEFAULT_CAMERA_VIDEO_ID;
  const channelInfo = extractYouTubeChannelInfo(customChannelInput || currentCam.channelUrl || '');
  const resolvedChannelUrl = getYouTubeChannelUrl(customChannelInput || currentCam.channelUrl, activeVideoId);
  const activeEmbedSrc = buildYouTubeEmbedSrc({
    videoId: activeVideoId,
    channelId: channelInfo.channelId,
    mode: streamMode,
  });

  const activePreset = BARBURY_PTZ_PRESETS[activePresetIndex] || BARBURY_PTZ_PRESETS[0];

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

    if (onAddDispatch) {
      const autoDispatch: RssDispatch = {
        id: `disp-trail-${Date.now()}`,
        title: `TRAIL SPOT: ${quickSpotCount}x ${quickSpotSpecies.toUpperCase()} AT BARBURY CASTLE`,
        timestamp: new Date().toISOString(),
        timeAgo: 'Just now',
        source: 'Barbury Ridge Trail Watch',
        category: 'SIGHTING ALERT',
        priority: 'HIGH',
        summary: quickSpotNotes.trim() || `Hiker spotted ${quickSpotCount}x ${quickSpotSpecies} overhead on the Ridgeway trail.`,
        hotspotRef: 'barbury-castle',
        author: `Trail Walker: ${currentCallsign}`,
        verified: true,
        speciesMentioned: [quickSpotSpecies],
      };
      onAddDispatch(autoDispatch);
    }

    setShowQuickSpotModal(false);
    setQuickSpotNotes('');
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto animate-fadeIn">
      {/* 1. Live Summit Camera & Optical Spotter Stage */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Stream Header & Clean Actions */}
        <div className="bg-neutral-900/95 border-b border-neutral-800 px-3.5 sm:px-4 py-2.5 flex items-center justify-between text-xs font-mono-tactical flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="font-bold text-neutral-100">
              {isLocalIpAddress(activeVideoId)
                ? 'Station Hardware (Local LAN)'
                : activeVideoId === DEFAULT_CAMERA_VIDEO_ID
                ? 'RaptorLens Station Cam (Rolling 4-View Tour)'
                : POPULAR_CAMERA_PRESETS.find((p) => p.videoId === activeVideoId)?.name || 'Live Raptor Camera'}
            </span>
            <span className="text-[10px] text-amber-300/90 hidden sm:inline">
              {activeVideoId === DEFAULT_CAMERA_VIDEO_ID
                ? '• Hackpen Hill • Barbury Fort • Field • Perch'
                : `• ${POPULAR_CAMERA_PRESETS.find((p) => p.videoId === activeVideoId)?.location || '24/7 Live Feed'}`}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct Channel Link */}
            <a
              href={resolvedChannelUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => tacticalAudio.playRadarPing(880)}
              className="bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              title="Open YouTube Live Broadcast in new tab"
            >
              <svg className="w-3.5 h-3.5 fill-current text-red-400" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span className="hidden sm:inline">YouTube ↗</span>
            </a>

            <button
              onClick={() => {
                tacticalAudio.playRadarPing(800);
                setShowTroubleshootModal(true);
              }}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Switch cameras or troubleshoot feed"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Camera Help</span>
            </button>

            <button
              onClick={() => {
                tacticalAudio.playRadarPing(760);
                setShowFeedInput(!showFeedInput);
              }}
              className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Configure station stream or explore guest raptor cameras"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-400" />
              <span>{showFeedInput ? 'Close' : 'All Cameras'}</span>
            </button>

            <button
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                setShowQuickSpotModal(true);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-neutral-950 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Log Spot</span>
            </button>
          </div>
        </div>

        {/* Station Cam + Free Live Raptor Cams Bar */}
        <div className="bg-neutral-900/90 border-b border-neutral-800 px-3.5 sm:px-4 py-2 flex items-center justify-between text-xs font-mono-tactical flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold mr-1">
              Live Feeds:
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
                  className={`px-2.5 py-1 rounded-lg border text-[10px] cursor-pointer transition-all flex items-center gap-1 ${
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

          <span className="text-[10px] text-neutral-400 hidden xl:inline">
            ID: <code className="text-amber-300 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">{activeVideoId}</code>
          </span>
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
                  Custom Stream Link, YouTube Video ID, or Station Hardware IP:
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      tacticalAudio.playRadarPing(860);
                      if (isDeviceCamActive) stopDeviceCamera();
                      setCustomVideoId(HIKVISION_CAMERA_LAN_IP);
                      setStreamMode('video');
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer transition-colors ${
                      customVideoId === HIKVISION_CAMERA_LAN_IP
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-cyan-400 hover:border-cyan-500/50'
                    }`}
                  >
                    📷 Cam (192.168.0.167)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      tacticalAudio.playRadarPing(860);
                      if (isDeviceCamActive) stopDeviceCamera();
                      setCustomVideoId(HIKVISION_NVR_LAN_IP);
                      setStreamMode('video');
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer transition-colors ${
                      customVideoId === HIKVISION_NVR_LAN_IP
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-cyan-400 hover:border-cyan-500/50'
                    }`}
                  >
                    🖥️ Hikvision NVR (192.168.0.188)
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Paste YouTube livestream URL (watch / live / studio), 11-char ID, or IP..."
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

              {isRtmpStreamKeyOrUrl(customVideoId) && (
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/50 text-[11px] text-amber-200 space-y-1 font-sans">
                  <div className="font-bold font-mono-tactical text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>RTMP Encoder Key Detected ({customVideoId})</span>
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    That key is your <strong>private YouTube encoder key</strong> used on your Linux relay box to push RTSP video from <code>192.168.0.167</code> / <code>192.168.0.188</code> to <code>rtmp://a.rtmp.youtube.com/live2</code>. Once your Linux stream is running, paste your <strong>public YouTube Share Link</strong> (e.g. <code>https://youtube.com/live/...</code>) here!
                  </p>
                </div>
              )}
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
          ) : isLocalIpAddress(activeVideoId) || isRtmpStreamKeyOrUrl(activeVideoId) ? (
            /* CASE B: Local Home Network IP Camera (Static IP) or RTMP Relay Setup */
            <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 text-neutral-200 space-y-3 overflow-y-auto">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-500/10 shrink-0">
                <Wifi className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-1 max-w-lg">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  <span className="text-[10px] font-mono-tactical font-bold text-cyan-300 uppercase tracking-wider">
                    HIKVISION DS-7608NXI-I2/8P/S • LAN &amp; LINUX RTMP RELAY
                  </span>
                </div>
                <h3 className="font-display-tactical text-base sm:text-lg font-bold text-neutral-100 font-mono">
                  {isLocalIpAddress(activeVideoId) ? formatLocalIpUrl(activeVideoId) : 'Linux FFmpeg → YouTube Live Relay'}
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  Access your local camera or Hikvision 4K NVR directly on your LAN, or bridge the RTSP stream via Linux FFmpeg to YouTube Live for public broadcast on <strong>raptorlens.org</strong>:
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <a
                  href={HIKVISION_CAMERA_LAN_IP}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-display-tactical text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  <span>Open Camera (192.168.0.167)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={HIKVISION_NVR_LAN_IP}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display-tactical text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <span>Open Hikvision NVR (192.168.0.188)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => {
                    tacticalAudio.playRadarPing(800);
                    setCustomVideoId(DEFAULT_CAMERA_VIDEO_ID);
                    setStreamMode('video');
                  }}
                  className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-neutral-300 hover:text-amber-300 text-xs font-mono-tactical transition-colors cursor-pointer"
                >
                  Return to Public Raptor Cam
                </button>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-[11px] text-neutral-300 max-w-xl text-left space-y-1.5 font-sans">
                <strong className="text-amber-300 block font-mono-tactical text-[10px]">
                  LINUX FFMPEG BRIDGE COMMAND (HIKVISION RTSP → YOUTUBE LIVE):
                </strong>
                <pre className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
{`ffmpeg -f lavfi -i anullsrc -rtsp_transport tcp \\
  -i "rtsp://admin:YOUR_PASSWORD@192.168.0.188:554/Streaming/Channels/101" \\
  -c:v copy -c:a aac -b:a 128k -shortest \\
  -f flv "rtmp://a.rtmp.youtube.com/live2/YOUR_STREAM_KEY"`}
                </pre>
              </div>
            </div>
          ) : (
            /* CASE C: Standard Embed Player */
            <>
              <iframe
                title="Barbury Castle Summit Live Cam"
                src={activeEmbedSrc}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />

              {/* Clean Camera Preset Label */}
              <div className="absolute bottom-2 left-2 pointer-events-none bg-neutral-950/85 backdrop-blur-md border border-neutral-800 px-2.5 py-1 rounded-lg text-[10px] font-mono-tactical text-neutral-300 flex items-center gap-2 shadow-lg">
                {activeVideoId === DEFAULT_CAMERA_VIDEO_ID ? (
                  <>
                    <span className="text-emerald-400 font-bold">ROLLING PTZ TOUR</span>
                    <span className="text-neutral-600">|</span>
                    <span>Focus: <strong className="text-amber-300">{activePreset.shortName}</strong></span>
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

        {/* Station Cam Rolling 4-View Tour Guide (or Guest Camera Info Strip) */}
        {activeVideoId === DEFAULT_CAMERA_VIDEO_ID ? (
          <div className="p-3 bg-neutral-900/90 border-t border-neutral-800 space-y-2.5 text-xs font-mono-tactical">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-neutral-200 font-bold text-[11px]">
                  Station Cam Rolling Tour (4 Automated Focus Zones):
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[9px] font-bold">
                  AUTO-CYCLING
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {BARBURY_PTZ_PRESETS.map((preset, idx) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      tacticalAudio.playRadarPing(800 + idx * 50);
                      setActivePresetIndex(idx);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] cursor-pointer transition-colors flex items-center gap-1 ${
                      activePresetIndex === idx
                        ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                        : 'bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-amber-300 hover:border-amber-500/40'
                    }`}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.shortName}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Rolling Zone Details */}
            <div className="p-2.5 rounded-xl bg-neutral-950/90 border border-neutral-800/90 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
              <div className="md:col-span-2 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-amber-400 font-bold">{activePreset.icon} {activePreset.name}</span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-cyan-300">{activePreset.zoom} ({activePreset.distanceKm}, {activePreset.azimuth})</span>
                </div>
                <p className="text-neutral-300 font-sans leading-relaxed">
                  {activePreset.description}
                </p>
              </div>
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-2 space-y-1 flex flex-col justify-center">
                <div className="text-[10px] text-neutral-400">
                  <strong className="text-amber-300">Target:</strong> {activePreset.target}
                </div>
                <div className="text-[10px] text-neutral-400">
                  <strong className="text-emerald-300">Key Species:</strong> {activePreset.typicalSpecies.join(', ')}
                </div>
              </div>
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

          <div className="flex items-center gap-2">
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

      {/* 2. The 3-Second Glanceable Summary Bar (Simple & Punchy) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono-tactical text-xs">
        {/* Pill 1: Ridge Wind */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-[10px]">
            <span>SUMMIT WIND</span>
            <Wind className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1">
            <div className="text-base sm:text-lg font-bold text-neutral-100">
              NW 14 <span className="text-xs font-normal text-neutral-400">kts</span>
            </div>
            <div className="text-[10px] text-amber-300">Gusts to 22 kts (Brisk)</div>
          </div>
        </div>

        {/* Pill 2: Visibility & Fog */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-[10px]">
            <span>HORIZON VIEW</span>
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1">
            <div className="text-base sm:text-lg font-bold text-emerald-400">
              Clear (35+ km)
            </div>
            <div className="text-[10px] text-neutral-300">Zero Summit Fog</div>
          </div>
        </div>

        {/* Pill 3: Temp & Air */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-[10px]">
            <span>TEMPERATURE</span>
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1">
            <div className="text-base sm:text-lg font-bold text-neutral-100">
              15.2°<span className="text-xs font-normal text-neutral-400">C</span>
            </div>
            <div className="text-[10px] text-cyan-300">Feels like 12.8°C at 268m</div>
          </div>
        </div>

        {/* Pill 4: Footing & Trailhead */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-[10px]">
            <span>TRAIL FOOTING</span>
            <Mountain className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1">
            <div className="text-base sm:text-lg font-bold text-neutral-100">
              Dry &amp; Firm <span className="text-emerald-400 text-xs font-normal">(9/10)</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold">Free Parking • Dawn-Dusk</div>
          </div>
        </div>
      </div>

      {/* 3. Clean Progressive Detail Tabs (No Endless Scrolling) */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Tab Headers */}
        <div className="flex items-center border-b border-neutral-850 bg-neutral-900/50 p-1.5 gap-1.5 font-mono-tactical text-xs">
          <button
            onClick={() => {
              tacticalAudio.playRadarPing(800);
              setActiveTab('parking');
            }}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'parking'
                ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Trailhead Parking &amp; Access</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(800);
              setActiveTab('distances');
            }}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'distances'
                ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Ridgeway Trail Distances</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(800);
              setActiveTab('dispatches');
            }}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'dispatches'
                ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Community Spotter Reports</span>
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

              <div className="bg-neutral-900/40 p-3 rounded-xl border border-neutral-850 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Sunset today: <strong className="text-neutral-100">18:48 BST</strong> (Golden hour starts 17:45)</span>
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

          {/* TAB 3: Recent Spotter Reports */}
          {activeTab === 'dispatches' && (
            <div className="space-y-3 font-mono-tactical text-xs">
              <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
                <span className="text-neutral-400">COMMUNITY TRAIL SIGHTINGS</span>
                <button
                  onClick={() => setShowQuickSpotModal(true)}
                  className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  + Add Sighting Report
                </button>
              </div>

              <div className="space-y-2">
                {[
                  {
                    species: 'Red Kite',
                    count: 4,
                    loc: 'Northern Ramparts',
                    time: '18 mins ago',
                    notes: 'Kettling in strong slope updraft over ditch.',
                    scout: 'DOWNS-ALPHA',
                  },
                  {
                    species: 'Common Kestrel',
                    count: 1,
                    loc: 'Hackpen Scarp Gallops',
                    time: '42 mins ago',
                    notes: 'Head-to-wind hovering at 15m surveying turf for voles.',
                    scout: 'RIDGEWAY-SCOUT',
                  },
                  {
                    species: 'Common Buzzard',
                    count: 2,
                    loc: 'Sarsen Perch Post',
                    time: '1 hr ago',
                    notes: 'Perched together on fence line drying feathers in breeze.',
                    scout: 'CHALK-WATCH',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-neutral-100 font-bold">
                        {item.count}x {item.species} <span className="text-[10px] text-amber-400 font-normal">({item.loc})</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 font-sans mt-0.5">{item.notes}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-neutral-400 text-[10px]">{item.time}</div>
                      <div className="text-emerald-400 text-[10px] font-bold">{item.scout}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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
