import React, { useState } from 'react';
import { SightingLog, VerificationStatus } from '../types/raptor';
import { ObserverProfile } from '../types/community';
import { 
  X, 
  ShieldCheck, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  Flag, 
  MapPin, 
  Camera, 
  Compass, 
  Eye, 
  FileText, 
  Sparkles,
  Award,
  History,
  Send,
  Lock
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';
import { getUkTimeZoneLabel } from '../utils/recency';

interface SightingAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  sighting: SightingLog | null;
  currentCallsign: string;
  currentObserverProfile: ObserverProfile | null;
  onCorroborate: (sightingId: string, notes?: string) => void;
  onFlagSighting: (sightingId: string, reason: string) => void;
  onOpenLogin: () => void;
}

export const SightingAuditModal: React.FC<SightingAuditModalProps> = ({
  isOpen,
  onClose,
  sighting,
  currentCallsign,
  currentObserverProfile,
  onCorroborate,
  onFlagSighting,
  onOpenLogin,
}) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [corroborateNotes, setCorroborateNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [showFlagInput, setShowFlagInput] = useState(false);
  const [flagReason, setFlagReason] = useState('');

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
  }, [isOpen, sighting?.id]);

  if (!isOpen || !sighting) return null;

  const hasAlreadyCorroborated = sighting.corroborations?.some(
    (c) => c.observerCallsign.toUpperCase() === currentCallsign.toUpperCase()
  ) || sighting.observerCallsign.toUpperCase() === currentCallsign.toUpperCase();

  const isGuest = currentCallsign === 'GUEST-SCOUT' || !currentCallsign;

  const handleCorroborateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      onOpenLogin();
      return;
    }
    tacticalAudio.playConfirmChime();
    onCorroborate(sighting.id, corroborateNotes.trim() || undefined);
    setCorroborateNotes('');
    setShowNotesInput(false);
  };

  const handleFlagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagReason.trim()) return;
    tacticalAudio.playRadarPing(600);
    onFlagSighting(sighting.id, flagReason.trim());
    setFlagReason('');
    setShowFlagInput(false);
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'Specialist Confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono-tactical font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Specialist Confirmed
          </span>
        );
      case 'Corroborated by Peers':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono-tactical font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm">
            <Users className="w-4 h-4 text-cyan-400" />
            Corroborated ({sighting.corroborations?.length || 1})
          </span>
        );
      case 'Flagged for Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono-tactical font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Flagged for Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono-tactical font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm">
            <Clock className="w-4 h-4 text-amber-400" />
            Pending Peer Review
          </span>
        );
    }
  };

  return (
    <div 
      ref={scrollContainerRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/85 backdrop-blur-md p-3 sm:p-4 flex justify-center items-start overscroll-contain font-mono-tactical"
    >
      <div className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 mb-16 sm:mb-24">
        {/* Header */}
        <div className="bg-neutral-900/90 border-b border-neutral-800 p-4 sm:p-5 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                TACTICAL SIGHTING AUDIT RECORD #{sighting.id.slice(-6)}
              </span>
              {getStatusBadge(sighting.verificationStatus)}
            </div>

            <h3 className="font-display-tactical text-xl sm:text-2xl font-bold text-neutral-100 flex items-center gap-2">
              <span>{sighting.speciesName}</span>
              <span className="text-amber-400 font-mono text-base font-normal">({sighting.count}x)</span>
            </h3>

            <div className="text-xs text-neutral-400 flex items-center gap-3 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-neutral-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> {sighting.locationName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-neutral-300">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> {sighting.time} {getUkTimeZoneLabel(sighting.timestamp)} ({sighting.date})
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 text-xs">
          {/* Rarity Alert Banner (if applicable) */}
          {sighting.rarityAlert && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 flex items-start gap-3 shadow-inner">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase tracking-wider text-amber-300 block mb-0.5">
                  High Conservation / Rarity Flag
                </span>
                <p className="text-[11px] leading-relaxed text-amber-100/90 font-sans">
                  {sighting.rarityReason || 'Rare seasonal sighting requiring corroborated photographic or specialist review.'}
                </p>
              </div>
            </div>
          )}

          {/* Schedule 1 Privacy & Wildlife Act Compliance Dossier */}
          {sighting.isFuzzed && (
            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/50 text-purple-200 flex items-start gap-3 shadow-inner">
              <Lock className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold uppercase tracking-wider text-purple-300 block">
                    Schedule 1 Wildlife Protection Protocol (Active)
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-900 border border-purple-400/50 text-purple-200">
                    ~{sighting.privacyRadiusKm || 10}km Obfuscation
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-purple-100/90 font-sans">
                  In compliance with Section 1 of the UK <strong>Wildlife and Countryside Act 1981</strong>, pinpoint GPS coordinates for this taxon are intentionally masked to a regional hectad grid to safeguard active breeding territories, nest ledges, and dependant young from disturbance.
                </p>
              </div>
            </div>
          )}

          {/* Verification Pipeline Steps */}
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-4 space-y-3">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">
              Verification Trust Pipeline
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
              {/* Step 1: Initial Log */}
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-emerald-500/40 text-left space-y-1">
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="font-bold text-[10px]">STEP 1: FIELD LOG</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-neutral-200 truncate">{sighting.observerCallsign}</div>
                <div className="text-[10px] text-neutral-400 truncate">{sighting.opticalGear}</div>
              </div>

              {/* Step 2: Peer Corroboration */}
              <div className={`p-2.5 rounded-lg bg-neutral-950 border text-left space-y-1 ${
                sighting.corroborations && sighting.corroborations.length > 0
                  ? 'border-cyan-500/50'
                  : 'border-neutral-800 opacity-70'
              }`}>
                <div className="flex items-center justify-between text-cyan-400">
                  <span className="font-bold text-[10px]">STEP 2: CORROBORATION</span>
                  {sighting.corroborations && sighting.corroborations.length > 0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  )}
                </div>
                <div className="font-bold text-neutral-200">
                  {sighting.corroborations?.length || 0} Peer Scout(s)
                </div>
                <div className="text-[10px] text-neutral-400">
                  {sighting.corroborations && sighting.corroborations.length > 0
                    ? 'Visual contact confirmed'
                    : 'Awaiting 2nd witness'}
                </div>
              </div>

              {/* Step 3: Specialist Confirmed */}
              <div className={`p-2.5 rounded-lg bg-neutral-950 border text-left space-y-1 ${
                sighting.verificationStatus === 'Specialist Confirmed'
                  ? 'border-emerald-500/60'
                  : 'border-neutral-800 opacity-70'
              }`}>
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="font-bold text-[10px]">STEP 3: STUDY GROUP</span>
                  {sighting.verificationStatus === 'Specialist Confirmed' ? (
                    <Award className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  )}
                </div>
                <div className="font-bold text-neutral-200">
                  {sighting.verificationStatus === 'Specialist Confirmed' ? 'Specialist Signed' : 'Pending Review'}
                </div>
                <div className="text-[10px] text-neutral-400">
                  BTO / Wessex Study Group
                </div>
              </div>
            </div>
          </div>

          {/* Primary Observer & Equipment Dossier */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">
                Observer & Contact Details
              </span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Certified Wessex Observer
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-neutral-500 block text-[9px]">OBSERVER CALLSIGN</span>
                <span className="text-amber-400 font-bold truncate block">{sighting.observerCallsign}</span>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-neutral-500 block text-[9px]">EXPERIENCE RANK</span>
                <span className="text-neutral-200 font-bold truncate block">
                  {sighting.observerRank || 'Wessex Field Scout'}
                </span>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-neutral-500 block text-[9px]">FLIGHT BEHAVIOUR</span>
                <span className="text-cyan-400 font-bold truncate block">{sighting.behavior}</span>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-neutral-500 block text-[9px]">OPTICAL GEAR</span>
                <span className="text-neutral-300 font-bold truncate block">{sighting.opticalGear}</span>
              </div>
            </div>

            {/* Observer Field Notes */}
            <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
              <span className="text-[9px] text-neutral-500 uppercase tracking-wider block">Observer Field Notes:</span>
              <p className="text-xs text-neutral-200 font-sans leading-relaxed">
                "{sighting.notes}"
              </p>
            </div>
          </div>

          {/* Peer Corroborations List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Peer Corroborations ({sighting.corroborations?.length || 0})
              </span>
            </div>

            {sighting.corroborations && sighting.corroborations.length > 0 ? (
              <div className="space-y-1.5">
                {sighting.corroborations.map((corrob, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-neutral-900/80 border border-neutral-800 rounded-lg flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400">{corrob.observerCallsign}</span>
                        {corrob.observerRank && (
                          <span className="text-[10px] text-neutral-400">({corrob.observerRank})</span>
                        )}
                        <span className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Corroborated
                        </span>
                      </div>
                      {corrob.notes && (
                        <p className="text-[11px] text-neutral-300 font-sans">
                          "{corrob.notes}"
                        </p>
                      )}
                    </div>

                    <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                      {new Date(corrob.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-neutral-900/40 border border-dashed border-neutral-800 rounded-lg text-center text-neutral-500 text-[11px]">
                No peer corroborations logged yet for this contact.
              </div>
            )}
          </div>

          {/* Interactive Corroboration Actions */}
          <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                  Were you patrolling this sector?
                </h4>
                <p className="text-[11px] text-neutral-400 font-sans">
                  Help maintain data integrity by confirming this contact with your observer ID.
                </p>
              </div>

              {isGuest ? (
                <button
                  onClick={onOpenLogin}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Sign In to Corroborate
                </button>
              ) : hasAlreadyCorroborated ? (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Your Visual Confirmed</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowNotesInput(!showNotesInput)}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I Corroborate This Sighting</span>
                </button>
              )}
            </div>

            {/* Corroboration Note Input */}
            {showNotesInput && !hasAlreadyCorroborated && !isGuest && (
              <form onSubmit={handleCorroborateSubmit} className="space-y-2 pt-2 border-t border-neutral-800">
                <label className="text-[11px] text-neutral-300 block font-bold">
                  CORROBORATION DETAILS (OPTIONAL):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Verified with 8x42 from car park; saw individual drift south."
                    value={corroborateNotes}
                    onChange={(e) => setCorroborateNotes(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 text-xs focus:outline-none focus:border-emerald-500 font-sans"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs cursor-pointer flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Submit
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Full Audit Trail Timeline */}
          <div className="space-y-2 pt-1 border-t border-neutral-800">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-amber-400" />
              Immutable Audit Log
            </span>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {sighting.auditTrail && sighting.auditTrail.length > 0 ? (
                sighting.auditTrail.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-neutral-900/60 border border-neutral-800/80 text-[11px] flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="font-bold text-amber-400">{entry.action}</span>
                        <span className="text-neutral-500">•</span>
                        <span className="text-neutral-300 font-bold">{entry.actorCallsign}</span>
                        {entry.actorRank && <span className="text-neutral-500">({entry.actorRank})</span>}
                      </div>
                      <p className="text-neutral-300 font-sans text-[11px]">
                        {entry.details}
                      </p>
                    </div>
                    <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-neutral-500 text-[10px] italic">
                  Initial log verified.
                </div>
              )}
            </div>
          </div>

          {/* Scrutiny / Flagging Option */}
          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span className="text-[10px]">Suspect or misidentified sighting?</span>
            <button
              onClick={() => setShowFlagInput(!showFlagInput)}
              className="text-neutral-400 hover:text-rose-400 flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Flag className="w-3 h-3" /> Flag for Review
            </button>
          </div>

          {showFlagInput && (
            <form onSubmit={handleFlagSubmit} className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-xl space-y-2">
              <label className="text-[10px] text-rose-300 font-bold block">
                REASON FOR SCRUTINY / FLAG:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Unlikely plumage description; out-of-season migrant without photos."
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-100 text-xs focus:outline-none focus:border-rose-500 font-sans"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-neutral-950 font-bold text-xs cursor-pointer"
                >
                  Flag
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
