import { BarburySummitWeather } from '../data/camPresets';

// Convert wind degrees to 16-point cardinal compass text
export function getCardinalDirection(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg % 360) / 22.5)) % 16;
  return directions[index];
}

// Convert WMO code to human-readable downland description
export function getWmoWeatherDescription(code: number): string {
  if (code === 0) return 'Clear Sky & High Insolation';
  if (code === 1) return 'Mainly Clear with Scattered Cumulus';
  if (code === 2) return 'Partly Cloudy (Good Convective Thermals)';
  if (code === 3) return 'Overcast Stratocumulus';
  if (code >= 45 && code <= 48) return 'Ridge Fog / Low Scarp Mist';
  if (code >= 51 && code <= 55) return 'Light Downland Drizzle';
  if (code >= 61 && code <= 65) return 'Intermittent Rain Showers';
  if (code >= 80 && code <= 82) return 'Passing Convective Rain Squalls';
  return 'Variable Downland Sky';
}

/**
 * Fetches real-time live meteorological telemetry for Barbury Castle Summit
 * Latitude: 51.4851, Longitude: -1.7892, Elevation: 268m ASL (SU 149 763)
 * Data source: Open-Meteo API synced with UK Met Office and ECMWF models.
 */
export async function fetchLiveBarburyWeather(): Promise<BarburySummitWeather> {
  const lat = 51.4851;
  const lng = -1.7892;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure&daily=sunrise,sunset&wind_speed_unit=kn&timezone=Europe%2FLondon`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather service returned HTTP ${response.status}`);
  }

  const data = await response.json();
  const cur = data.current;
  if (!cur) {
    throw new Error('No current weather payload received');
  }

  const temp = Math.round((cur.temperature_2m ?? 14.5) * 10) / 10;
  const apparentTemp = Math.round((cur.apparent_temperature ?? temp) * 10) / 10;
  const windSpeed = Math.round((cur.wind_speed_10m ?? 12) * 10) / 10;
  const windGust = Math.round((cur.wind_gusts_10m ?? (windSpeed * 1.4)) * 10) / 10;
  const windDirDeg = Math.round(cur.wind_direction_10m ?? 200);
  const windDirCard = getCardinalDirection(windDirDeg);
  const rh = Math.round(cur.relative_humidity_2m ?? 75);
  const pressure = Math.round(cur.surface_pressure ?? 1014);
  const precip = cur.precipitation ?? 0;
  const weatherCode = cur.weather_code ?? 1;

  // Approximate cloud base height in metres AGL using Lawrence spread formula:
  // Spread (T - Td) ~= (100 - RH) / 5
  // Cloud Base (m) ~= 125 * Spread = 25 * (100 - RH)
  const estimatedCloudBaseM = Math.max(150, Math.min(2200, Math.round(25 * (100 - rh))));

  // Visibility calculation: reduced by heavy rain or high humidity fog
  let visibilityKm = 18;
  if (weatherCode >= 45 && weatherCode <= 48) {
    visibilityKm = 2; // Fog
  } else if (precip > 2.0) {
    visibilityKm = 8;
  } else if (rh > 90) {
    visibilityKm = 12;
  } else {
    visibilityKm = 22;
  }

  // Barbury Castle Scarp Faces NNW (approx 335°).
  // Wind from W to N (270° - 020°) produces maximum orographic slope updraft along the scarp.
  // South/SW winds produce strong crest winds with lee waves and solar thermals.
  let soaringLiftRating: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'LOW' = 'MODERATE';
  if (windSpeed >= 12 && (windDirDeg >= 280 || windDirDeg <= 40)) {
    soaringLiftRating = 'EXCELLENT'; // Perpendicular scarp strike
  } else if (windSpeed >= 10 && windSpeed <= 24) {
    soaringLiftRating = 'GOOD';
  } else if (windSpeed < 5) {
    soaringLiftRating = 'LOW';
  } else if (windSpeed > 30) {
    soaringLiftRating = 'MODERATE'; // Turbulent gales
  }

  // Generate dynamic authentic Ridgeway Walker & Soaring Advisory
  let walkerAdvisory = '';
  if (precip > 0.5) {
    walkerAdvisory = `Active precipitation on the scarp (${precip}mm). Chalk surfaces will be slippery underfoot; carry waterproofs.`;
  } else if (windGust >= 25) {
    walkerAdvisory = `Exposed summit gusts up to ${Math.round(windGust)} kt (${Math.round(windGust * 1.15)} mph). Bracing ridge winds; excellent slope lift along the ramparts for Kites and Buzzards.`;
  } else if (temp <= 5) {
    walkerAdvisory = `Cold summit temperatures (${temp}°C, feels like ${apparentTemp}°C). High wind chill along the open ramparts. Dress warmly.`;
  } else if (estimatedCloudBaseM < 270) {
    walkerAdvisory = `Low cloud deck near hillfort summit level (268m ASL). Expect reduced visibility across Hackpen and Avebury downland.`;
  } else {
    walkerAdvisory = `Favourable downland conditions. Chalk tracks firm underfoot with ${windSpeed} kt ${windDirCard} breeze. Good visibility across the Marlborough Downs.`;
  }

  // Parse daily sunset and calculate golden hour (1 hr before sunset)
  let sunsetTime = '18:05';
  let goldenHourTime = '17:05';
  const rawSunset = data?.daily?.sunset?.[0];
  if (typeof rawSunset === 'string' && rawSunset.includes('T')) {
    const timePart = rawSunset.split('T')[1];
    if (timePart && timePart.length >= 5) {
      sunsetTime = timePart.slice(0, 5);
      const [hh, mm] = sunsetTime.split(':').map(Number);
      if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
        const ghHour = Math.max(0, hh - 1);
        goldenHourTime = `${String(ghHour).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      }
    }
  }

  // Format timestamp in London time
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });

  return {
    temperatureC: temp,
    windChillC: apparentTemp,
    windSpeedKt: windSpeed,
    windGustKt: windGust,
    windDirection: windDirCard,
    windBearingDeg: windDirDeg,
    cloudBaseM: estimatedCloudBaseM,
    cloudCover: getWmoWeatherDescription(weatherCode),
    visibilityKm,
    pressureHpa: pressure,
    pressureTendency: pressure >= 1018 ? 'Rising' : pressure <= 1005 ? 'Falling' : 'Steady',
    soaringLiftRating,
    walkerAdvisory,
    lastUpdated: `${timeStr} UK • Live Met Sync (Open-Meteo)`,
    sunsetTime,
    goldenHourTime,
  };
}
