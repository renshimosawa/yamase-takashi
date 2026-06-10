export const HACHINOHE_FORECAST_URL =
  "https://weather.tsukumijima.net/api/forecast/city/020030" as const;

export interface ForecastChanceOfRain {
  T00_06: string;
  T06_12: string;
  T12_18: string;
  T18_24: string;
}

export interface ForecastTemperatureValue {
  celsius: string | null;
  fahrenheit: string | null;
}

export interface ForecastTemperature {
  min: ForecastTemperatureValue;
  max: ForecastTemperatureValue;
}

export interface ForecastDetail {
  weather: string;
  wind: string;
  wave: string;
}

export interface ForecastImage {
  title: string;
  url: string;
  width: number;
  height: number;
}

export interface Forecast {
  date: string;
  dateLabel: string;
  telop: string;
  detail: ForecastDetail;
  temperature: ForecastTemperature;
  chanceOfRain: ForecastChanceOfRain;
  image: ForecastImage;
}

export interface ForecastDescription {
  publicTime: string;
  publicTimeFormatted: string;
  headlineText: string;
  bodyText: string;
  text: string;
}

export interface ForecastLocation {
  area: string;
  prefecture: string;
  district: string;
  city: string;
}

export interface ForecastCopyrightProvider {
  link: string;
  name: string;
  note: string;
}

export interface ForecastCopyrightImage {
  title: string;
  link: string;
  url: string;
  width: number;
  height: number;
}

export interface ForecastCopyright {
  title: string;
  link: string;
  image: ForecastCopyrightImage;
  provider: ForecastCopyrightProvider[];
}

export interface WeatherForecastResponse {
  publicTime: string;
  publicTimeFormatted: string;
  publishingOffice: string;
  title: string;
  link: string;
  description: ForecastDescription;
  forecasts: Forecast[];
  location: ForecastLocation;
  copyright: ForecastCopyright;
}

export async function fetchHachinoheForecast(): Promise<WeatherForecastResponse> {
  const response = await fetch(HACHINOHE_FORECAST_URL, {
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch forecast: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as WeatherForecastResponse;
  return data;
}

// JMA AMeDAS types
interface AmedasStation {
  type: string;
  elems: string;
  lat: [number, number]; // [degrees, minutes]
  lon: [number, number]; // [degrees, minutes]
  alt: number;
  kjName: string;
  knName: string;
  enName: string;
}

type AmedasTable = Record<string, AmedasStation>;

type AmedasObservation = {
  windDirection?: [number, number]; // [16-direction value, quality flag]
  wind?: [number, number];
  temp?: [number, number];
  [key: string]: unknown;
};

type AmedasPointData = Record<string, AmedasObservation>;

// AMeDAS 16-direction to degrees (0=calm, 1=NNE, 2=NE, ..., 16=N)
const AMEDAS_DIR_TO_DEG: (number | null)[] = [
  null,  // 0: calm
  22.5,  // 1: NNE
  45,    // 2: NE
  67.5,  // 3: ENE
  90,    // 4: E
  112.5, // 5: ESE
  135,   // 6: SE
  157.5, // 7: SSE
  180,   // 8: S
  202.5, // 9: SSW
  225,   // 10: SW
  247.5, // 11: WSW
  270,   // 12: W
  292.5, // 13: WNW
  315,   // 14: NW
  337.5, // 15: NNW
  0,     // 16: N
];

function toDecimalDeg(d: [number, number]): number {
  return d[0] + d[1] / 60;
}

function haversineDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function amedasBlockUrl(stationId: string, date: Date): string {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  const blockHour = String(Math.floor(jst.getUTCHours() / 3) * 3).padStart(2, "0");
  return `https://www.jma.go.jp/bosai/amedas/data/point/${stationId}/${y}${m}${d}_${blockHour}.json`;
}

export type CurrentWeather = {
  temperature: number | null;
  windDirection: number | null;
};

export async function fetchCurrentWeather(
  latitude: number,
  longitude: number
): Promise<CurrentWeather> {
  // 1. Find nearest AMeDAS station
  const tableRes = await fetch(
    "https://www.jma.go.jp/bosai/amedas/const/amedastable.json",
    { cache: "no-store" }
  );
  if (!tableRes.ok) return { temperature: null, windDirection: null };
  const table = (await tableRes.json()) as AmedasTable;

  let nearestId = "";
  let nearestDist = Infinity;
  for (const [id, st] of Object.entries(table)) {
    const dist = haversineDist(latitude, longitude, toDecimalDeg(st.lat), toDecimalDeg(st.lon));
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestId = id;
    }
  }
  if (!nearestId) return { temperature: null, windDirection: null };

  // 2. Try current 3-hour block, then previous as fallback
  const now = new Date();
  let data: AmedasPointData | null = null;
  for (let offset = 0; offset <= 1; offset++) {
    const date = new Date(now.getTime() - offset * 3 * 60 * 60 * 1000);
    try {
      const res = await fetch(amedasBlockUrl(nearestId, date), { cache: "no-store" });
      if (res.ok) {
        data = (await res.json()) as AmedasPointData;
        break;
      }
    } catch {
      // try previous block
    }
  }
  if (!data) return { temperature: null, windDirection: null };

  // 3. Extract latest entry
  const keys = Object.keys(data).sort().reverse();
  for (const key of keys) {
    const obs = data[key];
    if (obs.temp || obs.windDirection) {
      return {
        temperature: obs.temp ? obs.temp[0] : null,
        windDirection: obs.windDirection
          ? (AMEDAS_DIR_TO_DEG[obs.windDirection[0]] ?? null)
          : null,
      };
    }
  }
  return { temperature: null, windDirection: null };
}

export async function fetchCurrentTemperature(
  latitude: number,
  longitude: number
): Promise<number | null> {
  const weather = await fetchCurrentWeather(latitude, longitude);
  return weather.temperature;
}
