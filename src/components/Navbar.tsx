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
  Heart,
  Scale,
  Mail,
  BarChart3,
  BookOpen
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

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

  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: string | number; isActive: boolean }> = [
    { 
      id: 'dispatches', 
      label: 'Live Webcam & Weather', 
      icon: <Mountain className="w-4 h-4 text-rose-400" />, 
      badge: 'LIVE',
      isActive: activeTab === 'dispatches',
    },
    { 
      id: 'map', 
      label: 'Raptor Map', 
      icon: <Map className="w-4 h-4 text-amber-400" />,
      isActive: activeTab === 'map',
    },
    { 
      id: 'silhouette', 
      label: 'Bird ID & Calls', 
      icon: <Eye className="w-4 h-4 text-cyan-400" />,
      isActive: activeTab === 'silhouette' || activeTab === 'quiz',
    },
    { 
      id: 'community', 
      label: 'Community & Logs', 
      icon: <Users className="w-4 h-4 text-emerald-400" />, 
      badge: `${sightingsCount}`,
      isActive: activeTab === 'community' || activeTab === 'sightings',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800/80 shadow-xl transition-colors">
      {/* Top Region & Quick Utility Strip (Desktop md+) */}
      <div className="hidden md:flex items-center justify-between px-4 lg:px-6 py-1.5 bg-neutral-900/75 border-b border-neutral-800/60 text-xs text-neutral-300">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-neutral-300">
            <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-neutral-400">Region:</span>
            <select
              id="navbar-sector-select"
              value={activeSectorId}
              onChange={(e) => {
                tacticalAudio.playRadarPing(880);
                if (onSelectSector) onSelectSector(e.target.value as SectorId);
              }}
              className="bg-transparent text-amber-300 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              {UK_SECTORS.map((sec) => (
                <option key={sec.id} value={sec.id} className="bg-neutral-900 text-neutral-200">
                  {sec.shortName}
                </option>
              ))}
            </select>
          </div>
          <span className="text-neutral-700">·</span>
          <span className="text-neutral-400">
            Ridgeway Soaring Conditions: <strong className="text-emerald-400 font-semibold">Good</strong>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Guide Button */}
          <button
            id="nav-user-guide-btn"
            onClick={() => {
              tacticalAudio.playRadarPing(850);
              onOpenGuide();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-amber-300 cursor-pointer transition-colors text-xs font-medium"
            title="User Guide & Field Manual"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Site Guide</span>
          </button>

          {/* Audio Mute Toggle */}
          <button
            id="header-mute-toggle-btn"
            onClick={handleToggleMute}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
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
                <span>Sound On</span>
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
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-amber-300 cursor-pointer transition-colors text-xs"
              title="Observer Profile"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold">{currentCallsign}</span>
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
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group min-w-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md group-hover:scale-105 transition-transform shrink-0">
            <Crosshair className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display-tactical text-base sm:text-lg md:text-xl font-bold tracking-tight text-neutral-100 truncate">
                RaptorLens UK
              </span>
            </div>
            <div className="text-xs text-neutral-400 -mt-0.5 flex items-center gap-1.5 truncate">
              <span className="text-amber-400/90 font-medium hidden sm:inline">Live Ridgeway Webcam, Weather &amp; Raptor Map</span>
              <span className="text-amber-400/90 font-medium sm:hidden">Live Webcam &amp; Raptor Map</span>
            </div>
          </div>
        </div>

        {/* Tab Buttons (Desktop - 4 Clean Pillars) */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-neutral-900/90 p-1.5 rounded-2xl border border-neutral-800 shadow-lg">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => {
                tacticalAudio.playRadarPing(900);
                onTabChange(item.id);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                item.isActive
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/60 shadow-sm font-bold'
                  : 'text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/70 border border-transparent'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
                    item.id === 'dispatches'
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
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
            className={`md:hidden min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl border text-xs transition-colors cursor-pointer ${
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

          {/* Field Lite Mode Switcher */}
          {onToggleLiteMode && (
            <button
              id="nav-lite-toggle-btn"
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                onToggleLiteMode();
              }}
              className={`min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                isLiteMode
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20'
                  : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 text-neutral-300 hover:text-cyan-300'
              }`}
              title={isLiteMode ? 'Switch to Full Live Camera & Radar View' : 'Switch to Pocket Lite Mode (1-Tap Field Logging)'}
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline">{isLiteMode ? 'Full View' : 'Pocket Mode'}</span>
              <span className="sm:hidden text-[11px]">{isLiteMode ? 'Full' : 'Pocket'}</span>
            </button>
          )}

          {/* Mobile Guide Button */}
          <button
            id="mobile-nav-about-btn"
            onClick={() => {
              tacticalAudio.playRadarPing(850);
              onOpenGuide();
            }}
            className="md:hidden min-h-[38px] flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs cursor-pointer"
            title="User Guide & Field Manual"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-semibold">Guide</span>
          </button>

          {/* Support UK Wildlife Charities Button (Desktop/Tablet) */}
          {onOpenDonate && (
            <button
              id="nav-fuel-radar-btn"
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                onOpenDonate();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
              title="Support RSPB, Wiltshire Wildlife Trust & UK Bird Charities (Zero money goes to this site)"
            >
              <Heart className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Support Wildlife Charity</span>
              <span className="md:hidden text-xs">Wildlife Charity</span>
            </button>
          )}

          {/* Quick Sighting Button */}
          <button
            id="nav-log-sighting-btn"
            onClick={() => {
              tacticalAudio.playRadarPing(950);
              onOpenLogModal();
            }}
            className="min-h-[38px] px-3.5 py-1.5 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Log Sighting</span>
            <span className="sm:hidden text-xs">Log</span>
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

          {/* Support UK Wildlife Charity */}
          {onOpenDonate && (
            <button
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                onOpenDonate();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-semibold shrink-0 cursor-pointer"
            >
              <Heart className="w-3 h-3 text-emerald-400" />
              <span>Wildlife Charity</span>
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
