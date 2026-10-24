import React from 'react';
import { 
  Mountain, 
  Compass, 
  Video, 
  Map, 
  Wind, 
  Radio, 
  CheckCircle2, 
  ArrowRight,
  Eye,
  Footprints,
  CloudSun
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

export type PerspectiveMode = 'summit-trail' | 'wildlife-radar';

export interface DualHeroModeSelectorProps {
  currentPerspective: PerspectiveMode;
  onSelectPerspective: (mode: PerspectiveMode) => void;
  sightingsCount: number;
  activeSectorName?: string;
  activeSectorShortName?: string;
}

export const DualHeroModeSelector: React.FC<DualHeroModeSelectorProps> = ({
  currentPerspective,
  onSelectPerspective,
  sightingsCount,
  activeSectorShortName = 'Ridgeway / Wessex',
}) => {
  const isSummit = currentPerspective === 'summit-trail';
  const isRadar = currentPerspective === 'wildlife-radar';

  const [showMobileDetails, setShowMobileDetails] = React.useState(false);

  return (
    <section 
      aria-label="Expedition View Mode Selector"
      className="bg-neutral-950/90 backdrop-blur-xl border border-neutral-800 rounded-2xl p-2.5 sm:p-5 shadow-2xl space-y-2.5 sm:space-y-4"
    >
      {/* Mobile Compact Dual-Lens Switcher (Keeps Live Stream & Map Above the Fold on Phones) */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-mono-tactical uppercase tracking-wider text-amber-400 font-bold">
              CHOOSE LENS • {activeSectorShortName}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowMobileDetails((prev) => !prev)}
            className="text-[10px] font-mono-tactical text-neutral-400 hover:text-amber-300 underline cursor-pointer py-0.5 px-1"
          >
            {showMobileDetails ? 'Hide Info' : 'Compare Views'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              tacticalAudio.playRadarPing(880);
              onSelectPerspective('summit-trail');
            }}
            className={`min-h-[52px] p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
              isSummit
                ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500/40 shadow-md'
                : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isSummit ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-amber-400'
            }`}>
              <Mountain className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-display-tactical text-xs font-bold text-neutral-100 truncate">
                Summit &amp; Cam
              </div>
              <div className="text-[10px] font-mono-tactical text-amber-300/90 truncate">
                Live Stream &amp; Weather
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              tacticalAudio.playRadarPing(920);
              onSelectPerspective('wildlife-radar');
            }}
            className={`min-h-[52px] p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
              isRadar
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/40 shadow-md'
                : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isRadar ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-emerald-400'
            }`}>
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-display-tactical text-xs font-bold text-neutral-100 truncate">
                Airspace Radar
              </div>
              <div className="text-[10px] font-mono-tactical text-emerald-300/90 truncate">
                Map &amp; {sightingsCount} Blips
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Top Clarifying Header (Desktop md+) */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-mono-tactical uppercase tracking-widest text-amber-400 font-bold">
              EXPEDITION MODE // CHOOSE YOUR PRIMARY LENS
            </span>
            <span className="text-neutral-600 hidden sm:inline">•</span>
            <span className="text-neutral-400 text-[10px] font-mono-tactical hidden sm:inline">
              {activeSectorShortName}
            </span>
          </div>
          <h2 className="text-base sm:text-lg md:text-xl font-display-tactical font-bold text-neutral-100 tracking-tight">
            What would you like to explore today?
          </h2>
          <p className="text-xs text-neutral-400 font-sans max-w-2xl mt-0.5 leading-relaxed">
            Choose between the <strong>Live Hilltop Webcam &amp; Trail Surface Report</strong> for walking conditions, or the <strong>Tactical Airspace Radar</strong> to track raptors in flight.
          </p>
        </div>

        {/* Quick Segmented Indicator Pill */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900/90 rounded-xl border border-neutral-800 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              tacticalAudio.playRadarPing(880);
              onSelectPerspective('summit-trail');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono-tactical font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isSummit
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Summit &amp; Trail</span>
          </button>
          <button
            type="button"
            onClick={() => {
              tacticalAudio.playRadarPing(920);
              onSelectPerspective('wildlife-radar');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono-tactical font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isRadar
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Airspace Radar</span>
          </button>
        </div>
      </div>

      {/* The Two Distinct Choice Doors (Side-by-Side Cards on Desktop, expandable on Mobile) */}
      <div className={`${showMobileDetails ? 'grid' : 'hidden md:grid'} grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4`}>
        {/* DOOR 1: SUMMIT & TRAIL CONDITIONS */}
        <div
          id="select-door-summit"
          onClick={() => {
            if (!isSummit) {
              tacticalAudio.playRadarPing(880);
              onSelectPerspective('summit-trail');
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              tacticalAudio.playRadarPing(880);
              onSelectPerspective('summit-trail');
            }
          }}
          role="button"
          tabIndex={0}
          className={`group text-left rounded-2xl p-4 sm:p-5 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-amber-400 ${
            isSummit
              ? 'bg-gradient-to-b from-amber-950/40 via-neutral-900/90 to-neutral-950 border-2 border-amber-500 ring-2 ring-amber-500/20 shadow-xl shadow-amber-500/10'
              : 'bg-neutral-900/60 hover:bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/50 shadow-md'
          }`}
        >
          {/* Subtle Ambient Background Watermark */}
          <div className="absolute top-2 right-2 text-amber-500/5 pointer-events-none select-none">
            <Mountain className="w-28 h-28 -mr-6 -mt-6" />
          </div>

          <div className="space-y-3 relative z-10">
            {/* Top Target Audience Badge */}
            <div className="flex items-center justify-between gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono-tactical font-bold uppercase tracking-wider ${
                isSummit
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                  : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
              }`}>
                <Footprints className="w-3 h-3 text-amber-400" />
                <span>For Hikers, Walkers &amp; Viewers</span>
              </span>

              {isSummit && (
                <span className="flex items-center gap-1 text-[11px] font-mono-tactical text-amber-400 font-bold bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span>ACTIVE VIEW</span>
                </span>
              )}
            </div>

            {/* Option Title & Icon */}
            <div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isSummit ? 'bg-amber-500 text-neutral-950 shadow-md' : 'bg-neutral-800 text-amber-400'
                }`}>
                  <Mountain className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-display-tactical font-bold text-neutral-100 group-hover:text-amber-300 transition-colors">
                  Summit &amp; Trail Conditions
                </h3>
              </div>
              <p className="text-xs text-neutral-300 font-sans mt-1.5 leading-relaxed">
                Check whether it is muddy, dry, or windy before setting out. Watch the live summit camera overlooking Barbury Castle hillfort.
              </p>
            </div>

            {/* Feature Bullets (What you get) */}
            <div className="space-y-1.5 pt-1 text-xs font-mono-tactical text-neutral-300">
              <div className="flex items-start gap-2 bg-neutral-950/50 p-2 rounded-lg border border-neutral-850">
                <Video className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-neutral-200">Live 268m Summit Webcam:</span>
                  <span className="text-neutral-400 block text-[11px] font-sans">
                    Panoramic optical presets, zoom feeds &amp; YouTube live stream
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-neutral-950/50 p-2 rounded-lg border border-neutral-850">
                <Footprints className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-neutral-200">Trail Mud &amp; Walkability Index:</span>
                  <span className="text-neutral-400 block text-[11px] font-sans">
                    Surface firmness, chalk slippiness &amp; recent downland rainfall
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-neutral-950/50 p-2 rounded-lg border border-neutral-850">
                <CloudSun className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-neutral-200">Ridge Weather &amp; Dispatches:</span>
                  <span className="text-neutral-400 block text-[11px] font-sans">
                    Wind chill, gust speeds, visibility &amp; ranger trail bulletins
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button / Active State Bar */}
          <div className="mt-4 pt-3 border-t border-neutral-800/80 relative z-10">
            {isSummit ? (
              <div className="w-full py-2 px-3 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs font-mono-tactical flex items-center justify-between shadow-md">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Viewing Summit Cam &amp; Trail Intel</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-neutral-950/20 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  tacticalAudio.playRadarPing(880);
                  onSelectPerspective('summit-trail');
                }}
                className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-amber-300 font-semibold text-xs font-mono-tactical flex items-center justify-between border border-neutral-700 group-hover:border-amber-500/50 transition-colors cursor-pointer"
              >
                <span>Select Summit &amp; Trail Conditions</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* DOOR 2: RAPTOR & WILDLIFE RADAR */}
        <div
          id="select-door-radar"
          onClick={() => {
            if (!isRadar) {
              tacticalAudio.playRadarPing(920);
              onSelectPerspective('wildlife-radar');
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              tacticalAudio.playRadarPing(920);
              onSelectPerspective('wildlife-radar');
            }
          }}
          role="button"
          tabIndex={0}
          className={`group text-left rounded-2xl p-4 sm:p-5 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
            isRadar
              ? 'bg-gradient-to-b from-emerald-950/40 via-neutral-900/90 to-neutral-950 border-2 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xl shadow-emerald-500/10'
              : 'bg-neutral-900/60 hover:bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500/50 shadow-md'
          }`}
        >
          {/* Subtle Ambient Background Watermark */}
          <div className="absolute top-2 right-2 text-emerald-500/5 pointer-events-none select-none">
            <Compass className="w-28 h-28 -mr-6 -mt-6" />
          </div>

          <div className="space-y-3 relative z-10">
            {/* Top Target Audience Badge */}
            <div className="flex items-center justify-between gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono-tactical font-bold uppercase tracking-wider ${
                isRadar
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50'
                  : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
              }`}>
                <Eye className="w-3 h-3 text-emerald-400" />
                <span>For Birders, Spotters &amp; Observers</span>
              </span>

              {isRadar && (
                <span className="flex items-center gap-1 text-[11px] font-mono-tactical text-emerald-400 font-bold bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>ACTIVE VIEW</span>
                </span>
              )}
            </div>

            {/* Option Title & Icon */}
            <div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isRadar ? 'bg-emerald-500 text-neutral-950 shadow-md' : 'bg-neutral-800 text-emerald-400'
                }`}>
                  <Compass className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-display-tactical font-bold text-neutral-100 group-hover:text-emerald-300 transition-colors">
                  Raptor &amp; Wildlife Radar
                </h3>
              </div>
              <p className="text-xs text-neutral-300 font-sans mt-1.5 leading-relaxed">
                Scan tactical airspace for Red Kites, Buzzards, and Harriers. Explore thermal updrafts, GPS sighting blips, and flight corridors.
              </p>
            </div>

            {/* Feature Bullets (What you get) */}
            <div className="space-y-1.5 pt-1 text-xs font-mono-tactical text-neutral-300">
              <div className="flex items-start gap-2 bg-neutral-950/50 p-2 rounded-lg border border-neutral-850">
                <Map className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-neutral-200">Interactive Airspace Radar Map:</span>
                  <span className="text-neutral-400 block text-[11px] font-sans">
                    Live GPS blips across Wessex hotspots, elevation &amp; grid references
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-neutral-950/50 p-2 rounded-lg border border-neutral-850">
                <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-neutral-200">Verified Sighting Log ({sightingsCount} blips):</span>
                  <span className="text-neutral-400 block text-[11px] font-sans">
                    Log new contacts, view flight altitudes, species &amp; photos
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-neutral-950/50 p-2 rounded-lg border border-neutral-850">
                <Wind className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-neutral-200">Thermal Lift &amp; Soaring Score:</span>
                  <span className="text-neutral-400 block text-[11px] font-sans">
                    Escarpment wind vectors, ridge lift predictor &amp; soaring thermal zones
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button / Active State Bar */}
          <div className="mt-4 pt-3 border-t border-neutral-800/80 relative z-10">
            {isRadar ? (
              <div className="w-full py-2 px-3 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs font-mono-tactical flex items-center justify-between shadow-md">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Viewing Airspace Radar &amp; Sighting Map</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-neutral-950/20 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  tacticalAudio.playRadarPing(920);
                  onSelectPerspective('wildlife-radar');
                }}
                className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-emerald-300 font-semibold text-xs font-mono-tactical flex items-center justify-between border border-neutral-700 group-hover:border-emerald-500/50 transition-colors cursor-pointer"
              >
                <span>Select Raptor &amp; Wildlife Radar</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Orientation Bar */}
      <div className={`${showMobileDetails ? 'flex' : 'hidden md:flex'} pt-2 flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono-tactical text-neutral-400 px-1`}>
        <div className="flex items-center gap-2">
          <span className="text-neutral-500 font-bold uppercase text-[10px]">CURRENTLY SHOWING ON SCREEN:</span>
          {isSummit ? (
            <span className="text-amber-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Barbury Castle Summit Cam (268m ASL) &amp; Downland Trail Reports
            </span>
          ) : (
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Tactical Airspace Radar &amp; {sightingsCount} Wildlife Blips
            </span>
          )}
        </div>

        <div className="text-[11px] text-neutral-400">
          Tip: You can switch between views anytime using the buttons above or the top navigation bar.
        </div>
      </div>
    </section>
  );
};
