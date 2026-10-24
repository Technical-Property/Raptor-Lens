import React, { useState } from 'react';
import { ObserverProfile, GroupSkywatch, CommunityDiscussion } from '../types/community';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  Compass, 
  ShieldCheck, 
  Plus, 
  ThumbsUp, 
  Send, 
  MapPin, 
  Award, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  HeartHandshake, 
  HelpCircle,
  Eye,
  Camera,
  Share2,
  Lock,
  UserCheck,
  ShieldAlert,
  Info
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';
import { ObserverRegistrationModal } from './ObserverRegistrationModal';

interface CommunityHubProps {
  observers: ObserverProfile[];
  skywatches: GroupSkywatch[];
  discussions: CommunityDiscussion[];
  currentCallsign: string;
  onUpdateCallsign: (newCallsign: string, homeHotspot: string) => void;
  onRegisterObserver: (profile: ObserverProfile) => void;
  onJoinSkywatch: (skywatchId: string) => void;
  onCreateSkywatch: (watch: GroupSkywatch) => void;
  onAddDiscussion: (discussion: CommunityDiscussion) => void;
  onAddReply: (discussionId: string, replyText: string) => void;
  onUpvoteDiscussion: (discussionId: string) => void;
  onLocateHotspot: (hotspotId: string) => void;
}

export const CommunityHub: React.FC<CommunityHubProps> = ({
  observers,
  skywatches,
  discussions,
  currentCallsign,
  onUpdateCallsign,
  onRegisterObserver,
  onJoinSkywatch,
  onCreateSkywatch,
  onAddDiscussion,
  onAddReply,
  onUpvoteDiscussion,
  onLocateHotspot,
}) => {
  const [activeSection, setActiveSection] = useState<'skywatches' | 'forum' | 'observers'>('skywatches');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [experienceFilter, setExperienceFilter] = useState<string>('ALL');
  
  // Registration / Profile modal state
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  
  // Find current user's full profile if registered
  const currentUserProfile = observers.find((o) => o.callsign === currentCallsign) || null;
  
  // Skywatch modal state
  const [showNewWatchModal, setShowNewWatchModal] = useState(false);
  const [newWatchTitle, setNewWatchTitle] = useState('');
  const [newWatchDate, setNewWatchDate] = useState('');
  const [newWatchTime, setNewWatchTime] = useState('');
  const [newWatchLocation, setNewWatchLocation] = useState('Barbury Castle Ramparts');
  const [newWatchHotspotId, setNewWatchHotspotId] = useState('barbury-castle');
  const [newWatchDesc, setNewWatchDesc] = useState('');
  const [newWatchTargets, setNewWatchTargets] = useState('Red Kite, Peregrine, Hobby');

  // Discussion modal state
  const [showNewDiscModal, setShowNewDiscModal] = useState(false);
  const [newDiscTitle, setNewDiscTitle] = useState('');
  const [newDiscCategory, setNewDiscCategory] = useState<'ID Help' | 'Field Conditions' | 'Optics & Gear' | 'Conservation & Roosts'>('ID Help');
  const [newDiscContent, setNewDiscContent] = useState('');
  const [newDiscTags, setNewDiscTags] = useState('Ridgeway, Raptor-ID');

  // Active expanded discussion reply input
  const [replyInputMap, setReplyInputMap] = useState<{ [key: string]: string }>({});

  const filteredDiscussions = discussions.filter((d) => {
    if (categoryFilter === 'ALL') return true;
    return d.category === categoryFilter;
  });

  const filteredObservers = observers.filter((obs) => {
    if (experienceFilter === 'ALL') return true;
    return obs.experienceLevel === experienceFilter;
  });

  const handleCreateWatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchTitle.trim() || !newWatchDate.trim()) return;

    tacticalAudio.playConfirmChime();
    const newWatch: GroupSkywatch = {
      id: `watch-${Date.now()}`,
      title: newWatchTitle,
      date: newWatchDate,
      time: newWatchTime || '10:00 - 13:00 BST',
      hotspotId: newWatchHotspotId,
      locationName: newWatchLocation,
      gridRef: 'SU 149 763',
      leaderCallsign: currentCallsign,
      targetSpecies: newWatchTargets.split(',').map((s) => s.trim()),
      description: newWatchDesc || 'Community observer group walk along the Ridgeway scarp.',
      difficulty: 'Easy Trail',
      opticsRecommended: 'Binoculars (8x or 10x)',
      attendees: [currentCallsign],
      isJoined: true,
    };

    onCreateSkywatch(newWatch);
    setShowNewWatchModal(false);
    setNewWatchTitle('');
    setNewWatchDesc('');
  };

  const handleCreateDiscSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscTitle.trim() || !newDiscContent.trim()) return;

    tacticalAudio.playConfirmChime();
    const newDisc: CommunityDiscussion = {
      id: `disc-${Date.now()}`,
      title: newDiscTitle,
      authorCallsign: currentCallsign,
      authorBadge: 'Chalkland Thermal Scout',
      category: newDiscCategory,
      content: newDiscContent,
      timestamp: new Date().toISOString(),
      timeAgo: 'Just now',
      upvotes: 1,
      tags: newDiscTags.split(',').map((t) => t.trim()),
      replies: [],
    };

    onAddDiscussion(newDisc);
    setShowNewDiscModal(false);
    setNewDiscTitle('');
    setNewDiscContent('');
  };

  const handleSendReply = (discId: string) => {
    const text = replyInputMap[discId];
    if (!text || !text.trim()) return;

    tacticalAudio.playConfirmChime();
    onAddReply(discId, text.trim());
    setReplyInputMap((prev) => ({ ...prev, [discId]: '' }));
  };

  return (
    <div className="space-y-8 pb-16 sm:pb-24">
      {/* Community Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-neutral-900/90 border border-neutral-800/80 p-6 md:p-8 shadow-2xl backdrop-blur-md">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-tactical font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-3 h-3 text-amber-400" />
                WESSEX OBSERVER COLLECTIVE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-tactical font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                NO LOGGING REQUIRED
              </span>
              <span className="text-xs font-mono-tactical text-neutral-400">
                • 4 Active Stations
              </span>
            </div>
            <h1 className="font-display-tactical text-2xl md:text-3xl font-bold text-neutral-100 tracking-tight">
              Ridgeway Community &amp; Skywatch Net
            </h1>
            <p className="text-sm text-neutral-300 leading-relaxed font-sans">
              Connect with fellow birders, webcam watchers, downland walkers, and photographers. You do <strong>not</strong> need to log sightings or own high-end optics to participate — join our scheduled skywatches, ask ID questions on the forum, and enjoy UK raptor conservation together.
            </p>
          </div>

          {/* Current Observer Identity Pill & Registration CTA */}
          <div className="bg-neutral-950/80 border border-neutral-800 p-4 rounded-xl flex flex-col gap-2 min-w-[260px] shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono-tactical">
              <span className="text-neutral-400">YOUR OBSERVER PROFILE:</span>
              <button
                onClick={() => {
                  tacticalAudio.playRadarPing(880);
                  setShowRegistrationModal(true);
                }}
                className="text-amber-400 hover:text-amber-300 font-semibold text-[11px] cursor-pointer flex items-center gap-1"
              >
                <Award className="w-3 h-3" />
                {currentUserProfile ? 'Update Credentials' : 'Join Community'}
              </button>
            </div>
            
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-neutral-950 font-bold font-mono text-xs shadow-md shrink-0">
                {currentCallsign.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="font-display-tactical text-sm font-bold text-neutral-100 truncate">
                  {currentCallsign}
                </div>
                <div className="text-[10px] font-mono-tactical text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> 
                  {currentUserProfile?.experienceLevel ? (
                    <span className="text-amber-300 font-semibold truncate">{currentUserProfile.experienceLevel}</span>
                  ) : (
                    <span>Verified Wessex Scout</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Registration / Experience Button */}
            <button
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                setShowRegistrationModal(true);
              }}
              className="mt-1 w-full py-1.5 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-700/80 text-neutral-200 hover:text-amber-300 text-[11px] font-mono-tactical flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentUserProfile ? 'View / Edit Scout Card' : 'Register Experience & Join'}</span>
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-neutral-800/80 overflow-x-auto">
          <button
            onClick={() => {
              tacticalAudio.playRadarPing(800);
              setActiveSection('skywatches');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'skywatches'
                ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20 font-bold'
                : 'bg-neutral-950/80 text-neutral-300 hover:text-neutral-100 border border-neutral-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Group Walks &amp; Skywatches ({skywatches.length})</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(800);
              setActiveSection('forum');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'forum'
                ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20 font-bold'
                : 'bg-neutral-950/80 text-neutral-300 hover:text-neutral-100 border border-neutral-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Field Forum &amp; ID Help ({discussions.length})</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playRadarPing(800);
              setActiveSection('observers');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'observers'
                ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20 font-bold'
                : 'bg-neutral-950/80 text-neutral-300 hover:text-neutral-100 border border-neutral-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Community Members ({observers.length})</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: GROUP SKYWATCHES */}
      {activeSection === 'skywatches' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display-tactical text-xl font-bold text-neutral-100">
                Scheduled Group Skywatches & Field Walks
              </h2>
              <p className="text-xs font-mono-tactical text-neutral-400">
                Meet up with fellow raptor spotters on the chalk scarp. Novices and seasoned birders are equally welcome!
              </p>
            </div>

            <button
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                setShowNewWatchModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display-tactical text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Propose Group Skywatch
            </button>
          </div>

          {/* Monthly Recurring Schedule Banner */}
          <div className="bg-gradient-to-r from-amber-500/15 via-neutral-900 to-amber-500/5 border border-amber-500/35 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display-tactical text-sm font-bold text-amber-300">
                    Regular Schedule: 1st Sunday of Every Month
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono-tactical font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                    Recurring
                  </span>
                </div>
                <p className="text-xs text-neutral-300 font-sans mt-0.5">
                  We meet up on the first Sunday of every month across Barbury Castle and the Marlborough Downs. All skill levels, dog walkers, and curious skywatchers are warmly welcome!
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className="text-[11px] font-mono-tactical text-amber-400 font-semibold block">
                Next: Sunday, 1 Nov 2026 (10:00 AM)
              </span>
              <span className="text-[10px] text-neutral-400 font-sans">
                Barbury Castle Main Ramparts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {skywatches.map((watch) => {
              const isJoined = watch.attendees.includes(currentCallsign) || watch.isJoined;

              return (
                <div
                  key={watch.id}
                  className="bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/50 rounded-2xl p-5 transition-all shadow-xl flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono-tactical font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {watch.date}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono-tactical bg-neutral-800 text-neutral-300">
                          {watch.difficulty}
                        </span>
                      </div>
                      <span className="text-xs font-mono-tactical text-neutral-400">
                        Leader: <strong className="text-amber-400">{watch.leaderCallsign}</strong>
                      </span>
                    </div>

                    <h3 className="font-display-tactical text-lg font-bold text-neutral-100 leading-snug">
                      {watch.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono-tactical text-neutral-400">
                      <span className="flex items-center gap-1 text-neutral-300">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        {watch.locationName}
                      </span>
                      <span>•</span>
                      <span>{watch.time}</span>
                      <span>•</span>
                      <span className="text-neutral-500">Grid: {watch.gridRef}</span>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                      {watch.description}
                    </p>

                    {/* Target Species Pills */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono-tactical text-neutral-400 uppercase tracking-wider block">
                        Target Species:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {watch.targetSpecies.map((sp) => (
                          <span
                            key={sp}
                            className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-xs font-mono-tactical text-amber-300"
                          >
                            {sp}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Gear advisory */}
                    <div className="text-[11px] font-mono-tactical text-neutral-400 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/80">
                      <strong>Recommended:</strong> {watch.opticsRecommended}
                    </div>
                  </div>

                  {/* Footer Actions & Attendees */}
                  <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2 overflow-hidden">
                        {watch.attendees.slice(0, 4).map((att, i) => (
                          <div
                            key={i}
                            className="w-7 h-7 rounded-full bg-neutral-800 border-2 border-neutral-900 flex items-center justify-center text-[10px] font-mono font-bold text-amber-400"
                            title={att}
                          >
                            {att.slice(0, 2)}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs font-mono-tactical text-neutral-400">
                        {watch.attendees.length} Scouts Attending
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          tacticalAudio.playRadarPing(800);
                          onLocateHotspot(watch.hotspotId);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-cyan-300 border border-cyan-500/40 text-xs font-mono-tactical flex items-center gap-1 cursor-pointer"
                      >
                        <Compass className="w-3 h-3" /> Map Sector
                      </button>

                      <button
                        onClick={() => {
                          tacticalAudio.playConfirmChime();
                          onJoinSkywatch(watch.id);
                        }}
                        className={`px-3.5 py-1.5 rounded-lg font-mono-tactical text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isJoined
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60'
                            : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20'
                        }`}
                      >
                        {isJoined ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Attending
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" /> RSVP / Join
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* End of Skywatches Status Badge */}
          <div className="pt-3 pb-8 text-center text-xs font-mono-tactical text-neutral-400 flex items-center justify-center gap-2 border-t border-neutral-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>All {skywatches.length} Scheduled Walks Listed • Novices, Walkers &amp; Seasoned Scouts Welcome</span>
          </div>
        </div>
      )}

      {/* SECTION 2: FIELD FORUM & ID HELP */}
      {activeSection === 'forum' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display-tactical text-xl font-bold text-neutral-100">
                Wessex Field Q&A & Identification Help
              </h2>
              <p className="text-xs font-mono-tactical text-neutral-400">
                Ask questions about ambiguous silhouettes, downland weather thermals, and recommended optical gear.
              </p>
            </div>

            <button
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                setShowNewDiscModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display-tactical text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Start New Discussion
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono-tactical">
            {['ALL', 'ID Help', 'Field Conditions', 'Optics & Gear', 'Conservation & Roosts'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  tacticalAudio.playRadarPing(800);
                  setCategoryFilter(cat);
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                  categoryFilter === cat
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 font-bold'
                    : 'bg-neutral-900/80 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Discussions List */}
          <div className="space-y-4">
            {filteredDiscussions.map((disc) => (
              <div
                key={disc.id}
                className="bg-neutral-900/80 border border-neutral-800/90 rounded-2xl p-5 transition-all shadow-lg space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono-tactical font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {disc.category}
                      </span>
                      <span className="text-xs font-mono-tactical text-neutral-400">
                        Posted by <strong className="text-neutral-200">{disc.authorCallsign}</strong> ({disc.authorBadge})
                      </span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-xs font-mono-tactical text-neutral-500">
                        {disc.timeAgo}
                      </span>
                    </div>
                    <h3 className="font-display-tactical text-base font-bold text-neutral-100">
                      {disc.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      tacticalAudio.playRadarPing(900);
                      onUpvoteDiscussion(disc.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-mono-tactical font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                      disc.hasUpvoted
                        ? 'bg-amber-500/30 text-amber-300 border-amber-500'
                        : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border-neutral-800'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{disc.upvotes}</span>
                  </button>
                </div>

                {/* Content */}
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
                  {disc.content}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {disc.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[10px] font-mono-tactical bg-neutral-950 text-neutral-400 border border-neutral-800"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Replies Thread */}
                {disc.replies.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-neutral-800/80">
                    <span className="text-[10px] font-mono-tactical text-neutral-400 uppercase tracking-wider block">
                      Replies ({disc.replies.length}):
                    </span>
                    <div className="space-y-2">
                      {disc.replies.map((rep) => (
                        <div
                          key={rep.id}
                          className="bg-neutral-950/70 border border-neutral-850 p-3 rounded-xl space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between text-neutral-400 font-mono-tactical text-[11px]">
                            <span className="font-semibold text-amber-400">
                              {rep.authorCallsign} <span className="text-neutral-500 font-normal">({rep.authorBadge})</span>
                            </span>
                            <span className="text-neutral-500">{rep.timestamp}</span>
                          </div>
                          <p className="text-neutral-300 font-sans leading-relaxed">
                            {rep.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Reply Form */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder={`Reply to ${disc.authorCallsign} as ${currentCallsign}...`}
                    value={replyInputMap[disc.id] || ''}
                    onChange={(e) => setReplyInputMap({ ...replyInputMap, [disc.id]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendReply(disc.id);
                      }
                    }}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono-tactical text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => handleSendReply(disc.id)}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-mono-tactical font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" /> Reply
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* End of Discussions Status Badge */}
          <div className="pt-3 pb-8 text-center text-xs font-mono-tactical text-neutral-400 flex items-center justify-center gap-2 border-t border-neutral-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Wessex Field Forum • Open to all ID questions, downland queries &amp; photography tips</span>
          </div>
        </div>
      )}

      {/* SECTION 3: OBSERVER ROSTER */}
      {activeSection === 'observers' && (
        <div className="space-y-6">
          {/* Header & Register Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display-tactical text-xl font-bold text-neutral-100 flex items-center gap-2">
                <span>Wessex Observer Roster</span>
                <span className="text-xs font-mono-tactical text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {filteredObservers.length} Scouts
                </span>
              </h2>
              <p className="text-xs font-mono-tactical text-neutral-400">
                Active certified naturalists patrolling Barbury Castle, Hackpen Hill, Avebury, and the Ridgeway trail corridors.
              </p>
            </div>

            <button
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                setShowRegistrationModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-display-tactical text-xs font-bold tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer self-start sm:self-auto"
            >
              <UserCheck className="w-4 h-4" /> 
              <span>{currentUserProfile ? 'Update My Scout Card' : 'Register Experience & Join'}</span>
            </button>
          </div>

          {/* Anti-Bot Security Callout */}
          <div className="bg-neutral-950/90 border border-emerald-500/30 rounded-xl p-4 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-mono-tactical font-bold text-emerald-300 uppercase tracking-wider">
                    Community Anti-Bot Shield Active
                  </h4>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-tactical bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                    100% Human Verified
                  </span>
                </div>
                <p className="text-xs text-neutral-300 font-sans">
                  Registrations are defended by honeypot field traps, human typing velocity timing, and natural Wiltshire raptor trivia. Automated scripts and crawlers are blocked automatically.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono-tactical text-neutral-400 shrink-0">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Zero Spam
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-cyan-400">
                <Lock className="w-3.5 h-3.5" /> Protected Net
              </span>
            </div>
          </div>

          {/* Experience Level Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-mono-tactical text-neutral-400 whitespace-nowrap mr-1">Experience:</span>
            {[
              { id: 'ALL', label: 'All Members' },
              { id: 'Armchair Watcher & Webcam Supporter', label: 'Armchair & Webcams' },
              { id: 'Downland Walker & Nature Photographer', label: 'Walkers & Photographers' },
              { id: 'Novice Skywatcher / Nature Learner', label: 'Learners & Beginners' },
              { id: 'Intermediate Field Spotter', label: 'Intermediate Spotters' },
              { id: 'Seasoned Chalkland Scout', label: 'Seasoned Scouts' },
              { id: 'Raptor Specialist / BTO Ringer', label: 'Specialists & Ringers' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => {
                  tacticalAudio.playRadarPing(900);
                  setExperienceFilter(lvl.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-tactical whitespace-nowrap transition-all cursor-pointer ${
                  experienceFilter === lvl.id
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow'
                    : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>

          {/* Observer Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredObservers.map((obs) => {
              const isCurrentUser = obs.callsign === currentCallsign;
              return (
                <div
                  key={obs.id}
                  className={`bg-neutral-900/80 border rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition-all ${
                    isCurrentUser 
                      ? 'border-amber-500/60 ring-1 ring-amber-500/30' 
                      : 'border-neutral-800/90 hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${obs.avatarColor} flex items-center justify-center text-neutral-100 font-bold font-display-tactical text-base shadow-lg shrink-0`}>
                          {obs.callsign.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-display-tactical text-base font-bold text-neutral-100 truncate">
                              {obs.callsign}
                            </h3>
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-tactical bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                You
                              </span>
                            )}
                            {obs.isHumanVerified && (
                              <span className="flex items-center gap-0.5 text-[10px] font-mono-tactical text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                <ShieldCheck className="w-3 h-3" /> Human
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-neutral-400 block truncate">{obs.fullName}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono-tactical font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {obs.badge}
                        </span>
                        {obs.experienceLevel && (
                          <span className="text-[10px] font-mono-tactical text-neutral-300 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                            {obs.yearsExperience ? `${obs.yearsExperience} yrs exp` : 'Active'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Experience Level Banner */}
                    {obs.experienceLevel && (
                      <div className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-xs font-mono-tactical">
                        <span className="text-neutral-400 text-[11px]">Experience Rank:</span>
                        <span className="font-semibold text-amber-300 text-[11px]">{obs.experienceLevel}</span>
                      </div>
                    )}

                    {obs.affiliation && (
                      <div className="text-[11px] font-mono-tactical text-cyan-400 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">Affiliation: <strong>{obs.affiliation}</strong></span>
                      </div>
                    )}

                    <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                      {obs.bio}
                    </p>

                    {/* Specialities Chips */}
                    {obs.specialties && obs.specialties.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono-tactical text-neutral-400 uppercase tracking-wider block">
                          Field Focus & Specialities:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {obs.specialties.map((spec, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-mono-tactical bg-neutral-950 text-neutral-300 border border-neutral-800"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 text-xs font-mono-tactical text-neutral-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">Home Sector: <strong className="text-neutral-200">{obs.homeHotspot}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">Optics: <strong className="text-neutral-300">{obs.opticsGear}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono-tactical text-neutral-400">
                    <span>Joined: {obs.joinedDate}</span>
                    <span className="text-amber-400 font-semibold">{obs.sightingsCount} Contacts Logged</span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredObservers.length === 0 && (
            <div className="text-center py-12 bg-neutral-950/60 border border-neutral-800 rounded-2xl p-6">
              <Eye className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm font-mono-tactical text-neutral-400">
                No observers registered under this experience filter yet.
              </p>
              <button
                onClick={() => setExperienceFilter('ALL')}
                className="mt-3 px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-400 text-xs font-mono-tactical cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          )}

          {/* End of Observers Directory Badge */}
          {filteredObservers.length > 0 && (
            <div className="pt-3 pb-8 text-center text-xs font-mono-tactical text-neutral-400 flex items-center justify-center gap-2 border-t border-neutral-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>All {filteredObservers.length} Registered Community Members • Join Anytime (No Sighting Logging Required)</span>
            </div>
          )}
        </div>
      )}

      {/* MODAL: PROPOSE GROUP SKYWATCH */}
      {showNewWatchModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/80 backdrop-blur-md p-4 flex justify-center items-start overscroll-contain">
          <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 font-mono-tactical text-xs my-4 sm:my-8 mb-16 sm:mb-24">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h3 className="font-display-tactical text-base font-bold text-neutral-100">
                  Propose Ridgeway Group Skywatch
                </h3>
              </div>
              <button
                onClick={() => setShowNewWatchModal(false)}
                className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWatchSubmit} className="space-y-3">
              <div>
                <label className="text-neutral-400 block mb-1 font-bold">EVENT TITLE</label>
                <input
                  type="text"
                  placeholder="e.g. Sunday Morning Thermal Watch at Barbury..."
                  value={newWatchTitle}
                  onChange={(e) => setNewWatchTitle(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-400 block mb-1 font-bold">DATE</label>
                  <input
                    type="text"
                    placeholder="e.g. Saturday, 19 Sept"
                    value={newWatchDate}
                    onChange={(e) => setNewWatchDate(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1 font-bold">TIME WINDOW</label>
                  <input
                    type="text"
                    placeholder="e.g. 09:30 - 12:30 BST"
                    value={newWatchTime}
                    onChange={(e) => setNewWatchTime(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-bold">HOTSPOT / MEETING VANTAGE</label>
                <select
                  value={newWatchHotspotId}
                  onChange={(e) => {
                    setNewWatchHotspotId(e.target.value);
                    if (e.target.value === 'barbury-castle') setNewWatchLocation('Barbury Castle Country Park');
                    if (e.target.value === 'hackpen-hill') setNewWatchLocation('Hackpen Hill & White Horse');
                    if (e.target.value === 'avebury-henge') setNewWatchLocation('Avebury Henge & Stone Circle');
                    if (e.target.value === 'fyfield-down') setNewWatchLocation('Fyfield Down Nature Reserve');
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="barbury-castle">Barbury Castle Country Park (Iron Age Ramparts)</option>
                  <option value="hackpen-hill">Hackpen Hill & White Horse (Top Car Park)</option>
                  <option value="avebury-henge">Avebury Henge & Stone Circle (Barn Museum)</option>
                  <option value="fyfield-down">Fyfield Down Nature Reserve (Delling car park)</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-bold">TARGET RAPTOR SPECIES</label>
                <input
                  type="text"
                  placeholder="Red Kite, Peregrine Falcon, Common Buzzard"
                  value={newWatchTargets}
                  onChange={(e) => setNewWatchTargets(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-bold">DETAILS & FIELD INSTRUCTIONS</label>
                <textarea
                  rows={3}
                  placeholder="Meeting point description, what to bring, wind expectations..."
                  value={newWatchDesc}
                  onChange={(e) => setNewWatchDesc(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-amber-500 resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowNewWatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-display-tactical flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  Publish Skywatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: START DISCUSSION */}
      {showNewDiscModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/80 backdrop-blur-md p-4 flex justify-center items-start overscroll-contain">
          <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 font-mono-tactical text-xs my-4 sm:my-8 mb-16 sm:mb-24">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <h3 className="font-display-tactical text-base font-bold text-neutral-100">
                  Start Community Discussion
                </h3>
              </div>
              <button
                onClick={() => setShowNewDiscModal(false)}
                className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDiscSubmit} className="space-y-3">
              <div>
                <label className="text-neutral-400 block mb-1 font-bold">TOPIC / QUESTION</label>
                <input
                  type="text"
                  placeholder="e.g. High soaring silhouette query over Barbury Castle..."
                  value={newDiscTitle}
                  onChange={(e) => setNewDiscTitle(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-bold">CATEGORY</label>
                <select
                  value={newDiscCategory}
                  onChange={(e) => setNewDiscCategory(e.target.value as any)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="ID Help">ID Help</option>
                  <option value="Field Conditions">Field Conditions</option>
                  <option value="Optics & Gear">Optics & Gear</option>
                  <option value="Conservation & Roosts">Conservation & Roosts</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-bold">MESSAGE / ENQUIRY</label>
                <textarea
                  rows={4}
                  placeholder="Describe your observation, behaviour observed, lighting, optics used..."
                  value={newDiscContent}
                  onChange={(e) => setNewDiscContent(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-amber-500 resize-none font-sans"
                  required
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-bold">TAGS (COMMA-SEPARATED)</label>
                <input
                  type="text"
                  placeholder="Ridgeway, Buzzard, Barbury"
                  value={newDiscTags}
                  onChange={(e) => setNewDiscTags(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowNewDiscModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-display-tactical flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  Post Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: OBSERVER REGISTRATION & BOT-DEFENDED SIGN-UP */}
      <ObserverRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onRegister={(newProfile) => {
          onRegisterObserver(newProfile);
          onUpdateCallsign(newProfile.callsign, newProfile.homeHotspot);
        }}
        existingProfile={currentUserProfile}
        currentCallsign={currentCallsign}
      />
    </div>
  );
};
