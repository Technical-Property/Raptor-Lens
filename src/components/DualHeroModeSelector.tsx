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

  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <section 
      aria-label="Choose Your View"
      className="bg-neutral-950/90 backdrop-blur-xl border border-neutral-800/90 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3"
    >
      {/* Clean, Friendly Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs sm:text-sm font-semibold text-neutral-200">
            Choose Your View:
          </span>
          <span className="text-xs text-neutral-400">
            {activeSectorShortName}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails((prev) => !prev)}
          className="text-xs font-medium text-amber-300/90 hover:text-amber-200 underline underline-offset-4 cursor-pointer py-0.5 px-1 transition-colors"
        >
          {showDetails ? 'Hide View Details' : 'Compare Views & Features'}
        </button>
      </div>

      {/* The Two Main View Cards — Clean, Side-by-Side, Scannable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
        {/* DOOR 1: SUMMIT WEBCAM & TRAIL WEATHER */}
        <button
          type="button"
          id="select-door-summit"
          onClick={() => {
            if (!isSummit) {
              tacticalAudio.playRadarPing(880);
              onSelectPerspective('summit-trail');
            }
          }}
          className={`group text-left rounded-xl p-3.5 sm:p-4 transition-all cursor-pointer flex items-start justify-between gap-3 relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            isSummit
              ? 'bg-gradient-to-r from-amber-500/15 via-neutral-900 to-neutral-900 border-2 border-amber-500 shadow-lg shadow-amber-500/10'
              : 'bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              isSummit ? 'bg-amber-500 text-neutral-950 shadow-md' : 'bg-neutral-800 text-amber-400 group-hover:bg-neutral-700'
            }`}>
              <Mountain className="w-5 h-5" />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display-tactical text-sm sm:text-base font-bold text-neutral-100">
                  Live Webcam &amp; Trail Weather
                </span>
                <span className="text-[11px] font-medium text-amber-300/90">
                  • For Walkers &amp; Viewers
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 leading-snug">
                Watch the 24/7 hilltop camera and check live wind, visibility, and trail footing before your walk.
              </p>
            </div>
          </div>

          <div className="shrink-0 self-center">
            {isSummit ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-400 group-hover:text-amber-300 px-2 py-1 rounded-lg transition-colors">
                <span className="hidden md:inline">Switch</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            )}
          </div>
        </button>

        {/* DOOR 2: RAPTOR & WILDLIFE RADAR MAP */}
        <button
          type="button"
          id="select-door-radar"
          onClick={() => {
            if (!isRadar) {
              tacticalAudio.playRadarPing(920);
              onSelectPerspective('wildlife-radar');
            }
          }}
          className={`group text-left rounded-xl p-3.5 sm:p-4 transition-all cursor-pointer flex items-start justify-between gap-3 relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
            isRadar
              ? 'bg-gradient-to-r from-emerald-500/15 via-neutral-900 to-neutral-900 border-2 border-emerald-500 shadow-lg shadow-emerald-500/10'
              : 'bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              isRadar ? 'bg-emerald-500 text-neutral-950 shadow-md' : 'bg-neutral-800 text-emerald-400 group-hover:bg-neutral-700'
            }`}>
              <Compass className="w-5 h-5" />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display-tactical text-sm sm:text-base font-bold text-neutral-100">
                  Raptor &amp; Wildlife Radar Map
                </span>
                <span className="text-[11px] font-medium text-emerald-300/90">
                  • {sightingsCount} Sightings
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 leading-snug">
                Explore the interactive map of Red Kites, Buzzards, Kestrels, and soaring thermals across the downs.
              </p>
            </div>
          </div>

          <div className="shrink-0 self-center">
            {isRadar ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-400 group-hover:text-emerald-300 px-2 py-1 rounded-lg transition-colors">
                <span className="hidden md:inline">Switch</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Expandable Feature Breakdown (When user clicks "Compare Views & Features") */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-neutral-800/80 text-xs text-neutral-300">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5 space-y-2">
            <div className="font-bold text-amber-300 flex items-center gap-2">
              <Footprints className="w-4 h-4 text-amber-400" />
              <span>Included in Live Webcam &amp; Trail Weather:</span>
            </div>
            <ul className="space-y-1.5 text-neutral-300 pl-1">
              <li className="flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span><strong>24/7 Hilltop Webcam:</strong> Live pan-tilt views over Hackpen Hill &amp; Barbury Castle</span>
              </li>
              <li className="flex items-center gap-2">
                <CloudSun className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>Live Ridge Weather:</strong> Wind speed, gusts, visibility, and sunset times</span>
              </li>
              <li className="flex items-center gap-2">
                <Footprints className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span><strong>Walker Info:</strong> Free parking guide, dog lead rules, and trail distances</span>
              </li>
            </ul>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5 space-y-2">
            <div className="font-bold text-emerald-300 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Included in Raptor &amp; Wildlife Radar Map:</span>
            </div>
            <ul className="space-y-1.5 text-neutral-300 pl-1">
              <li className="flex items-center gap-2">
                <Map className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span><strong>Interactive Sightings Map:</strong> Live GPS locations of spotted birds of prey</span>
              </li>
              <li className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>Community Sighting Log:</strong> Log your own sightings &amp; verify local reports</span>
              </li>
              <li className="flex items-center gap-2">
                <Wind className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>Soaring Conditions:</strong> Ridge lift ratings and best viewing hotspots</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
};
