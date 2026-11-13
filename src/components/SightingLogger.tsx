import React, { useState, useMemo } from 'react';
import { SightingLog, Hotspot, RaptorSpecies, VerificationStatus } from '../types/raptor';
import { SectorId } from '../types/sector';
import { UK_SECTORS } from '../data/sectors';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MapPin, 
  Wind, 
  Clock, 
  User, 
  Compass, 
  Eye, 
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  AlertTriangle, 
  History,
  Navigation,
  Sparkles,
  Lock,
  Share2,
  Check
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';
import { 
  getSightingRecency, 
  getRecencyCounts, 
  getUkTimeZoneLabel,
  RecencyWindow, 
  TRAFFIC_LIGHT_TIERS 
} from '../utils/recency';

interface SightingLoggerProps {
  sightings: SightingLog[];
  hotspots: Hotspot[];
  speciesList: RaptorSpecies[];
  currentCallsign: string;
  onOpenSightingModal: () => void;
  onSelectSighting: (sighting: SightingLog) => void;
  onViewOnMap: (sighting: SightingLog) => void;
  onInspectAudit: (sighting: SightingLog) => void;
  onCorroborateQuick: (sightingId: string) => void;
  activeSectorId?: SectorId;
  onSelectSector?: (sectorId: SectorId) => void;
}

export const SightingLogger: React.FC<SightingLoggerProps> = ({
  sightings,
  hotspots,
  speciesList,
  currentCallsign,
  onOpenSightingModal,
  onSelectSighting,
  onViewOnMap,
  onInspectAudit,
  onCorroborateQuick,
  activeSectorId = 'all',
  onSelectSector,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeciesFilter, setSelectedSpeciesFilter] = useState('ALL');
  const [selectedBehaviorFilter, setSelectedBehaviorFilter] = useState('ALL');
  const [selectedVerificationFilter, setSelectedVerificationFilter] = useState<string>('ALL');
  const [selectedObserverFilter, setSelectedObserverFilter] = useState<string>('ALL');
  const [selectedRecencyFilter, setSelectedRecencyFilter] = useState<RecencyWindow>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'count'>('newest');
  const [copiedSightingId, setCopiedSightingId] = useState<string | null>(null);

  const handleShareSighting = (sighting: SightingLog) => {
    tacticalAudio.playConfirmChime();
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://raptorlens.org';
    const shareText = `🦅 Raptor Sighting on RaptorLens UK: ${sighting.count}x ${sighting.speciesName} (${sighting.behavior}) spotted near ${sighting.locationName} by ${sighting.observerCallsign}! Watch live & explore the radar map:`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `RaptorLens UK: ${sighting.speciesName} Sighting`,
        text: shareText,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
        setCopiedSightingId(sighting.id);
        setTimeout(() => setCopiedSightingId(null), 2500);
      }).catch(() => {});
    }
  };

  // Distinct observer callsigns
  const observerCallsigns = useMemo(() => {
    return Array.from(new Set(sightings.map((s) => s.observerCallsign))).sort();
  }, [sightings]);

  // Dynamic traffic light counts
  const recencyCounts = useMemo(() => getRecencyCounts(sightings), [sightings]);

  // Filtered sightings
  const filteredSightings = useMemo(() => {
    return sightings
      .filter((s) => {
        if (activeSectorId && activeSectorId !== 'all') {
          if (s.sectorId && s.sectorId !== activeSectorId) return false;
        }
        if (selectedSpeciesFilter !== 'ALL' && s.speciesId !== selectedSpeciesFilter) return false;
        if (selectedBehaviorFilter !== 'ALL' && s.behavior !== selectedBehaviorFilter) return false;
        if (selectedVerificationFilter !== 'ALL' && s.verificationStatus !== selectedVerificationFilter) return false;
        if (selectedObserverFilter !== 'ALL') {
          if (selectedObserverFilter === 'ME') {
            if (s.observerCallsign.toUpperCase() !== currentCallsign.toUpperCase()) return false;
          } else if (s.observerCallsign !== selectedObserverFilter) {
            return false;
          }
        }
        if (selectedRecencyFilter !== 'all') {
          const rec = getSightingRecency(s.timestamp);
          if (selectedRecencyFilter === 'live' && rec.status !== 'live') return false;
          if (selectedRecencyFilter === 'today' && rec.hoursAgo >= 24) return false;
          if (selectedRecencyFilter === 'recent' && rec.hoursAgo >= 48) return false;
          if (selectedRecencyFilter === 'archived' && rec.status !== 'archived') return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchSpecies = s.speciesName.toLowerCase().includes(q);
          const matchLoc = s.locationName.toLowerCase().includes(q);
          const matchNotes = s.notes.toLowerCase().includes(q);
          const matchObserver = s.observerCallsign.toLowerCase().includes(q);
          if (!matchSpecies && !matchLoc && !matchNotes && !matchObserver) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'count') return b.count - a.count;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }, [sightings, activeSectorId, selectedSpeciesFilter, selectedBehaviorFilter, selectedVerificationFilter, selectedObserverFilter, selectedRecencyFilter, searchQuery, sortBy, currentCallsign]);

  // Summary Metrics
  const totalBirds = useMemo(() => sightings.reduce((acc, s) => acc + s.count, 0), [sightings]);
  const uniqueSpeciesCount = useMemo(() => new Set(sightings.map((s) => s.speciesId)).size, [sightings]);
  const verifiedCount = useMemo(
    () => sightings.filter((s) => s.verificationStatus === 'Specialist Confirmed' || s.verificationStatus === 'Corroborated by Peers').length,
    [sightings]
  );

  // CSV Export
  const handleExportCSV = () => {
    tacticalAudio.playConfirmChime();
    const headers = [
      'ID',
      'Date',
      'Time_BST',
      'Species_Common',
      'Count',
      'Location_Name',
      'Latitude',
      'Longitude',
      'Flight_Behaviour',
      'Est_Altitude_M',
      'Confidence',
      'Verification_Status',
      'Corroboration_Count',
      'Observer_Callsign',
      'Observer_Rank',
      'Optical_Gear',
      'Wind_Vector',
      'Field_Notes',
    ];

    const rows = filteredSightings.map((s) => [
      s.id,
      s.date,
      s.time,
      `"${s.speciesName}"`,
      s.count,
      `"${s.locationName}"`,
      s.coordinates[0],
      s.coordinates[1],
      `"${s.behavior}"`,
      s.altitudeM || '',
      `"${s.confidence}"`,
      `"${s.verificationStatus || 'Pending Review'}"`,
      s.corroborations?.length || 0,
      `"${s.observerCallsign}"`,
      `"${s.observerRank || ''}"`,
      `"${s.opticalGear}"`,
      `"${s.windDirection} ${s.windSpeedMph}mph"`,
      `"${s.notes.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RaptorLens_Wessex_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getVerificationBadge = (status: VerificationStatus, corrobCount: number) => {
    switch (status) {
      case 'Specialist Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-tactical font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Specialist Verified
          </span>
        );
      case 'Corroborated by Peers':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-tactical font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <Users className="w-3 h-3 text-cyan-400" /> Corroborated ({corrobCount})
          </span>
        );
      case 'Flagged for Review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-tactical font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <AlertTriangle className="w-3 h-3 text-rose-400" /> Flagged
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-tactical font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Clock className="w-3 h-3 text-amber-400" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16 sm:pb-24">
      {/* Header & Metrics Dashboard */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-xs font-mono-tactical uppercase tracking-wider text-amber-400 font-bold">
                WESSEX DOWNLAND RAPTOR NETWORK
              </span>
            </div>
            <h2 className="font-display-tactical text-xl md:text-2xl font-bold text-neutral-100">
              Verified Field Sightings
            </h2>
            <p className="text-xs font-mono-tactical text-neutral-400">
              Recent observations logged by local birdwatchers and verified according to UK Wildlife &amp; Countryside Act ethical guidelines.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              id="export-csv-btn"
              className="px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-700 font-mono-tactical text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" /> Export Sightings CSV
            </button>
            <button
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                onOpenSightingModal();
              }}
              id="open-log-modal-btn"
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display-tactical text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Log New Sighting
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 font-mono-tactical text-xs">
          <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-lg">
            <span className="text-neutral-500 text-[10px] block uppercase">TOTAL BIRDS RECORDED</span>
            <span className="text-amber-400 text-lg font-bold">{totalBirds} Individuals</span>
          </div>
          <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-lg">
            <span className="text-neutral-500 text-[10px] block uppercase">RAPTOR DIVERSITY</span>
            <span className="text-emerald-400 text-lg font-bold">{uniqueSpeciesCount} Species</span>
          </div>
          <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-lg">
            <span className="text-neutral-500 text-[10px] block uppercase">VERIFICATION INTEGRITY</span>
            <span className="text-cyan-400 text-lg font-bold">
              {Math.round((verifiedCount / (sightings.length || 1)) * 100)}%
            </span>
            <span className="text-neutral-400 text-[10px] block">{verifiedCount} Confirmed</span>
          </div>
          <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-lg">
            <span className="text-neutral-500 text-[10px] block uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              LIVE ALOFT (&lt;3H)
            </span>
            <span className="text-emerald-400 text-lg font-bold">{recencyCounts.live} Active</span>
            <span className="text-neutral-400 text-[10px] block">{recencyCounts.today} sighted today</span>
          </div>
          <div className="hidden lg:block bg-neutral-900/80 border border-neutral-800 p-3 rounded-lg">
            <span className="text-neutral-500 text-[10px] block uppercase">HISTORIC ARCHIVE</span>
            <span className="text-slate-400 text-lg font-bold">{recencyCounts.archived} Saved</span>
            <span className="text-neutral-500 text-[10px] block">Never deleted</span>
          </div>
        </div>
      </div>

      {/* Traffic Light Horizon Filter Strip */}
      <div className="bg-neutral-950 border border-neutral-800 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 font-mono-tactical text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
            <span>🚦</span> HORIZON:
          </span>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(700);
              setSelectedRecencyFilter('all');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              selectedRecencyFilter === 'all'
                ? 'bg-neutral-800 text-neutral-100 border border-neutral-600'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            All History ({recencyCounts.all})
          </button>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(1100);
              setSelectedRecencyFilter('live');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
              selectedRecencyFilter === 'live'
                ? 'bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold shadow-sm shadow-emerald-500/50'
                : 'text-emerald-400/90 hover:text-emerald-300 hover:bg-neutral-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>🟢 Live &lt;3h ({recencyCounts.live})</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(880);
              setSelectedRecencyFilter('today');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
              selectedRecencyFilter === 'today'
                ? 'bg-amber-950 border border-amber-500 text-amber-300 font-bold shadow-sm shadow-amber-500/50'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-neutral-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>🟡 Today &lt;24h ({recencyCounts.today})</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(750);
              setSelectedRecencyFilter('recent');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
              selectedRecencyFilter === 'recent'
                ? 'bg-orange-950 border border-orange-500 text-orange-300 font-bold shadow-sm shadow-orange-500/50'
                : 'text-orange-400/90 hover:text-orange-300 hover:bg-neutral-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
            <span>🟠 48h ({recencyCounts.recent})</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(600);
              setSelectedRecencyFilter('archived');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
              selectedRecencyFilter === 'archived'
                ? 'bg-neutral-800 border border-neutral-500 text-neutral-200 font-bold'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>⚪ Archive &gt;48h ({recencyCounts.archived})</span>
          </button>
        </div>

        <div className="text-[10px] text-neutral-400 italic hidden sm:block">
          {selectedRecencyFilter === 'live' && 'Showing active corridor thermals logged in the past 3 hours.'}
          {selectedRecencyFilter === 'today' && 'Showing all observations logged during today’s flight operations.'}
          {selectedRecencyFilter === 'recent' && 'Showing observations from the rolling 48-hour operational window.'}
          {selectedRecencyFilter === 'archived' && 'Showing permanent historical baseline ledger records.'}
          {selectedRecencyFilter === 'all' && 'All records preserved for scientific territory fidelity.'}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-xl flex flex-wrap items-center gap-3 font-mono-tactical text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search species, location, observer, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sector Filter */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1">
            <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              id="sighting-sector-filter"
              value={activeSectorId || 'all'}
              onChange={(e) => {
                tacticalAudio.playRadarPing(880);
                if (onSelectSector) onSelectSector(e.target.value as SectorId);
              }}
              className="bg-transparent text-amber-300 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">Sector: All UK Sectors</option>
              {UK_SECTORS.filter((s) => s.id !== 'all').map((sec) => (
                <option key={sec.id} value={sec.id}>
                  Sector: {sec.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Observer Filter */}
          <select
            value={selectedObserverFilter}
            onChange={(e) => setSelectedObserverFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">Observer: All Scouts</option>
            <option value="ME">Observer: My Logs ({currentCallsign})</option>
            {observerCallsigns.map((call) => (
              <option key={call} value={call}>
                {call}
              </option>
            ))}
          </select>

          {/* Verification Status Filter */}
          <select
            value={selectedVerificationFilter}
            onChange={(e) => setSelectedVerificationFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">Status: All Records</option>
            <option value="Specialist Confirmed">Specialist Confirmed</option>
            <option value="Corroborated by Peers">Corroborated by Peers</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Flagged for Review">Flagged for Review</option>
          </select>

          <select
            value={selectedSpeciesFilter}
            onChange={(e) => setSelectedSpeciesFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Species ({sightings.length})</option>
            {speciesList.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.commonName}
              </option>
            ))}
          </select>

          <select
            value={selectedBehaviorFilter}
            onChange={(e) => setSelectedBehaviorFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Behaviours</option>
            <option value="Thermal Soaring">Thermal Soaring</option>
            <option value="Escarpment Lift">Escarpment Lift</option>
            <option value="Hover Hunting">Hover Hunting</option>
            <option value="Low Quartering">Low Quartering</option>
            <option value="High-Speed Stoop">High-Speed Stoop</option>
            <option value="Passage Migration">Passage Migration</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'count')}
            className="bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="newest">Sort: Recent First</option>
            <option value="count">Sort: Highest Count</option>
          </select>
        </div>
      </div>

      {/* Sighting Cards List */}
      <div className="space-y-3 font-mono-tactical">
        {filteredSightings.length === 0 ? (
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-8 text-center text-neutral-400 font-mono-tactical text-xs">
            No sighting records match the selected filter criteria.
          </div>
        ) : (
          filteredSightings.map((sighting) => {
            const species = speciesList.find((s) => s.id === sighting.speciesId);
            const isMySighting = sighting.observerCallsign.toUpperCase() === currentCallsign.toUpperCase();
            const hasCorroborated = sighting.corroborations?.some(
              (c) => c.observerCallsign.toUpperCase() === currentCallsign.toUpperCase()
            );
            const recency = getSightingRecency(sighting.timestamp);

            return (
              <div
                key={sighting.id}
                id={`sighting-entry-${sighting.id}`}
                className="bg-neutral-950 border border-neutral-800/90 hover:border-amber-500/50 rounded-xl p-4 transition-all duration-200 shadow-md hover:shadow-lg space-y-3"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
                  <div className="flex items-center gap-3">
                    {/* Mini Silhouette SVG */}
                    {species && (
                      <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center p-1.5 shrink-0">
                        <svg viewBox="0 0 300 200" className="w-full h-full text-amber-400 fill-current">
                          <path d={species.silhouetteSvg} />
                        </svg>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display-tactical text-base font-bold text-neutral-100">
                          {sighting.speciesName}
                        </h4>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {sighting.count} {sighting.count === 1 ? 'Individual' : 'Birds'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-900 text-emerald-400 border border-emerald-500/30">
                          {sighting.behavior}
                        </span>

                        {/* Traffic Light Signal Status Badge */}
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm"
                          style={{
                            backgroundColor: `${recency.colorHex}20`,
                            color: recency.colorHex,
                            border: `1px solid ${recency.colorHex}50`
                          }}
                          title={recency.recommendation}
                        >
                          {recency.status === 'live' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          )}
                          <span>{recency.trafficEmoji}</span>
                          <span className="uppercase">{recency.label}</span>
                          <span className="opacity-80 font-normal">({recency.relativeTime})</span>
                        </span>

                        {/* Verification Status Badge */}
                        {getVerificationBadge(sighting.verificationStatus, sighting.corroborations?.length || 0)}
                        {sighting.rarityAlert && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Rarity Alert
                          </span>
                        )}

                        {/* Schedule 1 Privacy Indicator */}
                        {sighting.isFuzzed && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950/90 text-purple-300 border border-purple-500/50 flex items-center gap-1"
                            title={`Wildlife & Countryside Act 1981: Exact coordinates coarsened to a ~${sighting.privacyRadiusKm || 10}km sector grid to safeguard nesting location`}
                          >
                            <ShieldCheck className="w-2.5 h-2.5 text-purple-400" />
                            <span>Schedule 1 Protected (~{sighting.privacyRadiusKm || 10}km fuzzed)</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1 flex-wrap">
                        {sighting.sectorId && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-tactical font-semibold bg-neutral-900 border border-neutral-700 text-amber-400/90">
                            {UK_SECTORS.find(sec => sec.id === sighting.sectorId)?.shortName || 'UK Sector'}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                          <MapPin className="w-3 h-3" /> {sighting.locationName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {sighting.date} at {sighting.time} {getUkTimeZoneLabel(sighting.timestamp)}
                        </span>
                        <span>•</span>
                        <span className="text-[11px] text-neutral-400 italic">
                          {recency.recommendation}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Verification */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Corroborate Action */}
                    {!isMySighting && (
                      <button
                        onClick={() => onCorroborateQuick(sighting.id)}
                        className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                          hasCorroborated
                            ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                            : 'bg-neutral-900 hover:bg-emerald-950/60 border border-neutral-700 text-neutral-300 hover:text-emerald-300'
                        }`}
                        title={hasCorroborated ? 'You have corroborated this contact' : 'Corroborate visual contact'}
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{hasCorroborated ? 'Corroborated' : 'Corroborate'}</span>
                      </button>
                    )}

                    {/* View Audit Trail Button */}
                    <button
                      onClick={() => {
                        tacticalAudio.playRadarPing(880);
                        onInspectAudit(sighting);
                      }}
                      className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/40 text-xs flex items-center gap-1 cursor-pointer"
                      title="Inspect full audit trail and observer signatures"
                    >
                      <History className="w-3 h-3 text-amber-400" /> Audit Log ({sighting.auditTrail?.length || 1})
                    </button>

                    <button
                      onClick={() => {
                        tacticalAudio.playRadarPing(800);
                        onViewOnMap(sighting);
                      }}
                      className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-cyan-300 border border-cyan-500/40 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Compass className="w-3 h-3" /> Locate on Radar
                    </button>

                    <button
                      onClick={() => handleShareSighting(sighting)}
                      className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-emerald-300 border border-emerald-500/40 text-xs flex items-center gap-1 cursor-pointer"
                      title="Share sighting on WhatsApp, social media, or copy link"
                    >
                      {copiedSightingId === sighting.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3 h-3 text-emerald-400" />
                          <span>Share</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Notes & Telemetry */}
                <div className="text-xs text-neutral-300 leading-relaxed font-sans">
                  {sighting.notes}
                </div>

                {/* Schedule 1 Privacy Notice Banner */}
                {sighting.isFuzzed && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200">
                    <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>
                      <strong>Schedule 1 Wildlife Privacy:</strong> Exact coordinates masked to ~{sighting.privacyRadiusKm || 10}km sector grid to safeguard active breeding &amp; nesting territory under the UK Wildlife &amp; Countryside Act 1981.
                    </span>
                  </div>
                )}

                {/* Footer Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-900 text-[11px] text-neutral-400">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1 text-neutral-300">
                      <User className="w-3 h-3 text-neutral-500" />
                      <span className="font-bold text-amber-400">{sighting.observerCallsign}</span>
                      {sighting.observerRank && (
                        <span className="text-[10px] text-neutral-400">({sighting.observerRank})</span>
                      )}
                    </span>
                    <span>|</span>
                    <span>Optics: {sighting.opticalGear}</span>
                    {sighting.altitudeM && (
                      <>
                        <span>|</span>
                        <span>Alt: {sighting.altitudeM}m AGL</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-neutral-400">
                      <Wind className="w-3 h-3 text-neutral-500" /> {sighting.windDirection} {sighting.windSpeedMph} mph
                    </span>
                    <span className="text-emerald-400 font-semibold">{sighting.confidence}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* End of Verified Sightings Feed Indicator */}
      {filteredSightings.length > 0 && (
        <div className="pt-4 pb-6 text-center text-xs font-mono-tactical text-neutral-400 flex items-center justify-center gap-2 border-t border-neutral-850">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>All {filteredSightings.length} Field Observations Loaded • Full Peer &amp; Specialist Verification Active</span>
        </div>
      )}
    </div>
  );
};
