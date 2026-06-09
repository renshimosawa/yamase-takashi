import { GSI_MUNI_MAP } from "@/lib/gsiMuniMap";

const GSI_REVERSE_GEOCODER_URL =
  "https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress" as const;

type GsiReverseGeocodeResponse = {
  results?: {
    muniCd?: string;
    lv01Nm?: string;
  } | null;
};

export type ReverseGeocodeResult = {
  /** 都道府県＋市区町村（例: 青森県八戸市） */
  municipality: string | null;
  /** 町字・地区名（例: 内丸一丁目） */
  district: string | null;
  /** 連結した住所（例: 青森県八戸市内丸一丁目） */
  address: string | null;
};

/**
 * 国土地理院のリバースジオコーディングAPIで緯度経度から住所（地区名まで）を取得する。
 * APIキー不要・無料。失敗時はすべて null を返す（投稿処理を止めない）。
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> {
  const empty: ReverseGeocodeResult = {
    municipality: null,
    district: null,
    address: null,
  };

  try {
    const url = new URL(GSI_REVERSE_GEOCODER_URL);
    url.searchParams.set("lat", latitude.toString());
    url.searchParams.set("lon", longitude.toString());

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "Failed to reverse geocode",
        response.status,
        response.statusText,
      );
      return empty;
    }

    const data = (await response.json()) as GsiReverseGeocodeResponse;
    const muniCd = data.results?.muniCd?.trim() || null;
    const district = data.results?.lv01Nm?.trim() || null;
    const municipality = muniCd ? (GSI_MUNI_MAP[muniCd] ?? null) : null;

    const address =
      municipality || district
        ? `${municipality ?? ""}${district ?? ""}`
        : null;

    return { municipality, district, address };
  } catch (error) {
    console.error("Unexpected error on reverseGeocode", error);
    return empty;
  }
}
