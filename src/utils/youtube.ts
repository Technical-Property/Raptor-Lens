/**
 * YouTube and Camera integration utilities for RaptorLens UK:
 * Handles stream URL parsing, studio livestreams, channel info extraction,
 * device webcam inputs, and reliable embedded playback.
 */

// Verified 24/7 active live raptor & wildlife streams
export const CHALKTECH_CHANNEL_ID = 'UCIndyyYl6gizIAxgLXAfVyw'; // Station YouTube Channel ID
export const CHALKTECH_LIVE_STREAM_ID = 'jDkhKX5-i_g'; // Current active live broadcast session
export const CHALKTECH_VERIFIED_EMBED_ID = 'D9NvW7EA1B0'; // Verified embed-enabled Hackpen Hill & Barbury Castle stream
export const DEFAULT_CAMERA_VIDEO_ID = 'jDkhKX5-i_g'; // Official RaptorLens UK Station Live Stream
export const RAPTORLENS_STATION_VIDEO_ID = 'jDkhKX5-i_g'; // Official RaptorLens UK Live Cam
export const UK_OWL_KESTREL_VIDEO_ID = 'q28Q9_qzqyg'; // Robert E Fuller UK Barn Owl, Kestrel & Tawny Owl Live Cam
export const PEREGRINE_UK_VIDEO_ID = 'GAxREl6-fJs';   // Buckinghamshire UK Peregrine Falcon Cam 1
export const OSPREY_UK_VIDEO_ID = 'V08ET209nvU';       // Rutland Osprey Project (Manton Bay, UK) Live Cam
export const EAGLE_LIVE_VIDEO_ID = 'B4-L2nfGcuE';      // Big Bear Bald Eagle Live Nest (Cam 1)
export const EAGLE_WIDE_VIDEO_ID = '41eq4VzCYc4';      // Big Bear Bald Eagle Wide Lookout (Cam 2)
export const CORNELL_FEEDER_VIDEO_ID = 'x10vL6_47Dw';  // Cornell Lab Live FeederWatch
export const DEMO_NATURE_VIDEO_ID = 'D9NvW7EA1B0';     // Fallback verified Barbury & Hackpen stream
export const DEMO_LIVE_VIDEO_ID = '21X5lGlDOfg';       // NASA Earth Live HD broadcast

/**
 * Checks via YouTube's CORS-enabled oEmbed endpoint whether a given YouTube videoId
 * has "Allow embedding" enabled (HTTP 200) vs disabled/private (HTTP 401/403/404).
 */
export async function checkYouTubeVideoEmbeddable(videoId: string): Promise<boolean> {
  if (!videoId || /^UC[a-zA-Z0-9_-]{22}$/.test(videoId.trim())) {
    return true;
  }
  try {
    const cleanId = videoId.trim();
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(cleanId)}&format=json`
    );
    return res.ok;
  } catch {
    return true;
  }
}

export interface CameraPresetOption {
  id: string;
  name: string;
  shortLabel: string;
  badge: string;
  videoId: string;
  channelName: string;
  channelUrl: string;
  species: string;
  location: string;
  description: string;
}

export const POPULAR_CAMERA_PRESETS: CameraPresetOption[] = [
  {
    id: 'raptorlens-station',
    name: 'Station Live Camera',
    shortLabel: '📡 Station Live Camera',
    badge: 'PRIMARY STATION',
    videoId: 'jDkhKX5-i_g',
    channelName: 'RaptorLens UK Station Broadcast',
    channelUrl: '',
    species: 'Red Kite, Buzzard, Kestrel & Ridge Weather',
    location: 'Hackpen Hill • Barbury Fort • Field • Perch',
    description: 'Official 24/7 live camera broadcast streaming from the station at Barbury Castle & Hackpen Hill.',
  },
  {
    id: 'uk-owl-kestrel',
    name: 'UK Barn Owl, Kestrel & Tawny Owl Cam',
    shortLabel: '🦉 UK Owl & Kestrel',
    badge: 'UK GUEST CAM',
    videoId: UK_OWL_KESTREL_VIDEO_ID,
    channelName: 'Robert E Fuller Wildlife',
    channelUrl: 'https://www.youtube.com/watch?v=q28Q9_qzqyg',
    species: 'Barn Owl, Common Kestrel & Tawny Owl',
    location: 'Fotherdale, Yorkshire Wolds, UK',
    description: 'Renowned 24/7 live UK wildlife cameras tracking resident Barn Owls, Kestrels, and Tawny Owls.',
  },
  {
    id: 'uk-peregrine',
    name: 'UK Peregrine Falcon Live Cam',
    shortLabel: '🦅 UK Peregrine',
    badge: 'UK GUEST CAM',
    videoId: PEREGRINE_UK_VIDEO_ID,
    channelName: 'Buckinghamshire Council Peregrines',
    channelUrl: 'https://www.youtube.com/watch?v=GAxREl6-fJs',
    species: 'Peregrine Falcon (Falco peregrinus)',
    location: 'Aylesbury, Buckinghamshire, UK',
    description: 'High-definition optical Scrape & Ledge camera monitoring resident UK Peregrine Falcons.',
  },
  {
    id: 'uk-osprey',
    name: 'UK Rutland Osprey Nest Live Cam',
    shortLabel: '🐟 UK Osprey',
    badge: 'UK GUEST CAM',
    videoId: OSPREY_UK_VIDEO_ID,
    channelName: 'Rutland Osprey Project (LRWT)',
    channelUrl: 'https://www.youtube.com/watch?v=V08ET209nvU',
    species: 'Western Osprey (Pandion haliaetus)',
    location: 'Manton Bay, Rutland Water, UK',
    description: 'Live conservation camera overlooking the Manton Bay Osprey nesting platform at Rutland Water Nature Reserve.',
  },
  {
    id: 'bald-eagle',
    name: 'Big Bear Bald Eagle Nest Cam (Cam 1)',
    shortLabel: '🦅 Eagle Nest',
    badge: 'INTL RAPTOR CAM',
    videoId: EAGLE_LIVE_VIDEO_ID,
    channelName: 'Friends of Big Bear Valley',
    channelUrl: 'https://www.youtube.com/watch?v=B4-L2nfGcuE',
    species: 'Bald Eagle (Haliaeetus leucocephalus)',
    location: 'San Bernardino National Forest (2,050m ASL)',
    description: '24/7 solar-powered telephoto camera observing high-altitude Bald Eagle aerie.',
  },
  {
    id: 'bald-eagle-wide',
    name: 'Big Bear Eagle Lookout & Canopy (Cam 2)',
    shortLabel: '🌲 Eagle Lookout',
    badge: 'INTL RAPTOR CAM',
    videoId: EAGLE_WIDE_VIDEO_ID,
    channelName: 'Friends of Big Bear Valley',
    channelUrl: 'https://www.youtube.com/watch?v=41eq4VzCYc4',
    species: 'Bald Eagle & Red-tailed Hawk',
    location: 'Big Bear Lake Pine Canopy',
    description: 'Wide-angle ridge and snag perch camera tracking eagles gliding in and out of the valley.',
  },
];

/**
 * Normalizes user camera inputs (YouTube full URL, short URL, studio livestream link, embed, or raw ID)
 * and extracts the valid 11-character YouTube video ID.
 */
export function extractYouTubeVideoId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // 1. YouTube Studio Livestream link:
  // e.g. https://studio.youtube.com/video/9gkrkcqHQ78/livestreaming
  const studioMatch = trimmed.match(/studio\.youtube\.com\/video\/([a-zA-Z0-9_-]{11})/i);
  if (studioMatch) {
    return studioMatch[1];
  }

  // 2. Standard watch URL:
  // e.g. https://www.youtube.com/watch?v=9gkrkcqHQ78
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
  if (watchMatch) {
    return watchMatch[1];
  }

  // 3. Short URL:
  // e.g. https://youtu.be/9gkrkcqHQ78
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
  if (shortMatch) {
    return shortMatch[1];
  }

  // 4. Live URL or Embed URL:
  // e.g. https://www.youtube.com/live/9gkrkcqHQ78
  // e.g. https://www.youtube.com/embed/9gkrkcqHQ78
  const embedOrLiveMatch = trimmed.match(/youtube\.com\/(?:embed|live)\/([a-zA-Z0-9_-]{11})/i);
  if (embedOrLiveMatch) {
    return embedOrLiveMatch[1];
  }

  // 5. Channel URL or raw Channel ID (UC + 22 chars = 24 chars) for permanent live_stream embeds:
  const channelIdMatch = trimmed.match(/(?:youtube\.com\/channel\/|^)(UC[a-zA-Z0-9_-]{22})(?:[/?#]|$)/i);
  if (channelIdMatch) {
    return channelIdMatch[1];
  }

  // 6. If already an 11-char ID without path delimiters
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return trimmed;
}

export interface YouTubeChannelInfo {
  channelId?: string;
  handle?: string;
  channelUrl: string;
}

/**
 * Extracts YouTube channel ID (e.g. UC...) or handle (e.g. @name) and returns clean URLs.
 */
export function extractYouTubeChannelInfo(input: string): YouTubeChannelInfo {
  if (!input) {
    return {
      channelUrl: `https://www.youtube.com/watch?v=${DEFAULT_CAMERA_VIDEO_ID}`,
    };
  }

  const trimmed = input.trim();

  // 1. Direct channel URL: https://www.youtube.com/channel/UC...
  const channelUrlMatch = trimmed.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/i);
  if (channelUrlMatch) {
    return {
      channelId: channelUrlMatch[1],
      channelUrl: `https://www.youtube.com/channel/${channelUrlMatch[1]}`,
    };
  }

  // 2. Handle URL: https://www.youtube.com/@channelName
  const handleUrlMatch = trimmed.match(/youtube\.com\/(@[a-zA-Z0-9_.-]+)/i);
  if (handleUrlMatch) {
    return {
      handle: handleUrlMatch[1],
      channelUrl: `https://www.youtube.com/${handleUrlMatch[1]}`,
    };
  }

  // 3. Just the handle typed: e.g. @BarburyCastleRaptors
  if (trimmed.startsWith('@')) {
    return {
      handle: trimmed,
      channelUrl: `https://www.youtube.com/${trimmed}`,
    };
  }

  // 4. Raw Channel ID (UC...)
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) {
    return {
      channelId: trimmed,
      channelUrl: `https://www.youtube.com/channel/${trimmed}`,
    };
  }

  // 5. If given a full watch URL or video link, keep as direct link
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    return {
      channelUrl: trimmed,
    };
  }

  return {
    channelUrl: trimmed.startsWith('http') ? trimmed : `https://www.youtube.com/${trimmed}`,
  };
}

export const ACTIVE_STATION_STREAM_KEY = '';

export function getActiveStreamKey(): string {
  try {
    return localStorage.getItem('raptorlens_stream_key') || '';
  } catch {
    return '';
  }
}

export function setActiveStreamKey(key: string): void {
  try {
    localStorage.setItem('raptorlens_stream_key', key.trim());
  } catch {}
}

export function maskStreamKey(key: string): string {
  if (!key) return '••••-••••-••••-••••';
  const trimmed = key.trim();
  if (trimmed.length < 8) return '••••••••••••';
  return `${trimmed.slice(0, 4)}-••••-••••-${trimmed.slice(-4)}`;
}

/**
 * Resolves the primary URL to open the YouTube Channel or stream directly.
 */
export function getYouTubeChannelUrl(channelInput?: string, videoId: string = DEFAULT_CAMERA_VIDEO_ID): string {
  if (videoId && isRtmpStreamKeyOrUrl(videoId)) {
    return `https://www.youtube.com/channel/${CHALKTECH_CHANNEL_ID}/live`;
  }
  if (videoId && /^UC[a-zA-Z0-9_-]{22}$/.test(videoId.trim())) {
    return `https://www.youtube.com/channel/${videoId.trim()}/live`;
  }
  if (channelInput && channelInput.trim()) {
    const info = extractYouTubeChannelInfo(channelInput);
    if (info.channelUrl) return info.channelUrl;
  }
  return `https://www.youtube.com/watch?v=${videoId || DEFAULT_CAMERA_VIDEO_ID}`;
}

export const isRtmpStreamKeyOrUrl = (val: string): boolean => {
  if (!val) return false;
  const trimmed = val.trim();
  if (/^rtmps?:\/\//i.test(trimmed)) return true;
  if (/^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/i.test(trimmed)) return true;
  return false;
};

export const isLocalIpAddress = (val: string): boolean => {
  if (!val) return false;
  const trimmed = val.trim();
  return /^(https?:\/\/)?(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.|localhost)/i.test(trimmed);
};

export const formatLocalIpUrl = (val: string): string => {
  const trimmed = val.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
};

export type StreamPlayMode = 'video' | 'channel' | 'demo' | 'webcam';

const STALE_OR_LEGACY_VIDEO_IDS = new Set([
  'OFFLINE',
  'D9NvW7EA1B0',
  '9gkrkcqHQ78',
  'wUmvCR2YBMQ',
  '36w5VpxTmtk',
  'UCI8_yRov8jX_M8q4p8uE47w',
  CHALKTECH_CHANNEL_ID,
]);

export function isStaleOrLegacyVideoId(val?: string | null): boolean {
  if (!val) return true;
  const trimmed = val.trim();
  if (!trimmed) return true;
  return STALE_OR_LEGACY_VIDEO_IDS.has(trimmed) || isRtmpStreamKeyOrUrl(trimmed);
}

/**
 * Generates the embed URL for either a direct live video ID, a channel live stream, or a demo stream.
 * Includes enablejsapi=1 so DVR Rewind Markers can programmatically seek the YouTube player.
 */
export function buildYouTubeEmbedSrc(options: {
  videoId: string;
  channelId?: string;
  mode?: StreamPlayMode;
}): string {
  const { videoId, channelId, mode = 'video' } = options;

  if (mode === 'demo') {
    return `https://www.youtube.com/embed/${DEMO_NATURE_VIDEO_ID}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&loop=1&playlist=${DEMO_NATURE_VIDEO_ID}`;
  }

  const rawId = (videoId || DEFAULT_CAMERA_VIDEO_ID).trim();
  const cleanVideoId = isStaleOrLegacyVideoId(rawId) ? DEFAULT_CAMERA_VIDEO_ID : rawId;

  // If cleanVideoId is a 24-char YouTube Channel ID (UC...), use the permanent channel live stream endpoint
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(cleanVideoId)) {
    return `https://www.youtube.com/embed/live_stream?channel=${cleanVideoId}&autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`;
  }

  // Only use channel mode if cleanVideoId is not a valid 11-character YouTube video ID
  if (mode === 'channel' && !/^[a-zA-Z0-9_-]{11}$/.test(cleanVideoId)) {
    const targetChannel = (channelId && /^UC[a-zA-Z0-9_-]{22}$/.test(channelId.trim()))
      ? channelId.trim()
      : CHALKTECH_CHANNEL_ID;
    return `https://www.youtube.com/embed/live_stream?channel=${targetChannel}&autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`;
  }

  return `https://www.youtube.com/embed/${cleanVideoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`;
}


