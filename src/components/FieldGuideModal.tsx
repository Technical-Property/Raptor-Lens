import React, { useState } from 'react';
import { 
  Compass, 
  Map as MapIcon, 
  Eye, 
  Users, 
  Wind, 
  ShieldCheck, 
  Sparkles, 
  Mountain, 
  Sun, 
  Camera, 
  HelpCircle, 
  CheckCircle2, 
  BookOpen, 
  Layers, 
  Radar, 
  CheckSquare, 
  AlertTriangle, 
  ArrowRight, 
  Radio, 
  LogIn, 
  Plus, 
  Info, 
  HeartHandshake,
  Smartphone,
  MessageSquare,
  Globe2,
  Lock,
  Coffee,
  Scale,
  Mail
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

type GuideTab = 'about' | 'how-to' | 'navigation' | 'ethics' | 'legal';

interface FieldGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'map' | 'silhouette' | 'quiz' | 'sightings' | 'dispatches' | 'community') => void;
  onOpenLogin?: () => void;
  onOpenLogModal?: () => void;
  onToggleLiteMode?: () => void;
  onOpenBetaFeedback?: () => void;
  onOpenDonate?: () => void;
  onOpenLegal?: () => void;
  onOpenSponsors?: () => void;
  onOpenContact?: () => void;
}

export const FieldGuideModal: React.FC<FieldGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenLogin,
  onOpenLogModal,
  onToggleLiteMode,
  onOpenBetaFeedback,
  onOpenDonate,
  onOpenLegal,
  onOpenSponsors,
  onOpenContact,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<GuideTab>('how-to');
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
  }, [isOpen, activeSubTab]);

  if (!isOpen) return null;

  const handleNavigate = (tab: 'map' | 'silhouette' | 'quiz' | 'sightings' | 'dispatches' | 'community') => {
    tacticalAudio.playRadarPing(880);
    onClose();
    onNavigateTab(tab);
  };

  return (
    <div 
      ref={scrollContainerRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/85 backdrop-blur-md p-3 sm:p-5 flex justify-center items-start overscroll-contain"
    >
      <div className="w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-7 md:p-8 shadow-2xl space-y-6 font-sans my-4 sm:my-8 mb-16 sm:mb-24 relative overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-neutral-800/90 pb-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-tactical font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                ABOUT & FIELD MANUAL
              </span>
              <span className="text-xs font-mono-tactical text-neutral-400">
                UK Escarpments // Field Beta v0.9.4
              </span>
            </div>
            <h2 className="font-display-tactical text-2xl sm:text-3xl font-bold text-neutral-100 tracking-tight">
              About RaptorLens & Field Guide
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans max-w-2xl">
              Accurate background, operating instructions, wildlife ethics, and navigation assistance for Britain's dedicated downland bird of prey observation network.
            </p>
          </div>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(700);
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-100 flex items-center justify-center cursor-pointer transition-colors shrink-0"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto relative z-10 font-mono-tactical text-xs">
          <button
            onClick={() => {
              tacticalAudio.playRadarPing(800);
              setActiveSubTab('how-to');
            }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'how-to'
                ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 font-bold'
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900/50 border border-transparent'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>1. Quick Start &amp; User Guide</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(750);
              setActiveSubTab('about');
            }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'about'
                ? 'bg-cyan-500/20 border border-cyan-500/60 text-cyan-300 font-bold'
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900/50 border border-transparent'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>2. About &amp; UK Escarpments</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(850);
              setActiveSubTab('navigation');
            }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'navigation'
                ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 font-bold'
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900/50 border border-transparent'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>3. Section Quick Jump</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(900);
              setActiveSubTab('ethics');
            }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'ethics'
                ? 'bg-purple-500/20 border border-purple-500/60 text-purple-300 font-bold'
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900/50 border border-transparent'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>4. Wildlife Law &amp; Ethics</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(920);
              setActiveSubTab('legal');
            }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'legal'
                ? 'bg-rose-500/20 border border-rose-500/60 text-rose-300 font-bold'
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900/50 border border-transparent'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-rose-400" />
            <span>5. Compliance &amp; Privacy</span>
          </button>
        </div>

        {/* Tab 1: About Us & Our Mission */}
        {activeSubTab === 'about' && (
          <div className="space-y-5 text-neutral-300 font-sans text-xs sm:text-sm leading-relaxed relative z-10 animate-fadeIn">
            {/* Story & Purpose */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-display-tactical text-base font-bold">
                <Mountain className="w-5 h-5 text-amber-400" />
                <span>What is RaptorLens? (Powered by CHALK)</span>
              </div>
              <p className="text-neutral-300">
                <strong>RaptorLens</strong> is the flagship vertical of <strong>CHALK</strong>—an independent, open-access outdoor telemetry and wildlife intelligence network. Built specifically for observing, studying, and protecting birds of prey across Southern England's ancient chalk and limestone escarpments, CHALK stations integrate high-magnification optical sensors with real-time crowd corroboration.
              </p>
              <p className="text-neutral-300">
                These soaring corridors—where prevailing south-westerly winds collide with steep downland scarps—generate predictable orographic slope lift and solar thermal columns. This natural atmospheric engine creates premier soaring motorways for <strong>Red Kites</strong>, <strong>Common Buzzards</strong>, <strong>Peregrine Falcons</strong>, <strong>Eurasian Hobbies</strong>, <strong>Hen Harriers</strong>, <strong>Short-eared Owls</strong>, and passing <strong>Ospreys</strong>.
              </p>
            </div>

            {/* Supported UK Corridors (Factually Correct & Complete) */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono-tactical text-amber-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Globe2 className="w-4 h-4 text-amber-400" />
                <span>Supported Observation Sectors (National Landscapes & Parks)</span>
              </h4>
              <p className="text-xs text-neutral-400">
                Note: In November 2023, England’s Areas of Outstanding Natural Beauty (AONBs) were officially redesignated as <strong>National Landscapes</strong> to reflect their national conservation significance.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                <div className="bg-neutral-900/70 border border-neutral-800 p-3.5 rounded-xl space-y-1">
                  <div className="text-neutral-100 font-display-tactical font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    The Ridgeway & Marlborough Downs
                  </div>
                  <div className="text-[11px] text-amber-300 font-mono">Wiltshire & Oxfordshire</div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Core sector inside the North Wessex Downs National Landscape. High chalk ramparts at Barbury Castle (268m), Hackpen Hill, and Avebury Henge.
                  </p>
                </div>

                <div className="bg-neutral-900/70 border border-neutral-800 p-3.5 rounded-xl space-y-1">
                  <div className="text-neutral-100 font-display-tactical font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    Salisbury Plain Grasslands
                  </div>
                  <div className="text-[11px] text-cyan-300 font-mono">South Wiltshire & Hampshire</div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Largest continuous unimproved chalk grassland in NW Europe. Bratton Camp scarp, Stonehenge Down, and prime wintering Hen Harrier grounds.
                  </p>
                </div>

                <div className="bg-neutral-900/70 border border-neutral-800 p-3.5 rounded-xl space-y-1">
                  <div className="text-neutral-100 font-display-tactical font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    The Chilterns Scarp
                  </div>
                  <div className="text-[11px] text-emerald-300 font-mono">Buckinghamshire & Oxfordshire</div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Chilterns National Landscape. Epicentre of the English Red Kite reintroduction. Steep chalk ridges at Ivinghoe Beacon (233m) and Watlington Hill.
                  </p>
                </div>

                <div className="bg-neutral-900/70 border border-neutral-800 p-3.5 rounded-xl space-y-1">
                  <div className="text-neutral-100 font-display-tactical font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    Cotswold Edge & Severn Vale
                  </div>
                  <div className="text-[11px] text-purple-300 font-mono">Gloucestershire</div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Cotswolds National Landscape. Dramatic 300m oolitic limestone cliff at Cleeve Common (330m) and Leckhampton Hill overlooking the Severn estuary flyway.
                  </p>
                </div>

                <div className="bg-neutral-900/70 border border-neutral-800 p-3.5 rounded-xl space-y-1 sm:col-span-2 md:col-span-2">
                  <div className="text-neutral-100 font-display-tactical font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    South Downs Way & Sussex Scarp
                  </div>
                  <div className="text-[11px] text-rose-300 font-mono">East & West Sussex, Hampshire</div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    South Downs National Park. Ancient chalk ridge running from Winchester to the 162m sea cliffs of Beachy Head—Britain's premier coastal Peregrine stronghold and cross-channel migration departure point.
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Core Architectural Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
                  🦅
                </div>
                <h4 className="font-display-tactical text-neutral-100 font-bold text-sm">
                  1. Silhouette-First ID
                </h4>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Raptors soaring hundreds of feet in the air appear as stark black silhouettes against bright downland clouds. We prioritise flight geometry, wing aspect ratios, primary feather counts, and tail shape over faint plumage details.
                </p>
              </div>

              <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
                  🛡️
                </div>
                <h4 className="font-display-tactical text-neutral-100 font-bold text-sm">
                  2. Verified Data Pipeline
                </h4>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  To eliminate phantom reports and misidentifications, every record is tied to an observer callsign, optical equipment, and weather conditions, backed by multi-observer peer corroboration and specialist review.
                </p>
              </div>

              <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold">
                  📱
                </div>
                <h4 className="font-display-tactical text-neutral-100 font-bold text-sm">
                  3. Field Mobile & Lite Mode
                </h4>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Engineered for real-world field conditions: high-glare sunlight on open chalk summits, cold wind-chill, and intermittent 3G/4G connectivity with one-handed GPS logging and instant silhouette references.
                </p>
              </div>
            </div>

            {/* Field Beta Notice */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-amber-300 font-display-tactical text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>About Field Beta (v0.9.4) & Your Feedback</span>
                </h4>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                  BETA v0.9.4
                </span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                RaptorLens is currently in active <strong>Field Beta</strong>. We are continuously calibrating our thermal corridor models, testing mobile performance in remote downland hollows, and expanding our verified observer roster.
              </p>
              <p className="text-xs text-neutral-300 leading-relaxed">
                If you encounter any teething problems, spot glitches, or have suggestions for new vantage points, click the <strong>★ Beta Feedback</strong> button in the navigation bar or footer. Your field input directly shapes upcoming releases!
              </p>
            </div>

            {/* UK Wildlife Charity Support & Zero Personal Money Pledge */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-emerald-300 font-display-tactical text-xs font-bold uppercase tracking-wider">
                    100% Volunteer Project — Support UK Wildlife Charities Instead
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                  Zero Personal Donations
                </span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                RaptorLens UK does not accept personal donations, tips, or payments. If you enjoy watching the live Ridgeway camera and using the raptor map, please consider donating directly to the <strong>RSPB</strong>, <strong>Wiltshire Wildlife Trust</strong>, <strong>The Hawk Conservancy Trust</strong>, or the <strong>BTO</strong>.
              </p>
              <div className="pt-1 flex items-center flex-wrap gap-2.5">
                {onOpenDonate && (
                  <button
                    onClick={() => {
                      tacticalAudio.playRadarPing(900);
                      onClose();
                      onOpenDonate();
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <HeartHandshake className="w-4 h-4" />
                    <span>Support UK Wildlife Charities (RSPB / Wildlife Trusts)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: How to use the site & Quick Start */}
        {activeSubTab === 'how-to' && (
          <div className="space-y-4 text-neutral-300 font-sans text-xs sm:text-sm leading-relaxed relative z-10 animate-fadeIn">
            {/* Quick 3-Step Beginner's Guide */}
            <div className="bg-gradient-to-br from-amber-500/10 via-neutral-900 to-cyan-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌿</span>
                  <h3 className="font-display-tactical text-neutral-100 font-bold text-sm sm:text-base">
                    Quick Start Guide — 3 Simple Steps
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                  BEGINNER FRIENDLY &bull; UK ENGLISH
                </span>
              </div>
              <p className="text-xs text-neutral-300">
                You do not need to be an expert ornithologist or own expensive optical gear to enjoy RaptorLens. Here is how to get the most out of the site:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-neutral-950/70 border border-neutral-800 p-3 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 font-display-tactical font-bold text-amber-400 text-xs">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">1</span>
                    <span>Check the Map or Cam</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
                    View the <strong>Sightings Map</strong> to see where raptors are soaring in real time along the chalk escarpment, or click <strong>Barbury Live Cam</strong> to watch live from home.
                  </p>
                </div>

                <div className="bg-neutral-950/70 border border-neutral-800 p-3 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 font-display-tactical font-bold text-cyan-400 text-xs">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[11px]">2</span>
                    <span>Identify What You Saw</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
                    Not sure what bird you spotted? Head to <strong>Identify Raptors</strong>. Compare silhouettes, check wing shapes, or use our handy <strong>Compare Species</strong> tool (Buzzard vs Kite, Kestrel vs Sparrowhawk).
                  </p>
                </div>

                <div className="bg-neutral-950/70 border border-neutral-800 p-3 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 font-display-tactical font-bold text-emerald-400 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px]">3</span>
                    <span>Log with 1 Click</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
                    Seen a bird? Tap the gold <strong>+ Log Sighting</strong> button. If you spot a rare Schedule 1 nesting species, the app automatically protects and fuzzes coordinates to keep the birds safe.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-1.5">
              <h3 className="font-display-tactical text-neutral-100 font-bold text-sm sm:text-base flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Complete Site Feature Walkthrough</span>
              </h3>
              <p className="text-xs text-neutral-400">
                A step-by-step guide to using all six tactical modules and mobile tools:
              </p>
            </div>

            <div className="space-y-3">
              {/* Feature 1: Tactical Airspace Radar */}
              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono-tactical font-bold text-xs">
                      1
                    </span>
                    <strong className="text-neutral-100 font-display-tactical text-sm">
                      Tactical Airspace Radar & Hybrid Basemaps
                    </strong>
                  </div>
                  <button
                    onClick={() => handleNavigate('map')}
                    className="text-[11px] font-mono-tactical text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    Open Map &rarr;
                  </button>
                </div>
                <p className="text-neutral-300 text-xs">
                  • <strong>Sector Corridor Switcher:</strong> Switch between the 5 southern corridors or view all corridors combined.<br />
                  • <strong>Thermal Lift Zones:</strong> The glowing gold vector shows the escarpment thermal highway where rising air currents concentrate soaring raptors.<br />
                  • <strong>Basemaps:</strong> Switch between <strong>Google Satellite</strong> (high-res aerial imagery), <strong>Chalk Topo</strong> (10-metre elevation contour lines & public rights of way), and <strong>Tactical Dark</strong> (glare-free high contrast).<br />
                  • <strong>1-Click Map Logging:</strong> Click any spot on the map to open the sighting logger pre-filled with exact GPS coordinates.
                </p>
              </div>

              {/* Feature 2: Field Scout Lite Mode */}
              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono-tactical font-bold text-xs">
                      2
                    </span>
                    <strong className="text-neutral-100 font-display-tactical text-sm">
                      Field Scout Lite Mode (Mobile & Low-Bandwidth)
                    </strong>
                  </div>
                  {onToggleLiteMode && (
                    <button
                      onClick={() => {
                        onClose();
                        onToggleLiteMode();
                      }}
                      className="text-[11px] font-mono-tactical text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      Toggle Lite Mode &rarr;
                    </button>
                  )}
                </div>
                <p className="text-neutral-300 text-xs">
                  • <strong>Built for the Scarp:</strong> Access via the <strong>LITE MODE</strong> button in the top navigation bar.<br />
                  • <strong>Rapid Logging:</strong> 1-tap species picker with live GPS position locking and accuracy readout.<br />
                  • <strong>Sunlight Readability:</strong> High-contrast monochromatic UI designed for bright downland glare, low battery consumption, and patchy mobile signal.
                </p>
              </div>

              {/* Feature 3: Silhouette Identifier */}
              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono-tactical font-bold text-xs">
                      3
                    </span>
                    <strong className="text-neutral-100 font-display-tactical text-sm">
                      Silhouette Diagnostic Key
                    </strong>
                  </div>
                  <button
                    onClick={() => handleNavigate('silhouette')}
                    className="text-[11px] font-mono-tactical text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    Open Key &rarr;
                  </button>
                </div>
                <p className="text-neutral-300 text-xs">
                  • <strong>Filter by Flight Profile:</strong> Diagnostic filter for <strong>Forked tail</strong> (Red Kite), <strong>Fan tail & fingered primaries</strong> (Buzzard), <strong>Stationary hover</strong> (Kestrel), <strong>Scythe wings</strong> (Peregrine/Hobby), or <strong>High V-dihedral</strong> (Hen Harrier).<br />
                  • <strong>Species Dossiers:</strong> Inspect wingspan ranges, UK BoCC5 conservation status, diagnostic flight behaviours, confusion species, and optimal weather.
                </p>
              </div>

              {/* Feature 4: Silhouette Quiz */}
              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-mono-tactical font-bold text-xs">
                      4
                    </span>
                    <strong className="text-neutral-100 font-display-tactical text-sm">
                      Silhouette Reflex Drill Quiz
                    </strong>
                  </div>
                  <button
                    onClick={() => handleNavigate('quiz')}
                    className="text-[11px] font-mono-tactical text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                  >
                    Take Quiz &rarr;
                  </button>
                </div>
                <p className="text-neutral-300 text-xs">
                  • <strong>Timed Recognition Drills:</strong> Practice identifying silhouettes flashing across downland cloudscapes under a countdown timer.<br />
                  • <strong>Reflex Training:</strong> Develop subconscious, instant field recognition habits before arriving at the escarpment.
                </p>
              </div>

              {/* Feature 5: Sighting Logs & Peer Audits */}
              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono-tactical font-bold text-xs">
                      5
                    </span>
                    <strong className="text-neutral-100 font-display-tactical text-sm">
                      Sighting Logs & 3-Step Verification Pipeline
                    </strong>
                  </div>
                  <button
                    onClick={() => handleNavigate('sightings')}
                    className="text-[11px] font-mono-tactical text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    View Logs &rarr;
                  </button>
                </div>
                <p className="text-neutral-300 text-xs">
                  • <strong>Step 1 (Field Log):</strong> Sighting logged with observer callsign, optics (e.g. 10x42 bins, 30-70x scope), weather conditions, and behaviour.<br />
                  • <strong>Step 2 (Peer Corroboration):</strong> Observers in the same sector corroborate the sighting with 1 click.<br />
                  • <strong>Step 3 (Specialist Confirmation):</strong> Rare or sensitive records (Hen Harrier, Merlin, Osprey) are flagged for verified British Trust for Ornithology (BTO) or Raptor Study Group sign-off.
                </p>
              </div>

              {/* Feature 6: Live Webcams & Community */}
              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-mono-tactical font-bold text-xs">
                      6
                    </span>
                    <strong className="text-neutral-100 font-display-tactical text-sm">
                      Live Webcams, RSS Wire & Wessex Community Hub
                    </strong>
                  </div>
                  <button
                    onClick={() => handleNavigate('community')}
                    className="text-[11px] font-mono-tactical text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    Open Hub &rarr;
                  </button>
                </div>
                <p className="text-neutral-300 text-xs">
                  • <strong>Live Field Feeds:</strong> High-magnification optical sensor feeds focused across ancient downland escarpments, hillfort ramparts, and open chalk scarp pastures.<br />
                  • <strong>Community Skywatches:</strong> Join scheduled group watches at Barbury Castle, Hackpen Hill, and Ivinghoe Beacon.<br />
                  • <strong>Observer Roster:</strong> Register your custom callsign and badge level (Novice, Observer, Surveyor, BTO Ringer).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Navigation Quick Jump */}
        {activeSubTab === 'navigation' && (
          <div className="space-y-4 text-neutral-300 font-sans text-xs sm:text-sm leading-relaxed relative z-10 animate-fadeIn">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-1">
              <h3 className="font-display-tactical text-neutral-100 font-bold text-sm sm:text-base flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Instant Section Jump Shortcuts</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Click any tool below to immediately navigate to that section and dismiss this guide:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Shortcut: Radar Map */}
              <div
                onClick={() => handleNavigate('map')}
                className="bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 p-4 rounded-2xl transition-all cursor-pointer group flex items-start justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-400 font-display-tactical font-bold text-sm">
                    <MapIcon className="w-4 h-4" />
                    <span>Tactical Airspace Radar</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Live scarp thermal corridors, Google satellite layer, and sighting radar blips.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-amber-400 transition-colors shrink-0 mt-1" />
              </div>

              {/* Shortcut: Silhouette Key */}
              <div
                onClick={() => handleNavigate('silhouette')}
                className="bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 p-4 rounded-2xl transition-all cursor-pointer group flex items-start justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-display-tactical font-bold text-sm">
                    <Eye className="w-4 h-4" />
                    <span>Silhouette Field Key</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Diagnostic visual identification filter for wingspan, tail notch, and hunting flight.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 transition-colors shrink-0 mt-1" />
              </div>

              {/* Shortcut: Quiz */}
              <div
                onClick={() => handleNavigate('quiz')}
                className="bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 p-4 rounded-2xl transition-all cursor-pointer group flex items-start justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-purple-400 font-display-tactical font-bold text-sm">
                    <CheckSquare className="w-4 h-4" />
                    <span>Silhouette Drill Quiz</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Test and hone your recognition reflexes under timed downland conditions.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-purple-400 transition-colors shrink-0 mt-1" />
              </div>

              {/* Shortcut: Sighting Logger */}
              <div
                onClick={() => handleNavigate('sightings')}
                className="bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 p-4 rounded-2xl transition-all cursor-pointer group flex items-start justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-cyan-400 font-display-tactical font-bold text-sm">
                    <Radar className="w-4 h-4" />
                    <span>Sighting Logs & Audit Net</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Browse recent observations, corroborate contacts, and view audit timelines.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-cyan-400 transition-colors shrink-0 mt-1" />
              </div>

              {/* Shortcut: Dispatches */}
              <div
                onClick={() => handleNavigate('dispatches')}
                className="bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-rose-500/50 p-4 rounded-2xl transition-all cursor-pointer group flex items-start justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rose-400 font-display-tactical font-bold text-sm">
                    <Radio className="w-4 h-4" />
                    <span>Live Webcams & Dispatches</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Watch active raptor nests and regional Wiltshire bird study updates.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-rose-400 transition-colors shrink-0 mt-1" />
              </div>

              {/* Shortcut: Community */}
              <div
                onClick={() => handleNavigate('community')}
                className="bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 p-4 rounded-2xl transition-all cursor-pointer group flex items-start justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-400 font-display-tactical font-bold text-sm">
                    <Users className="w-4 h-4" />
                    <span>Wessex Community Hub</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Join group skywatches, view observer roster profiles, and exchange advice.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-amber-400 transition-colors shrink-0 mt-1" />
              </div>
            </div>

            {/* Quick Actions Strip */}
            <div className="pt-3 border-t border-neutral-800 flex flex-wrap items-center gap-2 font-mono-tactical text-xs">
              {onToggleLiteMode && (
                <button
                  onClick={() => {
                    tacticalAudio.playConfirmChime();
                    onClose();
                    onToggleLiteMode();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Switch to Field Scout Lite Mode</span>
                </button>
              )}

              {onOpenBetaFeedback && (
                <button
                  onClick={() => {
                    tacticalAudio.playRadarPing(800);
                    onClose();
                    onOpenBetaFeedback();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Submit Field Beta Feedback</span>
                </button>
              )}

              {onOpenLogin && (
                <button
                  onClick={() => {
                    tacticalAudio.playRadarPing(880);
                    onClose();
                    onOpenLogin();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-400" />
                  <span>Observer Callsign</span>
                </button>
              )}

              {onOpenContact && (
                <button
                  onClick={() => {
                    tacticalAudio.playRadarPing(850);
                    onClose();
                    onOpenContact();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Contact Station / Conservation Liaison</span>
                </button>
              )}

              {onOpenLogModal && (
                <button
                  onClick={() => {
                    tacticalAudio.playRadarPing(920);
                    onClose();
                    onOpenLogModal();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold flex items-center gap-1.5 cursor-pointer transition-colors ml-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Sighting</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Wildlife Law & Field Ethics */}
        {activeSubTab === 'ethics' && (
          <div className="space-y-4 text-neutral-300 font-sans text-xs sm:text-sm leading-relaxed relative z-10 animate-fadeIn">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-display-tactical font-bold text-sm sm:text-base">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <span>Wildlife & Countryside Act 1981 & Downland Field Protocol</span>
              </div>
              <p className="text-xs text-neutral-300">
                The chalk downlands and limestone escarpments of Southern England support critically vulnerable raptors and rare ground-nesting birds. All observers using RaptorLens must observe UK wildlife law and field birding ethics:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="bg-neutral-900/70 border border-neutral-800 p-4 rounded-2xl space-y-1.5">
                <strong className="text-neutral-100 font-display-tactical text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Schedule 1 Species Strict Protection &amp; Coordinate Fuzzing
                </strong>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Under the Wildlife and Countryside Act 1981, it is a criminal offence to intentionally or recklessly disturb Schedule 1 species (including Hen Harrier, Peregrine Falcon, Merlin, Osprey, and Goshawk) while building a nest, at or near a nest containing eggs or young, or to disturb dependent young. RaptorLens automatically fuzzes exact breeding coordinates to a 5–10km regional hectad grid to safeguard active eyries and breeding territories.
                </p>
              </div>

              <div className="bg-neutral-900/70 border border-neutral-800 p-4 rounded-2xl space-y-1.5">
                <strong className="text-neutral-100 font-display-tactical text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  150-Metre Stand-off From Roosts
                </strong>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Never approach active raptor roosts or downland beech clump nests. Use binoculars or a 30-70x spotting scope from established public rights of way (The Ridgeway, South Downs Way, Cotswold Way). Flushing wintering harriers or owls burns crucial energy.
                </p>
              </div>

              <div className="bg-neutral-900/70 border border-neutral-800 p-4 rounded-2xl space-y-1.5">
                <strong className="text-neutral-100 font-display-tactical text-xs flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-cyan-400" />
                  Ground-Nesting Birds (March to August)
                </strong>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Wessex chalk grasslands and Salisbury Plain host globally significant populations of Stone-curlews, Skylarks, Meadow Pipits, and Lapwings. Between 1 March and 31 July, dogs must be kept on short leads and observers must remain strictly on marked public rights of way.
                </p>
              </div>

              <div className="bg-neutral-900/70 border border-neutral-800 p-4 rounded-2xl space-y-1.5">
                <strong className="text-neutral-100 font-display-tactical text-xs flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-purple-400" />
                  Drone Prohibition Over Ancient Monuments
                </strong>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Recreational drone flights are strictly prohibited without prior permission over Scheduled Ancient Monuments (Barbury Castle, Avebury Henge, Silbury Hill, Bratton Camp). Low-flying UAVs cause raptors to panic, abandon hunts, or attack drones and suffer fatal wing strikes.
                </p>
              </div>

              <div className="bg-neutral-900/70 border border-neutral-800 p-4 rounded-2xl space-y-1.5 sm:col-span-2">
                <strong className="text-neutral-100 font-display-tactical text-xs flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  Salisbury Plain Military Byelaws (MoD SPTA)
                </strong>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  The Salisbury Plain Training Area is an active Ministry of Defence live-firing and tracked vehicle range. When red flags (by day) or red lamps (by night) are hoisted, danger areas are strictly closed to all public access. Observers must never stray from marked permissive byways or touch unexploded ordnance or military debris.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Copyright & GDPR Legal Architecture */}
        {activeSubTab === 'legal' && (
          <div className="space-y-4 text-neutral-300 font-sans text-xs sm:text-sm leading-relaxed relative z-10 animate-fadeIn">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-display-tactical text-base font-bold">
                <Scale className="w-5 h-5 text-rose-400" />
                <span>Intellectual Property &amp; Landscape Privacy Architecture</span>
              </div>
              <p className="text-neutral-300">
                To secure our automated optics feeds against unauthorized AI scraping while strictly complying with the UK Data Protection Act (GDPR) and ICO surveillance guidance, CHALK employs a two-tier legal and hardware defense model:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="bg-neutral-900/70 border border-neutral-800 p-4 rounded-2xl space-y-2">
                <strong className="text-neutral-100 font-display-tactical text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  1. Derivative Human-Authored Copyright
                </strong>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Pure unguided automated camera feeds risk falling into the public domain under UK and US copyright law. CHALK stations permanently burn real-time curated graphical telemetry, barometric lift indicators, azimuth reticles, and human field annotations into the video feed. Under Section 9(3) CDPA 1988, this composite work grants undisputed copyright ownership to CHALK.
                </p>
              </div>

              <div className="bg-neutral-900/70 border border-neutral-800 p-4 rounded-2xl space-y-2">
                <strong className="text-neutral-100 font-display-tactical text-xs flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  2. Hardware-Level 3D Privacy Masking
                </strong>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Operating telephoto optics across public countryside requires stringent privacy safeguards. Our station cameras employ onboard DSP privacy masking to occlude residential curtilages, farmsteads, and private gardens. Hardware tilt limiters enforce "The Skyline Rule," preventing ground-level surveillance of hikers or vehicles.
                </p>
              </div>

              <div className="bg-neutral-900/70 border border-neutral-800 p-4 rounded-2xl space-y-2 sm:col-span-2">
                <strong className="text-neutral-100 font-display-tactical text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  3. Terms of Service &amp; European Database Right (96/9/EC)
                </strong>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  All telemetry datasets, raptor arrival corridors, and stream feeds are protected under the European Database Directive and UK Copyright Law. Commercial scraping or unlicensed stream syndication is prohibited without written authorization from CHALK.
                </p>
              </div>
            </div>

            {onOpenLegal && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    tacticalAudio.playRadarPing(880);
                    onClose();
                    onOpenLegal();
                  }}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Scale className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Full Governance &amp; Compliance Dossier &rarr;</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800/90 relative z-10 font-mono-tactical text-xs">
          <span className="text-neutral-400 text-[11px] hidden sm:inline">
            Press ESC or click close to return to active radar
          </span>

          <div className="flex items-center gap-2 ml-auto">
            {onOpenDonate && (
              <button
                onClick={() => {
                  tacticalAudio.playRadarPing(900);
                  onClose();
                  onOpenDonate();
                }}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Support RSPB, Wiltshire Wildlife Trust & UK Raptor Charities"
              >
                <HeartHandshake className="w-4 h-4 text-emerald-400" />
                <span>Wildlife Charities</span>
              </button>
            )}

            <button
              onClick={() => {
                tacticalAudio.playConfirmChime();
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              Resume Skywatch &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
