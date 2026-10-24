import React, { useState } from 'react';
import { ObserverProfile } from '../types/community';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  LogIn, 
  LogOut, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  UserPlus,
  ArrowRight,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  observers: ObserverProfile[];
  currentCallsign: string;
  onSelectObserver: (profile: ObserverProfile) => void;
  onLoginCustomCallsign: (callsign: string, homeHotspot?: string) => void;
  onResetObserverPassword?: (updatedProfile: ObserverProfile) => void;
  onLogoutToGuest: () => void;
  onOpenRegistration: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  observers,
  currentCallsign,
  onSelectObserver,
  onLoginCustomCallsign,
  onResetObserverPassword,
  onLogoutToGuest,
  onOpenRegistration,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'custom' | 'reset'>('roster');
  const [callsignInput, setCallsignInput] = useState('');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password Reset / Recovery states
  const [resetCallsign, setResetCallsign] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetChallengeAnswer, setResetChallengeAnswer] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showNewPasscode, setShowNewPasscode] = useState(false);

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
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const currentProfile = observers.find((o) => o.callsign === currentCallsign) || null;

  const handleCustomLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const cleanInput = callsignInput.trim();
    if (!cleanInput) {
      setErrorMsg('Please enter your observer callsign or registered email.');
      return;
    }

    // Match by Callsign OR by Contact Email
    const existing = observers.find(
      (o) =>
        o.callsign.toUpperCase() === cleanInput.toUpperCase() ||
        (o.contactEmail && o.contactEmail.toLowerCase() === cleanInput.toLowerCase())
    );

    if (existing) {
      // If observer has a password set, verify it
      if (existing.passcode && existing.passcode.trim() !== '') {
        if (passcodeInput.trim() !== existing.passcode.trim()) {
          setErrorMsg(
            `Incorrect password/PIN for ${existing.callsign}. Click "Forgot or Change Password?" below to reset it.`
          );
          return;
        }
      } else if (passcodeInput.trim() !== '' && onResetObserverPassword) {
        // Observer didn't have a password yet, save the newly entered password to their profile
        const updated = { ...existing, passcode: passcodeInput.trim() };
        onResetObserverPassword(updated);
      }

      tacticalAudio.playConfirmChime();
      onSelectObserver(existing);
      onClose();
      return;
    }

    // If new callsign entered with passcode
    tacticalAudio.playConfirmChime();
    onLoginCustomCallsign(cleanInput.toUpperCase(), 'Barbury Castle Country Park');
    onClose();
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const targetCallsign = resetCallsign.trim().toUpperCase();
    if (!targetCallsign) {
      setErrorMsg('Please enter or select the Observer Callsign you want to reset.');
      return;
    }

    const targetObserver = observers.find(
      (o) =>
        o.callsign.toUpperCase() === targetCallsign ||
        (o.contactEmail && o.contactEmail.toLowerCase() === resetCallsign.trim().toLowerCase())
    );

    if (!targetObserver) {
      setErrorMsg(`No observer found with callsign "${targetCallsign}". You can register a new profile below.`);
      return;
    }

    // Verification: Check either matching registered email OR correct field security challenge
    const emailMatches =
      targetObserver.contactEmail &&
      resetEmail.trim() !== '' &&
      targetObserver.contactEmail.toLowerCase() === resetEmail.trim().toLowerCase();

    const challengeMatches = resetChallengeAnswer === 'Red Kite';

    if (!emailMatches && !challengeMatches) {
      setErrorMsg(
        'Verification required: Please either enter your matching registered email address OR select the correct answer to the Wessex Raptor security question below.'
      );
      return;
    }

    if (!newPasscode.trim() || newPasscode.trim().length < 4) {
      setErrorMsg('Please enter a new password or PIN (at least 4 characters).');
      return;
    }

    if (newPasscode.trim() !== confirmPasscode.trim()) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }

    const updatedProfile: ObserverProfile = {
      ...targetObserver,
      passcode: newPasscode.trim(),
      contactEmail: resetEmail.trim() || targetObserver.contactEmail,
    };

    tacticalAudio.playConfirmChime();
    if (onResetObserverPassword) {
      onResetObserverPassword(updatedProfile);
    } else {
      onSelectObserver(updatedProfile);
    }

    setSuccessMsg(`Password updated for ${updatedProfile.callsign}! Signing you in...`);
    setTimeout(() => {
      onSelectObserver(updatedProfile);
      onClose();
    }, 900);
  };

  const handleSelectPredefined = (obs: ObserverProfile) => {
    if (obs.passcode && obs.passcode.trim() !== '' && obs.callsign !== currentCallsign) {
      // Prompt for their password in the Callsign & Passcode tab
      setCallsignInput(obs.callsign);
      setPasscodeInput('');
      setActiveTab('custom');
      setErrorMsg(`Please enter your password/PIN for ${obs.callsign} (or click "Forgot or Change Password?").`);
      return;
    }
    tacticalAudio.playConfirmChime();
    onSelectObserver(obs);
    onClose();
  };

  const handleLogout = () => {
    tacticalAudio.playRadarPing(600);
    onLogoutToGuest();
    onClose();
  };

  return (
    <div 
      ref={scrollContainerRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/80 backdrop-blur-md p-3 sm:p-4 flex justify-center items-start overscroll-contain"
    >
      <div className="relative w-full max-w-xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 font-mono-tactical">
        {/* Header */}
        <div className="bg-neutral-900/90 border-b border-neutral-800 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                  OBSERVER AUTHENTICATION &amp; RECOVERY
                </span>
              </div>
              <h3 className="font-display-tactical text-lg sm:text-xl font-bold text-neutral-100">
                Wessex Observer Portal
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Observer Banner */}
        <div className="bg-neutral-900/60 border-b border-neutral-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold font-mono">
              {currentCallsign.slice(0, 2)}
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">CURRENT LOGGED IN IDENTITY:</span>
              <div className="flex items-center gap-1.5 font-bold text-neutral-200">
                <span className="text-amber-400">{currentCallsign}</span>
                {currentProfile ? (
                  <span className="text-[10px] text-emerald-400 font-normal flex items-center gap-0.5">
                    • {currentProfile.fullName} ({currentProfile.experienceLevel || 'Verified Scout'})
                  </span>
                ) : (
                  <span className="text-[10px] text-neutral-400 font-normal">• Field Scout</span>
                )}
              </div>
            </div>
          </div>

          {currentCallsign !== 'GUEST-SCOUT' && (
            <button
              onClick={handleLogout}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-rose-400 text-[11px] flex items-center gap-1 cursor-pointer transition-colors self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out to Guest
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/40 text-xs">
          <button
            onClick={() => {
              tacticalAudio.playRadarPing(880);
              setActiveTab('roster');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3 px-2 sm:px-3 text-center font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'roster'
                ? 'text-amber-400 border-b-2 border-amber-500 bg-neutral-900/70'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>Select Observer</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(880);
              setActiveTab('custom');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3 px-2 sm:px-3 text-center font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'custom'
                ? 'text-amber-400 border-b-2 border-amber-500 bg-neutral-900/70'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <KeyRound className="w-4 h-4 shrink-0" />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(880);
              if (callsignInput && !resetCallsign) {
                setResetCallsign(callsignInput.toUpperCase());
              } else if (currentCallsign !== 'GUEST-SCOUT' && !resetCallsign) {
                setResetCallsign(currentCallsign);
              }
              setActiveTab('reset');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3 px-2 sm:px-3 text-center font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'reset'
                ? 'text-amber-400 border-b-2 border-amber-500 bg-neutral-900/70'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span>Reset Password</span>
          </button>
        </div>

        {/* Tab 1: Pre-registered Scouts Roster */}
        {activeTab === 'roster' && (
          <div className="p-4 sm:p-5 space-y-3">
            <p className="text-[11px] text-neutral-400 mb-2">
              Select your registered observer profile to sign in and stamp all field sightings with your verified credentials:
            </p>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {observers.map((obs) => {
                const isActive = obs.callsign === currentCallsign;
                return (
                  <div
                    key={obs.id}
                    onClick={() => handleSelectPredefined(obs)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/70 ring-1 ring-amber-500/50'
                        : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${obs.avatarColor} flex items-center justify-center text-neutral-100 font-bold font-display-tactical text-sm shadow shrink-0`}>
                        {obs.callsign.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-neutral-100">{obs.callsign}</span>
                          {obs.isHumanVerified && (
                            <span className="flex items-center gap-0.5 text-[9px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/40">
                              <ShieldCheck className="w-2.5 h-2.5" /> Verified
                            </span>
                          )}
                          {obs.passcode && (
                            <span className="flex items-center gap-0.5 text-[9px] text-amber-300 bg-amber-950/70 px-1.5 py-0.2 rounded border border-amber-500/30">
                              <Lock className="w-2.5 h-2.5" /> PIN Protected
                            </span>
                          )}
                          {isActive && (
                            <span className="text-[9px] text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/40">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate">
                          {obs.fullName} • <span className="text-neutral-300">{obs.experienceLevel || obs.badge}</span>
                        </div>
                        <div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-0.5">
                          <span className="text-amber-400">{obs.sightingsCount} logged</span>
                          <span>•</span>
                          <span className="truncate">{obs.homeHotspot}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                        isActive
                          ? 'bg-amber-500 text-neutral-950'
                          : 'bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-200'
                      }`}
                    >
                      {isActive ? 'Current' : 'Sign In'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Custom Callsign & Passcode */}
        {activeTab === 'custom' && (
          <form onSubmit={handleCustomLoginSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs space-y-2">
                <div>{errorMsg}</div>
                <button
                  type="button"
                  onClick={() => {
                    setResetCallsign(callsignInput.trim().toUpperCase());
                    setErrorMsg(null);
                    setActiveTab('reset');
                  }}
                  className="text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Reset or Change Password Now →
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-neutral-300 font-bold block">OBSERVER CALLSIGN OR REGISTERED EMAIL</label>
              <input
                type="text"
                placeholder="e.g. BARBURY-HAWK-7 or observer@email.com"
                value={callsignInput}
                onChange={(e) => setCallsignInput(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
                required
              />
              <span className="text-[10px] text-neutral-400">
                Enter your Wessex tactical callsign or the email address you registered with.
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-neutral-300 font-bold">PASSWORD / FIELD SECURITY PIN</label>
                <button
                  type="button"
                  onClick={() => {
                    tacticalAudio.playRadarPing(850);
                    if (callsignInput) setResetCallsign(callsignInput.trim().toUpperCase());
                    setErrorMsg(null);
                    setActiveTab('reset');
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline underline-offset-2 cursor-pointer"
                >
                  Forgot or Change Password?
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-neutral-400">
                Protects your observer logbook and credentials across devices.
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-0"
                />
                <span>Remember session on this device</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-display-tactical text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition-all"
            >
              <LogIn className="w-4 h-4" /> Sign In to Field Net
            </button>
          </form>
        )}

        {/* Tab 3: Forgot / Change Password Recovery */}
        {activeTab === 'reset' && (
          <form onSubmit={handlePasswordResetSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-neutral-200 leading-relaxed font-sans text-xs">
              <strong className="text-amber-300 block mb-0.5 font-mono-tactical">
                Instant Self-Service Password Recovery
              </strong>
              Forgot your password or want to set a new one? Enter your Callsign below, verify using your registered email <em>or</em> the Wessex Raptor security question, and choose a new password.
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-neutral-300 font-bold block">1. YOUR OBSERVER CALLSIGN</label>
              <input
                type="text"
                list="registered-callsigns-list"
                placeholder="e.g. WESSEX-SCOUT-07"
                value={resetCallsign}
                onChange={(e) => setResetCallsign(e.target.value.toUpperCase())}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-amber-300 font-mono uppercase font-bold focus:outline-none focus:border-amber-500"
                required
              />
              <datalist id="registered-callsigns-list">
                {observers.map((o) => (
                  <option key={o.id} value={o.callsign}>
                    {o.fullName}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
              <span className="text-neutral-200 font-bold block">
                2. VERIFY YOUR IDENTITY (COMPLETE EITHER OPTION A OR B)
              </span>

              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 block">
                  Option A: Registered Contact Email (if you added one at sign-up)
                </label>
                <input
                  type="email"
                  placeholder="observer@wessexraptors.uk"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="text-center text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                — OR —
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-neutral-300 block flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Option B: Wessex Raptor Security Question</span>
                </label>
                <p className="text-[11px] text-neutral-400 font-sans">
                  Which raptor has a deeply forked V-shaped tail frequently seen circling over the Ridgeway?
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {['Red Kite', 'Mallard Duck', 'Mute Swan'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setResetChallengeAnswer(opt)}
                      className={`py-2 px-2 rounded-lg text-[11px] font-bold border cursor-pointer transition-all ${
                        resetChallengeAnswer === opt
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {resetChallengeAnswer === opt ? '✓ ' : ''}
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-neutral-300 font-bold">3. NEW PASSWORD / PIN</label>
                  <button
                    type="button"
                    onClick={() => setShowNewPasscode((prev) => !prev)}
                    className="text-[10px] text-neutral-400 hover:text-amber-300 cursor-pointer"
                  >
                    {showNewPasscode ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showNewPasscode ? 'text' : 'password'}
                  placeholder="At least 4 characters"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300 font-bold block">CONFIRM NEW PASSWORD</label>
                <input
                  type={showNewPasscode ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-display-tactical text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Save New Password &amp; Sign In
            </button>
          </form>
        )}

        {/* Footer actions: Register new scout */}
        <div className="bg-neutral-900/80 border-t border-neutral-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-neutral-400 text-center sm:text-left">
            Don't have a verified Wessex Scout ID?
          </div>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(880);
              onClose();
              onOpenRegistration();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register New Observer</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

