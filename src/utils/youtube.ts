/**
 * YouTube and Camera integration utilities for RaptorLens UK:
 * Handles stream URL parsing, studio livestreams, channel info extraction,
 * device webcam inputs, and reliable embedded playback.
 */

// Verified 24/7 active live raptor & wildlife streams
export const DEFAULT_CAMERA_VIDEO_ID = 'D9NvW7EA1B0'; // Official RaptorLens UK Station Live Stream (Rolling PTZ)
export const RAPTORLENS_STATION_VIDEO_ID = 'D9NvW7EA1B0'; // Official RaptorLens UK Live Cam
export const UK_OWL_KESTREL_VIDEO_ID = 'q28Q9_qzqyg'; // Robert E Fuller UK Barn Owl, Kestrel & Tawny Owl Live Cam
export const PEREGRINE_UK_VIDEO_ID = 'GAxREl6-fJs';   // Buckinghamshire UK Peregrine Falcon Cam 1
export const OSPREY_UK_VIDEO_ID = 'V08ET209nvU';       // Rutland Osprey Project (Manton Bay, UK) Live Cam
export const EAGLE_LIVE_VIDEO_ID = 'B4-L2nfGcuE';      // Big Bear Bald Eagle Live Nest (Cam 1)
export const EAGLE_WIDE_VIDEO_ID = '41eq4VzCYc4';      // Big Bear Bald Eagle Wide Lookout (Cam 2)
export const CORNELL_FEEDER_VIDEO_ID = 'x10vL6_47Dw';  // Cornell Lab Live FeederWatch
export const DEMO_NATURE_VIDEO_ID = 'B4-L2nfGcuE';     // Fallback verified stream
export const DEMO_LIVE_VIDEO_ID = '21X5lGlDOfg';       // NASA Earth Live HD broadcast

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
    name: 'RaptorLens Station Cam (Rolling 4-View Tour)',
    shortLabel: '📡 Station Cam (Rolling)',
    badge: 'PRIMARY STATION',
    videoId: RAPTORLENS_STATION_VIDEO_ID,
    channelName: 'RaptorLens UK Official Broadcast',
    channelUrl: 'https://youtube.com/live/D9NvW7EA1B0',
    species: 'Red Kite, Buzzard, Kestrel & Ridge Weather',
    location: 'Hackpen Hill • Barbury Fort • Field • Perch',
    description: 'Official rolling PTZ camera cycling across Hackpen Hill View, Barbury Fort View, Field View, and Perch View.',
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

  // 5. If already an 11-char ID without path delimiters
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

/**
 * Resolves the primary URL to open the YouTube Channel or stream directly.
 */
export function getYouTubeChannelUrl(channelInput?: string, videoId: string = DEFAULT_CAMERA_VIDEO_ID): string {
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

/**
 * Generates the embed URL for either a direct live video ID, a channel live stream, or a demo stream.
 */
export function buildYouTubeEmbedSrc(options: {
  videoId: string;
  channelId?: string;
  mode?: StreamPlayMode;
}): string {
  const { videoId, channelId, mode = 'video' } = options;

  if (mode === 'demo') {
    return `https://www.youtube.com/embed/${DEMO_NATURE_VIDEO_ID}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${DEMO_NATURE_VIDEO_ID}`;
  }

  if (mode === 'channel' && channelId && channelId.startsWith('UC')) {
    return `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&playsinline=1`;
  }

  const cleanVideoId = videoId || DEFAULT_CAMERA_VIDEO_ID;
  return `https://www.youtube.com/embed/${cleanVideoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&playsinline=1`;
}
