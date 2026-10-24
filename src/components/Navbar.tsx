import React, { useState, useEffect } from 'react';
import { 
  Crosshair, 
  Map, 
  Eye, 
  Radio, 
  Plus, 
  Volume2, 
  VolumeX, 
  Wind, 
  Compass, 
  Users, 
  Mountain, 
  HelpCircle,
  SunMedium,
  Moon,
  ShieldCheck,
  LogIn,
  Smartphone,
  Bug,
  Coffee,
  Scale,
  Mail,
  BarChart3,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';
import { getYouTubeChannelUrl, DEFAULT_CAMERA_VIDEO_ID } from '../utils/youtube';

import { SectorId } from '../types/sector';
import { UK_SECTORS } from '../data/sectors';

export type NavTab = 'map' | 'silhouette' | 'quiz' | 'sightings' | 'dispatches' | 'community';
export type SceneryMode = 'ridgeway' | 'soft-mist' | 'dark';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenLogModal: () => void;
  sightingsCount: number;
  unreadDispatchesCount: number;
  communitySkywatchesCount: number;
  sceneryMode: SceneryMode;
  onSceneryChange: (mode: SceneryMode) => void;
  backgroundVisibility: number;
  onBackgroundVisibilityChange: (val: number) => void;
  onOpenGuide: () => void;
  currentCallsign: string;
  onOpenRegister: () => void;
  onOpenLogin?: () => void;
  activeSectorId?: SectorId;
  onSelectSector?: (id: SectorId) => void;
  isLiteMode?: boolean;
  onToggleLiteMode?: () => void;
  onOpenBetaFeedback?: () => void;
  onOpenConfusionSolver?: () => void;
  onOpenLifeList?: () => void;
  onOpenDonate?: () => void;
  onOpenLegal?: () => void;
  onOpenContact?: () => void;
  onOpenAdminMetrics?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenLogModal,
  sightingsCount,
  unreadDispatchesCount,
  communitySkywatchesCount,
  sceneryMode,
  onSceneryChange,
  backgroundVisibility,
  onBackgroundVisibilityChange,
  onOpenGuide,
  currentCallsign,
  onOpenRegister,
  onOpenLogin,
  activeSectorId = 'ridgeway-wessex',
  onSelectSector,
  isLiteMode = false,
  onToggleLiteMode,
  onOpenBetaFeedback,
  onOpenConfusionSolver,
  onOpenLifeList,
  onOpenDonate,
  onOpenLegal,
  onOpenContact,
  onOpenAdminMetrics,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isBreezeActive, setIsBreezeActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => tacticalAudio.isMuted);
  const [showSceneryDropdown, setShowSceneryDropdown] = useState<boolean>(false);

  useEffect(() => {
    return tacticalAudio.subscribeMute((muted) => {
      setIsMuted(muted);
      if (muted) setIsBreezeActive(false);
    });
  }, []);

  const handleToggleMute = () => {
    const nextMuted = tacticalAudio.toggleMuted();
    setIsMuted(nextMuted);
    if (nextMuted) setIsBreezeActive(false);
    else tacticalAudio.playRadarPing(880);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Europe/London',
        }) + ' BST'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleSound = () => {
    const active = tacticalAudio.toggleDownlandBreeze();
    setIsBreezeActive(active);
  };

  const youtubeChannelUrl = (() => {
    try {
      return getYouTubeChannelUrl(
        localStorage.getItem('raptorlens_channel_url') || '',
        localStorage.getItem('raptorlens_custom_cam') || DEFAULT_CAMERA_VIDEO_ID
      );
    } catch {
      return `https://www.youtube.com/watch?v=${DEFAULT_CAMERA_VIDEO_ID}`;
    }
  })();

  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: string | number; isActive: boolean }> = [
    { 
      id: 'dispatches', 
      label: 'Summit & Trail Cam', 
      icon: <Mountain className="w-4 h-4 text-rose-400" />, 
      badge: '268m LIVE',
      isActive: activeTab === 'dispatches',
    },
    { 
      id: 'map', 
      label: 'Airspace Radar', 
      icon: <Map className="w-4 h-4 text-amber-400" />,
      isActive: activeTab === 'map',
    },
    { 
      id: 'silhouette', 
      label: 'Identify Raptors', 
      icon: <Eye className="w-4 h-4 text-cyan-400" />,
      isActive: activeTab === 'silhouette' || activeTab === 'quiz',
    },
    { 
      id: 'community', 
      label: 'Community & Logs', 
      icon: <Users className="w-4 h-4 text-emerald-400" />, 
      badge: `${sightingsCount} Logs`,
      isActive: activeTab === 'community' || activeTab === 'sightings',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/85 backdrop-blur-xl border-b border-neutral-800/80 shadow-2xl transition-colors">
      {/* Top Telemetry & Eye-Comfort Strip (Clean & Focused) */}
      <div className="hidden md:flex items-center justify-between px-4 lg:px-6 py-1.5 bg-neutral-900/70 border-b border-neutral-800/60 font-mono-tactical text-[11px] text-neutral-300 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            RADAR: <strong className="text-emerald-400 font-semibold">ONLINE</strong>
          </span>
          <span className="text-neutral-700">•</span>
          <div className="flex items-center gap-1.5 text-neutral-300">
            <Compass className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="text-neutral-400">SECTOR:</span>
            <select
              id="navbar-sector-select"
              value={activeSectorId}
              onChange={(e) => {
                tacticalAudio.playRadarPing(880);
                if (onSelectSector) onSelectSector(e.target.value as SectorId);
              }}
              className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer text-[11px]"
            >
              {UK_SECTORS.map((sec) => (
                <option key={sec.id} value={sec.id} className="bg-neutral-900 text-neutral-200">
                  {sec.shortName}
                </option>
              ))}
            </select>
          </div>
          <span className="text-neutral-700">•</span>
          <span className="text-neutral-400">
            Thermal Soaring: <strong className="text-amber-400">Active</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* YouTube Channel Direct Link */}
          <a
            id="nav-youtube-channel-link"
            href={youtubeChannelUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => tacticalAudio.playRadarPing(880)}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-red-600/15 hover:bg-red-600/25 border border-red-500/40 text-red-300 hover:text-white cursor-pointer transition-colors text-xs font-semibold shadow-sm"
            title="Visit Official YouTube Channel (Live camera & videos)"
          >
            <svg className="w-3.5 h-3.5 fill-current text-red-400" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span>YouTube Channel</span>
            <ExternalLink className="w-3 h-3 text-red-300" />
          </a>

          {/* Quick Guide Button */}
          <button
            id="nav-user-guide-btn"
            onClick={() => {
              tacticalAudio.playRadarPing(850);
              onOpenGuide();
            }}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-amber-300 cursor-pointer transition-colors text-xs"
            title="User Guide & Field Manual"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Guide</span>
          </button>

          {/* Audio Mute Toggle */}
          <button
            id="header-mute-toggle-btn"
            onClick={handleToggleMute}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[11px] font-mono-tactical transition-colors cursor-pointer ${
              isMuted
                ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                : 'bg-amber-500/10 border-amber-500/35 text-amber-300 hover:text-amber-200'
            }`}
            title={isMuted ? 'Audio Muted' : 'Sound Active'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
                <span>Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Sound ON</span>
              </>
            )}
          </button>

          {/* Observer Identity Authentication / Login Button */}
          {onOpenLogin && (
            <button
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                onOpenLogin();
              }}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-amber-300 cursor-pointer transition-colors text-[11px]"
              title="Callsign Account"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">{currentCallsign}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <div
          onClick={() => {
            tacticalAudio.playRadarPing(800);
            onTabChange('dispatches');
          }}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
            <Crosshair className="w-4 h-4 sm:w-5 sm:h-5 animate-radar-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-display-tactical text-base sm:text-lg md:text-xl font-bold tracking-wider text-neutral-100 uppercase truncate">
                RaptorLens
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono-tactical font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                UK
              </span>
              <span className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono-tactical font-bold bg-amber-500/30 text-amber-300 border border-amber-500/60 tracking-wider shadow-sm shrink-0">
                BETA
              </span>
            </div>
            <div className="text-[10px] font-mono-tactical text-neutral-400 uppercase tracking-wider -mt-0.5 flex items-center gap-1.5 truncate">
              <span className="text-amber-400/90 font-bold hidden sm:inline">Tactical Ridge, Weather &amp; Wildlife Radar</span>
              <span className="text-amber-400/90 font-bold sm:hidden">Live Ridge Cam &amp; Raptor Radar</span>
            </div>
          </div>
        </div>

        {/* Tab Buttons (Desktop - 4 Clean Pillars) */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-neutral-900/80 p-1.5 rounded-2xl border border-neutral-800/90 shadow-lg backdrop-blur-md">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => {
                tacticalAudio.playRadarPing(900);
                onTabChange(item.id);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono-tactical font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                item.isActive
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60 shadow-md shadow-amber-500/10 font-bold'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/70 border border-transparent'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    item.id === 'dispatches'
                      ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 animate-pulse'
                      : item.id === 'community'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Audio Mute Toggle */}
          <button
            id="mobile-mute-toggle-btn"
            onClick={handleToggleMute}
            className={`md:hidden min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl border text-xs font-mono-tactical transition-colors cursor-pointer ${
              isMuted
                ? 'bg-neutral-900 border-neutral-800 text-neutral-400'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
            }`}
            title={isMuted ? 'Audio Muted (Tap to Unmute)' : 'Sound Active (Tap to Mute)'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-neutral-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Field Lite Mode Switcher (Great for Mobile & Wind-swept Escarpments) */}
          {onToggleLiteMode && (
            <button
              id="nav-lite-toggle-btn"
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                onToggleLiteMode();
              }}
              className={`min-h-[38px] flex items-center gap-1.5 px-2.5 py-1.5 md:py-2 rounded-xl text-xs font-mono-tactical font-bold transition-all border cursor-pointer ${
                isLiteMode
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20'
                  : 'bg-neutral-900/90 hover:bg-neutral-850 border-neutral-750 text-neutral-300 hover:text-cyan-300'
              }`}
              title={isLiteMode ? 'Switch to Full Live Camera & Tactical Radar' : 'Switch to Field Scout Lite Mode (1-Tap GPS Logging & High-Contrast Touch View)'}
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline">{isLiteMode ? 'Full View' : 'Pocket Lite'}</span>
              <span className="sm:hidden text-[11px]">{isLiteMode ? 'Full View' : 'Lite'}</span>
            </button>
          )}

          {/* Beta Telemetry Feedback Button (Desktop/Tablet) */}
          {onOpenBetaFeedback && (
            <button
              id="nav-beta-feedback-btn"
              onClick={() => {
                tacticalAudio.playRadarPing(800);
                onOpenBetaFeedback();
              }}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 md:py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/35 text-amber-300 font-mono-tactical text-xs cursor-pointer"
              title="Report Field Beta Issue or Feedback"
            >
              <Bug className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Beta Feedback</span>
            </button>
          )}

          {/* Mobile Guide Button */}
          <button
            id="mobile-nav-about-btn"
            onClick={() => {
              tacticalAudio.playRadarPing(850);
              onOpenGuide();
            }}
            className="md:hidden min-h-[38px] flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono-tactical text-xs cursor-pointer"
            title="User Guide & Field Manual"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-semibold">Guide</span>
          </button>

          {/* Desktop YouTube Channel Direct Button */}
          <a
            id="nav-desktop-youtube-channel-btn"
            href={youtubeChannelUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => tacticalAudio.playRadarPing(880)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 hover:text-white font-mono-tactical text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            title="Open Official YouTube Channel in new tab"
          >
            <svg className="w-3.5 h-3.5 fill-current text-red-400" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span>YouTube</span>
            <ExternalLink className="w-3 h-3 text-red-300" />
          </a>

          {/* Fuel the Radar Ko-fi Button (Desktop/Tablet) */}
          {onOpenDonate && (
            <button
              id="nav-fuel-radar-btn"
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                onOpenDonate();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/45 text-amber-300 hover:text-amber-200 font-mono-tactical text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              title="Fuel the Radar / Support on Ko-fi (ko-fi.com/raptorlens)"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Fuel the Radar</span>
              <span className="md:hidden text-xs">Fuel</span>
            </button>
          )}

          {/* Quick Sighting Button */}
          <button
            id="nav-log-sighting-btn"
            onClick={() => {
              tacticalAudio.playRadarPing(950);
              onOpenLogModal();
            }}
            className="min-h-[38px] px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display-tactical text-xs font-bold tracking-wider flex items-center gap-1 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Log Sighting</span>
            <span className="sm:hidden text-[11px]">Log</span>
          </button>
        </div>
      </div>

      {/* Mobile Swipeable Sector & Quick Tools Bar (Visible on < md screens in Full Mode) */}
      {!isLiteMode && (
        <div className="md:hidden flex items-center gap-2 px-3 py-1.5 bg-neutral-900/90 border-t border-neutral-850 overflow-x-auto no-scrollbar font-mono-tactical text-[11px]">
          {/* Sector Selector */}
          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 shrink-0">
            <Compass className="w-3 h-3 text-amber-400 shrink-0" />
            <select
              aria-label="Select UK Raptor Sector"
              value={activeSectorId}
              onChange={(e) => {
                tacticalAudio.playRadarPing(880);
                if (onSelectSector) onSelectSector(e.target.value as SectorId);
              }}
              className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer text-[11px] max-w-[140px] truncate"
            >
              {UK_SECTORS.map((sec) => (
                <option key={sec.id} value={sec.id} className="bg-neutral-900 text-neutral-200">
                  {sec.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* YouTube Channel Direct Link */}
          <a
            id="mobile-nav-youtube-btn"
            href={youtubeChannelUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => tacticalAudio.playRadarPing(880)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600/20 border border-red-500/40 text-red-300 font-semibold shrink-0 cursor-pointer"
          >
            <svg className="w-3 h-3 fill-current text-red-400" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span>YouTube ↗</span>
          </a>

          {/* Callsign Account */}
          {onOpenLogin && (
            <button
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                onOpenLogin();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 shrink-0 cursor-pointer"
            >
              <LogIn className="w-3 h-3 text-amber-400" />
              <span className="font-bold">{currentCallsign}</span>
            </button>
          )}

          {/* Fuel the Radar */}
          {onOpenDonate && (
            <button
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                onOpenDonate();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold shrink-0 cursor-pointer"
            >
              <Coffee className="w-3 h-3 text-amber-400" />
              <span>Support Cam</span>
            </button>
          )}

          {/* Beta Feedback */}
          {onOpenBetaFeedback && (
            <button
              onClick={() => {
                tacticalAudio.playRadarPing(800);
                onOpenBetaFeedback();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 shrink-0 cursor-pointer"
            >
              <Bug className="w-3 h-3 text-amber-400" />
              <span>Feedback</span>
            </button>
          )}
        </div>
      )}

      {/* Tablet / Mobile Top Tab Strip (Clean 4 Pillars) */}
      {!isLiteMode && (
        <div className="grid grid-cols-4 lg:hidden px-2 py-1.5 border-t border-neutral-850 bg-neutral-950/95 backdrop-blur-md gap-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                tacticalAudio.playRadarPing(900);
                onTabChange(item.id);
              }}
              className={`min-h-[44px] py-1.5 px-1 rounded-xl text-[11px] font-mono-tactical flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                item.isActive
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60 font-bold shadow-sm'
                  : 'text-neutral-400 border border-neutral-850 bg-neutral-900/50 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-1">
                {item.icon}
                {item.id === 'dispatches' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                )}
              </div>
              <span className="truncate max-w-full text-[10px]">
                {item.id === 'dispatches' ? 'Summit Cam' : item.id === 'map' ? 'Radar Map' : item.id === 'silhouette' ? 'ID & Calls' : 'Community'}
              </span>
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
