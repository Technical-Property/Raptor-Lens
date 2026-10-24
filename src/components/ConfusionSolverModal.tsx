import React, { useState } from 'react';
import { X, Scale, Volume2, Sparkles, Check, ExternalLink } from 'lucide-react';
import { RaptorSpecies } from '../types/raptor';
import { tacticalAudio } from '../utils/audio';

interface ConfusionSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  speciesList: RaptorSpecies[];
  onLogSpecies: (species: RaptorSpecies) => void;
}

interface ConfusionPreset {
  id: string;
  title: string;
  speciesAId: string;
  speciesBId: string;
  ruleOfThumb: string;
  keyDifferences: {
    feature: string;
    speciesADetail: string;
    speciesBDetail: string;
  }[];
}

const CONFUSION_PRESETS: ConfusionPreset[] = [
  {
    id: 'buzzard-vs-redkite',
    title: 'Common Buzzard vs. Red Kite',
    speciesAId: 'common-buzzard',
    speciesBId: 'red-kite',
    ruleOfThumb: 'Watch the tail rudder! If the tail is deeply forked and visibly twists from side to side in flight, it is always a Red Kite. A Buzzard has a broad, fan-shaped rounded tail and holds its wings in a distinct shallow V dihedral.',
    keyDifferences: [
      {
        feature: 'Tail Shape',
        speciesADetail: 'Broad, rounded fan shape with tight dark terminal bar.',
        speciesBDetail: 'Deeply forked, angled V-notch; twists like a kite rudder.'
      },
      {
        feature: 'Underwing Markings',
        speciesADetail: 'Dark comma mark at carpal joints; variable pale breast.',
        speciesBDetail: 'Prominent, blazing white patches near outer primary bases.'
      },
      {
        feature: 'Gliding Posture',
        speciesADetail: 'Wings held in a raised shallow V dihedral.',
        speciesBDetail: 'Wings held flatter with arched elbow and slightly drooping hands.'
      },
      {
        feature: 'Voice / Flight Call',
        speciesADetail: 'Loud, cat-like descending mew ("pee-yooow").',
        speciesBDetail: 'High musical whistling piping note trailing into chitter.'
      }
    ]
  },
  {
    id: 'kestrel-vs-sparrowhawk',
    title: 'Common Kestrel vs. Eurasian Sparrowhawk',
    speciesAId: 'common-kestrel',
    speciesBId: 'sparrowhawk',
    ruleOfThumb: 'Check the wings and hunting style! A Kestrel possesses pointed scythe-like falcon wings and hovers stationary in mid-air over road verges. A Sparrowhawk has blunt, rounded wings, a long square tail, and hunts via stealth bursts (flap-flap-glide) through hedgerows.',
    keyDifferences: [
      {
        feature: 'Wing Shape',
        speciesADetail: 'Pointed, scythe-like falcon wings tapering to sharp tips.',
        speciesBDetail: 'Short, broad and blunt-tipped; designed for forest agility.'
      },
      {
        feature: 'Tail Geometry',
        speciesADetail: 'Long, narrow with rounded corners and broad dark subterminal bar.',
        speciesBDetail: 'Noticeably square-ended with sharp corners.'
      },
      {
        feature: 'Hunting Style',
        speciesADetail: 'Iconic stationary hovering ("windhover") facing directly into breeze.',
        speciesBDetail: 'Rapid surprise ambush dashing low along hedges and wood edges.'
      },
      {
        feature: 'Flight Pattern',
        speciesADetail: 'Fast fluttering wingbeats punctuated by stationary hover or glide.',
        speciesBDetail: 'Characteristic "flap-flap-glide" burst rhythm.'
      }
    ]
  },
  {
    id: 'henharrier-vs-marshharrier',
    title: 'Hen Harrier vs. Marsh Harrier',
    speciesAId: 'hen-harrier',
    speciesBId: 'marsh-harrier',
    ruleOfThumb: 'Look for the bright white rump patch and flight posture! The Hen Harrier (especially the female "ringtail") shows a striking, brilliant white rectangular rump patch above a barred tail and soars with wings in a steep high-V. The Marsh Harrier is larger, heavier, chocolate brown with pale cream head/shoulders, and lacks the bright white rump.',
    keyDifferences: [
      {
        feature: 'Rump Marking',
        speciesADetail: 'Bright, blinding white square rump patch visible at distance.',
        speciesBDetail: 'Generally lacks contrasting white rump (uniform dark brown or greyish).'
      },
      {
        feature: 'Gliding Dihedral',
        speciesADetail: 'Wings held in an exaggerated, steep high-V posture.',
        speciesBDetail: 'Shallow V dihedral; longer, broader and more laboured wingbeats.'
      },
      {
        feature: 'Male Plumage',
        speciesADetail: 'Stunning pale ghostly silver-grey with jet-black wingtips ("The Ghost").',
        speciesBDetail: 'Tricoloured: chestnut body, silver-grey wings with black tips.'
      },
      {
        feature: 'Primary Habitat',
        speciesADetail: 'Open high chalk downland, military gallops, winter stubble.',
        speciesBDetail: 'Reedbeds, marshes, and damp lowland river valleys.'
      }
    ]
  },
  {
    id: 'peregrine-vs-hobby',
    title: 'Peregrine Falcon vs. Eurasian Hobby',
    speciesAId: 'peregrine-falcon',
    speciesBId: 'hobby',
    ruleOfThumb: 'Body proportions & flight tempo! Peregrine is heavily built, barrel-chested like an airborne bullet with thick black helmet/mustache. Eurasian Hobby is sleeker, resembling an oversized Swift with extremely long scythe wings, rust-red thighs, and catches dragonflies on the wing.',
    keyDifferences: [
      {
        feature: 'Silhouette & Build',
        speciesADetail: 'Broad chest, heavy muscular build, tapering pointed wings.',
        speciesBDetail: 'Slender, long sickle-shaped wings; silhouette like a giant swift.'
      },
      {
        feature: 'Underparts & Vent',
        speciesADetail: 'White to buff breast densely barred with black horizontal bands.',
        speciesBDetail: 'Heavily streaked vertically with distinctive bright rufous/red under-tail "trousers".'
      },
      {
        feature: 'Prey & Tactics',
        speciesADetail: 'High-altitude stoop at speed (up to 200 mph) striking pigeons & ducks.',
        speciesBDetail: 'Agile aerial acrobat snatching dragonflies and swallows in mid-flight.'
      },
      {
        feature: 'UK Seasonality',
        speciesADetail: 'Resident year-round on chalk cliffs, quarries and pylons.',
        speciesBDetail: 'Summer migrant only (arrives May, departs September for Africa).'
      }
    ]
  }
];

export const ConfusionSolverModal: React.FC<ConfusionSolverModalProps> = ({
  isOpen,
  onClose,
  speciesList,
  onLogSpecies,
}) => {
  const [activePresetId, setActivePresetId] = useState<string>('buzzard-vs-redkite');
  const [customSpeciesA, setCustomSpeciesA] = useState<string>('common-buzzard');
  const [customSpeciesB, setCustomSpeciesB] = useState<string>('red-kite');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen, activePresetId, isCustomMode]);

  if (!isOpen) return null;

  const activePreset = CONFUSION_PRESETS.find((p) => p.id === activePresetId) || CONFUSION_PRESETS[0];

  const speciesAId = isCustomMode ? customSpeciesA : activePreset.speciesAId;
  const speciesBId = isCustomMode ? customSpeciesB : activePreset.speciesBId;

  const speciesA = speciesList.find((s) => s.id === speciesAId) || speciesList[0];
  const speciesB = speciesList.find((s) => s.id === speciesBId) || speciesList[1];

  return (
    <div 
      ref={scrollContainerRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/85 backdrop-blur-md p-3 sm:p-4 flex justify-center items-start overscroll-contain"
    >
      <div className="relative w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 mb-16 sm:mb-24">
        {/* Modal Header */}
        <div className="bg-neutral-900/90 border-b border-neutral-800 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-mono-tactical uppercase tracking-wider text-amber-400 font-bold">
                DIAGNOSTIC FIELD COMPARISON
              </span>
              <span className="text-neutral-600 text-xs">|</span>
              <span className="text-[10px] font-mono-tactical text-neutral-400">1-Tap Confusion Solver</span>
            </div>
            <h3 className="font-display-tactical text-xl sm:text-2xl font-bold text-neutral-100">
              Raptor Side-by-Side Confusion Solver
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
        <div className="p-4 sm:p-6 space-y-6 text-neutral-200 font-mono-tactical text-xs">
          {/* Quick Preset Selector Buttons */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase text-neutral-400 font-bold tracking-wider">
              FREQUENT DOWNLAND DILEMMAS:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CONFUSION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    tacticalAudio.playRadarPing(880);
                    setActivePresetId(preset.id);
                    setIsCustomMode(false);
                  }}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    !isCustomMode && activePresetId === preset.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200'
                  }`}
                >
                  <div className="text-[11px] font-display-tactical font-semibold truncate">
                    {preset.title}
                  </div>
                  <div className="text-[9px] text-neutral-500">Field Dilemma</div>
                </button>
              ))}
            </div>
          </div>

          {/* Rule of Thumb Golden Banner */}
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3.5 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                FIELD SCOUT RULE OF THUMB:
              </span>
              <p className="text-neutral-200 font-sans text-xs leading-relaxed">
                {activePreset.ruleOfThumb}
              </p>
            </div>
          </div>

          {/* Side-by-Side Species Visual Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Species A */}
            <div className="bg-neutral-900/80 border-2 border-amber-500/50 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider block">
                    CANDIDATE 1
                  </span>
                  <h4 className="font-display-tactical text-lg font-bold text-neutral-100">
                    {speciesA.commonName}
                  </h4>
                  <span className="text-neutral-400 italic text-[11px]">
                    {speciesA.scientificName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-neutral-500 block uppercase">WINGSPAN</span>
                  <span className="text-amber-400 font-bold text-xs">{speciesA.wingspanCm}</span>
                </div>
              </div>

              {/* Silhouette SVG */}
              <div className="w-full h-36 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-center p-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:12px_12px] opacity-40"></div>
                <svg viewBox="0 0 300 200" className="w-full h-full max-h-28 text-amber-400 fill-current drop-shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                  <path d={speciesA.silhouetteSvg} />
                </svg>
              </div>

              {/* Play Real Recorded Call */}
              <button
                type="button"
                onClick={() => {
                  tacticalAudio.setMuted(false);
                  tacticalAudio.playSpeciesCall(speciesA.id);
                }}
                className="w-full py-2 px-3 rounded-lg border border-amber-500/40 bg-neutral-950 hover:bg-neutral-850 flex items-center justify-center gap-2 font-mono-tactical text-xs text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
                title={`Play real recorded ${speciesA.commonName} call`}
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>🔊 Play Real Call ({speciesA.commonName})</span>
              </button>

              <div className="space-y-1.5 text-[11px]">
                <div className="bg-neutral-950/80 p-2 rounded border border-neutral-800">
                  <span className="text-amber-400 font-bold block mb-0.5">FLIGHT STYLE:</span>
                  <span className="text-neutral-200 font-sans">{speciesA.flightProfileLabel}</span>
                </div>
                <div className="bg-neutral-950/80 p-2 rounded border border-neutral-800">
                  <span className="text-neutral-400 font-bold block mb-0.5">KEY MARK:</span>
                  <span className="text-neutral-200 font-sans">{speciesA.keyMarks[0]}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  tacticalAudio.playRadarPing(920);
                  onLogSpecies(speciesA);
                  onClose();
                }}
                className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/40 text-center cursor-pointer transition-colors"
              >
                + Log as {speciesA.commonName}
              </button>
            </div>

            {/* Species B */}
            <div className="bg-neutral-900/80 border-2 border-cyan-500/50 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider block">
                    CANDIDATE 2
                  </span>
                  <h4 className="font-display-tactical text-lg font-bold text-neutral-100">
                    {speciesB.commonName}
                  </h4>
                  <span className="text-neutral-400 italic text-[11px]">
                    {speciesB.scientificName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-neutral-500 block uppercase">WINGSPAN</span>
                  <span className="text-cyan-400 font-bold text-xs">{speciesB.wingspanCm}</span>
                </div>
              </div>

              {/* Silhouette SVG */}
              <div className="w-full h-36 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-center p-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:12px_12px] opacity-40"></div>
                <svg viewBox="0 0 300 200" className="w-full h-full max-h-28 text-cyan-400 fill-current drop-shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                  <path d={speciesB.silhouetteSvg} />
                </svg>
              </div>

              {/* Play Real Recorded Call */}
              <button
                type="button"
                onClick={() => {
                  tacticalAudio.setMuted(false);
                  tacticalAudio.playSpeciesCall(speciesB.id);
                }}
                className="w-full py-2 px-3 rounded-lg border border-cyan-500/40 bg-neutral-950 hover:bg-neutral-850 flex items-center justify-center gap-2 font-mono-tactical text-xs text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
                title={`Play real recorded ${speciesB.commonName} call`}
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>🔊 Play Real Call ({speciesB.commonName})</span>
              </button>

              <div className="space-y-1.5 text-[11px]">
                <div className="bg-neutral-950/80 p-2 rounded border border-neutral-800">
                  <span className="text-cyan-400 font-bold block mb-0.5">FLIGHT STYLE:</span>
                  <span className="text-neutral-200 font-sans">{speciesB.flightProfileLabel}</span>
                </div>
                <div className="bg-neutral-950/80 p-2 rounded border border-neutral-800">
                  <span className="text-neutral-400 font-bold block mb-0.5">KEY MARK:</span>
                  <span className="text-neutral-200 font-sans">{speciesB.keyMarks[0]}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  tacticalAudio.playRadarPing(920);
                  onLogSpecies(speciesB);
                  onClose();
                }}
                className="w-full py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold border border-cyan-500/40 text-center cursor-pointer transition-colors"
              >
                + Log as {speciesB.commonName}
              </button>
            </div>
          </div>

          {/* Diagnostic Feature Breakdown Table */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              OPTICAL TRAIT BREAKDOWN
            </h4>
            <div className="space-y-2">
              {activePreset.keyDifferences.map((diff, idx) => (
                <div key={idx} className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="text-neutral-400 font-bold text-xs uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    {diff.feature}
                  </div>
                  <div className="text-neutral-200 text-xs font-sans">
                    <strong className="text-amber-400 text-[11px] block md:hidden">{speciesA.commonName}:</strong>
                    {diff.speciesADetail}
                  </div>
                  <div className="text-neutral-200 text-xs font-sans">
                    <strong className="text-cyan-400 text-[11px] block md:hidden">{speciesB.commonName}:</strong>
                    {diff.speciesBDetail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Close Action */}
          <div className="flex justify-end pt-2 border-t border-neutral-800">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 cursor-pointer font-mono-tactical text-xs"
            >
              Done Comparing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
