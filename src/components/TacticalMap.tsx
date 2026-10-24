import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Hotspot, SightingLog } from '../types/raptor';
import { SectorId } from '../types/sector';
import { UK_SECTORS } from '../data/sectors';
import { 
  Crosshair, 
  Layers, 
  Navigation, 
  Wind, 
  Eye, 
  Compass, 
  Plus, 
  Maximize2, 
  ShieldAlert, 
  Satellite, 
  Mountain, 
  Map as MapIcon, 
  ExternalLink, 
  Clock, 
  HelpCircle, 
  X, 
  Sparkles, 
  Info, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Search,
  Video
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';
import { evaluateCoordinatePrivacy } from '../utils/schedule1Privacy';
import { 
  getSightingRecency, 
  getRecencyCounts, 
  RecencyWindow, 
  TRAFFIC_LIGHT_TIERS 
} from '../utils/recency';

export type BasemapMode = 'tactical-dark' | 'satellite' | 'google-satellite' | 'opentopo-contour' | 'osm-trails';
export type QuickPreset = 'all' | 'live' | 'soaring' | 'schedule1' | 'falcons' | 'kites';
export type DrawerTab = 'layers' | 'basemap' | 'filter' | 'signals';

interface TacticalMapProps {
  hotspots: Hotspot[];
  sightings: SightingLog[];
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot) => void;
  onSelectSighting: (sighting: SightingLog) => void;
  onLogAtCoordinate: (lat: number, lng: number, locationGuess?: string) => void;
  onInspectAudit?: (sighting: SightingLog) => void;
  activeSectorId?: SectorId;
  onSelectSector?: (sectorId: SectorId) => void;
  onOpenLiveCam?: () => void;
  cleanMode?: boolean;
  onToggleCleanMode?: (isClean: boolean) => void;
}

const getBasemapLayer = (mode: BasemapMode): L.Layer => {
  if (mode === 'google-satellite' || mode === 'satellite') {
    return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
      maxNativeZoom: 18,
      maxZoom: 19,
    });
  } else if (mode === 'opentopo-contour') {
    return L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; OpenTopoMap (SRTM) &copy; OpenStreetMap contributors',
      maxNativeZoom: 17,
      maxZoom: 19,
    });
  } else if (mode === 'osm-trails') {
    return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors &bull; Ridgeway &amp; Downland Public Rights of Way',
      maxNativeZoom: 19,
      maxZoom: 19,
    });
  } else {
    // Tactical Dark: Esri Dark Gray Base + Reference Labels
    const base = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ &copy; OpenStreetMap contributors',
      maxNativeZoom: 16,
      maxZoom: 19,
    });
    const labels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
      maxNativeZoom: 16,
      maxZoom: 19,
    });
    return L.layerGroup([base, labels]);
  }
};

/**
 * Safely navigates the Leaflet map without triggering hyperbolic geometry NaN crashes.
 * When the map container has 0x0 dimensions (e.g. during tab switching or initial DOM mount),
 * Leaflet's flyTo divides by w0=0 resulting in "Invalid LatLng object: (NaN, NaN)".
 * safeNavigateMap detects non-laid out dimensions and cleanly falls back to mathematically safe setView.
 */
const safeNavigateMap = (
  map: L.Map | null,
  coords: [number, number] | number[] | undefined | null,
  zoom: number,
  animate = true
) => {
  if (!map || !coords || !Array.isArray(coords) || coords.length < 2) return;
  const lat = Number(coords[0]);
  const lng = Number(coords[1]);
  const targetZoom = Number.isFinite(zoom) ? zoom : 12;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  try {
    const size = map.getSize();
    const isVisibleAndSized = size && size.x > 30 && size.y > 30;

    if (!isVisibleAndSized || !animate) {
      map.setView([lat, lng], targetZoom);
      return;
    }

    map.flyTo([lat, lng], targetZoom, {
      duration: 1.1,
      easeLinearity: 0.25,
    });
  } catch {
    try {
      map.setView([lat, lng], targetZoom);
    } catch {
      // safely ignored
    }
  }
};

export const TacticalMap: React.FC<TacticalMapProps> = ({
  hotspots,
  sightings,
  selectedHotspot,
  onSelectHotspot,
  onSelectSighting,
  onLogAtCoordinate,
  onInspectAudit,
  activeSectorId = 'ridgeway-wessex',
  onSelectSector,
  onOpenLiveCam,
  cleanMode = false,
  onToggleCleanMode,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.Layer | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const sightingsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const corridorLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [basemapMode, setBasemapMode] = useState<BasemapMode>(() => {
    try {
      const saved = localStorage.getItem('raptorlens_basemap');
      if (saved && (saved === 'osm-trails' || saved === 'tactical-dark' || saved === 'satellite' || saved === 'google-satellite' || saved === 'opentopo-contour')) {
        return saved as BasemapMode;
      }
      return 'osm-trails';
    } catch {
      return 'osm-trails';
    }
  });
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showSightings, setShowSightings] = useState(true);
  const [showThermalCorridors, setShowThermalCorridors] = useState(!cleanMode);
  const [showRangeRings, setShowRangeRings] = useState(!cleanMode);

  // Sync cleanMode prop changes
  useEffect(() => {
    setShowThermalCorridors(!cleanMode);
    setShowRangeRings(!cleanMode);
  }, [cleanMode]);
  const [activeFilterSpecies, setActiveFilterSpecies] = useState<string>('ALL');
  const [recencyWindow, setRecencyWindow] = useState<RecencyWindow>('all');
  const [showTrafficLightModal, setShowTrafficLightModal] = useState<boolean>(false);
  const [showSchedule1Modal, setShowSchedule1Modal] = useState<boolean>(false);

  // Zen / Clean Map Mode & Compact Drawer state (Default collapsed on mobile < 768px so map is unobstructed)
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  });
  const [activeDrawerTab, setActiveDrawerTab] = useState<DrawerTab>('layers');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickPreset, setQuickPreset] = useState<QuickPreset>('all');

  // Dynamic counts for traffic light recency horizons
  const recencyCounts = useMemo(() => getRecencyCounts(sightings), [sightings]);

  // Keyboard shortcut listener ('Z' for Clean Map / Zen Mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === 'z' || e.key === 'Z') {
        tacticalAudio.playRadarPing(880);
        setIsZenMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Invalidate Leaflet map size on Zen Mode toggle for seamless resizing
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isZenMode]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialSector = UK_SECTORS.find((s) => s.id === activeSectorId) || UK_SECTORS[0];
    const initialCenter: [number, number] = (initialSector && Array.isArray(initialSector.center) && Number.isFinite(initialSector.center[0]) && Number.isFinite(initialSector.center[1]))
      ? initialSector.center
      : [51.465, -1.815];
    const initialZoom = (initialSector && Number.isFinite(initialSector.zoom)) ? initialSector.zoom : 12;

    // Centered on Marlborough Downs / Ridgeway corridor or active sector
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false,
    });

    // Initial Tile Layer
    const initialTileLayer = getBasemapLayer(basemapMode).addTo(map);
    baseTileLayerRef.current = initialTileLayer;

    // Reposition zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Layer groups
    const corridorGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);
    const sightingsGroup = L.layerGroup().addTo(map);

    corridorLayerGroupRef.current = corridorGroup;
    markersLayerGroupRef.current = markersGroup;
    sightingsLayerGroupRef.current = sightingsGroup;
    mapInstanceRef.current = map;

    // Track mouse coordinate for tactical reticle
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (e?.latlng && Number.isFinite(e.latlng.lat) && Number.isFinite(e.latlng.lng)) {
        setMouseCoords({ lat: Number(e.latlng.lat.toFixed(4)), lng: Number(e.latlng.lng.toFixed(4)) });
      }
    });

    map.on('mouseout', () => {
      setMouseCoords(null);
    });

    // Allow user to click anywhere on map to log a sighting
    map.on('click', (e: L.LeafletMouseEvent) => {
      tacticalAudio.playRadarPing(920);
      const sector = UK_SECTORS.find((s) => s.id === activeSectorId);
      const locGuess = sector ? `${sector.shortName} Sector` : 'UK Downland Sector';
      if (e?.latlng && Number.isFinite(e.latlng.lat) && Number.isFinite(e.latlng.lng)) {
        onLogAtCoordinate(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4)), locGuess);
      }
    });

    // Auto-invalidate size whenever map container changes dimensions (e.g. tab switches, window resize)
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.invalidateSize();
        } catch {
          // ignore
        }
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Smooth fly to active sector when sector changes (guarded against 0x0 DOM dimension NaN crash)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeSectorId) return;

    const targetSector = UK_SECTORS.find((s) => s.id === activeSectorId);
    if (targetSector && Array.isArray(targetSector.center) && Number.isFinite(Number(targetSector.center[0])) && Number.isFinite(Number(targetSector.center[1]))) {
      safeNavigateMap(
        map,
        [Number(targetSector.center[0]), Number(targetSector.center[1])],
        Number.isFinite(targetSector.zoom) ? targetSector.zoom : 12
      );
    }
  }, [activeSectorId]);

  // Hybrid Basemap Switching (Tactical Dark vs Esri Satellite vs OpenTopo Contour vs OSM Trails)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    const newLayer = getBasemapLayer(basemapMode);
    newLayer.addTo(map);
    // Ensure base tile layer stays behind markers and overlays
    if ('bringToBack' in newLayer && typeof (newLayer as any).bringToBack === 'function') {
      (newLayer as any).bringToBack();
    } else if (newLayer instanceof L.LayerGroup) {
      newLayer.eachLayer((l) => {
        if ('bringToBack' in l && typeof (l as any).bringToBack === 'function') {
          (l as any).bringToBack();
        }
      });
    }
    baseTileLayerRef.current = newLayer;
    try {
      localStorage.setItem('raptorlens_basemap', basemapMode);
    } catch {
      // ignore
    }
  }, [basemapMode]);

  // Update Thermal Corridor & Range Rings for active sector (or all sectors)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const corridorGroup = corridorLayerGroupRef.current;
    if (!map || !corridorGroup) return;

    corridorGroup.clearLayers();

    const sectorColors: Record<string, string> = {
      'ridgeway-wessex': '#f59e0b', // amber
      'salisbury-plain': '#10b981', // emerald
      'chilterns': '#06b6d4',      // cyan
      'cotswolds': '#8b5cf6',       // violet
      'south-downs': '#f43f5e',     // rose
    };

    if (showThermalCorridors) {
      if (activeSectorId === 'all') {
        // Draw all individual sector corridors with distinctive tactical colors
        UK_SECTORS.filter((s) => s.id !== 'all').forEach((sec) => {
          const col = sectorColors[sec.id] || '#f59e0b';
          const validTrack = (sec.corridorTrack || [])
            .filter((pt) => Array.isArray(pt) && pt.length >= 2 && Number.isFinite(Number(pt[0])) && Number.isFinite(Number(pt[1])))
            .map((pt) => [Number(pt[0]), Number(pt[1])] as [number, number]);

          if (validTrack.length >= 2) {
            L.polyline(validTrack, {
              color: col,
              weight: 3,
              opacity: 0.8,
              dashArray: '8, 8',
            }).bindTooltip(`⚡ ${sec.thermalCorridorName}`, {
              permanent: false,
              className: 'bg-neutral-900 text-neutral-100 font-mono-tactical text-xs border border-neutral-700 p-1 rounded',
            }).addTo(corridorGroup);
          }

          const validZone = (sec.thermalZone || [])
            .filter((pt) => Array.isArray(pt) && pt.length >= 2 && Number.isFinite(Number(pt[0])) && Number.isFinite(Number(pt[1])))
            .map((pt) => [Number(pt[0]), Number(pt[1])] as [number, number]);

          if (validZone.length >= 3) {
            L.polygon(validZone, {
              color: col,
              weight: 1.5,
              fillColor: col,
              fillOpacity: 0.08,
              dashArray: '4, 6',
            }).bindTooltip(`${sec.shortName}: Thermal Soaring Sector`, {
              className: 'bg-neutral-900 text-neutral-200 font-mono-tactical text-xs border border-neutral-700 p-1 rounded',
            }).addTo(corridorGroup);
          }
        });
      } else {
        const sector = UK_SECTORS.find((s) => s.id === activeSectorId) || UK_SECTORS[0];
        const col = sectorColors[sector.id] || '#f59e0b';

        const validTrack = (sector.corridorTrack || [])
          .filter((pt) => Array.isArray(pt) && pt.length >= 2 && Number.isFinite(Number(pt[0])) && Number.isFinite(Number(pt[1])))
          .map((pt) => [Number(pt[0]), Number(pt[1])] as [number, number]);

        if (validTrack.length >= 2) {
          L.polyline(validTrack, {
            color: col,
            weight: 3.5,
            opacity: 0.85,
            dashArray: '8, 8',
          }).bindTooltip(`⚡ ${sector.thermalCorridorName}`, {
            permanent: false,
            className: 'bg-neutral-900 text-amber-300 font-mono-tactical text-xs border border-amber-500/40 p-1 rounded',
          }).addTo(corridorGroup);
        }

        const validZone = (sector.thermalZone || [])
          .filter((pt) => Array.isArray(pt) && pt.length >= 2 && Number.isFinite(Number(pt[0])) && Number.isFinite(Number(pt[1])))
          .map((pt) => [Number(pt[0]), Number(pt[1])] as [number, number]);

        if (validZone.length >= 3) {
          L.polygon(validZone, {
            color: '#10b981',
            weight: 1.5,
            fillColor: '#10b981',
            fillOpacity: 0.08,
            dashArray: '4, 6',
          }).bindTooltip(`Primary Chalk Updraft Zone: ${sector.name}`, {
            className: 'bg-neutral-900 text-emerald-400 font-mono-tactical text-xs border border-emerald-500/40 p-1 rounded',
          }).addTo(corridorGroup);
        }
      }
    }

    if (showRangeRings) {
      const activeSector = UK_SECTORS.find((s) => s.id === activeSectorId) || UK_SECTORS[0];
      const ringCenters = activeSector.radarRingCenters || [];

      ringCenters.forEach((coords) => {
        if (Array.isArray(coords) && coords.length >= 2) {
          const rLat = Number(coords[0]);
          const rLng = Number(coords[1]);
          if (Number.isFinite(rLat) && Number.isFinite(rLng)) {
            L.circle([rLat, rLng], {
              radius: 2500,
              color: '#06b6d4',
              weight: 1,
              fill: false,
              opacity: 0.35,
              dashArray: '3, 6',
            }).addTo(corridorGroup);
          }
        }
      });
    }
  }, [showThermalCorridors, showRangeRings, activeSectorId]);

  // Update Hotspot Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (!showHotspots) return;

    hotspots.forEach((spot) => {
      if (!spot.coordinates || !Array.isArray(spot.coordinates) || spot.coordinates.length < 2) {
        return;
      }
      const spotLat = Number(spot.coordinates[0]);
      const spotLng = Number(spot.coordinates[1]);
      if (!Number.isFinite(spotLat) || !Number.isFinite(spotLng)) {
        return;
      }

      const isSelected = selectedHotspot?.id === spot.id;

      // Create tactical glowing beacon HTML marker
      const markerHtml = `
        <div class="relative group cursor-pointer flex flex-col items-center">
          <div class="absolute -inset-2 rounded-full ${isSelected ? 'bg-amber-500/30 animate-ping' : 'bg-amber-500/10 animate-radar-pulse'}"></div>
          <div class="w-8 h-8 rounded-full border-2 ${isSelected ? 'border-amber-400 bg-amber-500/40 shadow-lg shadow-amber-500/50' : 'border-amber-500/80 bg-neutral-900/90'} flex items-center justify-center text-amber-300 backdrop-blur-sm transition-transform hover:scale-125">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="22" y1="12" x2="18" y2="12"></line>
              <line x1="6" y1="12" x2="2" y2="12"></line>
              <line x1="12" y1="6" x2="12" y2="2"></line>
              <line x1="12" y1="22" x2="12" y2="18"></line>
            </svg>
          </div>
          <div class="mt-1 px-1.5 py-0.5 rounded bg-neutral-950/90 border border-amber-500/40 text-[10px] font-mono-tactical font-semibold text-amber-200 shadow-md whitespace-nowrap">
            ${(spot.name.replace('RSPB ', '') || 'Site').split(' ')[0]} • ${spot.elevationM}m
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'tactical-hotspot-icon',
        html: markerHtml,
        iconSize: [80, 50],
        iconAnchor: [40, 20],
      });

      const marker = L.marker([spotLat, spotLng], { icon: customIcon });

      const popupContent = document.createElement('div');
      popupContent.className = 'tactical-popup p-1 text-neutral-100';
      popupContent.innerHTML = `
        <div class="flex items-center justify-between border-b border-amber-500/30 pb-2 mb-2">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-[10px] font-mono-tactical uppercase tracking-wider text-amber-400 font-bold">${spot.name.includes('RSPB') ? 'RSPB BIRD RESERVE' : spot.name.includes('Nature Reserve') || spot.name.includes('NNR') ? 'NATURE RESERVE' : 'RAPTOR HOTSPOT'}</span>
          </div>
          <span class="text-[10px] font-mono-tactical text-neutral-400">${spot.gridRef}</span>
        </div>
        <h4 class="font-display-tactical text-sm font-bold text-neutral-100 tracking-wide mb-1">${spot.name}</h4>
        <div class="grid grid-cols-2 gap-1.5 text-[11px] font-mono-tactical text-neutral-300 my-2">
          <div class="bg-neutral-900/90 p-1.5 rounded border border-neutral-800">
            <span class="text-neutral-500 block text-[9px]">ELEVATION</span>
            <span class="text-amber-400 font-bold">${spot.elevationM}m ASL</span>
          </div>
          <div class="bg-neutral-900/90 p-1.5 rounded border border-neutral-800">
            <span class="text-neutral-500 block text-[9px]">THERMAL LIFT</span>
            <span class="text-emerald-400 font-bold">${spot.thermalRating}</span>
          </div>
          <div class="bg-neutral-900/90 p-1.5 rounded border border-neutral-800">
            <span class="text-neutral-500 block text-[9px]">ACTIVE SCOUTS</span>
            <span class="text-cyan-400 font-bold">${spot.activeObservers} In Field</span>
          </div>
          <div class="bg-neutral-900/90 p-1.5 rounded border border-neutral-800">
            <span class="text-neutral-500 block text-[9px]">WIND SWEETSPOT</span>
            <span class="text-indigo-300 font-bold">${spot.bestWindDirections.join(', ')}</span>
          </div>
        </div>
        <div class="text-[11px] text-neutral-300 leading-relaxed line-clamp-2 mb-3">
          ${spot.description}
        </div>
        <div class="flex items-center gap-1.5 pt-1 border-t border-neutral-800">
          <button id="btn-inspect-${spot.id}" class="flex-1 py-1 px-2 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-mono-tactical font-semibold flex items-center justify-center gap-1 cursor-pointer">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            Tactical Dossier
          </button>
          <button id="btn-log-${spot.id}" class="py-1 px-2 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 text-xs font-mono-tactical font-semibold flex items-center justify-center gap-1 cursor-pointer">
            + Log Sighting
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280 });

      marker.on('popupopen', () => {
        const inspectBtn = document.getElementById(`btn-inspect-${spot.id}`);
        const logBtn = document.getElementById(`btn-log-${spot.id}`);

        if (inspectBtn) {
          inspectBtn.onclick = () => {
            tacticalAudio.playRadarPing(1100);
            onSelectHotspot(spot);
          };
        }
        if (logBtn) {
          logBtn.onclick = () => {
            tacticalAudio.playRadarPing(880);
            onLogAtCoordinate(spotLat, spotLng, spot.name);
          };
        }
      });

      marker.on('click', () => {
        tacticalAudio.playRadarPing(800);
        onSelectHotspot(spot);
      });

      marker.addTo(markersGroup);
    });
  }, [hotspots, selectedHotspot, showHotspots]);

  // Update Sighting Radar Markers with Traffic Light Indicators
  useEffect(() => {
    const map = mapInstanceRef.current;
    const sightingsGroup = sightingsLayerGroupRef.current;
    if (!map || !sightingsGroup) return;

    sightingsGroup.clearLayers();

    if (!showSightings) return;

    const q = searchQuery.trim().toLowerCase();

    const filteredSightings = sightings.filter((s) => {
      if (activeFilterSpecies !== 'ALL' && s.speciesId !== activeFilterSpecies) return false;
      
      const rec = getSightingRecency(s.timestamp);
      if (recencyWindow === 'live' && rec.status !== 'live') return false;
      if (recencyWindow === 'today' && rec.hoursAgo >= 24) return false;
      if (recencyWindow === 'recent' && rec.hoursAgo >= 48) return false;
      if (recencyWindow === 'archived' && rec.status !== 'archived') return false;

      // Smart Presets filter
      if (quickPreset === 'live' && rec.status !== 'live') return false;
      if (quickPreset === 'soaring') {
        const beh = (s.behavior || '').toLowerCase();
        const isSoaring = beh.includes('soar') || beh.includes('kettle') || beh.includes('thermal') || beh.includes('glide');
        if (!isSoaring) return false;
      }
      if (quickPreset === 'schedule1' && !s.isSchedule1) return false;
      if (quickPreset === 'falcons') {
        const id = s.speciesId.toLowerCase();
        if (!id.includes('falcon') && !id.includes('kestrel') && !id.includes('hobby') && !id.includes('merlin')) return false;
      }
      if (quickPreset === 'kites') {
        const id = s.speciesId.toLowerCase();
        if (!id.includes('kite') && !id.includes('harrier') && !id.includes('buzzard')) return false;
      }

      // Live search query matching
      if (q) {
        const matchesSpecies = (s.speciesName || '').toLowerCase().includes(q);
        const matchesLoc = (s.locationName || '').toLowerCase().includes(q);
        const matchesCallsign = (s.observerCallsign || '').toLowerCase().includes(q);
        const matchesNotes = (s.notes || '').toLowerCase().includes(q);
        const matchesHabitat = (s.habitat || '').toLowerCase().includes(q);
        if (!matchesSpecies && !matchesLoc && !matchesCallsign && !matchesNotes && !matchesHabitat) {
          return false;
        }
      }

      return true;
    });

    filteredSightings.forEach((sighting) => {
      // Validate raw sighting coordinates
      const rawCoords = sighting.coordinates;
      if (!rawCoords || !Array.isArray(rawCoords) || rawCoords.length < 2) {
        return;
      }
      const rawLat = Number(rawCoords[0]);
      const rawLng = Number(rawCoords[1]);
      if (!Number.isFinite(rawLat) || !Number.isFinite(rawLng)) {
        return;
      }

      const recency = getSightingRecency(sighting.timestamp);
      const privacy = evaluateCoordinatePrivacy(
        sighting.speciesId,
        [rawLat, rawLng],
        sighting.locationName,
        sighting.timestamp
      );

      // Validate display coordinates before passing to Leaflet
      if (!privacy.displayCoordinates || !Array.isArray(privacy.displayCoordinates) || privacy.displayCoordinates.length < 2) {
        return;
      }
      const dispLat = Number(privacy.displayCoordinates[0]);
      const dispLng = Number(privacy.displayCoordinates[1]);
      if (!Number.isFinite(dispLat) || !Number.isFinite(dispLng)) {
        return;
      }

      // Visual styling mapped to Traffic Light level
      let pingLayer = '';
      let markerBorder = 'border-2 border-white';
      let opacityClass = 'opacity-100';
      let shadowGlow = `box-shadow: 0 0 12px ${recency.colorHex};`;

      if (privacy.fuzzed) {
        // Schedule 1 species: Distinctive conservation shield badge + dashed boundary sector
        markerBorder = 'border-2 border-purple-300 ring-2 ring-purple-500/80';
        shadowGlow = `box-shadow: 0 0 14px #a855f7, 0 0 20px rgba(168, 85, 247, 0.4);`;

        // Render subtle boundary privacy buffer circle around the fuzzed sector center
        const radiusMeters = Math.max(1000, (privacy.fuzzRadiusKm || 5) * 1000);
        const privacyCircle = L.circle([dispLat, dispLng], {
          radius: radiusMeters,
          color: '#a855f7',
          weight: 1.5,
          dashArray: '5, 8',
          fillColor: '#a855f7',
          fillOpacity: 0.06,
          interactive: false,
        });
        privacyCircle.addTo(sightingsGroup);
      } else if (recency.level === 'green') {
        // LIVE (< 3h): Intense radar ping animation + high glow
        pingLayer = `
          <div class="absolute -inset-2 rounded-full animate-ping opacity-75" style="background-color: ${recency.colorHex};"></div>
          <div class="absolute -inset-1 rounded-full animate-pulse opacity-50" style="background-color: ${recency.colorHex};"></div>
        `;
        markerBorder = 'border-2 border-emerald-100 ring-2 ring-emerald-400/60';
        shadowGlow = 'box-shadow: 0 0 14px #10b981, 0 0 24px rgba(16, 185, 129, 0.4);';
      } else if (recency.level === 'amber') {
        // TODAY (3-24h): Warm glow, steady presence
        pingLayer = `<div class="absolute -inset-1 rounded-full opacity-35" style="background-color: ${recency.colorHex};"></div>`;
        markerBorder = 'border-2 border-amber-100 ring-1 ring-amber-400/40';
        shadowGlow = 'box-shadow: 0 0 10px #f59e0b;';
      } else if (recency.level === 'orange') {
        // PAST 48H: Subtle warmth
        markerBorder = 'border-1.5 border-orange-200';
        shadowGlow = 'box-shadow: 0 0 6px #f97316;';
      } else {
        // ARCHIVED (> 48h): Clean muted slate disc, historical density
        opacityClass = 'opacity-65 hover:opacity-100';
        markerBorder = 'border border-slate-300';
        shadowGlow = 'box-shadow: 0 0 4px rgba(148, 163, 184, 0.5);';
      }

      const schedule1Badge = privacy.fuzzed
        ? `<div class="absolute -top-1 -right-1 w-3 h-3 bg-purple-900 border border-purple-300 rounded-full flex items-center justify-center text-[7px] text-purple-200 font-bold" title="UK Schedule 1 Protected Taxon">🛡️</div>`
        : '';

      const blipHtml = `
        <div class="relative cursor-pointer group flex flex-col items-center ${opacityClass} transition-opacity">
          ${pingLayer}
          <div class="w-4 h-4 rounded-full flex items-center justify-center ${markerBorder} transition-transform group-hover:scale-125 relative" style="background-color: ${privacy.fuzzed ? '#9333ea' : recency.colorHex}; ${shadowGlow}">
            <span class="text-[7px] font-mono-tactical font-black text-neutral-950 leading-none">
              ${privacy.fuzzed ? '🔒' : recency.level === 'green' ? '●' : ''}
            </span>
            ${schedule1Badge}
          </div>
          <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-0.5 rounded bg-neutral-950/95 border border-neutral-700 text-[10px] font-mono-tactical text-neutral-200 whitespace-nowrap pointer-events-none shadow-2xl z-30 flex items-center gap-1.5">
            <span>${privacy.fuzzed ? '🛡️' : recency.trafficEmoji}</span>
            <span class="font-bold text-neutral-100">${sighting.speciesName}</span>
            ${privacy.fuzzed ? `<span class="text-purple-300 font-bold text-[9px]">[Sch 1 Fuzzed ~${privacy.fuzzRadiusKm}km]</span>` : ''}
            <span class="text-neutral-400 text-[9px]">(${recency.relativeTime})</span>
          </div>
        </div>
      `;

      const blipIcon = L.divIcon({
        className: 'tactical-sighting-blip',
        html: blipHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const blipMarker = L.marker([dispLat, dispLng], { icon: blipIcon });

      const statusColor = sighting.verificationStatus === 'Specialist Confirmed'
        ? '#10b981'
        : sighting.verificationStatus === 'Corroborated by Peers'
        ? '#06b6d4'
        : sighting.verificationStatus === 'Flagged for Review'
        ? '#f43f5e'
        : '#f59e0b';

      const schedule1PopupNotice = privacy.fuzzed
        ? `<div class="bg-purple-950/70 border border-purple-500/50 p-1.5 rounded text-[9px] text-purple-200 font-sans leading-tight mt-1 flex items-start gap-1">
             <span>🛡️</span>
             <span><strong>UK Schedule 1 Protected:</strong> Coordinates coarsened to ${privacy.fuzzRadiusKm}km grid under Wildlife & Countryside Act 1981 to protect active breeding territories.</span>
           </div>`
        : '';

      blipMarker.bindTooltip(
        `<div class="p-1 space-y-1">` +
        `<div class="flex items-center justify-between gap-2 border-b border-neutral-700 pb-1">` +
        `<span class="font-bold text-xs text-neutral-100 flex items-center gap-1"><span>${privacy.fuzzed ? '🛡️' : recency.trafficEmoji}</span> ${sighting.speciesName} (${sighting.count}x)</span>` +
        `<span class="text-[9px] font-mono-tactical uppercase font-semibold px-1 rounded ${recency.badgeClass}">${recency.shortBadge} (${recency.relativeTime})</span>` +
        `</div>` +
        `<div class="text-[10px] text-amber-300/90 font-mono-tactical">📍 ${privacy.generalizedLocation} • ${sighting.behavior}</div>` +
        `<div class="text-[9px] text-neutral-400 font-mono-tactical italic">💡 ${recency.recommendation}</div>` +
        schedule1PopupNotice +
        `<div class="flex items-center justify-between pt-0.5 text-[9px] font-mono-tactical border-t border-neutral-800">` +
        `<span style="color: ${statusColor}; font-weight: bold;">● ${sighting.verificationStatus || 'Pending Review'}</span>` +
        `<span class="text-neutral-400">${sighting.time} BST | ${sighting.observerCallsign}</span>` +
        `</div>` +
        `</div>`,
        {
          direction: 'top',
          className: 'bg-neutral-950/95 text-neutral-100 font-mono-tactical text-xs border border-neutral-700 p-1.5 rounded-lg shadow-2xl max-w-xs',
        }
      );

      blipMarker.on('click', () => {
        tacticalAudio.playRadarPing(1050);
        if (onInspectAudit) {
          onInspectAudit(sighting);
        } else {
          onSelectSighting(sighting);
        }
      });

      blipMarker.addTo(sightingsGroup);
    });
  }, [sightings, showSightings, activeFilterSpecies, recencyWindow, quickPreset, searchQuery]);

  // Pan to selected hotspot when changed (guarded against 0x0 DOM dimension NaN crash)
  useEffect(() => {
    if (selectedHotspot && mapInstanceRef.current) {
      if (selectedHotspot.coordinates && Array.isArray(selectedHotspot.coordinates) && selectedHotspot.coordinates.length >= 2) {
        const hLat = Number(selectedHotspot.coordinates[0]);
        const hLng = Number(selectedHotspot.coordinates[1]);
        if (Number.isFinite(hLat) && Number.isFinite(hLng)) {
          safeNavigateMap(mapInstanceRef.current, [hLat, hLng], 14);
        }
      }
    }
  }, [selectedHotspot]);

  // Fly to specific hotspot helper
  const handleFlyToHotspot = (spot: Hotspot) => {
    tacticalAudio.playRadarPing(880);
    onSelectHotspot(spot);
  };

  // Reset view to active sector corridor
  const handleResetCorridorView = () => {
    tacticalAudio.playRadarPing(700);
    const sector = UK_SECTORS.find((s) => s.id === activeSectorId) || UK_SECTORS[0];
    if (mapInstanceRef.current && sector && Array.isArray(sector.center) && sector.center.length >= 2) {
      const sLat = Number(sector.center[0]);
      const sLng = Number(sector.center[1]);
      if (Number.isFinite(sLat) && Number.isFinite(sLng)) {
        safeNavigateMap(mapInstanceRef.current, [sLat, sLng], Number.isFinite(sector.zoom) ? sector.zoom : 12);
      }
    }
  };

  // Visible hotspots filtered for quick bar
  const visibleHotspots = hotspots.filter((spot) => {
    if (!activeSectorId || activeSectorId === 'all') return true;
    return spot.sectorId === activeSectorId;
  });

  const currentSector = UK_SECTORS.find((s) => s.id === activeSectorId) || UK_SECTORS[0];

  return (
    <div className={`relative w-full ${isZenMode || cleanMode ? 'h-[520px] sm:h-[750px] lg:h-[840px]' : 'h-[480px] sm:h-[620px] lg:h-[720px]'} rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl transition-all duration-300`}>
      {/* Tactical Leaflet Map Canvas */}
      <div id="tactical-leaflet-map" ref={mapContainerRef} className="w-full h-full z-0" />

      {/* ZEN MODE: Minimal Floating Restore Pill */}
      {isZenMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto animate-fade-in">
          <button
            id="exit-zen-mode-btn"
            onClick={() => {
              tacticalAudio.playRadarPing(880);
              setIsZenMode(false);
            }}
            className="px-4 py-2 rounded-full bg-neutral-950/95 backdrop-blur-xl border border-amber-500/60 text-amber-300 hover:text-amber-200 text-xs font-mono-tactical font-bold flex items-center gap-2.5 shadow-2xl transition-all hover:scale-105 cursor-pointer"
            title="Exit Clean Map (Zen Mode) - Press Z or Click"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>ZEN MAP ACTIVE</span>
            <span className="text-neutral-600">|</span>
            <span className="text-[11px] text-neutral-300 font-sans font-normal hidden sm:inline">Press 'Z' or Click to Restore HUD</span>
            <X className="w-3.5 h-3.5 text-neutral-400 ml-1" />
          </button>
        </div>
      )}

      {/* TOP TACTICAL HUD OVERLAY (Hidden in Zen Mode) */}
      {!isZenMode && (
        <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-12 sm:right-16 z-10 pointer-events-none flex flex-col gap-1.5 sm:gap-2">
          {/* Top Row: Sector Switcher, Quick Search, Zen Mode Button & Hotspot Vectors */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Radar Status & Sector Selector */}
              <div className="pointer-events-auto bg-neutral-950/90 backdrop-blur-md border border-neutral-800/90 rounded-lg px-2.5 py-1.5 shadow-xl flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-display-tactical text-xs tracking-wider uppercase font-bold text-amber-400 hidden sm:inline">
                    RADAR
                  </span>
                </div>

                <span className="text-neutral-700">|</span>

                <div className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <select
                    id="tactical-hud-sector-select"
                    value={activeSectorId || 'ridgeway-wessex'}
                    onChange={(e) => {
                      const sId = e.target.value as SectorId;
                      tacticalAudio.playRadarPing(880);
                      if (onSelectSector) onSelectSector(sId);
                    }}
                    className="bg-neutral-900 border border-neutral-700 text-amber-300 font-mono-tactical text-xs font-semibold rounded-md px-2 py-1 focus:outline-none focus:border-amber-500 cursor-pointer max-w-[150px] sm:max-w-none truncate"
                  >
                    {UK_SECTORS.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.shortName} ({sec.county})
                      </option>
                    ))}
                  </select>
                </div>

                {!cleanMode && (
                  <>
                    <span className="text-neutral-700 hidden sm:inline">|</span>
                    <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono-tactical text-neutral-300">
                      <Wind className="w-3.5 h-3.5 text-neutral-400" />
                      <span>WNW 11 MPH</span>
                    </div>
                  </>
                )}
              </div>

              {/* Fast Quick Search Input */}
              <div className="pointer-events-auto bg-neutral-950/90 backdrop-blur-md border border-neutral-800/90 rounded-lg px-2.5 py-1 shadow-xl flex items-center gap-1.5 text-xs font-mono-tactical">
                <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Filter contacts, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none w-28 sm:w-36 md:w-44"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* One-Click Clean Map Zen Toggle Button */}
              <button
                id="hud-zen-mode-btn"
                onClick={() => {
                  tacticalAudio.playRadarPing(880);
                  setIsZenMode(true);
                }}
                className="pointer-events-auto bg-neutral-950/90 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 rounded-lg px-2.5 py-1.5 shadow-xl text-neutral-300 hover:text-amber-300 font-mono-tactical text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                title="Clean Map / Zen Mode: Hide HUD cards and expand map (Keyboard: Z)"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Full Zen</span>
                <span className="text-[10px] text-neutral-500 font-mono border border-neutral-700 px-1 rounded">Z</span>
              </button>
            </div>

            {/* Hotspot Quick-Targeting Vectors Bar (Only in Aero/Telemetry Mode) */}
            {!cleanMode && (
              <div className="pointer-events-auto hidden xl:flex items-center gap-1.5 bg-neutral-950/90 backdrop-blur-md border border-neutral-800/90 rounded-lg p-1.5 shadow-xl">
                <span className="text-[10px] font-mono-tactical text-neutral-400 uppercase px-1.5 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-amber-400" /> VECTORS:
                </span>
                {visibleHotspots.slice(0, 3).map((spot) => (
                  <button
                    key={spot.id}
                    id={`quick-nav-${spot.id}`}
                    onClick={() => handleFlyToHotspot(spot)}
                    className={`px-2 py-0.5 rounded text-xs font-mono-tactical transition-all cursor-pointer ${
                      selectedHotspot?.id === spot.id
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/60 font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
                    }`}
                  >
                    {(spot.name || 'Site').split(' ')[0]} ({spot.elevationM}m)
                  </button>
                ))}
                <button
                  id="reset-corridor-view"
                  onClick={handleResetCorridorView}
                  title={`Reset ${currentSector.shortName} view`}
                  className="p-1 text-neutral-400 hover:text-amber-400 rounded hover:bg-neutral-900 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Row 2: Recency Horizon & Smart Quick Presets Bar */}
          <div className="pointer-events-auto flex flex-wrap items-center gap-1 bg-neutral-950/90 backdrop-blur-md border border-neutral-800/90 rounded-lg p-1 shadow-xl text-[11px] font-mono-tactical self-start">
            <span className="text-[10px] text-neutral-400 font-bold px-1.5 flex items-center gap-1">
              <span>🚦</span> <span className="hidden sm:inline">HORIZON:</span>
            </span>

            <button
              id="tl-filter-all"
              onClick={() => {
                tacticalAudio.playRadarPing(700);
                setRecencyWindow('all');
                setQuickPreset('all');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                recencyWindow === 'all' && quickPreset === 'all'
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-600'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All ({recencyCounts.all})
            </button>

            <button
              id="tl-filter-live"
              onClick={() => {
                tacticalAudio.playRadarPing(1100);
                setRecencyWindow('live');
                setQuickPreset('live');
              }}
              title="Sightings logged within the last 3 hours - high intercept probability"
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                recencyWindow === 'live' || quickPreset === 'live'
                  ? 'bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold shadow-sm shadow-emerald-500/50'
                  : 'text-emerald-400/90 hover:text-emerald-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Live &lt;3h ({recencyCounts.live})</span>
            </button>

            <button
              id="tl-filter-today"
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                setRecencyWindow('today');
                setQuickPreset('all');
              }}
              title="Sightings logged today (<24 hours) - likely in sector roost or hunting"
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                recencyWindow === 'today'
                  ? 'bg-amber-950 border border-amber-500 text-amber-300 font-bold shadow-sm shadow-amber-500/50'
                  : 'text-amber-400/90 hover:text-amber-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Today ({recencyCounts.today})</span>
            </button>

            {/* Smart Presets Separator */}
            <span className="text-neutral-700 hidden md:inline">|</span>

            <button
              onClick={() => {
                tacticalAudio.playRadarPing(900);
                setQuickPreset('soaring');
                setRecencyWindow('all');
              }}
              title="Filter raptors actively soaring or kettling in chalk thermals"
              className={`hidden md:flex px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer items-center gap-1 ${
                quickPreset === 'soaring'
                  ? 'bg-amber-950 border border-amber-500 text-amber-300 font-bold'
                  : 'text-neutral-400 hover:text-amber-300'
              }`}
            >
              <span>⚡ Soaring</span>
            </button>

            <button
              onClick={() => {
                tacticalAudio.playRadarPing(950);
                setQuickPreset('schedule1');
                setRecencyWindow('all');
              }}
              title="Filter Schedule 1 protected raptors (Peregrine, Hen Harrier, Hobby, etc.)"
              className={`hidden md:flex px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer items-center gap-1 ${
                quickPreset === 'schedule1'
                  ? 'bg-purple-950 border border-purple-500 text-purple-300 font-bold'
                  : 'text-purple-400/90 hover:text-purple-200'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              <span>Sch 1</span>
            </button>

            <button
              onClick={() => {
                tacticalAudio.playRadarPing(850);
                setQuickPreset('falcons');
                setRecencyWindow('all');
              }}
              title="Filter falcons (Peregrines, Kestrels, Hobbies)"
              className={`hidden lg:flex px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer items-center gap-1 ${
                quickPreset === 'falcons'
                  ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold'
                  : 'text-neutral-400 hover:text-cyan-300'
              }`}
            >
              <span>Falcons</span>
            </button>

            {/* Live Field Cam Direct Launcher */}
            {onOpenLiveCam && (
              <>
                <span className="text-neutral-700 hidden sm:inline">|</span>
                <button
                  id="tactical-hud-live-cam-btn"
                  onClick={() => {
                    tacticalAudio.playRadarPing(880);
                    onOpenLiveCam();
                  }}
                  title="Switch to Barbury Downland 30x Live Field Cam Stream"
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-rose-200 cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <Video className="w-3 h-3 text-rose-400" />
                  <span className="hidden sm:inline">Live Cam (30x)</span>
                  <span className="sm:hidden">Cam</span>
                </button>
              </>
            )}

            <span className="text-neutral-700">|</span>

            {/* Protocol Guide Button */}
            <button
              id="tl-guide-button"
              onClick={() => {
                tacticalAudio.playRadarPing(920);
                setShowTrafficLightModal(true);
              }}
              title="Traffic Light Signals Protocol (How recency & time limits work)"
              className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 border border-amber-500/30 flex items-center gap-1 text-[10px] font-semibold cursor-pointer transition-colors"
            >
              <HelpCircle className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Guide</span>
            </button>

            {/* Schedule 1 Protection Ethics Button */}
            <button
              id="schedule1-ethics-button"
              onClick={() => {
                tacticalAudio.playRadarPing(950);
                setShowSchedule1Modal(true);
              }}
              title="Wildlife & Countryside Act 1981: Coordinate Fuzzing & Nesting Safeguard"
              className="px-2 py-0.5 rounded bg-purple-950/80 hover:bg-purple-900 text-purple-300 hover:text-purple-200 border border-purple-500/50 flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-colors"
            >
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              <span className="hidden sm:inline">Sch 1</span>
            </button>

            {/* In-HUD Clean Focus vs Aero Intel Toggle */}
            {onToggleCleanMode && (
              <>
                <span className="text-neutral-700">|</span>
                <button
                  id="map-hud-toggle-clean-mode"
                  onClick={() => {
                    tacticalAudio.playRadarPing(880);
                    onToggleCleanMode(!cleanMode);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                    cleanMode
                      ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                      : 'bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-750'
                  }`}
                  title={cleanMode ? 'Clean Sighting Mode Active (Click for Aero Intel)' : 'Aero Intel Active (Click for Clean Sighting Mode)'}
                >
                  {cleanMode ? (
                    <>
                      <Eye className="w-3 h-3" />
                      <span>Clean Focus</span>
                    </>
                  ) : (
                    <>
                      <Wind className="w-3 h-3 text-cyan-400" />
                      <span>Aero Intel</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* TACTICAL MAP CONTROLS / TABBED DRAWER (Bottom Left - Hidden in Zen Mode) */}
      {!isZenMode && (
        <div className="absolute bottom-3 left-3 z-10 pointer-events-auto flex flex-col gap-1.5 max-w-[320px] sm:max-w-xs">
          {isDrawerCollapsed ? (
            <button
              id="expand-drawer-btn"
              onClick={() => {
                tacticalAudio.playRadarPing(880);
                setIsDrawerCollapsed(false);
              }}
              className="bg-neutral-950/95 backdrop-blur-md border border-neutral-800 hover:border-amber-500/60 rounded-xl px-3 py-2 text-xs font-mono-tactical text-amber-300 hover:text-amber-200 flex items-center justify-between gap-2 shadow-2xl cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold">Map Controls &amp; Layers</span>
              </div>
              <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          ) : (
            <div className="bg-neutral-950/95 backdrop-blur-md border border-neutral-800/90 rounded-2xl p-3 shadow-2xl space-y-2.5">
              {/* Drawer Header with Tabs & Minimize */}
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
                <div className="flex items-center gap-1 bg-neutral-900/90 p-0.5 rounded-lg border border-neutral-800 text-[10px] font-mono-tactical">
                  <button
                    onClick={() => {
                      tacticalAudio.playRadarPing(750);
                      setActiveDrawerTab('layers');
                    }}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      activeDrawerTab === 'layers'
                        ? 'bg-amber-500/25 text-amber-300 font-bold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Layers
                  </button>
                  <button
                    onClick={() => {
                      tacticalAudio.playRadarPing(750);
                      setActiveDrawerTab('basemap');
                    }}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      activeDrawerTab === 'basemap'
                        ? 'bg-amber-500/25 text-amber-300 font-bold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Basemap
                  </button>
                  <button
                    onClick={() => {
                      tacticalAudio.playRadarPing(750);
                      setActiveDrawerTab('filter');
                    }}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      activeDrawerTab === 'filter'
                        ? 'bg-amber-500/25 text-amber-300 font-bold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Species
                  </button>
                  <button
                    onClick={() => {
                      tacticalAudio.playRadarPing(750);
                      setActiveDrawerTab('signals');
                    }}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      activeDrawerTab === 'signals'
                        ? 'bg-amber-500/25 text-amber-300 font-bold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Signals
                  </button>
                </div>

                <button
                  id="collapse-drawer-btn"
                  onClick={() => {
                    tacticalAudio.playRadarPing(700);
                    setIsDrawerCollapsed(true);
                  }}
                  className="p-1 rounded hover:bg-neutral-850 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                  title="Minimize Controls Drawer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* TAB 1: LAYERS */}
              {activeDrawerTab === 'layers' && (
                <div className="grid grid-cols-2 gap-1.5 text-xs font-mono-tactical">
                  <button
                    id="toggle-hotspots"
                    onClick={() => setShowHotspots(!showHotspots)}
                    className={`px-2 py-1 rounded-lg border text-left flex items-center justify-between cursor-pointer ${
                      showHotspots
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-500'
                    }`}
                  >
                    <span>Hotspots</span>
                    <span className="text-[9px] font-bold">{showHotspots ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    id="toggle-sightings"
                    onClick={() => setShowSightings(!showSightings)}
                    className={`px-2 py-1 rounded-lg border text-left flex items-center justify-between cursor-pointer ${
                      showSightings
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-500'
                    }`}
                  >
                    <span>Sightings</span>
                    <span className="text-[9px] font-bold">{showSightings ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    id="toggle-thermals"
                    onClick={() => setShowThermalCorridors(!showThermalCorridors)}
                    className={`px-2 py-1 rounded-lg border text-left flex items-center justify-between cursor-pointer ${
                      showThermalCorridors
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-500'
                    }`}
                  >
                    <span>{activeSectorId === 'all' ? 'All Corridors' : 'Thermal Lift'}</span>
                    <span className="text-[9px] font-bold">{showThermalCorridors ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    id="toggle-range-rings"
                    onClick={() => setShowRangeRings(!showRangeRings)}
                    className={`px-2 py-1 rounded-lg border text-left flex items-center justify-between cursor-pointer ${
                      showRangeRings
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-500'
                    }`}
                  >
                    <span>Radar Rings</span>
                    <span className="text-[9px] font-bold">{showRangeRings ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              )}

              {/* TAB 2: BASEMAP */}
              {activeDrawerTab === 'basemap' && (
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono-tactical">
                  <button
                    id="basemap-tactical-dark"
                    onClick={() => {
                      tacticalAudio.playRadarPing(700);
                      setBasemapMode('tactical-dark');
                    }}
                    title="Tactical Dark Radar (Esri Slate Canvas - High contrast HUD)"
                    className={`py-1.5 px-2 rounded-lg border text-left transition-colors cursor-pointer flex items-center gap-1.5 ${
                      basemapMode === 'tactical-dark'
                        ? 'bg-amber-500/20 border-amber-500/70 text-amber-300 font-bold'
                        : 'bg-neutral-900/70 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    <span>Radar Dark</span>
                  </button>

                  <button
                    id="basemap-satellite"
                    onClick={() => {
                      tacticalAudio.playRadarPing(880);
                      setBasemapMode('satellite');
                    }}
                    title="High-Resolution Satellite Photogrammetry"
                    className={`py-1.5 px-2 rounded-lg border text-left transition-colors cursor-pointer flex items-center gap-1.5 ${
                      basemapMode === 'satellite' || basemapMode === 'google-satellite'
                        ? 'bg-cyan-500/20 border-cyan-500/70 text-cyan-300 font-bold'
                        : 'bg-neutral-900/70 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Satellite className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Aerial</span>
                  </button>

                  <button
                    id="basemap-opentopo-contour"
                    onClick={() => {
                      tacticalAudio.playRadarPing(780);
                      setBasemapMode('opentopo-contour');
                    }}
                    title="OpenTopoMap: Chalk Escarpment Contours & Hillshades"
                    className={`py-1.5 px-2 rounded-lg border text-left transition-colors cursor-pointer flex items-center gap-1.5 ${
                      basemapMode === 'opentopo-contour'
                        ? 'bg-emerald-500/20 border-emerald-500/70 text-emerald-300 font-bold'
                        : 'bg-neutral-900/70 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Mountain className="w-3.5 h-3.5 text-emerald-400" />
                    <span>OS Contours</span>
                  </button>

                  <button
                    id="basemap-osm-trails"
                    onClick={() => {
                      tacticalAudio.playRadarPing(840);
                      setBasemapMode('osm-trails');
                    }}
                    title="OpenStreetMap: Downland Footpaths, Bridleways & Ridgeway Path"
                    className={`py-1.5 px-2 rounded-lg border text-left transition-colors cursor-pointer flex items-center gap-1.5 ${
                      basemapMode === 'osm-trails'
                        ? 'bg-amber-500/20 border-amber-500/70 text-amber-300 font-bold'
                        : 'bg-neutral-900/70 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ridgeway Trails</span>
                  </button>
                </div>
              )}

              {/* TAB 3: SPECIES FILTER */}
              {activeDrawerTab === 'filter' && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono-tactical text-neutral-400 block">
                    SPECIES RADAR FILTER:
                  </span>
                  <select
                    id="map-species-filter"
                    value={activeFilterSpecies}
                    onChange={(e) => setActiveFilterSpecies(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs font-mono-tactical rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="ALL">All Species Contacts ({sightings.length})</option>
                    <option value="red-kite">Red Kite Contacts</option>
                    <option value="common-buzzard">Common Buzzard Contacts</option>
                    <option value="peregrine-falcon">Peregrine Falcon Contacts</option>
                    <option value="common-kestrel">Common Kestrel Contacts</option>
                    <option value="hen-harrier">Hen Harrier Contacts</option>
                    <option value="eurasian-hobby">Eurasian Hobby Contacts</option>
                  </select>
                </div>
              )}

              {/* TAB 4: SIGNALS */}
              {activeDrawerTab === 'signals' && (
                <div className="space-y-1 text-[10px] font-mono-tactical">
                  <div className="flex items-center justify-between p-1 rounded bg-neutral-900/60 border border-neutral-800/60">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span className="text-emerald-300 font-semibold">🟢 Live (&lt;3h)</span>
                    </div>
                    <span className="text-neutral-400 text-[9px]">Active aloft</span>
                  </div>
                  <div className="flex items-center justify-between p-1 rounded bg-neutral-900/60 border border-neutral-800/60">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span className="text-amber-300 font-semibold">🟡 Today (3-24h)</span>
                    </div>
                    <span className="text-neutral-400 text-[9px]">In sector roost</span>
                  </div>
                  <div className="flex items-center justify-between p-1 rounded bg-neutral-900/60 border border-neutral-800/60">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      <span className="text-slate-300 font-semibold">⚪ Archive (&gt;48h)</span>
                    </div>
                    <span className="text-neutral-500 text-[9px]">Territory log</span>
                  </div>
                  <button
                    onClick={() => setShowTrafficLightModal(true)}
                    className="w-full text-center py-1 text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    View Full Protocol Briefing &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Understated Tap Tip Badge */}
          <div className="bg-neutral-950/85 backdrop-blur border border-neutral-800/70 rounded-xl px-2.5 py-1 text-[10px] font-mono-tactical text-neutral-400 flex items-center gap-1.5 shadow-lg">
            <Crosshair className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Click any map coordinate to log a sighting</span>
          </div>
        </div>
      )}

      {/* Coordinate & Grid Reference HUD (Bottom Right - Hidden in Zen Mode) */}
      {!isZenMode && (
        <div className="absolute bottom-3 right-3 z-10 pointer-events-auto bg-neutral-950/95 backdrop-blur-md border border-neutral-800/90 rounded-2xl p-2.5 sm:p-3 shadow-2xl text-right font-mono-tactical space-y-1 hidden sm:block">
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-[9px] text-neutral-500 uppercase tracking-widest">COORDINATES</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </div>
          <div className="text-xs text-amber-400 font-semibold">
            {mouseCoords ? `${mouseCoords.lat.toFixed(4)}°N, ${Math.abs(mouseCoords.lng).toFixed(4)}°${mouseCoords.lng < 0 ? 'W' : 'E'}` : '51.4650°N, 1.8150°W'}
          </div>
          <div className="text-[10px] text-neutral-400">
            OS GRID: {mouseCoords ? 'SU 135 732 (Marlborough)' : 'SU 149 763 (Barbury)'}
          </div>

          <div className="pt-1 border-t border-neutral-800/80 flex items-center justify-end">
            <a
              id="google-maps-3d-launch"
              href={`https://www.google.com/maps/@${mouseCoords ? mouseCoords.lat : 51.465},${mouseCoords ? mouseCoords.lng : -1.815},16z/data=!3m1!1e3`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 text-[10px] font-semibold transition-colors"
            >
              <Satellite className="w-3 h-3 text-cyan-400" />
              <span>3D Aerial</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>
          </div>
        </div>
      )}

      {/* Traffic Light Protocol Briefing Modal */}
      {showTrafficLightModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/80 backdrop-blur-md p-3 sm:p-4 flex justify-center items-start overscroll-contain font-mono-tactical pointer-events-auto">
          <div className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 mb-16 sm:mb-24">
            {/* Header */}
            <div className="bg-neutral-900/90 border-b border-neutral-800 p-4 sm:p-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🚦</span>
                  <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                    TACTICAL PROTOCOL BRIEFING
                  </span>
                </div>
                <h3 className="font-display-tactical text-xl font-bold text-neutral-100">
                  Time Limits &amp; Traffic Light Signals
                </h3>
                <p className="text-xs text-neutral-400 mt-1 font-sans">
                  How birding networks manage time limits without discarding valuable conservation history.
                </p>
              </div>

              <button
                onClick={() => setShowTrafficLightModal(false)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5 text-xs text-neutral-300 font-sans leading-relaxed max-h-[75vh] overflow-y-auto">
              {/* Question 1: Sighting Lifetime & Recency */}
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm font-mono-tactical">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Sighting Lifetime &amp; Dynamic Recency</span>
                </div>
                <p className="text-neutral-300 text-xs">
                  <strong>Persistent historical records with live operational clarity:</strong> Sightings are permanent and contribute to long-term downland territory records and seasonal arrival windows.
                </p>
                <p className="text-neutral-400 text-xs">
                  For an observer on the ridge right now, pins are prioritised by recency: contacts under 2 hours old highlight live active thermals, while older sightings remain available via historical query.
                </p>
              </div>

              {/* Traffic Light Breakdown */}
              <div className="space-y-2">
                <h4 className="font-mono-tactical text-xs font-bold uppercase tracking-wider text-amber-400">
                  RaptorLens 4-Stage Traffic Light Signal Protocol:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono-tactical text-xs">
                  {TRAFFIC_LIGHT_TIERS.map((tier) => (
                    <div
                      key={tier.level}
                      className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5 text-neutral-100">
                          <span>{tier.trafficEmoji}</span>
                          <span style={{ color: tier.colorHex }}>{tier.label}</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                          {tier.timeWindow}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-300 font-sans">
                        {tier.description}
                      </div>
                      <div className="text-[10px] text-amber-300/80 font-sans italic border-t border-neutral-800 pt-1">
                        🎯 {tier.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowTrafficLightModal(false)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono-tactical transition-colors cursor-pointer"
                >
                  Understood • Return to Radar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule 1 Wildlife & Countryside Act 1981 Privacy Protocol Modal */}
      {showSchedule1Modal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/85 backdrop-blur-md p-3 sm:p-4 flex justify-center items-start overscroll-contain">
          <div className="relative w-full max-w-2xl bg-neutral-950 border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 mb-16 sm:mb-24">
            <div className="bg-neutral-900/90 border-b border-neutral-800 p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/40">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[10px] font-mono-tactical uppercase tracking-wider text-purple-400 font-bold block">
                    UK WILDLIFE &amp; COUNTRYSIDE ACT 1981 COMPLIANCE
                  </span>
                  <h3 className="font-display-tactical text-lg sm:text-xl font-bold text-neutral-100">
                    Schedule 1 Protection &amp; Coordinate Fuzzing Protocol
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowSchedule1Modal(false)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 text-xs text-neutral-300 font-sans leading-relaxed max-h-[75vh] overflow-y-auto">
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-2">
                <div className="font-bold text-purple-200 text-sm font-mono-tactical flex items-center gap-2">
                  <span>⚖️</span>
                  <span>Legal Requirement &amp; Wildlife Ethics</span>
                </div>
                <p className="text-neutral-200 text-xs">
                  Under <strong>Schedule 1 of the Wildlife and Countryside Act 1981</strong>, it is a criminal offence to intentionally or recklessly disturb wild birds while they are building a nest, in, on, or near an active nest, or disturb their dependent young.
                </p>
                <p className="text-purple-300/90 text-xs">
                  In compliance with UK birding ethics (BTO, Rare Bird Alert, RSPB), RaptorLens implements <strong>deterministic coordinate obfuscation</strong> for all sensitive Schedule 1 raptors during the critical breeding season (March to August).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-mono-tactical text-xs font-bold uppercase tracking-wider text-purple-300">
                  Protected Taxa &amp; Obfuscation Radii:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono-tactical text-xs">
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between text-purple-300 font-bold">
                      <span>Hen Harrier (Circus cyaneus)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-500/30">10km Hectad</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-sans">
                      Critically endangered English breeder. All exact moorland &amp; downland roost/nesting coordinates are coarsened to 10km regional squares.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between text-purple-300 font-bold">
                      <span>Peregrine Falcon (Falco peregrinus)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-500/30">5km Grid</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-sans">
                      Quarry face, chalk cliff, and historic cathedral eyries are fuzzed to protect active broods from disturbance and egg theft.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between text-purple-300 font-bold">
                      <span>Merlin &amp; Osprey</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-500/30">5-10km Buffer</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-sans">
                      Rare passage migrants and breeding pairs protected with dashed territory boundary circles on the live radar.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between text-purple-300 font-bold">
                      <span>Eurasian Hobby &amp; Goshawk</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-500/30">5-10km Grid</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-sans">
                      Woodland breeding territories masked during summer months; observers must maintain a minimum 150m stand-off distance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                <span className="text-neutral-200 font-bold block">How It Appears on Your Radar:</span>
                <p>
                  Schedule 1 sightings display a purple conservation shield badge (🛡️), a lock icon (🔒), and a subtle dashed purple boundary circle indicating the general 5-10km observation sector rather than pinpointing an exact eyrie or nest ledge.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowSchedule1Modal(false)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold font-mono-tactical transition-colors cursor-pointer shadow-lg shadow-purple-600/30"
                >
                  Understood • Back to Radar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
