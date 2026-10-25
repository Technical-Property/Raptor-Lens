import { ObserverProfile } from '../types/community';

// Assembled at runtime so simple static regex scrapers scanning JS bundles do not harvest the raw address
const EMAIL_USER = ['jmzmccormick'].join('');
const EMAIL_DOMAIN = ['gmail', 'com'].join('.');
export const ADMIN_NOTIFICATION_EMAIL = `${EMAIL_USER}@${EMAIL_DOMAIN}`;

const EMAIL_LOG_STORAGE_KEY = 'raptorlens_email_notification_logs';
const EMAIL_RATE_LIMIT_KEY = 'raptorlens_email_rate_state';
const EMAIL_ALERTS_ENABLED_KEY = 'raptorlens_email_alerts_enabled';

// Cooldowns & caps
const SIGNUP_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes between sign-up emails per browser
const CONTACT_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes between contact messages per browser
const MAX_EMAILS_PER_DAY_PER_CLIENT = 3; // Hard cap of 3 emails per 24 hours from any single browser

const SPAM_PATTERNS = [
  /\b(crypto|bitcoin|casino|betting|viagra|forex|seo\s+service|backlinks|telegram\s+channel|whatsapp\s+me|loan\s+offer)\b/i,
  /(https?:\/\/[^\s]+.*){2,}/i, // 2 or more URLs in a registration bio or contact message
  /<script|<iframe|javascript:/i,
];

export interface EmailNotificationLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  callsign: string;
  fullName: string;
  status: 'sent' | 'failed' | 'blocked-spam' | 'rate-limited' | 'paused';
  detail?: string;
}

interface RateLimitState {
  lastSignupEmailAt: number;
  lastContactEmailAt: number;
  sentTimestamps24h: number[];
  notifiedCallsigns: string[];
  blockedCount: number;
}

function getRateLimitState(): RateLimitState {
  try {
    const raw = localStorage.getItem(EMAIL_RATE_LIMIT_KEY);
    if (!raw) {
      return {
        lastSignupEmailAt: 0,
        lastContactEmailAt: 0,
        sentTimestamps24h: [],
        notifiedCallsigns: [],
        blockedCount: 0,
      };
    }
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    return {
      lastSignupEmailAt: Number(parsed.lastSignupEmailAt) || 0,
      lastContactEmailAt: Number(parsed.lastContactEmailAt) || 0,
      sentTimestamps24h: Array.isArray(parsed.sentTimestamps24h)
        ? parsed.sentTimestamps24h.filter((t: number) => t > oneDayAgo)
        : [],
      notifiedCallsigns: Array.isArray(parsed.notifiedCallsigns)
        ? parsed.notifiedCallsigns.slice(0, 200)
        : [],
      blockedCount: Number(parsed.blockedCount) || 0,
    };
  } catch {
    return {
      lastSignupEmailAt: 0,
      lastContactEmailAt: 0,
      sentTimestamps24h: [],
      notifiedCallsigns: [],
      blockedCount: 0,
    };
  }
}

function saveRateLimitState(state: RateLimitState) {
  try {
    localStorage.setItem(EMAIL_RATE_LIMIT_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function getBlockedSpamCount(): number {
  return getRateLimitState().blockedCount;
}

export function isEmailAlertsEnabled(): boolean {
  try {
    return localStorage.getItem(EMAIL_ALERTS_ENABLED_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setEmailAlertsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(EMAIL_ALERTS_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export function containsSpamContent(text: string): boolean {
  if (!text) return false;
  return SPAM_PATTERNS.some((pattern) => pattern.test(text));
}

export function getEmailNotificationLogs(): EmailNotificationLog[] {
  try {
    const raw = localStorage.getItem(EMAIL_LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function recordEmailLog(entry: EmailNotificationLog) {
  try {
    const existing = getEmailNotificationLogs();
    const updated = [entry, ...existing].slice(0, 100);
    localStorage.setItem(EMAIL_LOG_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
}

/**
 * Sends a real email notification to jmzmccormick@gmail.com via FormSubmit AJAX endpoint
 * ONLY when a genuine, human-verified, non-duplicate, non-spam new observer registers.
 */
export async function sendObserverSignupEmail(
  profile: ObserverProfile,
  isUpdate: boolean = false
): Promise<{ ok: boolean; message: string }> {
  // 1. Do not send emails for profile edits/updates — only brand-new registrations
  if (isUpdate) {
    return { ok: false, message: 'Profile update only (email skipped to prevent inbox clutter).' };
  }

  // 2. Check if admin paused email alerts
  if (!isEmailAlertsEnabled()) {
    recordEmailLog({
      id: `email-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipient: ADMIN_NOTIFICATION_EMAIL,
      subject: `[Paused] Sign-up: ${profile.callsign}`,
      callsign: profile.callsign,
      fullName: profile.fullName,
      status: 'paused',
      detail: 'Email alerts currently paused by Admin.',
    });
    return { ok: false, message: 'Email alerts are currently paused.' };
  }

  // 3. Require human verification flag from the Ornithology Anti-Bot Challenge
  if (!profile.isHumanVerified) {
    const state = getRateLimitState();
    state.blockedCount += 1;
    saveRateLimitState(state);
    recordEmailLog({
      id: `email-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipient: ADMIN_NOTIFICATION_EMAIL,
      subject: `[Blocked Bot] Unverified sign-up: ${profile.callsign}`,
      callsign: profile.callsign,
      fullName: profile.fullName,
      status: 'blocked-spam',
      detail: 'Missing human anti-bot challenge verification.',
    });
    return { ok: false, message: 'Unverified submission blocked.' };
  }

  // 4. Content spam filter (checks name, callsign, bio, optics, affiliation for links/spam keywords)
  const combinedText = `${profile.fullName} ${profile.callsign} ${profile.bio || ''} ${profile.affiliation || ''} ${profile.opticsGear || ''}`;
  if (containsSpamContent(combinedText)) {
    const state = getRateLimitState();
    state.blockedCount += 1;
    saveRateLimitState(state);
    recordEmailLog({
      id: `email-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipient: ADMIN_NOTIFICATION_EMAIL,
      subject: `[Blocked Spam] Suspicious content in ${profile.callsign}`,
      callsign: profile.callsign,
      fullName: profile.fullName,
      status: 'blocked-spam',
      detail: 'Filtered due to URL stuffing or spam keywords.',
    });
    return { ok: false, message: 'Blocked by anti-spam content filter.' };
  }

  // 5. Rate-limit & duplicate callsign guard
  const now = Date.now();
  const rateState = getRateLimitState();
  const normalizedCallsign = profile.callsign.trim().toUpperCase();

  if (rateState.notifiedCallsigns.includes(normalizedCallsign)) {
    return { ok: false, message: 'Duplicate callsign notification suppressed.' };
  }

  if (
    now - rateState.lastSignupEmailAt < SIGNUP_COOLDOWN_MS ||
    rateState.sentTimestamps24h.length >= MAX_EMAILS_PER_DAY_PER_CLIENT
  ) {
    rateState.blockedCount += 1;
    saveRateLimitState(rateState);
    recordEmailLog({
      id: `email-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipient: ADMIN_NOTIFICATION_EMAIL,
      subject: `[Rate-Limited] ${profile.callsign}`,
      callsign: profile.callsign,
      fullName: profile.fullName,
      status: 'rate-limited',
      detail: '30-minute cooldown or 3/day per-device limit active to prevent spam.',
    });
    return { ok: false, message: 'Rate-limited to protect admin inbox.' };
  }

  const subject = `[RaptorLens UK] New Observer Sign-Up: ${profile.callsign} (${profile.fullName})`;

  const payload = {
    _subject: subject,
    _template: 'table',
    _captcha: 'false',
    _honey: '', // FormSubmit server-side honeypot
    Notification_Type: 'New Human-Verified Observer Sign-Up',
    Observer_Callsign: profile.callsign,
    Full_Name: profile.fullName,
    Contact_Email: profile.contactEmail || 'Not provided',
    Experience_Level: profile.experienceLevel || 'Field Observer',
    Years_Experience: `${profile.yearsExperience ?? 1} year(s)`,
    Badge_Rank: profile.badge || 'Field Observer',
    Affiliation: profile.affiliation || 'Independent',
    Home_Hotspot: profile.homeHotspot || 'Barbury Castle Country Park',
    Optics_Gear: profile.opticsGear || 'Standard Optics',
    Specialties: (profile.specialties || []).join(', ') || 'General Raptor Spotting',
    Observer_Bio: profile.bio || '',
    Spam_Screen: 'PASSED (Human Ornithology Challenge + Rate-Limit + Content Filter)',
    Registered_At: new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }),
  };

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${ADMIN_NOTIFICATION_EMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    const isSuccess = response.ok && (data.success === 'true' || data.success === true || response.status === 200);

    if (isSuccess) {
      rateState.lastSignupEmailAt = now;
      rateState.sentTimestamps24h.push(now);
      rateState.notifiedCallsigns.push(normalizedCallsign);
      saveRateLimitState(rateState);
    }

    recordEmailLog({
      id: `email-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipient: ADMIN_NOTIFICATION_EMAIL,
      subject,
      callsign: profile.callsign,
      fullName: profile.fullName,
      status: isSuccess ? 'sent' : 'failed',
      detail: data.message || (isSuccess ? 'Delivered via FormSubmit' : `HTTP ${response.status}`),
    });

    return {
      ok: isSuccess,
      message:
        data.message ||
        (isSuccess
          ? `Notification email sent to ${ADMIN_NOTIFICATION_EMAIL}`
          : 'Could not dispatch email notification.'),
    };
  } catch (err: any) {
    recordEmailLog({
      id: `email-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipient: ADMIN_NOTIFICATION_EMAIL,
      subject,
      callsign: profile.callsign,
      fullName: profile.fullName,
      status: 'failed',
      detail: err?.message || 'Network error',
    });
    return {
      ok: false,
      message: err?.message || 'Network error while sending notification email.',
    };
  }
}

/**
 * Sends a test notification email so the station administrator (jmzmccormick@gmail.com)
 * can activate/verify delivery with 1 click.
 */
export async function sendTestNotificationEmail(): Promise<{ ok: boolean; message: string }> {
  const subject = `[RaptorLens UK] Test Sign-Up Alert Verification`;
  const payload = {
    _subject: subject,
    _template: 'table',
    _captcha: 'false',
    _honey: '',
    Alert: 'RaptorLens UK Sign-Up Email Notification Active',
    Recipient: ADMIN_NOTIFICATION_EMAIL,
    Anti_Spam_Shield: 'Enabled (30m cooldown, 3/day cap per device, ornithology CAPTCHA, link/keyword filter)',
    Timestamp: new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }),
  };

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${ADMIN_NOTIFICATION_EMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    const isSuccess = response.ok;

    recordEmailLog({
      id: `email-test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipient: ADMIN_NOTIFICATION_EMAIL,
      subject,
      callsign: 'STATION-ADMIN-TEST',
      fullName: 'Test Verification',
      status: isSuccess ? 'sent' : 'failed',
      detail: data.message || (isSuccess ? 'Test email dispatched' : `HTTP ${response.status}`),
    });

    return {
      ok: isSuccess,
      message:
        data.message ||
        (isSuccess
          ? `Test email dispatched to ${ADMIN_NOTIFICATION_EMAIL}! Check your inbox (and spam folder) to confirm.`
          : `Failed with HTTP ${response.status}`),
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.message || 'Network error sending test email.',
    };
  }
}

/**
 * Sends Contact & Station Liaison form submissions to jmzmccormick@gmail.com
 * with honeypot, velocity, content-spam, and rate-limit protection.
 */
export async function sendContactLiaisonEmail(form: {
  name: string;
  email: string;
  callsign: string;
  topic: string;
  sectorRef: string;
  message: string;
  honeypot?: string;
  elapsedMs?: number;
}): Promise<{ ok: boolean; message: string }> {
  if (!isEmailAlertsEnabled()) {
    return { ok: false, message: 'Email notifications are currently paused.' };
  }

  const rateState = getRateLimitState();

  // 1. Honeypot or bot speed (< 2.5 seconds) check
  if (form.honeypot || (typeof form.elapsedMs === 'number' && form.elapsedMs < 2500)) {
    rateState.blockedCount += 1;
    saveRateLimitState(rateState);
    return { ok: false, message: 'Automated submission blocked.' };
  }

  // 2. Content spam filter
  if (containsSpamContent(`${form.name} ${form.message}`)) {
    rateState.blockedCount += 1;
    saveRateLimitState(rateState);
    recordEmailLog({
      id: `email-contact-spam-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipient: ADMIN_NOTIFICATION_EMAIL,
      subject: `[Blocked Contact Spam] from ${form.email}`,
      callsign: form.callsign || 'Guest',
      fullName: form.name || 'Unknown',
      status: 'blocked-spam',
      detail: 'Contact message contained spam keywords or excessive links.',
    });
    return { ok: false, message: 'Message blocked by anti-spam filter.' };
  }

  // 3. Rate limit check (15m cooldown, 3/day cap)
  const now = Date.now();
  if (
    now - rateState.lastContactEmailAt < CONTACT_COOLDOWN_MS ||
    rateState.sentTimestamps24h.length >= MAX_EMAILS_PER_DAY_PER_CLIENT
  ) {
    rateState.blockedCount += 1;
    saveRateLimitState(rateState);
    return { ok: false, message: 'Please wait at least 15 minutes before sending another message.' };
  }

  const subject = `[RaptorLens UK Contact] ${form.topic.toUpperCase()} — from ${form.name || form.callsign || form.email}`;
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${ADMIN_NOTIFICATION_EMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: subject,
        _replyto: form.email,
        _template: 'table',
        _captcha: 'false',
        _honey: '',
        Sender_Name: form.name || 'Not provided',
        Sender_Email: form.email,
        Observer_Callsign: form.callsign || 'Guest',
        Liaison_Topic: form.topic,
        Sector_Reference: form.sectorRef,
        Message: form.message,
        Sent_At: new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      rateState.lastContactEmailAt = now;
      rateState.sentTimestamps24h.push(now);
      saveRateLimitState(rateState);
    }
    return {
      ok: response.ok,
      message: data.message || 'Message sent.',
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.message || 'Network error',
    };
  }
}
