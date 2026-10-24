import React, { useState, useMemo } from 'react';
import { RaptorSpecies, WingShape, TailShape, FlightProfile, UkStatus } from '../types/raptor';
import { Search, Filter, RotateCcw, AlertTriangle, ChevronRight, Eye, Sparkles, Scale, ExternalLink } from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

interface SilhouetteIdentifierProps {
  speciesList: RaptorSpecies[];
  onSelectSpecies: (species: RaptorSpecies) => void;
  onLogSpecies: (species: RaptorSpecies) => void;
}

export const SilhouetteIdentifier: React.FC<SilhouetteIdentifierProps> = ({
  speciesList,
  onSelectSpecies,
  onLogSpecies,
}) => {
  const [selectedWingShape, setSelectedWingShape] = useState<WingShape | 'all'>('all');
  const [selectedTailShape, setSelectedTailShape] = useState<TailShape | 'all'>('all');
  const [selectedFlightProfile, setSelectedFlightProfile] = useState<FlightProfile | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [compareSpeciesA, setCompareSpeciesA] = useState<string>('red-kite');
  const [compareSpeciesB, setCompareSpeciesB] = useState<string>('common-buzzard');
  const [activeTab, setActiveTab] = useState<'matrix' | 'compare'>('matrix');

  // Filter logic
  const filteredSpecies = useMemo(() => {
    return speciesList.filter((sp) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = sp.commonName.toLowerCase().includes(q) || sp.scientificName.toLowerCase().includes(q);
        const matchMarks = sp.keyMarks.some((m) => m.toLowerCase().includes(q));
        const matchFlight = sp.flightDescription.toLowerCase().includes(q);
        if (!matchName && !matchMarks && !matchFlight) return false;
      }

      if (selectedWingShape !== 'all' && sp.wingShape !== selectedWingShape) return false;
      if (selectedTailShape !== 'all' && sp.tailShape !== selectedTailShape) return false;
      if (selectedFlightProfile !== 'all' && sp.flightProfile !== selectedFlightProfile) return false;
      if (selectedCategory !== 'all' && sp.category !== selectedCategory) return false;

      return true;
    });
  }, [speciesList, searchQuery, selectedWingShape, selectedTailShape, selectedFlightProfile, selectedCategory]);

  const handleResetFilters = () => {
    tacticalAudio.playRadarPing(650);
    setSelectedWingShape('all');
    setSelectedTailShape('all');
    setSelectedFlightProfile('all');
    setSelectedCategory('all');
    setSearchQuery('');
  };

  const speciesA = speciesList.find((s) => s.id === compareSpeciesA) || speciesList[0];
  const speciesB = speciesList.find((s) => s.id === compareSpeciesB) || speciesList[1];

  const getStatusBadge = (status: UkStatus) => {
    switch (status) {
      case 'Red':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-tactical font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">UK RED LIST</span>;
      case 'Amber':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-tactical font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">UK AMBER</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-tactical font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">UK GREEN</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/90 border border-neutral-800 p-4 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs font-mono-tactical uppercase tracking-wider text-amber-400 font-bold">
              FIELD CLASSIFICATION ENGINE
            </span>
          </div>
          <h2 className="font-display-tactical text-xl md:text-2xl font-bold text-neutral-100 tracking-wide">
            Bird of Prey Silhouette Key
          </h2>
          <p className="text-xs md:text-sm text-neutral-400">
            Identify British raptors by overhead flight geometry, wing shape, tail rudder, and dihedral gliding posture.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800 self-start sm:self-auto">
          <button
            id="tab-silhouette-matrix"
            onClick={() => {
              tacticalAudio.playRadarPing(800);
              setActiveTab('matrix');
            }}
            className={`px-3 py-1.5 rounded text-xs font-mono-tactical font-semibold transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Shape Filter Key ({filteredSpecies.length})
          </button>
          <button
            id="tab-silhouette-compare"
            onClick={() => {
              tacticalAudio.playRadarPing(880);
              setActiveTab('compare');
            }}
            className={`px-3 py-1.5 rounded text-xs font-mono-tactical font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'compare'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            Side-by-Side Compare
          </button>
        </div>
      </div>

      {activeTab === 'matrix' && (
        <>
          {/* Tactical Diagnostic Filter Bar */}
          <div className="bg-neutral-950/90 border border-neutral-800 p-4 rounded-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono-tactical font-bold uppercase tracking-wider text-neutral-200">
                  OBSERVED SILHOUETTE TRAITS
                </span>
              </div>
              {(selectedWingShape !== 'all' || selectedTailShape !== 'all' || selectedFlightProfile !== 'all' || selectedCategory !== 'all' || searchQuery) && (
                <button
                  id="reset-silhouette-filters"
                  onClick={handleResetFilters}
                  className="text-xs font-mono-tactical text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset All Filters
                </button>
              )}
            </div>

            {/* Quick Trait Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Wing Shape */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono-tactical text-neutral-400 block font-semibold">
                  1. WING SHAPE / PRIMARY TIPS
                </label>
                <div className="grid grid-cols-2 gap-1 text-xs font-mono-tactical">
                  {[
                    { id: 'all', label: 'Any Wing Profile' },
                    { id: 'broad-fingered', label: 'Broad & Fingered (5-6)' },
                    { id: 'pointed-sickle', label: 'Pointed / Scythe' },
                    { id: 'rounded', label: 'Short & Rounded' },
                    { id: 'long-narrow', label: 'Long & Slender' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        tacticalAudio.playRadarPing(900);
                        setSelectedWingShape(item.id as WingShape | 'all');
                      }}
                      className={`p-2 rounded text-left border transition-all cursor-pointer ${
                        selectedWingShape === item.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tail Shape */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono-tactical text-neutral-400 block font-semibold">
                  2. TAIL SHAPE & LENGTH
                </label>
                <div className="grid grid-cols-2 gap-1 text-xs font-mono-tactical">
                  {[
                    { id: 'all', label: 'Any Tail Shape' },
                    { id: 'forked', label: 'Deeply Forked (Twisting)' },
                    { id: 'fan-wedge', label: 'Fan-Shaped / Rounded' },
                    { id: 'square-long', label: 'Long & Narrow Square' },
                    { id: 'short-square', label: 'Short & Square-Cut' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        tacticalAudio.playRadarPing(900);
                        setSelectedTailShape(item.id as TailShape | 'all');
                      }}
                      className={`p-2 rounded text-left border transition-all cursor-pointer ${
                        selectedTailShape === item.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flight Behavior / Profile */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono-tactical text-neutral-400 block font-semibold">
                  3. FLIGHT BEHAVIOUR / PROFILE
                </label>
                <div className="grid grid-cols-2 gap-1 text-xs font-mono-tactical">
                  {[
                    { id: 'all', label: 'Any Flight Style' },
                    { id: 'hovering', label: 'Stationary Hovering' },
                    { id: 'shallow-v', label: 'Shallow V Soaring' },
                    { id: 'high-v', label: 'Steep High-V Glide' },
                    { id: 'rapid-stoop', label: 'High-Speed Stoop / Sprint' },
                    { id: 'flap-glide', label: 'Flap-Flap-Glide Burst' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        tacticalAudio.playRadarPing(900);
                        setSelectedFlightProfile(item.id as FlightProfile | 'all');
                      }}
                      className={`p-2 rounded text-left border transition-all cursor-pointer ${
                        selectedFlightProfile === item.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Keyword Search & Category Bar */}
            <div className="pt-2 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search field marks (e.g. 'forked tail', 'pale windows', 'white rump', 'swift-like')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs font-mono-tactical text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {['all', 'Kite', 'Buzzard', 'Falcon', 'Harrier', 'Hawk', 'Owl', 'Osprey'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      tacticalAudio.playRadarPing(800);
                      setSelectedCategory(cat);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-mono-tactical uppercase tracking-wider whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/60 font-bold'
                        : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono-tactical text-neutral-400 px-1">
              <span>
                MATCHING SPECIES PROFILE: <strong className="text-amber-400">{filteredSpecies.length}</strong> OF {speciesList.length}
              </span>
              <span className="text-neutral-500">CLICK CARD FOR FULL FIELD ANATOMY</span>
            </div>

            {filteredSpecies.length === 0 ? (
              <div className="bg-neutral-900/60 border border-dashed border-neutral-800 rounded-xl p-10 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <div className="font-display-tactical text-lg text-neutral-200 font-bold">
                  No Silhouette Match Found
                </div>
                <p className="text-xs font-mono-tactical text-neutral-400 max-w-md mx-auto">
                  The selected combination of wing shape, tail shape, and flight profile does not match any UK raptor species. Try loosening your filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono-tactical text-xs font-bold hover:bg-amber-500/30 cursor-pointer inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear Silhouette Filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSpecies.map((species) => (
                  <div
                    key={species.id}
                    id={`species-card-${species.id}`}
                    className="bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/60 rounded-xl p-4 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/10 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono-tactical text-neutral-500 uppercase">
                              {species.category}
                            </span>
                            {getStatusBadge(species.ukStatus)}
                          </div>
                          <h3 className="font-display-tactical text-lg font-bold text-neutral-100 group-hover:text-amber-300 transition-colors">
                            {species.commonName}
                          </h3>
                          <div className="text-xs font-mono-tactical italic text-neutral-400">
                            {species.scientificName}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-mono-tactical text-neutral-500 block">WINGSPAN</span>
                          <span className="text-xs font-mono-tactical text-amber-400 font-bold">
                            {species.wingspanCm}
                          </span>
                        </div>
                      </div>

                      {/* Silhouette Graphic Container */}
                      <div
                        onClick={() => {
                          tacticalAudio.playRadarPing(1000);
                          onSelectSpecies(species);
                        }}
                        className="w-full h-36 bg-neutral-950 border border-neutral-800/80 rounded-lg flex items-center justify-center p-3 relative overflow-hidden group/canvas cursor-pointer mb-3"
                      >
                        {/* Tactical Crosshair Background */}
                        <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:12px_12px] opacity-40"></div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-20 h-20 rounded-full border border-neutral-800/50"></div>
                          <div className="w-32 h-32 rounded-full border border-neutral-800/25"></div>
                          <div className="w-full h-px bg-neutral-800/40 absolute"></div>
                          <div className="h-full w-px bg-neutral-800/40 absolute"></div>
                        </div>

                        {/* Silhouette SVG */}
                        <svg
                          viewBox="0 0 300 200"
                          className="w-full h-full max-h-28 text-neutral-100 fill-current drop-shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-transform duration-300 group-hover/canvas:scale-110"
                        >
                          <path d={species.silhouetteSvg} />
                        </svg>

                        {/* Hover Prompt */}
                        <div className="absolute bottom-1.5 right-2 px-1.5 py-0.5 rounded bg-neutral-900/90 border border-neutral-700 text-[9px] font-mono-tactical text-neutral-300 opacity-0 group-hover/canvas:opacity-100 transition-opacity flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5 text-amber-400" /> Dossier
                        </div>
                      </div>

                      {/* Trait Chips */}
                      <div className="space-y-1.5 text-xs font-mono-tactical mb-3">
                        <div className="bg-neutral-950/70 p-2 rounded border border-neutral-800 text-neutral-300 text-[11px] leading-snug">
                          <strong className="text-amber-400 font-bold block mb-0.5">WING & TAIL:</strong>
                          {(species.wingShapeLabel || species.wingShape || '').split('&')[0]} • {(species.tailShapeLabel || species.tailShape || '').split(',')[0]}
                        </div>
                        <div className="bg-neutral-950/70 p-2 rounded border border-neutral-800 text-neutral-300 text-[11px] leading-snug">
                          <strong className="text-emerald-400 font-bold block mb-0.5">FLIGHT STYLE:</strong>
                          {species.flightProfileLabel}
                        </div>
                      </div>

                      {/* Key Diagnostic Mark */}
                      <div className="bg-neutral-950/90 p-2 rounded border border-neutral-800 text-[11px] text-neutral-300 space-y-1 mb-4">
                        <div className="text-[10px] font-mono-tactical text-neutral-400 flex items-center gap-1 font-bold">
                          <Sparkles className="w-3 h-3 text-amber-400" /> PRIMARY IDENTIFIER:
                        </div>
                        <div className="text-neutral-200">
                          {species.keyMarks[0]}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          tacticalAudio.setMuted(false);
                          tacticalAudio.playSpeciesCall(species.id);
                        }}
                        className="py-1.5 px-2.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-[11px] font-mono-tactical font-bold cursor-pointer transition-colors flex items-center gap-1 border border-cyan-500/40"
                        title={`Play real recorded ${species.commonName} flight call`}
                      >
                        <span>🔊 Call</span>
                      </button>
                      <button
                        onClick={() => {
                          tacticalAudio.playRadarPing(950);
                          onSelectSpecies(species);
                        }}
                        className="flex-1 py-1.5 px-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono-tactical font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        Anatomy
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                      </button>
                      <button
                        onClick={() => {
                          tacticalAudio.playRadarPing(880);
                          onLogSpecies(species);
                        }}
                        className="py-1.5 px-3 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-mono-tactical font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        + Log
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'compare' && (
        <div className="bg-neutral-950 border border-neutral-800 p-4 md:p-6 rounded-xl space-y-6">
          <div className="border-b border-neutral-800 pb-4">
            <h3 className="font-display-tactical text-lg font-bold text-neutral-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" /> Silhouette Flight Comparison
            </h3>
            <p className="text-xs font-mono-tactical text-neutral-400 mt-1">
              Direct side-by-side optical evaluation to eliminate downland confusion species (e.g. Buzzard vs Kite, Kestrel vs Hobby).
            </p>
          </div>

          {/* Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono-tactical text-amber-400 block mb-1.5 font-bold">
                PRIMARY TARGET SPECIES (A)
              </label>
              <select
                value={compareSpeciesA}
                onChange={(e) => setCompareSpeciesA(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 text-neutral-100 text-xs font-mono-tactical rounded-lg p-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {speciesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.commonName} ({s.scientificName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono-tactical text-cyan-400 block mb-1.5 font-bold">
                CONFUSION CANDIDATE (B)
              </label>
              <select
                value={compareSpeciesB}
                onChange={(e) => setCompareSpeciesB(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 text-neutral-100 text-xs font-mono-tactical rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {speciesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.commonName} ({s.scientificName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Target A */}
            <div className="bg-neutral-900/90 border-2 border-amber-500/50 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div>
                  <span className="text-[10px] font-mono-tactical text-amber-400 font-bold uppercase tracking-wider block">
                    TARGET A
                  </span>
                  <h4 className="font-display-tactical text-xl font-bold text-neutral-100">
                    {speciesA.commonName}
                  </h4>
                </div>
                <span className="text-xs font-mono-tactical text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
                  {speciesA.wingspanCm}
                </span>
              </div>

              {/* Silhouette SVG */}
              <div className="w-full h-44 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-center p-3 relative">
                <svg viewBox="0 0 300 200" className="w-full h-full max-h-36 text-amber-400 fill-current drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  <path d={speciesA.silhouetteSvg} />
                </svg>
              </div>

              <div className="space-y-2 text-xs font-mono-tactical">
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                  <span className="text-neutral-400 block font-bold mb-1">TAIL SHAPE:</span>
                  <span className="text-neutral-200">{speciesA.tailShapeLabel}</span>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                  <span className="text-neutral-400 block font-bold mb-1">WING PROFILE:</span>
                  <span className="text-neutral-200">{speciesA.wingShapeLabel}</span>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                  <span className="text-neutral-400 block font-bold mb-1">FLIGHT BEHAVIOUR:</span>
                  <span className="text-neutral-200">{speciesA.flightProfileLabel}</span>
                </div>
              </div>
            </div>

            {/* Target B */}
            <div className="bg-neutral-900/90 border-2 border-cyan-500/50 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div>
                  <span className="text-[10px] font-mono-tactical text-cyan-400 font-bold uppercase tracking-wider block">
                    TARGET B
                  </span>
                  <h4 className="font-display-tactical text-xl font-bold text-neutral-100">
                    {speciesB.commonName}
                  </h4>
                </div>
                <span className="text-xs font-mono-tactical text-cyan-400 font-bold bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/30">
                  {speciesB.wingspanCm}
                </span>
              </div>

              {/* Silhouette SVG */}
              <div className="w-full h-44 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-center p-3 relative">
                <svg viewBox="0 0 300 200" className="w-full h-full max-h-36 text-cyan-400 fill-current drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <path d={speciesB.silhouetteSvg} />
                </svg>
              </div>

              <div className="space-y-2 text-xs font-mono-tactical">
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                  <span className="text-neutral-400 block font-bold mb-1">TAIL SHAPE:</span>
                  <span className="text-neutral-200">{speciesB.tailShapeLabel}</span>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                  <span className="text-neutral-400 block font-bold mb-1">WING PROFILE:</span>
                  <span className="text-neutral-200">{speciesB.wingShapeLabel}</span>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                  <span className="text-neutral-400 block font-bold mb-1">FLIGHT BEHAVIOUR:</span>
                  <span className="text-neutral-200">{speciesB.flightProfileLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
