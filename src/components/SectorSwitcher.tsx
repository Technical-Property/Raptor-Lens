import React from 'react';
import { UK_SECTORS } from '../data/sectors';
import { SectorId } from '../types/sector';
import { Compass, MapPin, Wind, Mountain, Navigation } from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

interface SectorSwitcherProps {
  activeSectorId: SectorId;
  onSelectSector: (sectorId: SectorId) => void;
  className?: string;
  variant?: 'pills' | 'cards' | 'compact';
}

export const SectorSwitcher: React.FC<SectorSwitcherProps> = ({
  activeSectorId,
  onSelectSector,
  className = '',
  variant = 'pills',
}) => {
  const activeSector = UK_SECTORS.find((s) => s.id === activeSectorId) || UK_SECTORS[0];

  const handleSelect = (id: SectorId) => {
    if (id === activeSectorId) return;
    tacticalAudio.playRadarPing(880);
    onSelectSector(id);
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="text-[10px] font-mono-tactical text-neutral-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Navigation className="w-3 h-3 text-amber-400" />
          SECTOR:
        </span>
        <select
          id="sector-compact-select"
          value={activeSectorId}
          onChange={(e) => handleSelect(e.target.value as SectorId)}
          className="bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1 text-xs font-mono-tactical text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          {UK_SECTORS.map((sec) => (
            <option key={sec.id} value={sec.id}>
              {sec.shortName} ({sec.county})
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Sector Pills Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] font-mono-tactical text-neutral-400 font-bold uppercase tracking-widest flex items-center gap-1">
            <Compass className="w-3 h-3 text-amber-400 animate-spin-slow" />
            AIRSPACE SECTORS
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {UK_SECTORS.map((sec) => {
            const isActive = sec.id === activeSectorId;
            return (
              <button
                key={sec.id}
                id={`sector-pill-${sec.id}`}
                onClick={() => handleSelect(sec.id)}
                className={`group px-3 py-1.5 rounded-xl text-xs font-mono-tactical font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-lg shadow-amber-500/20 font-bold'
                    : 'bg-neutral-900/80 hover:bg-neutral-800/90 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    isActive ? 'bg-amber-400 animate-pulse' : 'bg-neutral-600 group-hover:bg-neutral-400'
                  }`}
                />
                <span>{sec.shortName}</span>
                {sec.id === 'ridgeway-wessex' && (
                  <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/30 text-amber-200 uppercase tracking-tighter">
                    CORE
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Sector Dossier Strip */}
      <div className="bg-neutral-950/70 border border-neutral-800/80 rounded-xl px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono-tactical backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="space-x-1.5">
            <span className="font-bold text-neutral-100">{activeSector.name}</span>
            <span className="text-neutral-500">•</span>
            <span className="text-neutral-400">{activeSector.county}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-neutral-400">
          <div className="flex items-center gap-1">
            <Mountain className="w-3 h-3 text-emerald-400" />
            <span>Elev: <strong className="text-neutral-200">{activeSector.elevationRange}</strong></span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <Wind className="w-3 h-3 text-cyan-400" />
            <span className="truncate max-w-[280px]">{activeSector.thermalCorridorName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
