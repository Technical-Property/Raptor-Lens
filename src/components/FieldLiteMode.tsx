import React, { useState, useEffect, useMemo } from 'react';
import { 
  Crosshair, 
  MapPin, 
  Navigation, 
  Clock, 
  Wind, 
  Eye, 
  Plus, 
  Check, 
  AlertCircle, 
  Sparkles, 
  ExternalLink, 
  Compass, 
  Maximize2, 
  Volume2, 
  CheckCircle2, 
  ShieldCheck, 
  Search, 
  Filter,
  Layers,
  ChevronRight,
  HelpCircle,
  Smartphone,
  Sliders,
  Send,
  WifiOff,
  Download,
  Coffee
} from 'lucide-react';
import { SightingLog, Hotspot, RaptorSpecies } from '../types/raptor';
import { SectorId } from '../types/sector';
import { UK_SECTORS } from '../data/sectors';
import { tacticalAudio } from '../utils/audio';
import { getSightingRecency, getRecencyCounts } from '../utils/recency';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface FieldLiteModeProps {
  sightings: SightingLog[];
  hotspots: Hotspot[];
  speciesList: RaptorSpecies[];
  activeSectorId: SectorId;
  onSelectSector: (sectorId: SectorId) => void;
  currentCallsign: string;
  onSaveSighting: (sighting: SightingLog) => void;
  onSwitchToFullMode: () => void;
  onOpenLiveCam?: () => void;
  onOpenBetaFeedback: () => void;
  onOpenFieldGuide: () => void;
  onOpenDonate?: () => void;
}

type LiteSubTab = 'quick-log' | 'live-radar' | 'silhouette-id' | 'recent-logs';

export const FieldLiteMode: React.FC<FieldLiteModeProps> = ({
  sightings,
  hotspots,
  speciesList,
  activeSectorId,
  onSelectSector,
  currentCallsign,
  onSaveSighting,
  onSwitchToFullMode,
  onOpenLiveCam,
  onOpenBetaFeedback,
  onOpenFieldGuide,
  onOpenDonate,
}) => {
  const [activeLiteTab, setActiveLiteTab] = useState<LiteSubTab>('quick-log');
  const [playingSpeciesCallId, setPlayingSpeciesCallId] = useState<string | null>(null);

  const isOnline = useOnlineStatus();
  const { isInstallable, install } = usePWAInstall();

  // Quick Log State
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>(speciesList[0]?.id || 'red-kite');
  const [count, setCount] = useState<number>(1);
  const [behavior, setBehavior] = useState<string>('Circling / Soaring');
  const [locationName, setLocationName] = useState<string>('');
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [isLoggedSuccess, setIsLoggedSuccess] = useState<boolean>(false);
  const [showAllSpecies, setShowAllSpecies] = useState<boolean>(false);
  const [speciesSearch, setSpeciesSearch] = useState<string>('');

  // Filter for live radar stream
  const [radarRecencyFilter, setRadarRecencyFilter] = useState<'all' | 'live' | 'today'>('all');

  const currentSector = useMemo(() => {
    return UK_SECTORS.find((s) => s.id === activeSectorId) || UK_SECTORS[0];
  }, [activeSectorId]);

  // Auto-fetch GPS on initial load & ensure view starts cleanly at the top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    handleFetchGPS(false);
  }, []);

  // Reset scroll position when switching between Lite sub-tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeLiteTab]);

  const handleFetchGPS = (playChime = true) => {
    if (!navigator.geolocation) {
      if (!locationName) setLocationName(`${currentSector.shortName} Ridge`);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lng = parseFloat(pos.coords.longitude.toFixed(4));
        setCoordinates([lat, lng]);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        if (playChime) tacticalAudio.playConfirmChime();

        // Check nearest hotspot in active sector
        const sectorSpots = hotspots.filter((h) => h.sectorId === activeSectorId);
        if (sectorSpots.length > 0) {
          const nearest = sectorSpots.reduce((prev, curr) => {
            const dPrev = Math.hypot(prev.coordinates[0] - lat, prev.coordinates[1] - lng);
            const dCurr = Math.hypot(curr.coordinates[0] - lat, curr.coordinates[1] - lng);
            return dCurr < dPrev ? curr : prev;
          });
          setLocationName(`${nearest.name} (${nearest.county})`);
        } else {
          setLocationName(`${currentSector.shortName} (GPS Fix)`);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('GPS position unavailable:', err.message);
        if (!locationName) setLocationName(`${currentSector.shortName} Escarpment`);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    tacticalAudio.playConfirmChime();

    const selectedSpecies = speciesList.find((s) => s.id === selectedSpeciesId);
    const now = new Date();
    const finalCoords: [number, number] = (coordinates && Array.isArray(coordinates) && Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1]))
      ? coordinates
      : (currentSector?.center && Number.isFinite(currentSector.center[0]) && Number.isFinite(currentSector.center[1]))
      ? currentSector.center
      : [51.4835, -1.7895];
    const finalLoc = locationName.trim() || `${currentSector.shortName} Vantage Point`;

    const newSighting: SightingLog = {
      id: `sighting-${Date.now()}`,
      speciesId: selectedSpeciesId,
      speciesName: selectedSpecies?.commonName || 'Unknown Raptor',
      count,
      locationName: finalLoc,
      coordinates: finalCoords,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      timestamp: now.toISOString(),
      behavior: behavior as any,
      confidence: 'Confirmed (100%)',
      opticalGear: 'Pocket Field Recon (Mobile)',
      observerCallsign: currentCallsign,
      observerRank: 'Field Scout',
      windDirection: 'WNW',
      windSpeedMph: 12,
      thermalStrength: 'Moderate',
      notes: notes.trim() || `Instant GPS contact logged in ${currentSector.shortName} via Field Scout Lite Pocket HUD.`,
      sectorId: activeSectorId,
      verificationStatus: 'Pending Review',
      corroborations: [],
      auditTrail: [
        {
          action: 'INITIAL_LOG',
          timestamp: now.toISOString(),
          actorCallsign: currentCallsign,
          actorRank: 'Field Scout',
          details: `Field Sighting registered via Pocket Lite HUD at ${finalCoords[0]}°N, ${Math.abs(finalCoords[1])}°${finalCoords[1] < 0 ? 'W' : 'E'}.`,
        },
      ],
    };

    onSaveSighting(newSighting);
    setIsLoggedSuccess(true);
    setNotes('');

    setTimeout(() => {
      setIsLoggedSuccess(false);
    }, 2400);
  };

  // Filtered sightings for radar stream
  const sectorSightings = useMemo(() => {
    return sightings
      .filter((s) => {
        if (activeSectorId !== 'all' && s.sectorId && s.sectorId !== activeSectorId) return false;
        if (radarRecencyFilter === 'live') {
          const r = getSightingRecency(s.timestamp);
          return r.status === 'live';
        }
        if (radarRecencyFilter === 'today') {
          const r = getSightingRecency(s.timestamp);
          return r.hoursAgo < 24;
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [sightings, activeSectorId, radarRecencyFilter]);

  const recencyCounts = useMemo(() => getRecencyCounts(sightings), [sightings]);

  // Derived selected species and quick list for logger
  const selectedSpecies = useMemo(() => {
    return speciesList.find((s) => s.id === selectedSpeciesId) || speciesList[0];
  }, [speciesList, selectedSpeciesId]);

  const displayedSpecies = useMemo(() => {
    if (speciesSearch.trim()) {
      const q = speciesSearch.toLowerCase().trim();
      return speciesList.filter(
        (s) =>
          s.commonName.toLowerCase().includes(q) ||
          s.scientificName.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }
    return showAllSpecies ? speciesList : speciesList.slice(0, 8);
  }, [speciesList, speciesSearch, showAllSpecies]);

  const handleSelectLiteTab = (tab: LiteSubTab) => {
    tacticalAudio.playRadarPing(880);
    setActiveLiteTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 font-mono-tactical text-neutral-100 pb-6">
      {/* Pocket Header Bar */}
      <div className="bg-neutral-950/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-3 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Brand & Beta tag */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display-tactical text-base font-bold text-neutral-100 tracking-wider">
                  RAPTORLENS
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50">
                  BETA
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  LITE
                </span>
              </div>
              <div className="text-[10px] text-neutral-400">Pocket Field Scout</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            {!isOnline && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[9px] font-bold">
                <WifiOff className="w-2.5 h-2.5" /> OFFLINE
              </span>
            )}

            {isInstallable && (
              <button
                onClick={async () => {
                  tacticalAudio.playConfirmChime();
                  await install();
                }}
                className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                title="Install RaptorLens to phone"
              >
                <Download className="w-3 h-3" />
                <span className="hidden xs:inline">Install</span>
              </button>
            )}

            <button
              onClick={() => {
                tacticalAudio.playRadarPing(800);
                onOpenBetaFeedback();
              }}
              title="Report teething bug or missing hotspot"
              className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-amber-500/30 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Feedback</span>
            </button>

            {onOpenDonate && (
              <button
                onClick={() => {
                  tacticalAudio.playRadarPing(900);
                  onOpenDonate();
                }}
                title="Fuel the Downland Radar (Support server & open data)"
                className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Coffee className="w-3 h-3 text-amber-400" />
                <span>Tip</span>
              </button>
            )}

            {onOpenLiveCam && (
              <button
                onClick={() => {
                  tacticalAudio.playRadarPing(880);
                  onOpenLiveCam();
                }}
                title="Watch Live Hackpen Hill & Barbury Castle Summit Camera"
                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/50 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>Live Cam</span>
              </button>
            )}

            <button
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                onSwitchToFullMode();
              }}
              title="Switch to full desktop radar view"
              className="min-h-[34px] px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-neutral-100 border border-neutral-700 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Maximize2 className="w-3 h-3 text-cyan-400" />
              <span>Full View</span>
            </button>
          </div>
        </div>

        {/* Sector Switcher & Ambient Telemetry Bar */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-850 text-xs">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              id="lite-sector-select"
              value={activeSectorId || 'ridgeway-wessex'}
              onChange={(e) => {
                tacticalAudio.playRadarPing(880);
                onSelectSector(e.target.value as SectorId);
              }}
              className="bg-neutral-900 border border-neutral-750 text-amber-300 font-bold rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-amber-500 w-full truncate cursor-pointer"
            >
              {UK_SECTORS.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.shortName} ({sec.county})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-300 shrink-0">
            <Wind className="w-3 h-3 text-amber-400" />
            <span>WNW 11mph</span>
          </div>
        </div>
      </div>

      {/* Main Tab View Card */}
      <div className="bg-neutral-950 border border-neutral-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl">
        {/* ===================== TAB 1: 1-TAP QUICK GPS LOGGER ===================== */}
        {activeLiteTab === 'quick-log' && (
          <form onSubmit={handleQuickSubmit} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <h3 className="font-display-tactical text-base font-bold text-neutral-100 uppercase tracking-wide">
                  1-Tap Field Scout Logger
                </h3>
              </div>
              <span className="text-[10px] text-amber-400 font-semibold">
                Observer: {currentCallsign}
              </span>
            </div>

            {isLoggedSuccess ? (
              <div className="p-6 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-center space-y-2 animate-pulse">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-display-tactical text-base font-bold text-emerald-300">
                  Contact Successfully Logged!
                </h4>
                <p className="text-xs text-neutral-300 font-sans">
                  Sighting added to the tactical telemetry ledger and live radar blips.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Big Raptor Selector Buttons & Quick Filter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] uppercase font-bold text-neutral-400 flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                      <span>1. Tap Sighted Raptor:</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        tacticalAudio.playRadarPing(880);
                        setShowAllSpecies((prev) => !prev);
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                    >
                      {showAllSpecies ? 'Show Top 8' : `Show All Species (${speciesList.length})`}
                    </button>
                  </div>

                  {/* Quick Dropdown & Filter row */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <select
                        id="lite-species-quick-dropdown"
                        value={selectedSpeciesId}
                        onChange={(e) => {
                          tacticalAudio.playRadarPing(900);
                          setSelectedSpeciesId(e.target.value);
                        }}
                        className="w-full h-9 bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-lg px-2.5 text-xs text-amber-300 font-bold focus:outline-none cursor-pointer"
                      >
                        {speciesList.map((spec) => (
                          <option key={spec.id} value={spec.id}>
                            {spec.commonName} ({spec.scientificName}) — {spec.category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-32 sm:w-40 relative">
                      <input
                        type="text"
                        placeholder="Search bird..."
                        value={speciesSearch}
                        onChange={(e) => setSpeciesSearch(e.target.value)}
                        className="w-full h-9 bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-lg px-2.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
                      />
                      {speciesSearch && (
                        <button
                          type="button"
                          onClick={() => setSpeciesSearch('')}
                          className="absolute right-2 top-2 text-[10px] text-neutral-400 hover:text-neutral-200 font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Raptor Grid Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {displayedSpecies.map((spec) => {
                      const isSelected = selectedSpeciesId === spec.id;
                      return (
                        <button
                          key={spec.id}
                          type="button"
                          onClick={() => {
                            tacticalAudio.playRadarPing(900);
                            setSelectedSpeciesId(spec.id);
                          }}
                          className={`min-h-[56px] p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/25 border-amber-500 text-amber-200 shadow-md shadow-amber-500/20 ring-1 ring-amber-500 font-bold'
                              : 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center p-0.5 shrink-0">
                            <svg viewBox="0 0 300 200" className={`w-full h-full fill-current ${isSelected ? 'text-amber-400' : 'text-neutral-400'}`}>
                              <path d={spec.silhouetteSvg} />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs leading-tight font-bold truncate">
                              {spec.commonName}
                            </div>
                            <div className="text-[9px] text-neutral-400 font-sans truncate">
                              {spec.keyMarks?.[0] || spec.tailShapeLabel || spec.category}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Target Locked Badge */}
                  {selectedSpecies && (
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                        <div className="truncate">
                          <span className="text-neutral-400 text-[10px] uppercase font-bold mr-1">Locked:</span>
                          <strong className="text-amber-300">{selectedSpecies.commonName}</strong>
                          <span className="text-[10px] text-neutral-400 italic ml-1">({selectedSpecies.scientificName})</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-400 font-mono-tactical shrink-0">
                        {selectedSpecies.aspectRatio ? `${selectedSpecies.aspectRatio} Aspect` : selectedSpecies.wingspanCm}
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Count & Behavior */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Count Stepper */}
                  <div>
                    <label className="text-[11px] uppercase font-bold text-neutral-400 block mb-1.5">
                      2. Count:
                    </label>
                    <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => {
                          tacticalAudio.playRadarPing(700);
                          setCount((prev) => Math.max(1, prev - 1));
                        }}
                        className="w-12 h-10 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-lg font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center font-bold text-amber-400 text-base">
                        {count} {count === 1 ? 'Bird' : 'Birds'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          tacticalAudio.playRadarPing(880);
                          setCount((prev) => prev + 1);
                        }}
                        className="w-12 h-10 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-lg font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Behavior Select */}
                  <div>
                    <label className="text-[11px] uppercase font-bold text-neutral-400 block mb-1.5">
                      3. Flight Behaviour:
                    </label>
                    <select
                      value={behavior}
                      onChange={(e) => setBehavior(e.target.value)}
                      className="w-full h-12 bg-neutral-900 border border-neutral-800 rounded-xl px-3 text-xs text-neutral-200 font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="Circling / Soaring">Circling / Soaring on Thermals</option>
                      <option value="Flap-flap-glide low dash / Ambush">Flap-flap-glide Low Dash / Ambush (Sparrowhawk)</option>
                      <option value="Quartering">Quartering Low over Grassland</option>
                      <option value="Hovering">Hovering Stationary in Headwind</option>
                      <option value="Stooping / Hunting">Stooping / High-Speed Dive</option>
                      <option value="Perched">Perched on Fence / Tree Stand</option>
                      <option value="Garden / Woodland Edge Pursuit">Garden / Woodland Edge Pursuit</option>
                      <option value="Mobbing / Interaction">Mobbed by Crows / Gulls</option>
                    </select>
                  </div>
                </div>

                {/* 3. Location & GPS Auto-Fix */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>4. Field Coordinate &amp; Location:</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleFetchGPS(true)}
                      disabled={isLocating}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Crosshair className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                      <span>{isLocating ? 'Fixing GPS...' : 'Refresh GPS'}</span>
                    </button>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder="e.g. Barbury Castle Escarpment"
                        className="w-full bg-transparent text-neutral-200 font-semibold focus:outline-none truncate"
                      />
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        {coordinates
                          ? `📍 ${coordinates[0]}°N, ${Math.abs(coordinates[1])}°${coordinates[1] < 0 ? 'W' : 'E'} ${gpsAccuracy ? `(±${gpsAccuracy}m)` : ''}`
                          : `Sector Default (${currentSector.shortName})`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Quick Notes (Optional) */}
                <div>
                  <input
                    type="text"
                    placeholder="Quick field notes (e.g. adult female, missing outer primary wing feather)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-sans"
                  />
                </div>

                {/* Big 1-Tap Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full min-h-[52px] rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display-tactical text-sm font-bold tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-500/20 cursor-pointer active:scale-[0.99]"
                  >
                    <Send className="w-4 h-4" />
                    <span>LOG RAPTOR SIGHTING (1-TAP)</span>
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {/* ===================== TAB 2: LIVE POCKET RADAR ===================== */}
        {activeLiteTab === 'live-radar' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="font-display-tactical text-base font-bold text-neutral-100 uppercase tracking-wide">
                  Live Corridor Contacts
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-400">
                {sectorSightings.length} Logged in {currentSector.shortName}
              </span>
            </div>

            {/* Recency Horizon Filter */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setRadarRecencyFilter('all')}
                className={`flex-1 py-1.5 rounded-lg border text-center font-semibold cursor-pointer ${
                  radarRecencyFilter === 'all'
                    ? 'bg-neutral-800 border-neutral-600 text-neutral-100'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-400'
                }`}
              >
                All ({sectorSightings.length})
              </button>
              <button
                onClick={() => setRadarRecencyFilter('live')}
                className={`flex-1 py-1.5 rounded-lg border text-center font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                  radarRecencyFilter === 'live'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-neutral-900/60 border-neutral-800 text-emerald-400/80'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Live &lt;3h ({recencyCounts.live})</span>
              </button>
              <button
                onClick={() => setRadarRecencyFilter('today')}
                className={`flex-1 py-1.5 rounded-lg border text-center font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                  radarRecencyFilter === 'today'
                    ? 'bg-amber-950 border-amber-500 text-amber-300 font-bold'
                    : 'bg-neutral-900/60 border-neutral-800 text-amber-400/80'
                }`}
              >
                <span>Today ({recencyCounts.today})</span>
              </button>
            </div>

            {/* Contact Stream Cards */}
            <div className="space-y-2.5">
              {sectorSightings.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-xs bg-neutral-900/50 rounded-xl border border-neutral-800">
                  No raptor contacts logged in this time window for {currentSector.shortName}.
                </div>
              ) : (
                sectorSightings.slice(0, 10).map((s) => {
                  const recency = getSightingRecency(s.timestamp);
                  const species = speciesList.find((sp) => sp.id === s.speciesId);

                  return (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/50 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          {species && (
                            <div className="w-9 h-9 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center p-1 shrink-0">
                              <svg viewBox="0 0 300 200" className="w-full h-full text-amber-400 fill-current">
                                <path d={species.silhouetteSvg} />
                              </svg>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-display-tactical text-sm font-bold text-neutral-100">
                                {s.speciesName}
                              </span>
                              <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                {s.count}x
                              </span>
                              <span
                                className="px-1.5 py-0.2 rounded text-[9px] font-bold flex items-center gap-1"
                                style={{
                                  backgroundColor: `${recency.colorHex}20`,
                                  color: recency.colorHex,
                                  border: `1px solid ${recency.colorHex}50`
                                }}
                              >
                                {recency.trafficEmoji} {recency.relativeTime}
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">{s.locationName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick 3D Aerial Recon Link */}
                        <a
                          href={`https://www.google.com/maps/@${s.coordinates[0]},${s.coordinates[1]},16z/data=!3m1!1e3`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded bg-neutral-950 hover:bg-neutral-800 text-cyan-300 border border-cyan-500/40 text-[10px] font-semibold flex items-center gap-1 shrink-0"
                          title="Open Google 3D Aerial Reconnaissance"
                        >
                          <span>Aerial</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>

                      <div className="text-[11px] text-neutral-300 font-sans border-t border-neutral-800/80 pt-1.5 flex items-center justify-between">
                        <span className="text-emerald-400 font-mono-tactical text-[10px]">
                          Behaviour: {s.behavior}
                        </span>
                        <span className="text-neutral-500 text-[10px]">
                          Scout: {s.observerCallsign}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {sectorSightings.length > 0 && (
              <div className="pt-3 pb-1 text-center text-[10px] text-neutral-400 font-mono-tactical flex items-center justify-center gap-2 border-t border-neutral-850">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60"></span>
                <span>All {sectorSightings.length} corridor contacts displayed for {currentSector.shortName}</span>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3: POCKET SILHOUETTE QUICK-KEY ===================== */}
        {activeLiteTab === 'silhouette-id' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <h3 className="font-display-tactical text-base font-bold text-neutral-100 uppercase tracking-wide">
                  Pocket Silhouette Quick-Key
                </h3>
              </div>
              <span className="text-[10px] text-neutral-400">High-Contrast Field Marks</span>
            </div>

            {/* Quick Diagnostic Rules */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 block uppercase">FORKED V-TAIL</span>
                <p className="text-[11px] text-neutral-300 font-sans leading-tight">
                  Constantly twisting rudder tail = <strong>Red Kite</strong>.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 block uppercase">ROUNDED BROAD WING</span>
                <p className="text-[11px] text-neutral-300 font-sans leading-tight">
                  Shallow V-glide + splayed finger primaries = <strong>Common Buzzard</strong>.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1">
                <span className="text-[10px] font-bold text-cyan-400 block uppercase">POINTED SCYTHE WINGS</span>
                <p className="text-[11px] text-neutral-300 font-sans leading-tight">
                  Heavy barrel chest + anchor dive shape = <strong>Peregrine Falcon</strong>.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1">
                <span className="text-[10px] font-bold text-purple-400 block uppercase">WIND HOVERING</span>
                <p className="text-[11px] text-neutral-300 font-sans leading-tight">
                  Stationary headwind hover with fanned tail = <strong>Common Kestrel</strong>.
                </p>
              </div>
              <div className="col-span-2 p-2.5 rounded-xl bg-neutral-900/80 border border-amber-500/30 space-y-1">
                <span className="text-[10px] font-bold text-amber-300 block uppercase">FLAP-FLAP-GLIDE AMBUSH</span>
                <p className="text-[11px] text-neutral-300 font-sans leading-tight">
                  Short rounded wings + long square-cut tail + sprint low along hedgerow = <strong>Eurasian Sparrowhawk</strong>.
                </p>
              </div>
            </div>

            {/* Species Quick Reference Cards */}
            <div className="space-y-2">
              {speciesList.map((spec) => (
                <div
                  key={spec.id}
                  className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-neutral-950 border border-neutral-800 p-1 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 300 200" className="w-full h-full text-amber-400 fill-current">
                      <path d={spec.silhouetteSvg} />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs text-neutral-100 truncate">{spec.commonName}</h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-amber-400 font-semibold hidden xs:inline">{spec.wingspanCm}</span>
                        <button
                          type="button"
                          onClick={() => {
                            tacticalAudio.setMuted(false);
                            const started = tacticalAudio.playSpeciesCall(spec.id, () => {
                              setPlayingSpeciesCallId((prev) => (prev === spec.id ? null : prev));
                            });
                            setPlayingSpeciesCallId(started ? spec.id : null);
                          }}
                          className={`min-h-[32px] px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                            playingSpeciesCallId === spec.id
                              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                              : 'bg-neutral-800 hover:bg-neutral-750 border-neutral-700 text-cyan-300'
                          }`}
                          title={`Play real recorded ${spec.commonName} call`}
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>{playingSpeciesCallId === spec.id ? 'Stop' : 'Call'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            tacticalAudio.playConfirmChime();
                            setSelectedSpeciesId(spec.id);
                            handleSelectLiteTab('quick-log');
                          }}
                          className="min-h-[32px] px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-neutral-950 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title={`1-Tap Log a ${spec.commonName} sighting`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Log</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-sans mt-0.5 leading-snug">
                      {spec.keyMarks?.[0] || spec.flightProfileLabel || spec.flightDescription}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 pb-1 text-center text-[10px] text-neutral-400 font-mono-tactical flex items-center justify-center gap-2 border-t border-neutral-850">
              <span>All 12 UK downland &amp; coastal raptors catalogued • Tap [Log] to transmit contact</span>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: RECENT LOGS ===================== */}
        {activeLiteTab === 'recent-logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-display-tactical text-base font-bold text-neutral-100 uppercase tracking-wide">
                  My Scout History
                </h3>
              </div>
              <span className="text-[10px] text-neutral-400">
                Callsign: <strong className="text-amber-400">{currentCallsign}</strong>
              </span>
            </div>

            <div className="space-y-2">
              {sightings
                .filter((s) => s.observerCallsign.toUpperCase() === currentCallsign.toUpperCase())
                .slice(0, 8)
                .map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-neutral-100">
                        {s.count}x {s.speciesName}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {s.date} • {s.time}
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-300/90 truncate">
                      📍 {s.locationName}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-sans italic">
                      "{s.notes}"
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* ===================== ERGONOMIC BOTTOM THUMB BAR ===================== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800 p-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="max-w-xl mx-auto grid grid-cols-4 gap-1 text-center font-mono-tactical">
          <button
            onClick={() => handleSelectLiteTab('quick-log')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 cursor-pointer transition-all ${
              activeLiteTab === 'quick-log'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px]">1-Tap Log</span>
          </button>

          <button
            onClick={() => handleSelectLiteTab('live-radar')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 cursor-pointer transition-all ${
              activeLiteTab === 'live-radar'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/60 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Crosshair className="w-5 h-5" />
            <span className="text-[10px]">Live Blips</span>
          </button>

          <button
            onClick={() => handleSelectLiteTab('silhouette-id')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 cursor-pointer transition-all ${
              activeLiteTab === 'silhouette-id'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/60 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Eye className="w-5 h-5" />
            <span className="text-[10px]">ID Key</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(750);
              onSwitchToFullMode();
            }}
            className="py-2 px-1 rounded-xl flex flex-col items-center gap-1 text-neutral-400 hover:text-amber-300 cursor-pointer"
          >
            <Maximize2 className="w-5 h-5" />
            <span className="text-[10px]">Full Radar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
