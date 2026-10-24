import React, { useState, useEffect } from 'react';
import { ObserverProfile, ExperienceLevel, ObserverBadge } from '../types/community';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  Camera, 
  MapPin, 
  HelpCircle, 
  Compass, 
  Eye, 
  Lock, 
  Zap, 
  RefreshCw,
  Info,
  UserCheck
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

interface ObserverRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (profile: ObserverProfile) => void;
  existingProfile?: ObserverProfile | null;
  currentCallsign: string;
}

// Field Ornithology Anti-Bot Challenges (Natural CAPTCHA)
interface AntiBotQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  hint: string;
}

const FIELD_CHALLENGES: AntiBotQuestion[] = [
  {
    id: 'q-forked-tail',
    question: 'Which raptor has a deeply forked V-shaped tail frequently seen circling over the Ridgeway?',
    options: ['Red Kite', 'Mallard Duck', 'Canada Goose'],
    correctAnswer: 'Red Kite',
    hint: 'Famous for its russet plumage and acrobatic rudder-like tail.',
  },
  {
    id: 'q-hovering',
    question: 'Which small Wessex falcon is famous for hovering completely motionless facing directly into the wind?',
    options: ['Common Kestrel', 'Ostrich', 'Mute Swan'],
    correctAnswer: 'Common Kestrel',
    hint: 'Also known historically as the "windhover".',
  },
  {
    id: 'q-eyes-count',
    question: 'How many forward-facing or lateral eyes does a wild bird of prey possess?',
    options: ['2', '6', '12'],
    correctAnswer: '2',
    hint: 'Raptors possess binocular vision powered by 2 large eyes.',
  },
  {
    id: 'q-barbury-landmark',
    question: 'What type of ancient historic monument provides panoramic raptor vistas at Barbury Castle?',
    options: ['Iron Age Hillfort & Ramparts', 'Modern Skyscraper', 'Airport Runway'],
    correctAnswer: 'Iron Age Hillfort & Ramparts',
    hint: 'Dating back over 2,500 years with deep chalk ditches and earthen banks.',
  },
  {
    id: 'q-buzzard-diet',
    question: 'What do Common Buzzards and Kestrels primarily hunt on the chalk downland grasslands?',
    options: ['Small voles & rodents', 'Plastic bottles', 'Fast food'],
    correctAnswer: 'Small voles & rodents',
    hint: 'Field voles (Microtus agrestis) are a staple prey.',
  },
];

const CALLSIGN_PRESETS = [
  'BARBURY-MERLIN',
  'HACKPEN-HARRIER',
  'AVEBURY-KESTREL',
  'RIDGEWAY-SCOUT',
  'CHALK-FALCON',
  'FYFIELD-BUZZARD',
  'WESSEX-EAGLE',
];

export const ObserverRegistrationModal: React.FC<ObserverRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegister,
  existingProfile,
  currentCallsign,
}) => {
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

  // Mount time for bot velocity detection (bots submit in < 1 second)
  const [mountTime, setMountTime] = useState<number>(Date.now());

  // Form Fields
  const [fullName, setFullName] = useState(existingProfile?.fullName || '');
  const [callsign, setCallsign] = useState(existingProfile?.callsign || currentCallsign || '');
  const [contactEmail, setContactEmail] = useState(existingProfile?.contactEmail || '');
  const [passcode, setPasscode] = useState(existingProfile?.passcode || '');
  const [showPasscode, setShowPasscode] = useState(false);
  const [homeHotspot, setHomeHotspot] = useState(existingProfile?.homeHotspot || 'Barbury Castle Country Park');
  
  // Experience Tracking
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    existingProfile?.experienceLevel || 'Intermediate Field Spotter'
  );
  const [yearsExperience, setYearsExperience] = useState<number>(existingProfile?.yearsExperience ?? 3);
  const [opticsGear, setOpticsGear] = useState(existingProfile?.opticsGear || 'Vortex Diamondback HD 8x42');
  const [affiliation, setAffiliation] = useState(existingProfile?.affiliation || 'Independent Wessex Scout');
  const [specialties, setSpecialties] = useState<string[]>(
    existingProfile?.specialties || ['Flight Silhouette Identification', 'Thermal Soaring Dynamics']
  );
  const [bio, setBio] = useState(
    existingProfile?.bio || 'Active downland observer monitoring raptor movements across the Ridgeway scarp.'
  );

  // Anti-Bot Defence States
  const [honeypotValue, setHoneypotValue] = useState(''); // Hidden trap field
  const [activeChallengeIdx, setActiveChallengeIdx] = useState(0);
  const [userChallengeAnswer, setUserChallengeAnswer] = useState('');
  const [attestationChecked, setAttestationChecked] = useState(false);
  const [botAlert, setBotAlert] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);

  // Reset timestamp and challenge on open
  useEffect(() => {
    if (isOpen) {
      setMountTime(Date.now());
      setBotAlert(null);
      setUserChallengeAnswer('');
      setHoneypotValue('');
      setFullName(existingProfile?.fullName || '');
      setCallsign(existingProfile?.callsign || currentCallsign || '');
      setContactEmail(existingProfile?.contactEmail || '');
      setPasscode(existingProfile?.passcode || '');
      // Pick random challenge
      setActiveChallengeIdx(Math.floor(Math.random() * FIELD_CHALLENGES.length));
    }
  }, [isOpen, existingProfile, currentCallsign]);

  if (!isOpen) return null;

  const currentChallenge = FIELD_CHALLENGES[activeChallengeIdx];

  const handleShuffleChallenge = () => {
    tacticalAudio.playRadarPing(800);
    setActiveChallengeIdx((prev) => (prev + 1) % FIELD_CHALLENGES.length);
    setUserChallengeAnswer('');
    setBotAlert(null);
  };

  const handleGenerateCallsign = () => {
    tacticalAudio.playRadarPing(900);
    const prefix = CALLSIGN_PRESETS[Math.floor(Math.random() * CALLSIGN_PRESETS.length)];
    const num = Math.floor(10 + Math.random() * 89);
    setCallsign(`${prefix}-${num}`);
  };

  const toggleSpecialty = (spec: string) => {
    setSpecialties((prev) => 
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  // Derive verified badge based on experience
  const deriveBadge = (level: ExperienceLevel): ObserverBadge => {
    switch (level) {
      case 'Raptor Specialist / BTO Ringer':
        return 'Raptor Specialist';
      case 'Seasoned Chalkland Scout':
        return 'Chalkland Thermal Scout';
      case 'Intermediate Field Spotter':
        return 'Barbury Regular';
      case 'Downland Walker & Nature Photographer':
        return 'Downland Walker & Photographer';
      case 'Armchair Watcher & Webcam Supporter':
        return 'Armchair Observer';
      case 'Novice Skywatcher / Nature Learner':
      default:
        return 'Novice Skywatcher';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBotAlert(null);

    // ANTI-BOT DEFENCE LAYER 1: Honeypot Trap
    if (honeypotValue.trim() !== '') {
      console.warn('Bot detected via honeypot trap field');
      setBotAlert('Security rejection: Automated bot crawler detected via honeypot trap.');
      return;
    }

    // ANTI-BOT DEFENCE LAYER 2: Velocity Check (Human typing speed heuristic)
    const elapsedSeconds = (Date.now() - mountTime) / 1000;
    if (elapsedSeconds < 2.5) {
      console.warn(`Submission rejected: Velocity too fast (${elapsedSeconds.toFixed(1)}s)`);
      setBotAlert('Velocity check triggered: Registration completed too quickly for human input. Please review and retry.');
      return;
    }

    // ANTI-BOT DEFENCE LAYER 3: Natural Field Knowledge Verification
    if (userChallengeAnswer !== currentChallenge.correctAnswer) {
      setBotAlert('Field Verification incorrect: Please answer the raptor question correctly to confirm you are human.');
      return;
    }

    // ANTI-BOT DEFENCE LAYER 4: Human Attestation
    if (!attestationChecked) {
      setBotAlert('Please check the human observer attestation box.');
      return;
    }

    if (!callsign.trim() || !fullName.trim()) {
      setBotAlert('Please provide both your Observer Name and a valid Callsign.');
      return;
    }

    setIsSubmitting(true);
    tacticalAudio.playConfirmChime();

    // Map hotspot ID
    const hotspotId = homeHotspot.toLowerCase().includes('barbury')
      ? 'barbury-castle'
      : homeHotspot.toLowerCase().includes('hackpen')
      ? 'hackpen-hill'
      : homeHotspot.toLowerCase().includes('avebury')
      ? 'avebury-henge'
      : homeHotspot.toLowerCase().includes('fyfield')
      ? 'fyfield-down'
      : homeHotspot.toLowerCase().includes('fowlmere')
      ? 'fowlmere-reserve'
      : 'barbury-castle';

    const avatarGradients = [
      'from-amber-600 to-amber-800',
      'from-emerald-600 to-teal-800',
      'from-cyan-600 to-blue-800',
      'from-purple-600 to-indigo-800',
      'from-rose-600 to-pink-800',
    ];
    const avatarColor = existingProfile?.avatarColor || avatarGradients[Math.floor(Math.random() * avatarGradients.length)];

    const newProfile: ObserverProfile = {
      id: existingProfile?.id || `obs-${Date.now()}`,
      callsign: callsign.trim().toUpperCase(),
      fullName: fullName.trim(),
      contactEmail: contactEmail.trim(),
      passcode: passcode.trim() || undefined,
      badge: deriveBadge(experienceLevel),
      experienceLevel,
      yearsExperience: Number(yearsExperience) || 1,
      affiliation: affiliation.trim(),
      specialties,
      homeHotspot,
      hotspotId,
      sightingsCount: existingProfile?.sightingsCount ?? 1,
      verified: true,
      isHumanVerified: true,
      opticsGear: opticsGear.trim() || 'Binoculars 8x42',
      bio: bio.trim() || 'Active Wessex Downs raptor observer.',
      joinedDate: existingProfile?.joinedDate || 'September 2026',
      avatarColor,
    };

    setTimeout(() => {
      onRegister(newProfile);
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div 
      ref={scrollContainerRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/85 backdrop-blur-md p-3 sm:p-4 flex justify-center items-start overscroll-contain"
    >
      <div className="relative w-full max-w-2xl bg-neutral-950/95 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden font-sans my-4 sm:my-8 mb-16 sm:mb-24">
        
        {/* Header with Anti-Bot Shield Status */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 p-5 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-tactical font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-widest flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-amber-400" />
                COMMUNITY ENROLMENT
              </span>
              <span className="text-[10px] font-mono-tactical text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Anti-Bot Defence Active
              </span>
            </div>
            <h2 className="font-display-tactical text-xl font-bold text-neutral-100 tracking-tight">
              {existingProfile ? 'Update Observer Credentials' : 'Join the Wessex Observer Collective'}
            </h2>
            <p className="text-xs text-neutral-300 font-sans mt-0.5">
              Open to everyone — webcam watchers, downland walkers, nature learners, and field observers alike.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowSecurityInfo(!showSecurityInfo)}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-400 text-xs font-mono-tactical flex items-center gap-1 cursor-pointer transition-colors"
              title="How Wessex protects the site from automated bots"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline text-[11px]">Anti-Bot Shield</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 flex items-center justify-center cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Welcoming Inclusive Callout - No Logging Required */}
        <div className="bg-amber-500/10 border-b border-amber-500/30 p-4 px-5 flex items-start gap-3 text-xs text-amber-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-300 block font-mono-tactical uppercase tracking-wider text-[11px]">
              ★ Open to Everyone — No Sighting Logging Required!
            </span>
            <p className="text-neutral-300 font-sans leading-relaxed text-[11px]">
              You do <strong>not</strong> need to record field sightings or own high-end optics to be part of RaptorLens! You can join to chat on the field forum, RSVP to group walks on the Ridgeway, follow live nest webcams, or simply learn UK raptor identification.
            </p>
          </div>
        </div>

        {/* Anti-Bot Explanation Banner (Toggleable) */}
        {showSecurityInfo && (
          <div className="bg-emerald-950/40 border-b border-emerald-900/60 p-4 font-mono-tactical text-xs text-emerald-200 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>How We Stop Bots & Automated Crawlers (Without Ad Cookies)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-100/90 font-sans">
              To keep our community genuine and free of spam scripts:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-emerald-800/40">
                <strong className="text-amber-400 block mb-1">1. Invisible Honeypot</strong>
                Hidden form traps that bots automatically fill, immediately disqualifying scrapers.
              </div>
              <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-emerald-800/40">
                <strong className="text-cyan-400 block mb-1">2. Raptor Knowledge</strong>
                Natural human questions about Wiltshire raptors that automated scripts cannot answer.
              </div>
              <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-emerald-800/40">
                <strong className="text-emerald-400 block mb-1">3. Human Velocity</strong>
                Submissions faster than human typing thresholds are automatically blocked.
              </div>
            </div>
          </div>
        )}

        {/* Error / Bot Alert */}
        {botAlert && (
          <div className="bg-rose-950/80 border-b border-rose-800/80 p-3.5 px-5 flex items-center gap-2.5 text-rose-200 text-xs font-mono-tactical animate-shake">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{botAlert}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* ========================================================== */}
          {/* ANTI-BOT HONEYPOT TRAP FIELD (Invisible to humans, visible to bots) */}
          {/* ========================================================== */}
          <div 
            style={{ 
              position: 'absolute', 
              left: '-9999px', 
              top: '-9999px', 
              opacity: 0, 
              height: '1px', 
              width: '1px', 
              overflow: 'hidden', 
              pointerEvents: 'none' 
            }}
            aria-hidden="true"
          >
            <label htmlFor="website_url_hp">Do not fill this field if you are human</label>
            <input
              id="website_url_hp"
              type="text"
              name="website_url_hp"
              tabIndex={-1}
              autoComplete="off"
              value={honeypotValue}
              onChange={(e) => setHoneypotValue(e.target.value)}
            />
          </div>

          {/* SECTION 1: IDENTITY & CALLSIGN */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono-tactical uppercase tracking-wider text-amber-400 font-bold border-b border-neutral-800 pb-1.5">
              <Award className="w-4 h-4" />
              <span>1. Observer Identity & Tactical Callsign</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono-tactical text-neutral-300 block mb-1 font-semibold">
                  FULL NAME / DISPLAY NAME <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Arthur Pendelton or Sarah J."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono-tactical text-neutral-300 font-semibold">
                    OBSERVER CALLSIGN <span className="text-amber-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateCallsign}
                    className="text-[10px] font-mono-tactical text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. BARBURY-HAWK-7"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-amber-300 font-mono focus:outline-none focus:border-amber-500 transition-colors uppercase font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono-tactical text-neutral-300 font-semibold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>PASSWORD / FIELD PIN</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPasscode((prev) => !prev)}
                    className="text-[10px] font-mono-tactical text-neutral-400 hover:text-amber-300 cursor-pointer"
                  >
                    {showPasscode ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPasscode ? 'text' : 'password'}
                  placeholder="Create a password or 4-6 digit PIN"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 font-mono focus:outline-none focus:border-amber-500 transition-colors"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Protects your observer callsign across devices. Forgot it? Reset anytime in Sign In.
                </span>
              </div>

              <div>
                <label className="text-xs font-mono-tactical text-neutral-300 block mb-1 font-semibold">
                  CONTACT EMAIL (FOR PASSWORD RECOVERY)
                </label>
                <input
                  type="email"
                  placeholder="observer@wessexraptors.uk"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Used for 1-click password recovery &amp; skywatch alerts; never shared publicly.
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono-tactical text-neutral-300 block mb-1 font-semibold">
                PRIMARY HOME RIDGEWAY SECTOR
              </label>
              <select
                value={homeHotspot}
                onChange={(e) => setHomeHotspot(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="Barbury Castle Country Park">Barbury Castle Country Park (Chalk Ramparts)</option>
                <option value="Hackpen Hill & White Horse">Hackpen Hill & White Horse (Scarp Thermals)</option>
                <option value="Avebury Henge & Stone Circle">Avebury Henge & Stone Circle (Megalith Corridors)</option>
                <option value="Fyfield Down Nature Reserve">Fyfield Down Nature Reserve (Sarsen Valleys)</option>
                <option value="Silbury Hill & Kennet Basin">Silbury Hill & Kennet Basin (River Corridors)</option>
                <option value="RSPB Fowlmere Nature Reserve">RSPB Fowlmere Nature Reserve (Chalk Springlines)</option>
                <option value="Ridgeway Trail Mobile Scout">Ridgeway Trail Mobile Scout (Full Escarpment)</option>
              </select>
            </div>
          </div>

          {/* SECTION 2: EXPERIENCE REGISTRATION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono-tactical uppercase tracking-wider text-amber-400 font-bold border-b border-neutral-800 pb-1.5">
              <Compass className="w-4 h-4" />
              <span>2. Register Field Experience & Optics Profile</span>
            </div>

            {/* Experience Level Selector */}
            <div>
              <label className="text-xs font-mono-tactical text-neutral-300 block mb-2 font-semibold">
                YOUR EXPERIENCE TIER (COMMUNITY BADGE ISSUED ACCORDINGLY)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    tier: 'Armchair Watcher & Webcam Supporter' as ExperienceLevel,
                    years: 'Home & Web',
                    desc: 'Enjoys following CAM 01 live dispatches, nest cams, and supporting UK raptors from home.',
                    badge: 'Armchair Observer',
                    color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300',
                  },
                  {
                    tier: 'Downland Walker & Nature Photographer' as ExperienceLevel,
                    years: 'Outdoor walks',
                    desc: 'Enjoys walking the Ridgeway trail scarp, capturing landscape photos, and spotting wildlife.',
                    badge: 'Downland Walker & Photographer',
                    color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
                  },
                  {
                    tier: 'Novice Skywatcher / Nature Learner' as ExperienceLevel,
                    years: '0–1 years',
                    desc: 'Curious nature lover learning flight silhouettes, thermals, and local downland species.',
                    badge: 'Novice Skywatcher',
                    color: 'border-blue-500/40 bg-blue-950/20 text-blue-300',
                  },
                  {
                    tier: 'Intermediate Field Spotter' as ExperienceLevel,
                    years: '1–3 years',
                    desc: 'Confident identifying common Wessex raptors (Buzzard, Kestrel, Red Kite, Sparrowhawk).',
                    badge: 'Barbury Regular',
                    color: 'border-amber-500/40 bg-amber-950/20 text-amber-300',
                  },
                  {
                    tier: 'Seasoned Chalkland Scout' as ExperienceLevel,
                    years: '3–7 years',
                    desc: 'Proficient in thermal speck ID, hunting styles, flight silhouettes, and seasonal passage.',
                    badge: 'Chalkland Thermal Scout',
                    color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
                  },
                  {
                    tier: 'Raptor Specialist / BTO Ringer' as ExperienceLevel,
                    years: '7+ years',
                    desc: 'Schedule 1 nest monitor, licensed BTO bird ringer, scientific researcher, or veteran.',
                    badge: 'Raptor Specialist',
                    color: 'border-purple-500/40 bg-purple-950/20 text-purple-300',
                  },
                ].map((item) => (
                  <div
                    key={item.tier}
                    onClick={() => {
                      tacticalAudio.playRadarPing(850);
                      setExperienceLevel(item.tier);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      experienceLevel === item.tier
                        ? 'border-amber-500 bg-amber-500/15 shadow-md shadow-amber-500/10'
                        : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-display-tactical text-xs font-bold text-neutral-100">
                          {item.tier}
                        </span>
                        <span className="text-[10px] font-mono-tactical text-neutral-400">
                          {item.years}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
                        {item.desc}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] font-mono-tactical">
                      <span className="text-neutral-400">Badge Earned:</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${item.color}`}>
                        {item.badge}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exact Years & Optics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-mono-tactical text-neutral-300 block mb-1 font-semibold">
                  YEARS RAPTOR WATCHING
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <span className="text-xs font-mono-tactical text-neutral-400">Years</span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono-tactical text-neutral-300 font-semibold flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>PRIMARY GEAR / OPTICS (OPTIONAL)</span>
                  </label>
                  <span className="text-[10px] text-neutral-400 font-mono-tactical">Optional</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. None / Armchair, Smartphone, Nikon 8x42, or Swarovski 10x42"
                  value={opticsGear}
                  onChange={(e) => setOpticsGear(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1 mt-1.5 text-[10px] font-mono-tactical">
                  {[
                    'None / Armchair Observer',
                    'Smartphone / Naked Eye',
                    'Camera & Telephoto Lens',
                    'Binoculars (8x42)',
                    'Spotting Scope'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setOpticsGear(preset)}
                      className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-amber-300 cursor-pointer transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Affiliations & Organisations */}
            <div>
              <label className="text-xs font-mono-tactical text-neutral-300 block mb-1 font-semibold">
                CONSERVATION OR INTEREST AFFILIATION
              </label>
              <select
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="Independent Observer / Armchair Watcher">Independent Observer / Armchair Watcher (Webcam Enthusiast)</option>
                <option value="Downland Walker & Nature Lover">Downland Walker / Nature Enthusiast (Walking & Photos)</option>
                <option value="Independent Wessex Scout">Independent Wessex Scout / Field Naturalist</option>
                <option value="Wiltshire Ornithological Society (WOS)">Wiltshire Ornithological Society (WOS)</option>
                <option value="British Trust for Ornithology (BTO)">British Trust for Ornithology (BTO Volunteer / Surveyor)</option>
                <option value="RSPB Local Group (Swindon / Wiltshire)">RSPB Local Group (Swindon / Wiltshire)</option>
                <option value="Wessex Raptor Study Group">Wessex Raptor Study Group</option>
                <option value="Cambridgeshire Bird Club / RSPB Volunteer">Cambridgeshire Bird Club / RSPB Volunteer</option>
                <option value="Hawk and Owl Trust">Hawk and Owl Trust</option>
                <option value="Wiltshire Wildlife Trust">Wiltshire Wildlife Trust</option>
                <option value="National Trust Ridgeway Volunteer">National Trust Ridgeway Ranger / Volunteer</option>
              </select>
            </div>

            {/* Specialities Badges */}
            <div>
              <label className="text-xs font-mono-tactical text-neutral-300 block mb-1.5 font-semibold">
                INTERESTS & OBSERVATION SPECIALITIES (SELECT ALL THAT APPLY)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Live Webcam Monitoring & Dispatches',
                  'Downland Walks & Scenery',
                  'Raptor & Flight Photography',
                  'Flight Silhouette Identification',
                  'Thermal Soaring Dynamics',
                  'Winter Hen Harrier Roosts',
                  'Peregrine Stoop Velocity Timing',
                  'Hobby Dragonfly Hunting',
                  'Barn Owl Dusk Surveys',
                  'Acoustic Call Recognition',
                  'Schedule 1 Ethical Monitoring',
                ].map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialty(spec)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono-tactical cursor-pointer transition-all border ${
                      specialties.includes(spec)
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {specialties.includes(spec) ? '✓ ' : '+ '}
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-xs font-mono-tactical text-neutral-300 block mb-1 font-semibold">
                OBSERVER FIELD BIO / PROFILE SUMMARY
              </label>
              <textarea
                rows={2}
                placeholder="Briefly describe your regular vantages, raptor interests, and favourite Ridgeway sightings..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 resize-none font-sans"
              />
            </div>
          </div>

          {/* ========================================================== */}
          {/* SECTION 3: ANTI-BOT HUMAN VERIFICATION CHALLENGE */}
          {/* ========================================================== */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono-tactical font-bold text-neutral-200 uppercase tracking-wide">
                  3. Anti-Bot Human Verification Challenge
                </span>
              </div>
              <button
                type="button"
                onClick={handleShuffleChallenge}
                className="text-[11px] font-mono-tactical text-neutral-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
                title="Load another field verification question"
              >
                <RefreshCw className="w-3 h-3" /> Different Question
              </button>
            </div>

            <p className="text-xs text-neutral-300 font-sans">
              To defend our observer registry against spam bots and fake profiles, please select the correct answer:
            </p>

            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-3">
              <p className="text-sm font-semibold text-neutral-100 font-sans">
                {currentChallenge.question}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {currentChallenge.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      tacticalAudio.playRadarPing(900);
                      setUserChallengeAnswer(opt);
                      setBotAlert(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-mono-tactical font-semibold text-center cursor-pointer transition-all border ${
                      userChallengeAnswer === opt
                        ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-neutral-100'
                    }`}
                  >
                    {userChallengeAnswer === opt && '✓ '}
                    {opt}
                  </button>
                ))}
              </div>

              <div className="text-[10px] font-mono-tactical text-neutral-400 flex items-center gap-1 pt-1">
                <Info className="w-3 h-3 text-amber-400" />
                <span>Field Hint: {currentChallenge.hint}</span>
              </div>
            </div>

            {/* Human Attestation Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-neutral-300 font-sans select-none">
                <input
                  type="checkbox"
                  checked={attestationChecked}
                  onChange={(e) => setAttestationChecked(e.target.checked)}
                  className="mt-0.5 accent-amber-500 w-4 h-4 rounded cursor-pointer shrink-0"
                />
                <span>
                  <strong>I attest that I am an authentic human observer</strong> and pledge to respect the Wiltshire Ridgeway ethical standoff protocol (no disturbance of active nests or Schedule 1 roosts).
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-neutral-800">
            <div className="text-[11px] font-mono-tactical text-neutral-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Protected by Wessex Scout Anti-Bot Net</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-neutral-200 text-xs font-mono-tactical cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display-tactical font-bold text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-neutral-950" />
                <span>{existingProfile ? 'Update Scout Credentials' : 'Verify & Register Observer'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
