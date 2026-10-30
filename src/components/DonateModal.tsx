/**
 * UK Wildlife & Bird Conservation Charity Directory Modal:
 * Replaces personal tipping/donations with direct links to registered UK wildlife,
 * bird of prey, and chalk downland conservation charities (RSPB, Wiltshire Wildlife Trust,
 * Hawk Conservancy Trust, BTO, and The Wildlife Trusts). Zero funds go to the site operator.
 */

import React, { useState } from 'react';
import {
  X,
  Heart,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Award,
  HeartHandshake,
  Send
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCallsign?: string;
  onOpenSponsors?: () => void;
}

interface UkWildlifeCharity {
  id: string;
  name: string;
  shortName: string;
  charityNumber: string;
  focus: string;
  description: string;
  donateUrl: string;
  accentClass: string;
  buttonClass: string;
}

interface CharitySupportNote {
  id: string;
  callsign: string;
  charityName: string;
  note: string;
  timeAgo: string;
}

const UK_WILDLIFE_CHARITIES: UkWildlifeCharity[] = [
  {
    id: 'rspb',
    name: 'RSPB (Royal Society for the Protection of Birds)',
    shortName: 'RSPB',
    charityNumber: 'Registered Charity No. 207076 (England & Wales)',
    focus: 'UK Birds of Prey, Hen Harrier Life Project & Habitat Reserves',
    description:
      'The UK’s largest nature conservation charity, protecting rare Schedule 1 raptors, defending upland and downland habitats, and tackling wildlife crime across Britain.',
    donateUrl: 'https://www.rspb.org.uk/donate',
    accentClass: 'border-emerald-500/40 bg-emerald-950/25',
    buttonClass: 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950',
  },
  {
    id: 'wiltshire-wildlife',
    name: 'Wiltshire Wildlife Trust',
    shortName: 'Wiltshire Wildlife Trust',
    charityNumber: 'Registered Charity No. 266202',
    focus: 'Marlborough Downs, Chalk Grassland & Local Wiltshire Nature Reserves',
    description:
      'Directly manages and restores ancient chalk downland, wildflower meadows, and wildlife corridors right here across Wiltshire, Swindon, and the Marlborough Downs.',
    donateUrl: 'https://www.wiltshirewildlife.org/donate',
    accentClass: 'border-amber-500/40 bg-amber-950/20',
    buttonClass: 'bg-amber-500 hover:bg-amber-400 text-neutral-950',
  },
  {
    id: 'hawk-conservancy',
    name: 'The Hawk Conservancy Trust',
    shortName: 'Hawk Conservancy Trust',
    charityNumber: 'Registered Charity No. 1092185',
    focus: 'Southern England Raptor Research, Kestrel & Barn Owl Nest Boxes',
    description:
      'Specialist bird of prey conservation charity operating the National Bird of Prey Hospital and leading field research on Kestrels, Barn Owls, and Red Kites across Wessex.',
    donateUrl: 'https://www.hawk-conservancy.org/support-us/donate/',
    accentClass: 'border-cyan-500/40 bg-cyan-950/20',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950',
  },
  {
    id: 'bto',
    name: 'British Trust for Ornithology (BTO)',
    shortName: 'BTO',
    charityNumber: 'Registered Charity No. 216652',
    focus: 'Raptor Ringing, Nest Record Scheme & Scientific Bird Monitoring',
    description:
      'Independent scientific research trust powering UK bird population monitoring, satellite tagging, and the national Nest Record Scheme.',
    donateUrl: 'https://www.bto.org/how-you-can-help/donate',
    accentClass: 'border-neutral-700 bg-neutral-900/80',
    buttonClass: 'bg-neutral-200 hover:bg-white text-neutral-950',
  },
  {
    id: 'wildlife-trusts',
    name: 'The Wildlife Trusts (UK)',
    shortName: 'The Wildlife Trusts',
    charityNumber: 'Registered Charity No. 207238',
    focus: '30 by 30 Nature Recovery & UK-Wide Habitat Restoration',
    description:
      'A grassroots movement of 46 regional Wildlife Trusts working to bring wildlife back and restore 30% of UK land and sea for nature by 2030.',
    donateUrl: 'https://www.wildlifetrusts.org/donate',
    accentClass: 'border-neutral-700 bg-neutral-900/80',
    buttonClass: 'bg-neutral-200 hover:bg-white text-neutral-950',
  },
];

const INITIAL_COMMUNITY_NOTES: CharitySupportNote[] = [
  {
    id: 'cn-1',
    callsign: 'Wessex_KiteWatch',
    charityName: 'Wiltshire Wildlife Trust',
    note: 'Watched 4 Red Kites over Barbury Castle on the cam today — sent a donation to Wiltshire Wildlife Trust to help protect our local chalk downland!',
    timeAgo: 'Recent field note',
  },
  {
    id: 'cn-2',
    callsign: 'Ridgeway_Walker',
    charityName: 'RSPB',
    note: 'Checked the summit weather here before our walk from Hackpen Hill. Donated to the RSPB in appreciation.',
    timeAgo: 'Recent field note',
  },
];

/**
 * Renders the UK Wildlife & Nature Charity support modal.
 * Inputs: DonateModalProps (isOpen, onClose, currentCallsign, onOpenSponsors)
 * Outputs: Modal JSX directing visitors exclusively to accredited UK wildlife charities.
 */
export const DonateModal: React.FC<DonateModalProps> = ({
  isOpen,
  onClose,
  currentCallsign = 'RIDGE-WALKER',
  onOpenSponsors,
}) => {
  const [selectedCharity, setSelectedCharity] = useState<string>('RSPB');
  const [observerName, setObserverName] = useState<string>(currentCallsign);
  const [fieldNote, setFieldNote] = useState<string>('');
  const [noteSubmitted, setNoteSubmitted] = useState<boolean>(false);
  const [notes, setNotes] = useState<CharitySupportNote[]>(() => {
    try {
      const saved = localStorage.getItem('raptorlens_charity_notes');
      return saved ? JSON.parse(saved) : INITIAL_COMMUNITY_NOTES;
    } catch {
      return INITIAL_COMMUNITY_NOTES;
    }
  });
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

  if (!isOpen) return null;

  /**
   * Saves a community conservation appreciation note locally without collecting any payment.
   */
  const handlePostCharityNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldNote.trim()) return;
    tacticalAudio.playConfirmChime();

    const newEntry: CharitySupportNote = {
      id: `cn-${Date.now()}`,
      callsign: observerName.trim() || currentCallsign || 'Field Spotter',
      charityName: selectedCharity,
      note: fieldNote.trim(),
      timeAgo: 'Just now',
    };

    const updated = [newEntry, ...notes];
    setNotes(updated);
    try {
      localStorage.setItem('raptorlens_charity_notes', JSON.stringify(updated));
    } catch {}
    setFieldNote('');
    setNoteSubmitted(true);
    setTimeout(() => setNoteSubmitted(false), 4000);
  };

  return (
    <div
      ref={scrollContainerRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md p-4 flex justify-center items-start overscroll-contain"
    >
      <div
        id="donate-modal-container"
        className="relative w-full max-w-2xl my-4 sm:my-8 mb-16 sm:mb-24 bg-neutral-900 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden font-mono-tactical text-neutral-200 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-neutral-900 to-emerald-950/80 border-b border-emerald-500/30 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-inner">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-emerald-300 font-sans tracking-tight">
                Support UK Wildlife &amp; Raptor Charities
              </h2>
              <p className="text-xs text-neutral-300 font-sans">
                100% Volunteer Station &middot; Zero Money Goes to This Website
              </p>
            </div>
          </div>

          <button
            id="close-donate-modal-btn"
            onClick={() => {
              tacticalAudio.playRadarPing(600);
              onClose();
            }}
            className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Explicit Zero Personal Money Pledge */}
          <div className="bg-emerald-950/35 border border-emerald-500/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>A Personal Note from the Station Operator</span>
            </div>
            <p className="text-xs text-neutral-200 font-sans leading-relaxed">
              RaptorLens UK and the live Hackpen Hill &amp; Barbury Castle camera are run purely for the love of British wildlife and the Marlborough Downs. <strong>We do not accept personal donations, tips, or payments of any kind.</strong>
            </p>
            <p className="text-xs text-emerald-200 font-sans leading-relaxed">
              If you enjoy checking the live ridge weather, watching the camera, or tracking Red Kites and Kestrels on the map, please consider making a direct donation to one of these registered UK wildlife and bird conservation charities instead:
            </p>
          </div>

          {/* Official UK Wildlife Charity Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Registered UK Bird &amp; Nature Charities (Direct Official Links)
            </h3>

            <div className="space-y-3">
              {UK_WILDLIFE_CHARITIES.map((charity) => (
                <div
                  key={charity.id}
                  className={`p-4 rounded-xl border ${charity.accentClass} flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-neutral-100 font-sans">
                        {charity.name}
                      </h4>
                    </div>
                    <div className="text-[11px] text-emerald-300/90 font-sans font-medium">
                      {charity.focus} &middot; <span className="text-neutral-400 font-mono">{charity.charityNumber}</span>
                    </div>
                    <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                      {charity.description}
                    </p>
                  </div>

                  <a
                    href={charity.donateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => tacticalAudio.playConfirmChime()}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow cursor-pointer transition-all ${charity.buttonClass}`}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Donate to {charity.shortName}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Community Charity Appreciation Log */}
          <form onSubmit={handlePostCharityNote} className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Leave a Wildlife Appreciation Note (Optional)</span>
              </span>
              <span className="text-[11px] text-neutral-400 font-sans">
                Inspire fellow walkers &amp; birders
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Your Callsign or Name
                </label>
                <input
                  type="text"
                  value={observerName}
                  onChange={(e) => setObserverName(e.target.value)}
                  placeholder="e.g. Ridgeway_Walker"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Charity Supported / Highlighted
                </label>
                <select
                  value={selectedCharity}
                  onChange={(e) => setSelectedCharity(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 font-sans"
                >
                  {UK_WILDLIFE_CHARITIES.map((c) => (
                    <option key={c.id} value={c.shortName}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Field Note or Message
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={fieldNote}
                  onChange={(e) => setFieldNote(e.target.value)}
                  placeholder="e.g. Enjoyed the Barbury Castle cam today — donated £5 to the RSPB!"
                  className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 font-sans"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Note</span>
                </button>
              </div>
            </div>

            {noteSubmitted && (
              <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-sans">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Thank you for supporting UK wildlife conservation! Your note has been added below.</span>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-neutral-800/80 max-h-36 overflow-y-auto pr-1">
              {notes.map((item) => (
                <div
                  key={item.id}
                  className="bg-neutral-900/70 border border-neutral-800/80 rounded-lg p-2.5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-400">
                    <span>
                      <strong className="text-neutral-200">{item.callsign}</strong> &middot; <span className="text-emerald-400">{item.charityName}</span>
                    </span>
                    <span>{item.timeAgo}</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 font-sans italic">
                    &ldquo;{item.note}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </form>

          {/* Discreet link to Conservation Partners Directory */}
          {onOpenSponsors && (
            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Conservation &amp; Optical Partners Directory</span>
              </div>
              <button
                type="button"
                id="donate-view-sponsors-link"
                onClick={() => {
                  tacticalAudio.playRadarPing(880);
                  onOpenSponsors();
                }}
                className="text-[11px] font-mono-tactical text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 cursor-pointer transition-colors"
              >
                View Conservation Partners &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-neutral-950 px-6 py-3 border-t border-neutral-850 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-400 font-sans">
          <span>All links open the official charity donation pages directly in a new tab.</span>
          <button
            type="button"
            onClick={() => onClose()}
            className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
};
