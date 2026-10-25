import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Check, 
  X, 
  ShieldCheck, 
  Video, 
  HelpCircle, 
  AlertTriangle, 
  Phone, 
  Radio, 
  MapPin, 
  MessageSquare,
  FileText
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';
import { sendContactLiaisonEmail } from '../services/emailNotification';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCallsign?: string;
  defaultTopic?: 'conservation' | 'camera' | 'general' | 'privacy';
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  currentCallsign = 'FIELD-SCOUT',
  defaultTopic = 'general',
}) => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [topic, setTopic] = useState<'conservation' | 'camera' | 'general' | 'privacy'>(defaultTopic);
  const [callsign, setCallsign] = useState<string>(currentCallsign !== 'FIELD-SCOUT' ? currentCallsign : '');
  const [sectorRef, setSectorRef] = useState<string>('Wessex Downland & Ridgeway');
  const [message, setMessage] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>('');
  const [mountTime, setMountTime] = useState<number>(Date.now());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setMountTime(Date.now());
      setErrorMessage(null);
      setHoneypot('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;

    setErrorMessage(null);
    setIsSending(true);
    tacticalAudio.playRadarPing(880);

    const elapsedMs = Date.now() - mountTime;
    const res = await sendContactLiaisonEmail({
      name: name.trim(),
      email: email.trim(),
      callsign: callsign.trim() || currentCallsign,
      topic,
      sectorRef,
      message: message.trim(),
      honeypot,
      elapsedMs,
    });

    setIsSending(false);

    if (!res.success && res.message.includes('Please wait')) {
      setErrorMessage(res.message);
      tacticalAudio.playRadarPing(600);
      return;
    }

    setIsSubmitted(true);
    tacticalAudio.playConfirmChime();
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setMessage('');
    setErrorMessage(null);
    setMountTime(Date.now());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/85 backdrop-blur-md p-3 sm:p-4 flex justify-center items-start overscroll-contain animate-fadeIn">
      <div className="w-full max-w-2xl my-4 sm:my-8 mb-16 sm:mb-24 bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5 font-mono-tactical text-xs text-neutral-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display-tactical text-lg sm:text-xl font-bold text-neutral-100">
                Contact &amp; Station Liaison
              </h2>
              <p className="text-[11px] text-neutral-400 font-sans">
                RaptorLens UK Operations • Conservation Ethics Desk &amp; Field Cam Support
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              tacticalAudio.playRadarPing(700);
              onClose();
            }}
            className="text-neutral-400 hover:text-neutral-100 p-1.5 rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Main Direct Liaison Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div 
            onClick={() => setTopic('conservation')}
            className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
              topic === 'conservation'
                ? 'bg-amber-500/15 border-amber-500/60 shadow-sm ring-1 ring-amber-500/30'
                : 'bg-neutral-900/60 border-neutral-800/80 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Conservation Desk</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-sans leading-snug">
              Sensitive breeding sites, Schedule 1 inquiries &amp; data coordinate blurring.
            </p>
          </div>

          <div 
            onClick={() => setTopic('camera')}
            className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
              topic === 'camera'
                ? 'bg-amber-500/15 border-amber-500/60 shadow-sm ring-1 ring-amber-500/30'
                : 'bg-neutral-900/60 border-neutral-800/80 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
              <Video className="w-3.5 h-3.5" />
              <span>Live Field Cams</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-sans leading-snug">
              30x optical telemetry, rig hosting, stream uptime &amp; PTZ masking queries.
            </p>
          </div>

          <div 
            onClick={() => setTopic('general')}
            className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
              topic === 'general'
                ? 'bg-amber-500/15 border-amber-500/60 shadow-sm ring-1 ring-amber-500/30'
                : 'bg-neutral-900/60 border-neutral-800/80 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>General Liaison</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-sans leading-snug">
              Bird club partnerships, observer verification &amp; media requests.
            </p>
          </div>
        </div>

        {/* Success Confirmation State */}
        {isSubmitted ? (
          <div className="p-6 rounded-2xl bg-neutral-900/80 border border-emerald-500/50 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display-tactical text-base font-bold text-neutral-100">
                Liaison Message Transmitted
              </h3>
              <p className="text-xs text-neutral-300 font-sans max-w-md mx-auto leading-relaxed">
                Thank you for contacting the RaptorLens team. Your message regarding{' '}
                <strong className="text-amber-400">
                  {topic === 'conservation' ? 'Conservation & Nesting Sensitivity' : topic === 'camera' ? 'Live Field Cam Operations' : topic === 'privacy' ? 'Privacy Masking / Landowner Query' : 'General Inquiry'}
                </strong>{' '}
                has been logged with reference ID <span className="font-mono text-emerald-300">RL-CONT-{Date.now().toString().slice(-6)}</span>.
              </p>
              <p className="text-[11px] text-neutral-400 font-sans pt-1">
                Our conservation and field tech team will reply to <strong>{email}</strong> within 24 hours.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Send Another Message
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-display-tactical text-xs cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Contact Form */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-300 block mb-1 font-bold text-[11px]">
                  YOUR NAME / CALLSIGN
                </label>
                <input
                  type="text"
                  placeholder="e.g. John M. or KITE-WATCHER-07"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 font-sans text-xs"
                />
              </div>

              <div>
                <label className="text-neutral-300 block mb-1 font-bold text-[11px]">
                  EMAIL ADDRESS <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. observer@downland-birds.org.uk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 font-sans text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-300 block mb-1 font-bold text-[11px]">
                  INQUIRY CATEGORY <span className="text-rose-400">*</span>
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as any)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500 font-sans text-xs cursor-pointer"
                >
                  <option value="conservation">Conservation &amp; Species Sensitivity (Schedule 1)</option>
                  <option value="camera">Live Field Cam Rig &amp; Optical Telemetry</option>
                  <option value="privacy">GDPR / Landowner Privacy Masking Query</option>
                  <option value="general">General Feedback / Local Bird Club Liaison</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-300 block mb-1 font-bold text-[11px]">
                  RELEVANT SECTOR OR RIG
                </label>
                <select
                  value={sectorRef}
                  onChange={(e) => setSectorRef(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500 font-sans text-xs cursor-pointer"
                >
                  <option value="Barbury Castle Field Rig">Barbury Castle (Chalk Station 01 Rig)</option>
                  <option value="Salisbury Cathedral Spire">Salisbury Cathedral Spire Eyrie Cam</option>
                  <option value="Gigrin Farm Station">Gigrin Farm Red Kite SkyStation</option>
                  <option value="Raptor Conservation Trust">British Raptor Sanctuary Pen</option>
                  <option value="Wessex Downland &amp; Ridgeway">Wessex Downland &amp; Ridgeway Sector</option>
                  <option value="Salisbury Plain">Salisbury Plain Grasslands</option>
                  <option value="Chiltern Escarpment">Chiltern Escarpment &amp; Scarp Lift</option>
                  <option value="Cotswold Edge">Cotswold Edge &amp; Severn Vale</option>
                  <option value="South Downs">South Downs &amp; Wealden Valleys</option>
                  <option value="Other / General Platform">Other / General Platform</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-neutral-300 block mb-1 font-bold text-[11px]">
                MESSAGE / FIELD REPORT <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Please describe your query, observation correction, camera rig inquiry, or conservation feedback in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 resize-none font-sans text-xs"
              />
            </div>

            {/* Hidden Anti-Bot Honeypot Trap */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="station_fax_extension">Station Fax Extension (Leave Blank)</label>
              <input
                id="station_fax_extension"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2 font-sans">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-800">
              <span className="text-[10px] text-neutral-400 hidden sm:inline">
                🔒 Inquiries handled confidentially under UK GDPR &amp; Anti-Spam Shield.
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending || !email.trim() || !message.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 font-display-tactical font-bold text-xs tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20 transition-all"
                >
                  {isSending ? (
                    <span>Transmitting...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Inquiry</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Direct Contact & Field Station Details Strip */}
        <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2.5">
          <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" />
            <span>Direct Station Operational Channels:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-neutral-300">
            <div className="flex items-start gap-2">
              <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-neutral-400 block font-semibold">Direct Email Inquiries:</span>
                <span className="text-neutral-200">operations@raptorlens.org</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Radio className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-neutral-400 block font-semibold">Downland Field Radio Net:</span>
                <span className="text-neutral-200">PMR446 Ch 8 (CTCSS 16 / 114.8 Hz)</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-neutral-400 block font-semibold">Field Station Coordination:</span>
                <span className="text-neutral-200">Marlborough Downs &amp; Barbury Ridge, Wiltshire</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Phone className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-neutral-400 block font-semibold">Injured Raptor Emergency Rescue:</span>
                <span className="text-rose-300">RSPCA Wildlife: 0300 1234 999</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
