import React from 'react';
import { RaptorSpecies, UkStatus } from '../types/raptor';
import { X, Sparkles, AlertTriangle, Volume2, Compass, Check, ExternalLink } from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

interface SpeciesDetailModalProps {
  species: RaptorSpecies | null;
  onClose: () => void;
  onLogSpecies: (species: RaptorSpecies) => void;
}

export const SpeciesDetailModal: React.FC<SpeciesDetailModalProps> = ({
  species,
  onClose,
  onLogSpecies,
}) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const [isPlayingCall, setIsPlayingCall] = React.useState(false);

  React.useEffect(() => {
    setIsPlayingCall(false);
    if (species) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        tacticalAudio.stopSpeciesCall();
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [species]);

  if (!species) return null;

  const getStatusBadge = (status: UkStatus) => {
    switch (status) {
      case 'Red':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono-tactical font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">UK RED LIST (CRITICAL)</span>;
      case 'Amber':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono-tactical font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">UK AMBER (MODERATE CONCERN)</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono-tactical font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">UK GREEN (LEAST CONCERN)</span>;
    }
  };

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
              <span className="text-[10px] font-mono-tactical uppercase tracking-wider text-amber-400 font-bold">
                RAPTOR ANATOMY DOSSIER
              </span>
              <span className="text-neutral-600">|</span>
              {getStatusBadge(species.ukStatus)}
            </div>
            <h3 className="font-display-tactical text-xl sm:text-2xl font-bold text-neutral-100">
              {species.commonName}
            </h3>
            <span className="text-xs font-mono-tactical italic text-neutral-400">
              {species.scientificName}
            </span>
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
          {/* Silhouette Showcase Canvas */}
          <div className="w-full h-52 bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Tactical Grid Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:14px_14px] opacity-40"></div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-36 h-36 rounded-full border border-neutral-700/30"></div>
              <div className="w-52 h-52 rounded-full border border-neutral-700/20"></div>
              <div className="w-full h-px bg-neutral-700/30 absolute"></div>
              <div className="h-full w-px bg-neutral-700/30 absolute"></div>
            </div>

            {/* Silhouette SVG */}
            <svg
              viewBox="0 0 300 200"
              className="w-full h-full max-h-40 text-amber-400 fill-current drop-shadow-[0_0_18px_rgba(245,158,11,0.35)]"
            >
              <path d={species.silhouetteSvg} />
            </svg>

            <div className="absolute bottom-2 left-3 text-[10px] text-neutral-400">
              VENTRAL FLIGHT SILHOUETTE // OPTICAL CROSSHAIR
            </div>
          </div>

          {/* Morphometrics Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800 text-center">
              <span className="text-neutral-500 text-[10px] block uppercase">WINGSPAN</span>
              <span className="text-amber-400 font-bold text-sm">{species.wingspanCm}</span>
            </div>
            <div className="bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800 text-center">
              <span className="text-neutral-500 text-[10px] block uppercase">BODY LENGTH</span>
              <span className="text-emerald-400 font-bold text-sm">{species.lengthCm}</span>
            </div>
            <div className="bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800 text-center">
              <span className="text-neutral-500 text-[10px] block uppercase">WEIGHT</span>
              <span className="text-cyan-400 font-bold text-sm">{species.weightG}</span>
            </div>
          </div>

          {/* Key Field Diagnostic Marks */}
          <div className="space-y-2">
            <h4 className="text-amber-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Diagnostic Field Identification Marks
            </h4>
            <div className="bg-neutral-900/70 p-3 rounded-xl border border-neutral-800/80 space-y-1.5 font-sans text-neutral-300">
              {species.keyMarks.map((mark, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{mark}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Flight Mechanics & Profile */}
          <div className="space-y-2">
            <h4 className="text-emerald-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" /> Overhead Aerodynamics & Behaviour
            </h4>
            <div className="bg-neutral-900/70 p-3 rounded-xl border border-neutral-800/80 leading-relaxed font-sans text-neutral-300 text-xs">
              {species.flightDescription}
            </div>
          </div>

          {/* Vocalisations & Call */}
          <div className="bg-neutral-900/70 p-3 rounded-xl border border-neutral-800/80 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" /> Call &amp; Vocalisations
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    tacticalAudio.setMuted(false);
                    const started = tacticalAudio.playSpeciesCall(species.id, () => {
                      setIsPlayingCall(false);
                    });
                    setIsPlayingCall(started);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono-tactical font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm ${
                    isPlayingCall
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                      : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300'
                  }`}
                >
                  <span>{isPlayingCall ? '⏹️ Stop Recording' : '🔊 Play Real Call'}</span>
                </button>
                <a
                  href="https://merlin.allaboutbirds.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 text-[11px] font-mono-tactical font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  title="Identify calls and listen to verified field audio recordings on Merlin Bird ID (Cornell Lab)"
                >
                  <span>Merlin ID</span>
                  <ExternalLink className="w-3 h-3 text-cyan-400" />
                </a>
              </div>
            </div>
            <p className="text-neutral-300 font-sans text-xs italic">
              "{species.callDescription}"
            </p>
            <p className="text-[10px] text-neutral-500 font-sans">
              Authentic ornithological field recording (Xeno-canto / Wikimedia Commons). You can also match live calls in the field with Cornell Lab's <strong>Merlin Bird ID</strong>.
            </p>
          </div>

          {/* Confusion Species Warning */}
          <div className="bg-neutral-900/50 p-3 rounded-xl border border-neutral-800 space-y-1.5">
            <span className="text-rose-400 font-bold flex items-center gap-1.5 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" /> DO NOT CONFUSE WITH:
            </span>
            <div className="space-y-1">
              {species.confusionSpecies.map((conf, i) => (
                <div key={i} className="text-neutral-300 text-[11px] font-sans">
                  • {conf}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                onLogSpecies(species);
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display-tactical font-bold tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              + Log Sighting of {species.commonName}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
