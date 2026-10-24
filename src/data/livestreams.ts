import { LivestreamCam } from '../types/raptor';

/**
 * SOLE OFFICIAL HOSTED LIVESTREAM RIG
 * In accordance with UK copyright law (CDPA 1988), broadcasting guidelines,
 * and conservation ethics, this website exclusively hosts and embeds the camera
 * rig directly owned and operated by the station (CAM 01: Barbury Castle Downland Field Cam).
 */
export const LIVESTREAM_CHANNELS: LivestreamCam[] = [
  {
    id: 'stream-barbury-castle-livecam',
    title: 'RaptorLens UK Downland & Summit Live Cam (4K Optical)',
    location: 'Wessex Escarpment / Downland Roost (Facing Barbury Airspace)',
    channelName: 'RaptorLens UK Live Station',
    youtubeId: 'D9NvW7EA1B0', // Official RaptorLens UK Live Stream
    channelUrl: 'https://youtube.com/live/D9NvW7EA1B0',
    status: 'LIVE',
    description: 'Official rolling PTZ camera cycling across Hackpen Hill View, Barbury Fort View, Field View, and Perch View to track downland raptors and live ridge weather.',
    elevation: '268m ASL (Barbury & Hackpen Sector)',
    gridRef: 'SU 149 763 (Target)',
    viewers: 412,
    isCommunityFieldCam: true,
    distanceToSubjectKm: 3.0,
    opticalZoom: '30x Rolling PTZ Tour',
    panBearing: 'Hackpen Hill • Barbury Fort • Field • Perch',
    sensorSpecs: '4K Hikvision AcuSense • 4-Zone Rolling Guard Tour',
    spotterReports: [
      {
        id: 'spot-01',
        timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
        timeAgo: '14m ago',
        callsign: 'KITE-WATCHER-07',
        speciesName: 'Red Kite',
        count: 4,
        sectorQuadrant: 'Northern Ramparts',
        description: '4 birds spiralling in thermal lift directly over the northern tree clumps of the ramparts.',
        verified: true,
      },
      {
        id: 'spot-02',
        timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
        timeAgo: '48m ago',
        callsign: 'RIDGEWAY-VANGUARD',
        speciesName: 'Common Buzzard',
        count: 2,
        sectorQuadrant: 'Chalk Valley Bottom',
        description: 'Adult buzzard hovering briefly over the rape field margin before dropping into rough grass.',
        verified: true,
      },
      {
        id: 'spot-03',
        timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
        timeAgo: '1h 50m ago',
        callsign: 'CHALK-THERMAL-99',
        speciesName: 'Common Kestrel',
        count: 1,
        sectorQuadrant: 'North-West Escarpment',
        description: 'Classic stationary wind-hover lock against the northerly breeze.',
        verified: true,
      }
    ]
  }
];
