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
    youtubeId: 'jDkhKX5-i_g', // Official RaptorLens UK Live Stream
    channelUrl: '',
    status: 'LIVE',
    description: 'Official rolling PTZ camera cycling across Hackpen Hill View, Barbury Fort View, Field View, and Perch View to track downland raptors and live ridge weather.',
    elevation: '268m ASL (Barbury & Hackpen Sector)',
    gridRef: 'SU 149 763 (Target)',
    viewers: 1,
    isCommunityFieldCam: true,
    distanceToSubjectKm: 3.0,
    opticalZoom: '30x Rolling PTZ Tour',
    panBearing: 'Hackpen Hill • Barbury Fort • Field • Perch',
    sensorSpecs: '4K Hikvision AcuSense • 4-Zone Rolling Guard Tour',
    spotterReports: []
  }
];
