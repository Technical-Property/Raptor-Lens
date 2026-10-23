export interface PtzPreset {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  target: string;
  distanceKm: string;
  azimuth: string;
  zoom: string;
  focusSubject: string;
  weatherAspect: string;
  typicalSpecies: string[];
  description: string;
  dwellSeconds: number;
}

export interface BarburySummitWeather {
  temperatureC: number;
  windChillC: number;
  windSpeedKt: number;
  windGustKt: number;
  windDirection: string;
  windBearingDeg: number;
  cloudBaseM: number;
  cloudCover: string;
  visibilityKm: number;
  pressureHpa: number;
  pressureTendency: 'Rising' | 'Steady' | 'Falling';
  soaringLiftRating: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'LOW';
  walkerAdvisory: string;
  lastUpdated: string;
  sunsetTime?: string;
  goldenHourTime?: string;
}

export interface EducationalChallenge {
  id: string;
  title: string;
  scenario: string;
  clues: string[];
  options: {
    speciesName: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export const BARBURY_PTZ_PRESETS: PtzPreset[] = [
  {
    id: 'hackpen-hill',
    name: 'Rolling View 1: Hackpen Hill View',
    shortName: '1. Hackpen Hill View',
    icon: '⛰️',
    target: 'Hackpen Hill Escarpment & Ridgeway Scarp (271m ASL)',
    distanceKm: '2.8 km',
    azimuth: '165° SSE',
    zoom: '25x Optical',
    focusSubject: 'Hackpen Chalk Ridge & Thermal Lift Corridor',
    weatherAspect: 'Horizon visibility & cloud base along the Marlborough Downs scarp',
    typicalSpecies: ['Red Kite', 'Common Kestrel', 'Peregrine Falcon'],
    description: 'Sweeping telephoto view across towards Hackpen Hill along The Ridgeway escarpment. Prime sector for spotting Red Kites riding slope lift and checking long-range downland visibility.',
    dwellSeconds: 60,
  },
  {
    id: 'barbury-fort',
    name: 'Rolling View 2: Barbury Fort View',
    shortName: '2. Barbury Fort View',
    icon: '🏰',
    target: 'Barbury Castle Iron Age Hillfort Ramparts (268m ASL)',
    distanceKm: '3.0 km',
    azimuth: '195° SSW',
    zoom: '30x Telephoto',
    focusSubject: 'Summit Earthworks, Trig Point & Ridgeline Sky',
    weatherAspect: 'Direct view of summit scarp cloud deck & incoming westerly fronts',
    typicalSpecies: ['Red Kite', 'Common Buzzard', 'Raven'],
    description: 'High-magnification view trained directly onto the ancient chalk ramparts of Barbury Castle. Watch Red Kites and Buzzards kettle in thermal columns rising over the hillfort crest.',
    dwellSeconds: 60,
  },
  {
    id: 'field-view',
    name: 'Rolling View 3: Field View',
    shortName: '3. Field View',
    icon: '🌾',
    target: 'Downland Chalk Pasture & Rough Grass Margin',
    distanceKm: '650 m',
    azimuth: '180° S',
    zoom: '10x Wide-Mid',
    focusSubject: 'Ground Pasture, Field Margin & Vole Habitat',
    weatherAspect: 'Surface wind gusts visible across chalk grass tussocks',
    typicalSpecies: ['Barn Owl', 'Common Kestrel', 'Hen Harrier', 'Short-eared Owl'],
    description: 'Mid-range wide view surveying the downland field floor. Ideal for spotting Kestrels wind-hovering overhead and Barn Owls or winter Harriers quartering low over the rough grass margins.',
    dwellSeconds: 45,
  },
  {
    id: 'perch-view',
    name: 'Rolling View 4: Perch View',
    shortName: '4. Perch View',
    icon: '🦅',
    target: 'Dedicated Raptor Lookout Perch & Field Boundary Post',
    distanceKm: '420 m',
    azimuth: '210° SW',
    zoom: '18x Optical',
    focusSubject: 'Elevated Hunting Perch & Boundary Fence Line',
    weatherAspect: 'Sheltered lee-side perch favoured in brisk ridge winds',
    typicalSpecies: ['Common Kestrel', 'Common Buzzard', 'Little Owl', 'Barn Owl'],
    description: 'Focused optical lock on our field boundary raptor perch. Buzzards, Kestrels, and Little Owls regularly use this station as a resting and lookout post to scan the surrounding turf.',
    dwellSeconds: 45,
  }
];

export const BARBURY_SUMMIT_WEATHER: BarburySummitWeather = {
  temperatureC: 14.2,
  windChillC: 11.5,
  windSpeedKt: 19,
  windGustKt: 28,
  windDirection: 'SSW',
  windBearingDeg: 205,
  cloudBaseM: 420,
  cloudCover: 'Scattered Cumulus (4/8)',
  visibilityKm: 18,
  pressureHpa: 1015,
  pressureTendency: 'Rising',
  soaringLiftRating: 'EXCELLENT',
  walkerAdvisory: 'Brisk, invigorating south-westerly wind on the exposed ramparts. Chalk tracks dry underfoot. Superb raptor soaring conditions along the scarp.',
  lastUpdated: 'Live telemetry synced',
};

export const EDUCATIONAL_ID_CHALLENGES: EducationalChallenge[] = [
  {
    id: 'challenge-01',
    title: 'Mystery Downland Raptor: The Wind-Hover Specialist',
    scenario: 'Scanning the camera over the Barbury Castle northern ramparts in a 20-knot headwind, you spot a medium-sized bird suspended in mid-air. Its head stays completely stationary while its long, narrow wings flutter with rapid beats, pointing downward into the rough chalk pasture.',
    clues: [
      'Tail: Long and slender with a dark terminal sub-band',
      'Flight Style: Stationary hovering into the headwind with minimal drift',
      'Habitat: Exposed downland ramparts and road verge margins',
      'Diet: Primarily field voles (Microtus agrestis) detected by UV urine trails'
    ],
    options: [
      {
        speciesName: 'Common Kestrel (Falco tinnunculus)',
        isCorrect: true,
        explanation: 'Correct! The Kestrel is Britain’s premier "wind-hover" specialist. It possesses specialized head-stabilization optics and scans for vole scent marks from a fixed hover.'
      },
      {
        speciesName: 'Red Kite (Milvus milvus)',
        isCorrect: false,
        explanation: 'Incorrect. Red Kites have huge 180cm wingspans and a deeply forked tail, soaring and wheeling on thermals rather than performing stationary headwind hovers.'
      },
      {
        speciesName: 'Common Buzzard (Buteo buteo)',
        isCorrect: false,
        explanation: 'Incorrect. While Buzzards occasionally hang clumsily on slope lift or hover briefly, they lack the slender sickle wings and rapid beating hover of a Kestrel.'
      },
      {
        speciesName: 'Peregrine Falcon (Falco peregrinus)',
        isCorrect: false,
        explanation: 'Incorrect. Peregrines hunt in high-speed level pursuit or vertical stoops at 200+ mph, not stationary vole-hunting hovers over pasture.'
      }
    ]
  },
  {
    id: 'challenge-02',
    title: 'Mystery Downland Raptor: The Angled Wing Soarer',
    scenario: 'High overhead above the hillfort, a large reddish-brown raptor wheels lazily in a thermal. When it banks, you clearly see pale whitish patches under the wingtips and a distinctive, deeply cleft V-notch in its long rufous tail acting as a steering rudder.',
    clues: [
      'Tail: Deeply notched V-fork tail, constantly twisting in flight',
      'Wingspan: Very large (~175-195 cm) with long fingered primary feathers',
      'Plumage: Rich chestnut-red body with pale greyish-white head',
      'Action: Gliding effortlessly with dihedral angled wings'
    ],
    options: [
      {
        speciesName: 'Red Kite (Milvus milvus)',
        isCorrect: true,
        explanation: 'Correct! The deeply forked tail and white underwing "carpal patches" are unmistakable diagnostics for the Red Kite, an iconic Wiltshire success story.'
      },
      {
        speciesName: 'Common Buzzard (Buteo buteo)',
        isCorrect: false,
        explanation: 'Incorrect. The Common Buzzard has a broad, rounded fan tail without any notch or fork, and broader, rounded wingtips.'
      },
      {
        speciesName: 'Marsh Harrier (Circus aeruginosus)',
        isCorrect: false,
        explanation: 'Incorrect. Harriers fly with wings in a shallow V low over reedbeds and crops, but have a square or rounded tail, never a deeply cleft fork.'
      },
      {
        speciesName: 'Golden Eagle (Aquila chrysaetos)',
        isCorrect: false,
        explanation: 'Incorrect. Golden Eagles do not have a forked tail and are not resident on the chalk downlands of southern England.'
      }
    ]
  }
];
