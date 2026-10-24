import { BarburySummitWeather, HourlySoaringSlot } from '../data/camPresets';

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

function calculateHourlyLiftScore(windKt: number, windDeg: number, rainProb: number, isDay: boolean): number {
  if (!isDay) {
    // Dusk/Dawn Owl & Roost activity baseline
    return Math.max(15, Math.min(45, Math.round(35 - rainProb * 0.3)));
  }
  let score = 55;
  // Optimal ridge wind for Red Kites, Buzzards & Kestrels is 9 to 22 knots
  if (windKt >= 9 && windKt <= 22) {
    score += 28;
  } else if (windKt >= 6 && windKt < 9) {
    score += 15;
  } else if (windKt > 22 && windKt <= 28) {
    score += 12;
  } else if (windKt > 28) {
    score -= 15;
  }
  // WNW to NNE or SSW to W escarpment alignment bonus
  if ((windDeg >= 210 && windDeg <= 350) || windDeg <= 30) {
    score += 12;
  }
  // Rain penalty
  score -= Math.round(rainProb * 0.45);
  return Math.max(12, Math.min(98, score));
}

/**
 * Fetches real-time live meteorological telemetry for Barbury Castle Summit
 * Latitude: 51.4851, Longitude: -1.7892, Elevation: 268m ASL (SU 149 763)
 * Data source: Open-Meteo API synced with UK Met Office and ECMWF models.
 */
export async function fetchLiveBarburyWeather(): Promise<BarburySummitWeather> {
  const lat = 51.4851;
  const lng = -1.7892;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,is_day&hourly=temperature_2m,precipitation_probability,wind_speed_10m,wind_direction_10m,is_day&daily=sunrise,sunset&wind_speed_unit=kn&timezone=Europe%2FLondon&forecast_days=2`;

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
  const isAfterDark = cur.is_day === 0;

  // Approximate cloud base height in metres AGL using Lawrence spread formula:
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

  // Parse daily sunrise, sunset and calculate golden hour (1 hr before sunset)
  let sunriseTime = '07:35';
  let sunsetTime = '18:05';
  let goldenHourTime = '17:05';
  const rawSunrise = data?.daily?.sunrise?.[0];
  if (typeof rawSunrise === 'string' && rawSunrise.includes('T')) {
    const timePart = rawSunrise.split('T')[1];
    if (timePart && timePart.length >= 5) {
      sunriseTime = timePart.slice(0, 5);
    }
  }
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

  // Parse next 6 daylight/upcoming hours for the Soaring Forecast Strip
  const hourlySoaring: HourlySoaringSlot[] = [];
  let peakSoaringWindow = '11:00 – 15:00 UK (High Escarpment Lift)';
  try {
    const times: string[] = data?.hourly?.time || [];
    const temps: number[] = data?.hourly?.temperature_2m || [];
    const rains: number[] = data?.hourly?.precipitation_probability || [];
    const winds: number[] = data?.hourly?.wind_speed_10m || [];
    const dirs: number[] = data?.hourly?.wind_direction_10m || [];
    const isDays: number[] = data?.hourly?.is_day || [];

    const curIsoHour = typeof cur.time === 'string' ? cur.time.slice(0, 13) : '';
    let startIdx = times.findIndex((t) => t.startsWith(curIsoHour));
    if (startIdx < 0) startIdx = 0;

    let bestSlot: HourlySoaringSlot | null = null;
    for (let i = startIdx; i < Math.min(times.length, startIdx + 18); i++) {
      const timeLabel = times[i]?.split('T')[1]?.slice(0, 5) || '12:00';
      const wKt = Math.round(winds[i] ?? windSpeed);
      const wDeg = Math.round(dirs[i] ?? windDirDeg);
      const rProb = Math.round(rains[i] ?? 0);
      const dayFlag = (isDays[i] ?? 1) === 1;
      const score = calculateHourlyLiftScore(wKt, wDeg, rProb, dayFlag);
      const slot: HourlySoaringSlot = {
        time: timeLabel,
        tempC: Math.round(temps[i] ?? temp),
        windSpeedKt: wKt,
        windDirection: getCardinalDirection(wDeg),
        rainProb: rProb,
        liftScore: score,
        isDay: dayFlag,
      };
      if (hourlySoaring.length < 6) {
        hourlySoaring.push(slot);
      }
      if (dayFlag && (!bestSlot || slot.liftScore > bestSlot.liftScore)) {
        bestSlot = slot;
      }
    }

    if (bestSlot) {
      const [bh] = bestSlot.time.split(':').map(Number);
      const endHour = String((bh + 2) % 24).padStart(2, '0') + ':00';
      peakSoaringWindow = `${bestSlot.time} – ${endHour} UK (${bestSlot.liftScore}% Lift • ${bestSlot.windDirection} ${bestSlot.windSpeedKt} kt)`;
    }
  } catch {}

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
    sunriseTime,
    sunsetTime,
    goldenHourTime,
    isAfterDark,
    peakSoaringWindow,
    hourlySoaring,
  };
}
