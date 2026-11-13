import React from 'react';
import { Hotspot, SightingLog } from '../types/raptor';
import { X, Compass, Eye, Car, ShieldAlert, Sparkles, Satellite, ExternalLink, Video } from 'lucide-react';
import { tacticalAudio } from '../utils/audio';
import { getUkTimeZoneLabel } from '../utils/recency';

interface HotspotDetailModalProps {
  hotspot: Hotspot | null;
  onClose: () => void;
  onLogAtHotspot: (hotspot: Hotspot) => void;
  onFlyToMap: (hotspot: Hotspot) => void;
  relatedSightings: SightingLog[];
  onOpenLiveCam?: () => void;
}

export const HotspotDetailModal: React.FC<HotspotDetailModalProps> = ({
  hotspot,
  onClose,
  onLogAtHotspot,
  onFlyToMap,
  relatedSightings,
  onOpenLiveCam,
}) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (hotspot) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [hotspot]);

  if (!hotspot) return null;

  return (
    <div 
      ref={scrollContainerRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/80 backdrop-blur-md p-3 sm:p-4 flex justify-center items-start overscroll-contain"
    >
      <div className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 mb-16 sm:mb-24">
        {/* Modal Header */}
        <div className="bg-neutral-900/90 border-b border-neutral-800 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-mono-tactical uppercase tracking-wider text-amber-400 font-bold">
                TACTICAL SECTOR DOSSIER
              </span>
              <span className="text-neutral-500 font-mono-tactical text-[10px]">|</span>
              <span className="text-neutral-400 font-mono-tactical text-[10px]">{hotspot.gridRef}</span>
            </div>
            <h3 className="font-display-tactical text-xl sm:text-2xl font-bold text-neutral-100">
              {hotspot.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 text-neutral-200 font-mono-tactical text-xs">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800">
              <span className="text-neutral-500 text-[10px] block uppercase">ELEVATION</span>
              <span className="text-amber-400 font-bold text-base">{hotspot.elevationM}m ASL</span>
            </div>
            <div className="bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800">
              <span className="text-neutral-500 text-[10px] block uppercase">THERMAL LIFT</span>
              <span className="text-emerald-400 font-bold text-base">{hotspot.thermalRating}</span>
            </div>
            <div className="bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800">
              <span className="text-neutral-500 text-[10px] block uppercase">BEST WINDS</span>
              <span className="text-cyan-400 font-bold text-base">{hotspot.bestWindDirections.join(', ')}</span>
            </div>
            <div className="bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800">
              <span className="text-neutral-500 text-[10px] block uppercase">OBSERVERS</span>
              <span className="text-neutral-100 font-bold text-base">{hotspot.activeObservers} In Field</span>
            </div>
          </div>

          {/* Habitat & Description */}
          <div className="space-y-2">
            <h4 className="text-amber-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" /> Sector Topography & Raptor Ecology
            </h4>
            <div className="bg-neutral-900/70 p-3 rounded-xl border border-neutral-800/80 leading-relaxed font-sans text-neutral-300">
              {hotspot.description}
            </div>
          </div>

          {/* Key Species */}
          <div className="space-y-2">
            <h4 className="text-amber-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> High-Probability Raptor Species
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {hotspot.keyRaptors.map((rap) => (
                <span
                  key={rap}
                  className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200 font-semibold text-xs flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  {rap}
                </span>
              ))}
            </div>
          </div>

          {/* Vantage Points & Optics Advisory */}
          <div className="space-y-2">
            <h4 className="text-emerald-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Field Vantage & Optical Placement
            </h4>
            <div className="bg-neutral-900/70 p-3 rounded-xl border border-neutral-800/80 leading-relaxed font-sans text-neutral-300">
              {hotspot.vantagePointTips}
            </div>
          </div>

          {/* Access & Parking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-neutral-900/50 p-3 rounded-xl border border-neutral-850 space-y-1">
              <span className="text-neutral-400 font-bold flex items-center gap-1 text-[11px]">
                <Car className="w-3.5 h-3.5 text-amber-400" /> PARKING TELEMETRY
              </span>
              <p className="text-neutral-300 text-[11px] leading-relaxed font-sans">
                {hotspot.parkingInfo}
              </p>
            </div>

            <div className="bg-neutral-900/50 p-3 rounded-xl border border-neutral-850 space-y-1">
              <span className="text-neutral-400 font-bold flex items-center gap-1 text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" /> PUBLIC RIGHTS OF WAY
              </span>
              <p className="text-neutral-300 text-[11px] leading-relaxed font-sans">
                {hotspot.accessInfo}
              </p>
            </div>
          </div>

          {/* Hybrid Aerial Recon & Google Vantage Preview */}
          <div className="space-y-2.5 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <h4 className="text-cyan-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Satellite className="w-3.5 h-3.5 text-cyan-400" />
                <span>Google Maps Hybrid Vantage & Aerial Recon</span>
              </h4>
              <span className="text-[9px] font-mono-tactical text-neutral-400">
                {hotspot.coordinates[0].toFixed(4)}°N, {Math.abs(hotspot.coordinates[1]).toFixed(4)}°{hotspot.coordinates[1] < 0 ? 'W' : 'E'}
              </span>
            </div>

            {/* Embedded Interactive Aerial Map preview */}
            <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-inner">
              <iframe
                title={`${hotspot.name} Aerial Satellite Recon`}
                width="100%"
                height="100%"
                loading="lazy"
                src={`https://maps.google.com/maps?q=${hotspot.coordinates[0]},${hotspot.coordinates[1]}&t=k&z=16&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full border-0 filter contrast-110"
              />
              <div className="absolute top-2 left-2 pointer-events-none bg-neutral-950/85 backdrop-blur px-2 py-1 rounded text-[10px] font-mono-tactical text-amber-300 border border-neutral-800">
                🛰️ Google Satellite Hybrid • 16x Orbit
              </div>
            </div>

            {/* Direct Google Maps Navigation & Street View Tools */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <a
                href={`https://www.google.com/maps/@${hotspot.coordinates[0]},${hotspot.coordinates[1]},17z/data=!3m1!1e3`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-500/50 text-neutral-300 hover:text-cyan-300 flex items-center justify-between text-xs transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Satellite className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-[11px]">3D Aerial Orbit</span>
                </div>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>

              <a
                href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${hotspot.coordinates[0]},${hotspot.coordinates[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 text-neutral-300 hover:text-amber-300 flex items-center justify-between text-xs transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-[11px]">Street View Layby</span>
                </div>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${hotspot.coordinates[0]},${hotspot.coordinates[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/50 text-neutral-300 hover:text-emerald-300 flex items-center justify-between text-xs transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Car className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-[11px]">Route to Trailhead</span>
                </div>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </div>
          </div>

          {/* Recent Sighting Logs in this Hotspot */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <h4 className="text-neutral-400 font-bold uppercase tracking-wider text-[11px]">
                RECENT SIGHTINGS AT THIS HOTSPOT ({relatedSightings.length})
              </h4>
            </div>

            {relatedSightings.length === 0 ? (
              <div className="text-neutral-500 italic py-2">
                No recent contacts recorded yet for this sector. Be the first to log!
              </div>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {relatedSightings.slice(0, 3).map((sgt) => (
                  <div key={sgt.id} className="bg-neutral-900 p-2 rounded border border-neutral-800 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-200 font-bold">
                      {sgt.speciesName} ({sgt.count}x) • <span className="text-amber-400">{sgt.behavior}</span>
                    </span>
                    <span className="text-neutral-500">{sgt.time} {getUkTimeZoneLabel(sgt.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800">
            {onOpenLiveCam ? (
              <button
                id="hotspot-live-cam-btn"
                onClick={() => {
                  tacticalAudio.playRadarPing(850);
                  onOpenLiveCam();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 font-mono-tactical font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Video className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>Watch Barbury Field Cam (30x)</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  tacticalAudio.playRadarPing(880);
                  onFlyToMap(hotspot);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-cyan-300 border border-cyan-500/40 font-mono-tactical font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" /> Target on Tactical Map
              </button>
              <button
                onClick={() => {
                  tacticalAudio.playRadarPing(920);
                  onLogAtHotspot(hotspot);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display-tactical font-bold tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                + Log Sighting Here
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
