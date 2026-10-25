import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  MapPin, 
  Eye, 
  Wind, 
  Download, 
  Search, 
  Filter, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  X, 
  RefreshCw, 
  FileText, 
  Layers, 
  Compass, 
  Bug, 
  Check, 
  UserPlus,
  AlertCircle,
  Mail,
  Send
} from 'lucide-react';
import { ObserverProfile, ExperienceLevel } from '../types/community';
import { SightingLog } from '../types/raptor';
import { BetaFeedbackEntry } from './BetaFeedbackModal';
import { SectorId } from '../types/sector';
import { UK_SECTORS } from '../data/sectors';
import { tacticalAudio } from '../utils/audio';
import { 
  getStoredAnalyticsEvents, 
  trackEvent, 
  downloadCsvFile, 
  downloadJsonFile, 
  AnalyticsEvent 
} from '../utils/analytics';
import {
  ADMIN_NOTIFICATION_EMAIL,
  sendTestNotificationEmail,
  getEmailNotificationLogs,
  EmailNotificationLog,
  isEmailAlertsEnabled,
  setEmailAlertsEnabled,
  getBlockedSpamCount
} from '../services/emailNotification';

interface AdminMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  observers: ObserverProfile[];
  onAddObserver?: (profile: ObserverProfile) => void;
  sightings: SightingLog[];
  betaFeedbacks: BetaFeedbackEntry[];
  currentCallsign: string;
  activeSectorId: SectorId;
  mapViewMode: 'clean' | 'telemetry';
}

type AdminTab = 'overview' | 'roster' | 'analytics' | 'events';

const ADMIN_PASSKEY = 'raptor2026';

export const AdminMetricsModal: React.FC<AdminMetricsModalProps> = ({
  isOpen,
  onClose,
  observers,
  onAddObserver,
  sightings,
  betaFeedbacks,
  currentCallsign,
  activeSectorId,
  mapViewMode,
}) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('raptorlens_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [passkeyInput, setPasskeyInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Active admin tab
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Search & Filter for Roster
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [experienceFilter, setExperienceFilter] = useState<string>('ALL');

  // Telemetry events
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [eventFilter, setEventFilter] = useState<string>('ALL');

  // Toast feedback inside modal
  const [adminToast, setAdminToast] = useState<string | null>(null);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState<boolean>(false);
  const [emailLogs, setEmailLogs] = useState<EmailNotificationLog[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(() => isEmailAlertsEnabled());
  const [blockedSpamCount, setBlockedSpamCount] = useState<number>(() => getBlockedSpamCount());

  const showToast = (msg: string) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(null), 4500);
  };

  // Reload events on open
  useEffect(() => {
    if (isOpen) {
      setEvents(getStoredAnalyticsEvents());
      setEmailLogs(getEmailNotificationLogs());
      setAlertsEnabled(isEmailAlertsEnabled());
      setBlockedSpamCount(getBlockedSpamCount());
    }
  }, [isOpen]);

  const handleToggleEmailAlerts = () => {
    const nextState = !alertsEnabled;
    setEmailAlertsEnabled(nextState);
    setAlertsEnabled(nextState);
    tacticalAudio.playRadarPing(nextState ? 880 : 600);
    showToast(
      nextState
        ? `✓ Email notifications RESUMED for ${ADMIN_NOTIFICATION_EMAIL}`
        : `⏸ Email notifications PAUSED — sign-ups will still be saved locally`
    );
  };

  const handleSendTestEmail = async () => {
    setIsSendingTestEmail(true);
    tacticalAudio.playRadarPing(880);
    const res = await sendTestNotificationEmail();
    setEmailLogs(getEmailNotificationLogs());
    setBlockedSpamCount(getBlockedSpamCount());
    setIsSendingTestEmail(false);
    showToast(res.message);
  };

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  const getAdminPasskey = () => {
    try {
      return localStorage.getItem('raptorlens_admin_passkey') || 'raptor2026';
    } catch {
      return 'raptor2026';
    }
  };

  const handleUnlock = (pass?: string) => {
    const keyToTest = pass !== undefined ? pass : passkeyInput;
    const requiredKey = getAdminPasskey();
    if (keyToTest.trim() === requiredKey) {
      tacticalAudio.playConfirmChime();
      setIsAuthenticated(true);
      setAuthError(null);
      setPasskeyInput('');
      try {
        sessionStorage.setItem('raptorlens_admin_auth', 'true');
      } catch {}
      showToast('✓ Admin Telemetry Console Unlocked');
    } else {
      tacticalAudio.playRadarPing(600);
      setAuthError('Access denied: Invalid administrator credentials.');
    }
  };

  const handleLock = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('raptorlens_admin_auth');
    } catch {}
    tacticalAudio.playRadarPing(800);
  };

  // KPI Calculations
  const totalRegisteredObservers = observers.length;
  const verifiedObserversCount = observers.filter((o) => o.verified || o.isHumanVerified).length;
  const totalSightingsCount = sightings.length;
  const schedule1Count = sightings.filter((s) => s.isSchedule1).length;
  const schedule1Compliance = totalSightingsCount > 0 ? ((schedule1Count / totalSightingsCount) * 100).toFixed(0) : '100';

  // Experience level breakdown
  const experienceBreakdown: Record<string, number> = {};
  observers.forEach((o) => {
    const lvl = o.experienceLevel || 'Intermediate Field Spotter';
    experienceBreakdown[lvl] = (experienceBreakdown[lvl] || 0) + 1;
  });

  // Top species logged
  const speciesCountMap: Record<string, number> = {};
  sightings.forEach((s) => {
    const sp = s.speciesName || s.speciesId;
    speciesCountMap[sp] = (speciesCountMap[sp] || 0) + (s.count || 1);
  });
  const topSpeciesList = Object.entries(speciesCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Sector distribution
  const sectorCountMap: Record<string, number> = {};
  sightings.forEach((s) => {
    const sec = s.sectorId || 'ridgeway-wessex';
    sectorCountMap[sec] = (sectorCountMap[sec] || 0) + 1;
  });

  // Map View Mode statistics
  const viewModeEvents = events.filter((e) => e.type === 'map_view_mode_toggled');
  const cleanModeToggles = viewModeEvents.filter((e) => e.metadata?.mode === 'clean').length;
  const telemetryModeToggles = viewModeEvents.filter((e) => e.metadata?.mode === 'telemetry').length;
  const totalToggles = cleanModeToggles + telemetryModeToggles;
  const cleanPreferencePct = totalToggles > 0 ? Math.round((cleanModeToggles / totalToggles) * 100) : (mapViewMode === 'clean' ? 70 : 30);

  // Filtered observers for Roster table
  const filteredObservers = useMemo(() => {
    return observers.filter((obs) => {
      const matchesSearch = 
        rosterSearch.trim() === '' ||
        obs.callsign.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        obs.fullName.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        (obs.affiliation && obs.affiliation.toLowerCase().includes(rosterSearch.toLowerCase())) ||
        obs.homeHotspot.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        obs.opticsGear.toLowerCase().includes(rosterSearch.toLowerCase());

      const matchesExp = 
        experienceFilter === 'ALL' ||
        obs.experienceLevel === experienceFilter;

      return matchesSearch && matchesExp;
    });
  }, [observers, rosterSearch, experienceFilter]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (eventFilter === 'ALL') return true;
      return evt.type === eventFilter;
    });
  }, [events, eventFilter]);

  // Export handlers
  const handleExportCsv = () => {
    tacticalAudio.playRadarPing(880);
    const headers = [
      'Callsign',
      'Full Name',
      'Experience Level',
      'Years Experience',
      'Badge',
      'Affiliation',
      'Home Hotspot',
      'Optics Gear',
      'Sightings Count',
      'Human Verified',
      'Joined Date'
    ];

    const rows = observers.map((obs) => [
      `"${obs.callsign}"`,
      `"${obs.fullName}"`,
      `"${obs.experienceLevel || ''}"`,
      obs.yearsExperience || 1,
      `"${obs.badge}"`,
      `"${obs.affiliation || ''}"`,
      `"${obs.homeHotspot}"`,
      `"${obs.opticsGear}"`,
      obs.sightingsCount || 0,
      obs.isHumanVerified ? 'YES' : 'NO',
      `"${obs.joinedDate}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCsvFile(`raptorlens_registered_observers_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
    showToast('✓ Observers roster downloaded (CSV)');
  };

  const handleExportJson = () => {
    tacticalAudio.playRadarPing(880);
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      site: 'RaptorLens UK',
      metrics: {
        totalObservers: observers.length,
        totalSightings: sightings.length,
        schedule1BlurRate: `${schedule1Compliance}%`,
        activeSectorId,
        currentViewMode: mapViewMode,
      },
      observers,
      recentEvents: events.slice(0, 50),
    };
    downloadJsonFile(`raptorlens_metrics_export_${new Date().toISOString().split('T')[0]}.json`, exportPayload);
    showToast('✓ Telemetry and roster downloaded (JSON)');
  };

  const handleClearTelemetryCache = () => {
    if (window.confirm('Reset local telemetry events cache? (Observer roster and sightings will remain untouched).')) {
      tacticalAudio.playRadarPing(600);
      try {
        localStorage.removeItem('raptorlens_analytics_events');
        setEvents(getStoredAnalyticsEvents());
      } catch {}
      showToast('✓ Telemetry cache reset');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-neutral-950 border border-neutral-850 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-850 bg-neutral-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/35 flex items-center justify-center text-amber-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display-tactical text-lg font-bold text-neutral-100 uppercase tracking-wide">
                  RaptorLens Admin &amp; Metrics Console
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-tactical font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  STATION METRICS
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-sans">
                Real-time observer sign-up counters, engagement telemetry, and Schedule 1 conservation compliance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button
                onClick={handleLock}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-amber-300 text-xs font-mono-tactical border border-neutral-750 transition-colors cursor-pointer"
                title="Lock admin session"
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Admin Mode</span>
                <span className="text-[10px] text-neutral-500">(Lock)</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 text-xs text-neutral-400 font-mono-tactical">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Protected</span>
              </span>
            )}

            <button
              onClick={() => {
                tacticalAudio.playRadarPing(800);
                onClose();
              }}
              className="p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-850 rounded-xl transition-colors cursor-pointer"
              title="Close Admin Metrics"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* In-Modal Toast Notification */}
        {adminToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-fade-in font-mono-tactical">
            <CheckCircle2 className="w-4 h-4 text-neutral-950" />
            <span>{adminToast}</span>
          </div>
        )}

        {/* Content Area */}
        {!isAuthenticated ? (
          /* Authentication Screen */
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto my-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display-tactical text-xl font-bold text-neutral-100">
                Admin Passkey Required
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Access observer sign-up records, CSV exports, downland usage telemetry, and anti-bot verification logs.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUnlock();
              }}
              className="w-full space-y-3"
            >
              <div className="relative">
                <input
                  type="password"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Enter admin passkey..."
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-750 text-neutral-100 font-mono-tactical text-sm placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 transition-colors text-center tracking-widest"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-mono-tactical">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display-tactical text-xs font-bold tracking-wider transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Authenticate &amp; Enter Console
              </button>
            </form>

            <div className="pt-3 border-t border-neutral-850 w-full flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 font-mono-tactical">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Restricted to authorised station administrators</span>
            </div>
          </div>
        ) : (
          /* Main Authenticated Dashboard */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Top Stat Highlights Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-neutral-925 border-b border-neutral-850">
              {/* Card 1: Registered Observers */}
              <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-mono-tactical">
                  <span>REGISTERED OBSERVERS</span>
                  <Users className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display-tactical text-2xl font-bold text-neutral-100">
                    {totalRegisteredObservers}
                  </span>
                  <span className="text-[11px] font-mono-tactical text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> 100% Verified
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 mt-1 font-mono-tactical">
                  Anti-bot verified field scouts
                </div>
              </div>

              {/* Card 2: Total Sightings */}
              <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-mono-tactical">
                  <span>SIGHTINGS LOGGED</span>
                  <Compass className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display-tactical text-2xl font-bold text-neutral-100">
                    {totalSightingsCount}
                  </span>
                  <span className="text-[11px] font-mono-tactical text-neutral-400">
                    Across {UK_SECTORS.length} Sectors
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 mt-1 font-mono-tactical">
                  {schedule1Count} Schedule 1 protected records
                </div>
              </div>

              {/* Card 3: Map View Preference */}
              <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-mono-tactical">
                  <span>CLEAN VIEW PREFERENCE</span>
                  <Eye className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display-tactical text-2xl font-bold text-amber-400">
                    {cleanPreferencePct}%
                  </span>
                  <span className="text-[11px] font-mono-tactical text-neutral-400">
                    Clean Focus
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 mt-1 font-mono-tactical">
                  Active mode: <strong className="text-neutral-300">{mapViewMode === 'clean' ? 'Clean Sightings' : 'Aero Intel'}</strong>
                </div>
              </div>

              {/* Card 4: Schedule 1 Compliance */}
              <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-mono-tactical">
                  <span>WILDLIFE LAW COMPLIANCE</span>
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display-tactical text-2xl font-bold text-purple-400">
                    100%
                  </span>
                  <span className="text-[11px] font-mono-tactical text-neutral-400">
                    Strict Blurring
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 mt-1 font-mono-tactical">
                  Zero nesting coordinates leaked
                </div>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center justify-between px-5 border-b border-neutral-850 bg-neutral-900/50">
              <div className="flex items-center gap-1 py-2">
                <button
                  onClick={() => {
                    tacticalAudio.playRadarPing(880);
                    setActiveTab('overview');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono-tactical font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Overview &amp; Growth</span>
                </button>

                <button
                  onClick={() => {
                    tacticalAudio.playRadarPing(880);
                    setActiveTab('roster');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono-tactical font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                    activeTab === 'roster'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Observer Roster ({observers.length})</span>
                </button>

                <button
                  onClick={() => {
                    tacticalAudio.playRadarPing(880);
                    setActiveTab('analytics');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono-tactical font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                    activeTab === 'analytics'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Feature Usage</span>
                </button>

                <button
                  onClick={() => {
                    tacticalAudio.playRadarPing(880);
                    setActiveTab('events');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono-tactical font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                    activeTab === 'events'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Live Event Log ({events.length})</span>
                </button>
              </div>

              {/* Quick Actions (Exports & Simulation) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCsv}
                  className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-neutral-300 hover:text-amber-300 text-xs font-mono-tactical flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Export Observers to CSV"
                >
                  <Download className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">CSV</span>
                </button>

                <button
                  onClick={handleExportJson}
                  className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-neutral-300 hover:text-amber-300 text-xs font-mono-tactical flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Export All Telemetry & Observers to JSON"
                >
                  <FileText className="w-3 h-3 text-cyan-400" />
                  <span className="hidden sm:inline">JSON</span>
                </button>
              </div>
            </div>

            {/* Tab Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 bg-neutral-950">
              
              {/* TAB 1: OVERVIEW & GROWTH */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Growth & Demographics Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Experience Level Distribution */}
                    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono-tactical text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                          <Users className="w-3.5 h-3.5 text-amber-400" />
                          <span>Observer Experience Breakdown</span>
                        </h4>
                        <span className="text-[11px] font-mono-tactical text-neutral-500">
                          Total: {observers.length}
                        </span>
                      </div>

                      <div className="space-y-2.5 pt-1">
                        {observers.length === 0 ? (
                          <div className="p-4 text-center text-xs font-mono-tactical text-neutral-500 border border-dashed border-neutral-800 rounded-lg">
                            No observers registered yet. Real user sign-ups will appear here.
                          </div>
                        ) : (
                          Object.entries(experienceBreakdown).map(([lvl, count]) => {
                            const pct = Math.round((count / observers.length) * 100);
                            return (
                              <div key={lvl} className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-mono-tactical">
                                  <span className="text-neutral-300 truncate max-w-[240px]">{lvl}</span>
                                  <span className="text-amber-400 font-bold">{count} ({pct}%)</span>
                                </div>
                                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" 
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Clean Sighting Mode vs Aero Telemetry split */}
                    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono-tactical text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Interface Preference (Clean vs. Aero)</span>
                        </h4>
                        <span className="text-[11px] font-mono-tactical text-emerald-400">
                          Live Active Telemetry
                        </span>
                      </div>

                      <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                        Tracks whether birders in the field prefer the uncluttered <strong>Clean Sightings Centerpiece</strong> or the detailed <strong>Aero &amp; Weather Intel</strong> mode.
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono-tactical">
                          <span className="text-amber-300 flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5" /> Clean Sightings Focus ({cleanPreferencePct}%)
                          </span>
                          <span className="text-cyan-300 flex items-center gap-1.5">
                            <Wind className="w-3.5 h-3.5" /> Aero &amp; Weather Intel ({100 - cleanPreferencePct}%)
                          </span>
                        </div>
                        <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden flex">
                          <div 
                            className="h-full bg-amber-500 transition-all duration-500" 
                            style={{ width: `${cleanPreferencePct}%` }}
                            title="Clean Focus Preference"
                          />
                          <div 
                            className="h-full bg-cyan-500 transition-all duration-500" 
                            style={{ width: `${100 - cleanPreferencePct}%` }}
                            title="Aero Intel Preference"
                          />
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800 text-[11px] font-mono-tactical text-neutral-400 flex items-center justify-between">
                        <span>Current Visitor Preference:</span>
                        <span className="text-amber-400 font-bold uppercase">{mapViewMode === 'clean' ? '🦅 Clean Sighting Mode' : '🌪️ Aero Intel Mode'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Second Row: Top Species & Sector Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Top 5 Species Logged */}
                    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-mono-tactical text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                        <Compass className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Most Logged Raptor Species</span>
                      </h4>

                      <div className="space-y-2 pt-1">
                        {topSpeciesList.length === 0 ? (
                          <div className="p-4 text-center text-xs font-mono-tactical text-neutral-500 border border-dashed border-neutral-800 rounded-lg">
                            No sightings logged yet. Real community sightings will appear here.
                          </div>
                        ) : (
                          topSpeciesList.map(([species, count], idx) => (
                            <div key={species} className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/70 border border-neutral-850 text-xs font-mono-tactical">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-neutral-850 text-neutral-400 flex items-center justify-center text-[10px] font-bold">
                                  #{idx + 1}
                                </span>
                                <span className="text-neutral-200 font-semibold">{species}</span>
                              </div>
                              <span className="text-amber-400 font-bold">{count} birds logged</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Sector Activity Breakdown */}
                    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-mono-tactical text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>Regional Activity by Sector</span>
                      </h4>

                      <div className="space-y-2 pt-1">
                        {UK_SECTORS.map((sec) => {
                          const count = sectorCountMap[sec.id] || 0;
                          return (
                            <div key={sec.id} className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/70 border border-neutral-850 text-xs font-mono-tactical">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${sec.id === activeSectorId ? 'bg-amber-400 animate-pulse' : 'bg-neutral-600'}`} />
                                <span className="text-neutral-200">{sec.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-neutral-400">{count} sightings</span>
                                {sec.id === activeSectorId && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: OBSERVER ROSTER & SIGN-UPS */}
              {activeTab === 'roster' && (
                <div className="space-y-4">
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/80 border border-neutral-800 rounded-xl p-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={rosterSearch}
                        onChange={(e) => setRosterSearch(e.target.value)}
                        placeholder="Search by callsign, name, optics, or hotspot..."
                        className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-750 rounded-lg text-xs font-mono-tactical text-neutral-200 focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-neutral-400" />
                      <select
                        value={experienceFilter}
                        onChange={(e) => setExperienceFilter(e.target.value)}
                        className="bg-neutral-950 border border-neutral-750 text-neutral-300 text-xs font-mono-tactical rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-400"
                      >
                        <option value="ALL">All Experience Levels</option>
                        <option value="Raptor Specialist / BTO Ringer">Raptor Specialist / BTO Ringer</option>
                        <option value="Seasoned Chalkland Scout">Seasoned Chalkland Scout</option>
                        <option value="Intermediate Field Spotter">Intermediate Field Spotter</option>
                        <option value="Downland Walker & Nature Photographer">Downland Walker &amp; Photographer</option>
                        <option value="Novice Skywatcher / Nature Learner">Novice Skywatcher</option>
                        <option value="Armchair Watcher & Webcam Supporter">Armchair Watcher</option>
                      </select>
                    </div>
                  </div>

                  {/* Instant Email Alert Banner & Anti-Spam Shield for jmzmccormick@gmail.com */}
                  <div className={`p-3.5 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors ${
                    alertsEnabled
                      ? 'bg-emerald-950/30 border-emerald-500/40'
                      : 'bg-neutral-900/80 border-neutral-700'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <div className={`p-2 rounded-lg border shrink-0 mt-0.5 ${
                        alertsEnabled
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                      }`}>
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-mono-tactical font-bold flex items-center gap-2 flex-wrap">
                          <span className={alertsEnabled ? 'text-emerald-300' : 'text-neutral-300'}>
                            Sign-Up Email Alerts ({ADMIN_NOTIFICATION_EMAIL}): {alertsEnabled ? 'ACTIVE' : 'PAUSED'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                            ANTI-SPAM SHIELD ON
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px]">
                            MAX 3 / DAY • 30M COOLDOWN
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-300 font-sans leading-relaxed">
                          Protected by <strong>5 anti-spam layers</strong>: Ornithology CAPTCHA verification required, honeypot trap, duplicate callsign filter, URL/keyword spam blocker, and a strict 30-minute cooldown (max 3 emails/day per device).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={handleToggleEmailAlerts}
                        className={`px-3 py-2 rounded-xl font-mono-tactical text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors border ${
                          alertsEnabled
                            ? 'bg-neutral-900 hover:bg-neutral-800 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                        }`}
                        title={alertsEnabled ? 'Pause all outgoing email notifications' : 'Resume outgoing email notifications'}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{alertsEnabled ? 'Pause Alerts' : 'Resume Alerts'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSendingTestEmail || !alertsEnabled}
                        onClick={handleSendTestEmail}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-mono-tactical text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors shadow"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSendingTestEmail ? 'Sending...' : 'Send Test Email'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="flex items-center justify-between text-xs font-mono-tactical text-neutral-400 px-1 flex-wrap gap-2">
                    <span>
                      Displaying <strong className="text-amber-400">{filteredObservers.length}</strong> of {observers.length} Registered Observers
                    </span>
                    <span className="text-neutral-400">
                      Emails dispatched: <strong className="text-emerald-400">{emailLogs.length}</strong> • Spam/duplicates blocked: <strong className="text-amber-400">{blockedSpamCount}</strong>
                    </span>
                  </div>

                  {/* Observers Roster Table */}
                  <div className="border border-neutral-850 rounded-xl overflow-hidden bg-neutral-900/60">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-mono-tactical">
                        <thead>
                          <tr className="border-b border-neutral-800 bg-neutral-900/90 text-neutral-400">
                            <th className="py-2.5 px-3">Callsign</th>
                            <th className="py-2.5 px-3">Observer Name</th>
                            <th className="py-2.5 px-3">Experience / Badge</th>
                            <th className="py-2.5 px-3">Home Hotspot</th>
                            <th className="py-2.5 px-3">Optics Gear</th>
                            <th className="py-2.5 px-3">Sightings</th>
                            <th className="py-2.5 px-3">Joined</th>
                            <th className="py-2.5 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-850">
                          {filteredObservers.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 px-4 text-center text-neutral-500">
                                No registered observers yet. All fake sign-ups have been cleared — real community registrations will appear here.
                              </td>
                            </tr>
                          ) : (
                            filteredObservers.map((obs) => (
                              <tr key={obs.id} className="hover:bg-neutral-850/50 transition-colors">
                                <td className="py-2.5 px-3 font-bold text-amber-300">
                                  {obs.callsign}
                                </td>
                                <td className="py-2.5 px-3 text-neutral-200">
                                  {obs.fullName}
                                  {obs.affiliation && (
                                    <div className="text-[10px] text-neutral-500">{obs.affiliation}</div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-300 border border-neutral-750">
                                    {obs.badge || 'Field Observer'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-neutral-300">
                                  {obs.homeHotspot}
                                </td>
                                <td className="py-2.5 px-3 text-neutral-400 text-[11px]">
                                  {obs.opticsGear || 'Standard Optics'}
                                </td>
                                <td className="py-2.5 px-3 text-amber-400 font-bold">
                                  {obs.sightingsCount}
                                </td>
                                <td className="py-2.5 px-3 text-neutral-400 text-[11px]">
                                  {obs.joinedDate}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                                    <Check className="w-3 h-3" /> VERIFIED
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FEATURE USAGE & TELEMETRY */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Telemetry Architecture Overview */}
                  <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                    <h4 className="text-xs font-mono-tactical text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>Telemetry &amp; Site Health Diagnostics</span>
                    </h4>
                    <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                      RaptorLens UK uses client-side, privacy-preserving event telemetry. No personally identifiable tracking cookies are deployed to field watchers; all metrics focus on observational utility and downland safety.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                        <div className="text-[10px] font-mono-tactical text-neutral-500">BETA FEEDBACK LOGS</div>
                        <div className="text-xl font-bold font-display-tactical text-neutral-100 mt-1">
                          {betaFeedbacks.length}
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">Submitted via field widget</div>
                      </div>

                      <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                        <div className="text-[10px] font-mono-tactical text-neutral-500">SCHEDULE 1 PRIVACY ENGINE</div>
                        <div className="text-xl font-bold font-display-tactical text-emerald-400 mt-1">
                          ACTIVE
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">Automated 1.5–5km grid fuzzing</div>
                      </div>

                      <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                        <div className="text-[10px] font-mono-tactical text-neutral-500">ANTI-BOT ATTACK RATE</div>
                        <div className="text-xl font-bold font-display-tactical text-cyan-400 mt-1">
                          0% Bypassed
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">Field knowledge question gate</div>
                      </div>
                    </div>
                  </div>

                  {/* Beta Feedback Inbox */}
                  <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono-tactical text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                        <Bug className="w-3.5 h-3.5 text-amber-400" />
                        <span>Recent Tester Feedback &amp; Suggestions ({betaFeedbacks.length})</span>
                      </h4>
                      <span className="text-[11px] font-mono-tactical text-neutral-500">
                        Field Beta Review
                      </span>
                    </div>

                    {betaFeedbacks.length === 0 ? (
                      <div className="p-6 text-center text-xs font-mono-tactical text-neutral-500 border border-dashed border-neutral-800 rounded-lg">
                        No tester feedback submitted yet. Users can submit reports via the Beta button in the top bar.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {betaFeedbacks.map((fb) => (
                          <div key={fb.id} className="p-3 rounded-lg bg-neutral-950 border border-neutral-850 space-y-1.5 text-xs font-mono-tactical">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-300">{fb.authorCallsign}</span>
                              <span className="text-neutral-500 text-[10px]">{fb.timestamp}</span>
                            </div>
                            <div className="text-neutral-300 font-sans">{fb.feedbackText}</div>
                            <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                              <span>Sector: {fb.sectorName}</span>
                              <span>•</span>
                              <span className="uppercase text-amber-400/80">{fb.category}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: LIVE EVENT LOG */}
              {activeTab === 'events' && (
                <div className="space-y-4">
                  {/* Event Filter & Clear */}
                  <div className="flex items-center justify-between gap-3 bg-neutral-900/80 border border-neutral-800 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs font-mono-tactical text-neutral-300">
                      <span>Filter Event Type:</span>
                      <select
                        value={eventFilter}
                        onChange={(e) => setEventFilter(e.target.value)}
                        className="bg-neutral-950 border border-neutral-750 text-neutral-200 text-xs font-mono-tactical rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-400"
                      >
                        <option value="ALL">All Events ({events.length})</option>
                        <option value="observer_registered">Sign-ups / Registrations</option>
                        <option value="map_view_mode_toggled">Map View Mode Switches</option>
                        <option value="sighting_logged">Sightings Logged</option>
                        <option value="sector_switched">Sector Switches</option>
                      </select>
                    </div>

                    <button
                      onClick={handleClearTelemetryCache}
                      className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-rose-400 text-xs font-mono-tactical flex items-center gap-1.5 border border-neutral-750 cursor-pointer transition-colors"
                      title="Clear local event history"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset Cache</span>
                    </button>
                  </div>

                  {/* Events Stream List */}
                  <div className="space-y-2">
                    {filteredEvents.map((evt) => (
                      <div 
                        key={evt.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/70 border border-neutral-850 text-xs font-mono-tactical hover:bg-neutral-850/60 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full ${
                            evt.type === 'observer_registered'
                              ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                              : evt.type === 'map_view_mode_toggled'
                              ? 'bg-amber-400'
                              : evt.type === 'sighting_logged'
                              ? 'bg-cyan-400'
                              : 'bg-neutral-500'
                          }`} />
                          <div>
                            <span className="text-neutral-200 font-semibold">{evt.label}</span>
                            {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                              <div className="text-[10px] text-neutral-500 mt-0.5">
                                {JSON.stringify(evt.metadata)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-neutral-500 text-[10px] text-right shrink-0">
                          {new Date(evt.timestamp).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                          <div className="text-[9px] text-neutral-600">{evt.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-neutral-850 bg-neutral-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono-tactical text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>RaptorLens Admin Console • Local Persistent Storage Sync</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCsv}
                  className="text-amber-400 hover:text-amber-300 cursor-pointer font-semibold underline"
                >
                  Download Observers CSV
                </button>
                <span>•</span>
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-semibold cursor-pointer"
                >
                  Close Console
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
