/**
 * Curated UK Field Optics & Ridgeway Trail Kit Recommendations
 * Update AMAZON_UK_AFFILIATE_TAG with your Amazon Associates UK tracking ID (e.g. 'raptorlens-21')
 * to earn commission on every qualifying purchase.
 */

export const AMAZON_UK_AFFILIATE_TAG = 'raptorlens-21';

export interface FieldKitItem {
  id: string;
  name: string;
  category: 'Binoculars' | 'Navigation' | 'Field Guide' | 'Camera Optics';
  badge: string;
  priceRange: string;
  bestFor: string;
  summary: string;
  amazonSearchQuery: string;
}

export const RECOMMENDED_FIELD_KIT: FieldKitItem[] = [
  {
    id: 'hawke-nature-trek-8x42',
    name: 'Hawke Nature-Trek 8x42 Waterproof Binoculars',
    category: 'Binoculars',
    badge: 'BEST VALUE UK OPTICS',
    priceRange: '£139 – £159',
    bestFor: 'Tracking Red Kites & Common Buzzards in flight',
    summary: 'Wide field of view (8x magnification), nitrogen-purged fog-proof polycarbonate body ideal for brisk Barbury Castle & Hackpen Hill winds.',
    amazonSearchQuery: 'Hawke+Nature+Trek+8x42+Binoculars',
  },
  {
    id: 'vortex-diamondback-10x42',
    name: 'Vortex Optics Diamondback HD 10x42 Binoculars',
    category: 'Binoculars',
    badge: 'LONG-RANGE SCARP PICK',
    priceRange: '£219 – £249',
    bestFor: 'Distant Kestrels, Peregrines & Hen Harriers',
    summary: 'Extra-low dispersion HD glass with 10x reach for picking out hovering Kestrels and perched raptors across the 4.5 km Hackpen chalk bowl.',
    amazonSearchQuery: 'Vortex+Optics+Diamondback+HD+10x42+Binoculars',
  },
  {
    id: 'os-explorer-157',
    name: 'OS Explorer Map 157: Marlborough & Savernake Forest (Weatherproof)',
    category: 'Navigation',
    badge: 'ESSENTIAL TRAIL MAP',
    priceRange: '£10 – £16',
    bestFor: 'Barbury Castle, Hackpen Hill, Avebury & Fyfield Down',
    summary: 'Official Ordnance Survey 1:25,000 scale walker map covering the exact Ridgeway National Trail, field boundaries, and sarsen valleys seen on our camera.',
    amazonSearchQuery: 'OS+Explorer+Map+157+Marlborough+Savernake+Active',
  },
  {
    id: 'collins-bird-guide',
    name: 'Collins Bird Guide (3rd Edition, Svensson, Mullarney & Zetterström)',
    category: 'Field Guide',
    badge: '#1 UK RAPTOR ID GUIDE',
    priceRange: '£18 – £25',
    bestFor: 'Separating Buzzard, Kite, Harrier & Falcon silhouettes',
    summary: 'The definitive British & European bird identification handbook with detailed underwing flight plates for every UK bird of prey.',
    amazonSearchQuery: 'Collins+Bird+Guide+3rd+Edition',
  },
];

export function buildAmazonUkAffiliateUrl(query: string): string {
  const tagParam = AMAZON_UK_AFFILIATE_TAG ? `&tag=${encodeURIComponent(AMAZON_UK_AFFILIATE_TAG)}` : '';
  return `https://www.amazon.co.uk/s?k=${query}${tagParam}`;
}
