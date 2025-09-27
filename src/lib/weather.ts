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

type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current?: {
    time: string;
    interval: number;
    temperature_2m?: number;
  };
};

export async function fetchCurrentTemperature(
  latitude: number,
  longitude: number
): Promise<number | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set("current", "temperature_2m");
  url.searchParams.set("timezone", "Asia/Tokyo");

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch current temperature: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as OpenMeteoResponse;
  return data.current?.temperature_2m ?? null;
}
