import React, { useState } from 'react';
import { Hotspot, RaptorSpecies, SightingBehavior, SightingLog, VerificationStatus } from '../types/raptor';
import { ObserverProfile } from '../types/community';
import { SectorId } from '../types/sector';
import { UK_SECTORS } from '../data/sectors';
import { X, Compass, Send, ShieldCheck, UserCheck, Navigation, Lock } from 'lucide-react';
import { tacticalAudio } from '../utils/audio';
import { evaluateCoordinatePrivacy } from '../utils/schedule1Privacy';

interface SightingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSighting: (sighting: SightingLog) => void;
  hotspots: Hotspot[];
  speciesList: RaptorSpecies[];
  initialCoordinates?: [number, number];
  initialLocationName?: string;
  initialSpeciesId?: string;
  initialSectorId?: SectorId;
  currentCallsign?: string;
  currentObserverProfile?: ObserverProfile | null;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
}

export const SightingModal: React.FC<SightingModalProps> = ({
  isOpen,
  onClose,
  onSaveSighting,
  hotspots,
  speciesList,
  initialCoordinates,
  initialLocationName,
  initialSpeciesId,
  initialSectorId,
  currentCallsign = 'GUEST-SCOUT',
  currentObserverProfile = null,
  onOpenLogin,
  onOpenRegister,
}) => {
  const [speciesId, setSpeciesId] = useState<string>(initialSpeciesId || speciesList[0]?.id || 'red-kite');
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>(
    hotspots.find((h) => h.name === initialLocationName)?.id || 'custom'
  );
  const [sectorId, setSectorId] = useState<SectorId>(
    initialSectorId || (hotspots.find((h) => h.name === initialLocationName)?.sectorId) || 'ridgeway-wessex'
  );
  const [customLocationName, setCustomLocationName] = useState<string>(initialLocationName || 'Barbury Castle Ramparts');
  const [lat, setLat] = useState<number>(() => (initialCoordinates && Number.isFinite(initialCoordinates[0])) ? initialCoordinates[0] : 51.4835);
  const [lng, setLng] = useState<number>(() => (initialCoordinates && Number.isFinite(initialCoordinates[1])) ? initialCoordinates[1] : -1.7895);
  const [count, setCount] = useState<number>(1);
  const [behavior, setBehavior] = useState<SightingBehavior>('Thermal Soaring');
  const [altitudeM, setAltitudeM] = useState<number>(180);
  const [opticalGear, setOpticalGear] = useState<string>(
    currentObserverProfile?.opticsGear || 'Swarovski EL 10x42'
  );
  const [observerCallsign, setObserverCallsign] = useState<string>(
    currentCallsign || 'WESSEX-SCOUT-9'
  );
  const [notes, setNotes] = useState<string>('');
  const [confidence, setConfidence] = useState<'Confirmed (100%)' | 'High (80%)' | 'Probable (60%)'>('Confirmed (100%)');
  const [windDirection, setWindDirection] = useState<string>('WNW');
  const [windSpeedMph, setWindSpeedMph] = useState<number>(11);
  const [thermalStrength, setThermalStrength] = useState<'Weak' | 'Moderate' | 'Strong'>('Strong');

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
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      if (initialSpeciesId) setSpeciesId(initialSpeciesId);
      if (initialLocationName) setCustomLocationName(initialLocationName);
      if (initialCoordinates && Number.isFinite(initialCoordinates[0]) && Number.isFinite(initialCoordinates[1])) {
        setLat(initialCoordinates[0]);
        setLng(initialCoordinates[1]);
      } else if (!initialCoordinates) {
        setLat(51.4835);
        setLng(-1.7895);
      }
      if (initialSectorId) setSectorId(initialSectorId);
      setObserverCallsign(currentCallsign);
    }
  }, [isOpen, initialSpeciesId, initialLocationName, initialCoordinates, initialSectorId, currentCallsign]);

  if (!isOpen) return null;

  const isGuest = !currentCallsign || currentCallsign === 'GUEST-SCOUT';

  const selectedSpecies = speciesList.find((s) => s.id === speciesId) || speciesList[0];
  const safeLat = Number.isFinite(Number(lat)) ? Number(lat) : 51.4835;
  const safeLng = Number.isFinite(Number(lng)) ? Number(lng) : -1.7895;

  // Dynamic check for Schedule 1 protection
  const privacyEvaluation = evaluateCoordinatePrivacy(
    selectedSpecies.id,
    [safeLat, safeLng],
    customLocationName,
    new Date().toISOString()
  );

  const handleHotspotChange = (hId: string) => {
    setSelectedHotspotId(hId);
    if (hId !== 'custom') {
      const spot = hotspots.find((h) => h.id === hId);
      if (spot) {
        setCustomLocationName(spot.name);
        setLat(spot.coordinates[0]);
        setLng(spot.coordinates[1]);
        if (spot.sectorId) {
          setSectorId(spot.sectorId);
        }
      }
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      tacticalAudio.playRadarPing(900);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(4)));
          setLng(Number(pos.coords.longitude.toFixed(4)));
          setCustomLocationName('Field GPS Sector (Observer Live Position)');
          setSelectedHotspotId('custom');
        },
        () => {
          // fallback
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      if (onOpenLogin) {
        onClose();
        onOpenLogin();
      }
      return;
    }
    tacticalAudio.playConfirmChime();

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = now.toISOString().split('T')[0];

    const isSpecialistObserver = currentObserverProfile?.isSpecialist || 
      currentObserverProfile?.rank?.includes('Specialist') || 
      currentObserverProfile?.rank?.includes('Ringer');

    const verificationStatus: VerificationStatus = isSpecialistObserver
      ? 'Specialist Confirmed'
      : 'Pending Review';

    // Rarity check for high conservation species in Wessex
    const rareSpeciesList = ['hen-harrier', 'merlin', 'osprey', 'white-tailed-eagle', 'short-eared-owl'];
    const isRare = rareSpeciesList.includes(selectedSpecies.id);

    const submitLat = Number.isFinite(Number(lat)) ? Number(lat) : 51.4835;
    const submitLng = Number.isFinite(Number(lng)) ? Number(lng) : -1.7895;
    const pCoords = privacyEvaluation.displayCoordinates;
    const validDisplayCoords: [number, number] = (pCoords && Array.isArray(pCoords) && Number.isFinite(Number(pCoords[0])) && Number.isFinite(Number(pCoords[1])))
      ? [Number(pCoords[0]), Number(pCoords[1])]
      : [submitLat, submitLng];

    const newLog: SightingLog = {
      id: `sgt-${Date.now()}`,
      timestamp: now.toISOString(),
      date: dateStr,
      time: timeStr,
      speciesId: selectedSpecies.id,
      speciesName: selectedSpecies.commonName,
      locationName: privacyEvaluation.fuzzed ? privacyEvaluation.generalizedLocation : (customLocationName || 'Wessex Downs Sector'),
      sectorId,
      coordinates: validDisplayCoords,
      count,
      behavior,
      altitudeM,
      opticalGear,
      observerCallsign: observerCallsign || 'SKY-SCOUT',
      observerRank: currentObserverProfile?.rank || 'Field Scout',
      observerAffiliation: currentObserverProfile?.affiliation || 'Wessex Raptor Network',
      verificationStatus,
      rarityAlert: isRare,
      rarityReason: isRare
        ? `${selectedSpecies.commonName} is a priority conservation taxon in Wessex requiring field verification.`
        : undefined,
      isSchedule1: privacyEvaluation.isSensitive,
      isFuzzed: privacyEvaluation.fuzzed,
      privacyRadiusKm: privacyEvaluation.fuzzRadiusKm,
      corroborations: [],
      auditTrail: [
        {
          action: 'INITIAL_LOG',
          timestamp: now.toISOString(),
          actorCallsign: observerCallsign || 'SKY-SCOUT',
          actorRank: currentObserverProfile?.rank || 'Field Scout',
          details: `Field observation logged (${count}x ${selectedSpecies.commonName}, ${behavior}) with ${opticalGear}. Confidence: ${confidence}. Sector: ${sectorId}.${privacyEvaluation.fuzzed ? ` [Schedule 1: Coordinates masked to ~${privacyEvaluation.fuzzRadiusKm}km hectad]` : ''}`,
        },
      ],
      notes: notes || `Logged ${count}x ${selectedSpecies.commonName} engaged in ${behavior}.`,
      confidence,
      windDirection,
      windSpeedMph,
      thermalStrength,
    };

    onSaveSighting(newLog);
    onClose();
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
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-mono-tactical uppercase tracking-wider text-amber-400 font-bold">
                TACTICAL SIGHTING LOG
              </span>
            </div>
            <h3 className="font-display-tactical text-lg sm:text-xl font-bold text-neutral-100">
              Record Raptor Contact
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 text-neutral-200 font-mono-tactical text-xs">
          {/* Active Observer Identity Strip */}
          {isGuest ? (
            <div className="bg-amber-500/10 border border-amber-500/50 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-display-tactical text-sm font-bold text-amber-300 block">
                    Sign In Required to Log Sightings
                  </span>
                  <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                    To protect data quality and prevent anonymous spam, please sign in with your Observer Callsign or register a free profile before submitting a sighting.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {onOpenLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLogin();
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display-tactical text-xs font-bold cursor-pointer"
                  >
                    Sign In to Callsign
                  </button>
                )}
                {onOpenRegister && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRegister();
                    }}
                    className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-amber-500/40 text-amber-300 font-mono-tactical text-xs font-bold cursor-pointer"
                  >
                    Register New Observer (Free)
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <UserCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">SIGNED-IN OBSERVER</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-300 font-bold font-mono">{currentCallsign}</span>
                      {currentObserverProfile?.rank && (
                        <span className="text-[10px] text-neutral-400">({currentObserverProfile.rank})</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    {currentObserverProfile?.isSpecialist ? 'Specialist Verified Tier' : 'Verified Observer'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Target Species Selector & Silhouette Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-900/70 p-3 rounded-xl border border-neutral-800">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-amber-400 font-bold block">1. IDENTIFIED SPECIES</label>
              <select
                id="sighting-species-select"
                value={speciesId}
                onChange={(e) => {
                  tacticalAudio.playRadarPing(800);
                  setSpeciesId(e.target.value);
                }}
                className="w-full bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-lg p-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {speciesList.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.commonName} ({sp.scientificName}) — {sp.wessexFrequency}
                  </option>
                ))}
              </select>

              <div className="text-[11px] text-neutral-400 mt-1">
                Wingspan: <span className="text-amber-300 font-bold">{selectedSpecies?.wingspanCm}</span> • Tail: {selectedSpecies?.tailShapeLabel ? selectedSpecies.tailShapeLabel.split(',')[0] : selectedSpecies?.tailShape}
              </div>
            </div>

            {/* Silhouette Preview */}
            <div className="w-full h-20 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-center p-2 relative overflow-hidden">
              <svg viewBox="0 0 300 200" className="w-full h-full max-h-16 text-amber-400 fill-current drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                <path d={selectedSpecies.silhouetteSvg} />
              </svg>
              <span className="absolute bottom-1 right-1.5 text-[8px] text-neutral-500">SILHOUETTE</span>
            </div>
          </div>

          {/* Schedule 1 Active Obfuscation Notice in Form */}
          {privacyEvaluation.fuzzed && (
            <div className="p-3 bg-purple-950/50 border border-purple-500/50 rounded-xl space-y-1 text-purple-200">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                <span>Wildlife &amp; Countryside Act 1981: Schedule 1 Safeguard Triggered</span>
              </div>
              <p className="text-[11px] text-purple-300 font-sans leading-relaxed">
                <strong>{selectedSpecies.commonName}</strong> is a protected Schedule 1 breeder. To prevent intentional disturbance and safeguard active eyries/nests, pinpoint coordinates will automatically be coarsened to a ~{privacyEvaluation.fuzzRadiusKm}km regional hectad on the public map.
              </p>
            </div>
          )}

          {/* Location & Coordinates */}
          <div className="space-y-2">
            <label className="text-amber-400 font-bold block flex items-center justify-between">
              <span>2. WESSEX DOWNS LOCATION / COORDINATES</span>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <Compass className="w-3 h-3" /> Use My GPS
              </button>
            </label>

            {/* Sector Selector */}
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-2.5">
              <Navigation className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1">
                <span className="text-[10px] text-neutral-400 block font-mono-tactical">UK OPERATIONAL SECTOR</span>
                <select
                  id="sighting-modal-sector-select"
                  value={sectorId}
                  onChange={(e) => setSectorId(e.target.value as SectorId)}
                  className="w-full bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer text-xs mt-0.5"
                >
                  {UK_SECTORS.filter((s) => s.id !== 'all').map((sec) => (
                    <option key={sec.id} value={sec.id} className="bg-neutral-900 text-neutral-200">
                      {sec.name} ({sec.county})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <select
                  value={selectedHotspotId}
                  onChange={(e) => handleHotspotChange(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-lg p-2 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="custom">-- Select Hotspot Preset or Custom --</option>
                  {hotspots.map((spot) => (
                    <option key={spot.id} value={spot.id}>
                      {spot.name} ({spot.elevationM}m)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Location Name / Landmark"
                  value={customLocationName}
                  onChange={(e) => setCustomLocationName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-lg p-2 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-neutral-500 block mb-0.5">LATITUDE (°N)</span>
                <input
                  type="number"
                  step="0.0001"
                  value={Number.isFinite(lat) ? lat : ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setLat(isNaN(val) ? 51.4835 : val);
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-neutral-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <span className="text-neutral-500 block mb-0.5">LONGITUDE (°E / °W)</span>
                <input
                  type="number"
                  step="0.0001"
                  value={Number.isFinite(lng) ? lng : ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setLng(isNaN(val) ? -1.7895 : val);
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-neutral-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Counts, Flight Behavior & Altitude */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-neutral-400 font-bold block mb-1">INDIVIDUALS COUNT</label>
              <input
                type="number"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="w-full bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-lg p-2 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="text-neutral-400 font-bold block mb-1">FLIGHT BEHAVIOUR</label>
              <select
                value={behavior}
                onChange={(e) => setBehavior(e.target.value as SightingBehavior)}
                className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-lg p-2 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="Thermal Soaring">Thermal Soaring</option>
                <option value="Escarpment Lift">Escarpment Lift</option>
                <option value="Hover Hunting">Hover Hunting</option>
                <option value="Low Quartering">Low Quartering</option>
                <option value="High-Speed Stoop">High-Speed Stoop</option>
                <option value="Perched on Post/Sarsen">Perched on Post/Sarsen</option>
                <option value="Territorial Mobbing">Territorial Mobbing</option>
                <option value="Passage Migration">Passage Migration</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-400 font-bold block mb-1">EST. ALTITUDE (AGL)</label>
              <input
                type="number"
                step="10"
                value={altitudeM}
                onChange={(e) => setAltitudeM(parseInt(e.target.value) || 50)}
                className="w-full bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-lg p-2 focus:outline-none focus:border-amber-500"
                placeholder="Metres above ground"
              />
            </div>
          </div>

          {/* Observer Optics & Meteorological Vector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-neutral-400 font-bold block mb-1">OPTICS / SCOPE</label>
              <input
                type="text"
                value={opticalGear}
                onChange={(e) => setOpticalGear(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-lg p-2 focus:outline-none focus:border-amber-500"
                placeholder="e.g. 10x42 Binos, 20-60x Scope"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-bold block mb-1">OBSERVER CALLSIGN</label>
              <input
                type="text"
                value={currentCallsign}
                readOnly
                className="w-full bg-neutral-950 border border-neutral-800 text-amber-300 font-bold rounded-lg p-2 focus:outline-none cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-bold block mb-1">IDENTIFICATION CONFIDENCE</label>
              <select
                value={confidence}
                onChange={(e) => setConfidence(e.target.value as 'Confirmed (100%)' | 'High (80%)' | 'Probable (60%)')}
                className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-lg p-2 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="Confirmed (100%)">Confirmed (100%)</option>
                <option value="High (80%)">High (80%)</option>
                <option value="Probable (60%)">Probable (60%)</option>
              </select>
            </div>
          </div>

          {/* Field Notes */}
          <div>
            <label className="text-neutral-400 font-bold block mb-1">FIELD NOTES & VOCALISATIONS</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record plumage details, interaction with other raptors/corvids, flight path trajectory across the chalk downs..."
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-amber-500 leading-relaxed resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-sighting-btn"
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display-tactical text-sm font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <Send className="w-4 h-4" /> Transmit Sighting to SkyScout Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
