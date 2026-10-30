import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ShieldCheck, 
  ExternalLink, 
  Share2, 
  Check, 
  Building2, 
  Binoculars, 
  Radio, 
  TreePine, 
  Mail, 
  Coffee,
  HeartHandshake,
  Sparkles,
  Info
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

interface SponsorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDonate?: () => void;
}

interface SponsorEntity {
  id: string;
  name: string;
  category: 'optics' | 'telemetry' | 'conservation' | 'data';
  categoryLabel: string;
  badge: string;
  badgeColor: string;
  tagline: string;
  description: string;
  contribution: string;
  website: string;
  iconType: 'binoculars' | 'radio' | 'tree' | 'building';
  sinceYear: number;
}

const SPONSORS_DATA: SponsorEntity[] = [
  {
    id: 'downland-optics',
    name: 'Downland Optical Precision Ltd',
    category: 'optics',
    categoryLabel: 'Field Optics Partner',
    badge: 'Equipment Patron',
    badgeColor: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
    tagline: 'High-transmission spotting scopes & ED glass binocular systems',
    description: 'Providing weather-sealed high-magnification loaner optics and digiscoping adapters for volunteer raptor monitors surveying Hackpen Hill and the Ridgeway scarp.',
    contribution: 'Supplies 6 HD field scopes for seasonal skywatch groups & young birder loaner kits.',
    website: 'https://example.com/downland-optics',
    iconType: 'binoculars',
    sinceYear: 2024,
  },
  {
    id: 'meso-telemetry',
    name: 'Wessex Meso-Telemetry Labs',
    category: 'telemetry',
    categoryLabel: 'Infrastructure Sponsor',
    badge: 'Hardware Benefactor',
    badgeColor: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
    tagline: 'Ultralow-power solar anemometers & upland thermal sensors',
    description: 'Underwrites the high-frequency micro-meteorological sensor array on Barbury Castle and Tan Hill, supplying live thermal updraft and wind shear telemetry to RaptorLens.',
    contribution: 'Fully funds real-time sensor API bandwidth and solar station maintenance along the scarp.',
    website: 'https://example.com/meso-telemetry',
    iconType: 'radio',
    sinceYear: 2023,
  },
  {
    id: 'chalk-ridge-trust',
    name: 'Chalk Ridge Raptor Conservation Trust',
    category: 'conservation',
    categoryLabel: 'Conservation Foundation',
    badge: 'Schedule 1 Custodian',
    badgeColor: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
    tagline: 'Non-invasive population monitoring & downland habitat stewardship',
    description: 'A registered British conservation body auditing our Schedule 1 nesting privacy algorithms, verifying that sensitive raptors (e.g. Hen Harriers, Montagu’s, Merlins) remain shielded from disturbance.',
    contribution: 'Annual grant towards ethical observer training workshops and habitat corridor protection.',
    website: 'https://example.com/chalk-ridge-trust',
    iconType: 'tree',
    sinceYear: 2022,
  },
  {
    id: 'british-downland-heritage',
    name: 'Downland GeoData & Spatial Works',
    category: 'data',
    categoryLabel: 'Geospatial Sponsor',
    badge: 'Data Infrastructure',
    badgeColor: 'text-purple-300 border-purple-500/30 bg-purple-500/10',
    tagline: 'LIDAR-derived elevation tiles & upland thermal thermal drift models',
    description: 'Provides high-resolution 1m digital elevation models and UK contour vector tiles, enabling 3D ridgeway topography and terrain wind-shadow simulations without commercial tracking.',
    contribution: 'Subsidises vector map tile hosting and CDN caching for zero-latency offline field use.',
    website: 'https://example.com/downland-geodata',
    iconType: 'building',
    sinceYear: 2023,
  },
];

export const SponsorsModal: React.FC<SponsorsModalProps> = ({
  isOpen,
  onClose,
  onOpenDonate,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'optics' | 'telemetry' | 'conservation' | 'data'>('all');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [inquiryName, setInquiryName] = useState<string>('');
  const [inquiryEmail, setInquiryEmail] = useState<string>('');
  const [inquiryOrg, setInquiryOrg] = useState<string>('');
  const [inquiryCategory, setInquiryCategory] = useState<string>('optics');
  const [inquiryNotes, setInquiryNotes] = useState<string>('');
  const [inquirySent, setInquirySent] = useState<boolean>(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top and lock background scroll
  useEffect(() => {
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

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        tacticalAudio.playRadarPing(600);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyDirectLink = () => {
    tacticalAudio.playConfirmChime();
    const directUrl = `${window.location.origin}${window.location.pathname}#sponsors`;
    navigator.clipboard.writeText(directUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }).catch(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    tacticalAudio.playConfirmChime();
    setInquirySent(true);
  };

  const filteredSponsors = selectedFilter === 'all' 
    ? SPONSORS_DATA 
    : SPONSORS_DATA.filter((s) => s.category === selectedFilter);

  const getCategoryIcon = (iconType: string) => {
    switch (iconType) {
      case 'binoculars':
        return <Binoculars className="w-5 h-5 text-amber-400" />;
      case 'radio':
        return <Radio className="w-5 h-5 text-cyan-400" />;
      case 'tree':
        return <TreePine className="w-5 h-5 text-emerald-400" />;
      default:
        return <Building2 className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/85 backdrop-blur-md p-3 sm:p-5 flex justify-center items-start overscroll-contain"
    >
      <div 
        id="sponsors-modal-container"
        className="relative w-full max-w-4xl my-4 sm:my-8 mb-16 sm:mb-24 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden font-sans text-neutral-200 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Header Ribbon */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 border-b border-neutral-800 px-5 sm:px-7 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-neutral-100 tracking-tight font-sans">
                  Sponsors &amp; Conservation Partners
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
                  Dedicated Directory
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Our trusted optical, telemetry, and conservation benefactors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Share / Direct Link Button */}
            <button
              id="copy-sponsors-direct-link-btn"
              onClick={handleCopyDirectLink}
              title="Copy direct shareable link to this sponsors directory (#sponsors)"
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="hidden sm:inline">Share Page Link</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              id="close-sponsors-modal-btn"
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
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 space-y-6">
          {/* Strict Non-Intrusive Independence Charter */}
          <div className="p-4 sm:p-5 rounded-xl bg-neutral-900/90 border border-amber-500/30 shadow-inner space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-xs sm:text-sm font-bold text-amber-300 font-mono uppercase tracking-wide">
                  Ethical Sponsorship Charter &amp; Non-Intrusive Policy
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                Zero Ads on Radar
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed font-sans">
              RaptorLens is built on absolute scientific integrity and observer trust. Unlike commercial outdoor portals, <strong className="text-neutral-100">sponsors never receive banner advertisements, tracker scripts, or sponsored ranking on our radar screens or species logs</strong>. Sponsors and equipment partners are featured exclusively on this dedicated directory page that can be linked to directly.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-[11px] font-mono text-neutral-400">
              <div className="flex items-center gap-2 bg-neutral-950/70 p-2 rounded-lg border border-neutral-800">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span>100% Ad-Free Field Tool</span>
              </div>
              <div className="flex items-center gap-2 bg-neutral-950/70 p-2 rounded-lg border border-neutral-800">
                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                <span>Funds Sensors &amp; CDN Bandwidth</span>
              </div>
              <div className="flex items-center gap-2 bg-neutral-950/70 p-2 rounded-lg border border-neutral-800">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <span>Schedule 1 Ethics Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Directory Filter Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-1 border-b border-neutral-850">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'All Partners' },
                { id: 'optics', label: 'Field Optics' },
                { id: 'telemetry', label: 'Telemetry & Weather' },
                { id: 'conservation', label: 'Conservation Trusts' },
                { id: 'data', label: 'Geodata & Mapping' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    tacticalAudio.playRadarPing(900);
                    setSelectedFilter(tab.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    selectedFilter === tab.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="text-xs font-mono text-neutral-500">
              Showing {filteredSponsors.length} active {filteredSponsors.length === 1 ? 'partner' : 'partners'}
            </span>
          </div>

          {/* Sponsor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className="bg-neutral-900/60 hover:bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0 shadow-inner group-hover:border-neutral-700 transition-colors">
                        {getCategoryIcon(sponsor.iconType)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-100 group-hover:text-amber-300 transition-colors font-sans">
                          {sponsor.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-neutral-400 font-mono">
                            {sponsor.categoryLabel}
                          </span>
                          <span className="text-neutral-600 text-[10px]">•</span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            Partner since {sponsor.sinceYear}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border whitespace-nowrap ${sponsor.badgeColor}`}>
                      {sponsor.badge}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                    {sponsor.description}
                  </p>

                  <div className="p-2.5 rounded-lg bg-neutral-950/70 border border-neutral-850/80 text-[11px] font-sans text-neutral-300 space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Community Impact &amp; Role</span>
                    </div>
                    <p className="leading-snug text-neutral-300">
                      {sponsor.contribution}
                    </p>
                  </div>
                </div>

                <div className="pt-3.5 mt-3 border-t border-neutral-850/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Independent Partner
                  </span>
                  <a
                    href={sponsor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => tacticalAudio.playConfirmChime()}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-amber-400 hover:text-amber-300 hover:underline transition-colors"
                  >
                    <span>Visit Official Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* UK Wildlife Charities Callout */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-neutral-900 to-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs sm:text-sm font-bold text-neutral-200">
                  Want to Support British Birds of Prey &amp; Downland Nature?
                </h4>
              </div>
              <p className="text-xs text-neutral-300 font-sans">
                RaptorLens takes zero personal donations. Instead, we encourage visitors to donate directly to registered UK wildlife charities (RSPB, Wiltshire Wildlife Trust, Hawk Conservancy Trust &amp; BTO).
              </p>
            </div>

            {onOpenDonate && (
              <button
                type="button"
                onClick={() => {
                  tacticalAudio.playRadarPing(880);
                  onClose();
                  onOpenDonate();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>UK Wildlife Charities</span>
              </button>
            )}
          </div>

          {/* Become an Optical / Institutional Partner Form */}
          <div className="pt-2 border-t border-neutral-800/80 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-neutral-200 font-sans">
                  Sponsorship &amp; Equipment Partnership Inquiries
                </h3>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">
                partnerships@raptorlens.org
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Are you an optical equipment manufacturer, wildlife telemetry firm, or conservation NGO? We welcome partners who share our commitment to non-invasive raptor surveying, data privacy, and zero ad intrusion.
            </p>

            {inquirySent ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 animate-in fade-in">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-emerald-300 font-sans">
                  Partnership Inquiry Logged
                </h4>
                <p className="text-xs text-neutral-300 max-w-md mx-auto">
                  Thank you for reaching out, <strong className="text-neutral-100">{inquiryName || 'Partner'}</strong> ({inquiryOrg || 'Organization'}). Our Downland telemetry team will review your ethical alignment and reply at <strong className="text-emerald-400">{inquiryEmail || 'your email'}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setInquirySent(false)}
                  className="mt-2 text-xs font-mono text-neutral-400 hover:text-neutral-200 underline cursor-pointer"
                >
                  Submit another query
                </button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-3 bg-neutral-900/70 p-4 rounded-xl border border-neutral-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Eleanor Vance"
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                      Organization / Brand
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Downland Optics"
                      value={inquiryOrg}
                      onChange={(e) => setInquiryOrg(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                      Official Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="partner@domain.co.uk"
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                      Partnership Category
                    </label>
                    <select
                      value={inquiryCategory}
                      onChange={(e) => setInquiryCategory(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50 font-mono"
                    >
                      <option value="optics">Field Optics &amp; Gear</option>
                      <option value="telemetry">Weather &amp; Radar Telemetry</option>
                      <option value="conservation">Conservation Foundation</option>
                      <option value="academic">Academic &amp; Data Research</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                      Proposal Brief / Loaner Equipment Details
                    </label>
                    <input
                      type="text"
                      placeholder="Describe your equipment support or telemetry underwriting..."
                      value={inquiryNotes}
                      onChange={(e) => setInquiryNotes(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono">
                    <Info className="w-3.5 h-3.5" />
                    <span>Inquiries undergo Schedule 1 ethical vetting before approval.</span>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors ml-auto shadow-md shadow-amber-500/20"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Submit Sponsorship Inquiry</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-neutral-950 px-5 sm:px-7 py-3.5 border-t border-neutral-850 flex items-center justify-between text-xs font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-500">
              Direct deep-link URL: <code className="text-amber-400/90">#sponsors</code>
            </span>
          </div>

          <button
            onClick={() => {
              tacticalAudio.playConfirmChime();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700 text-xs font-bold transition-all cursor-pointer"
          >
            Close &amp; Return to Radar
          </button>
        </div>
      </div>
    </div>
  );
};
