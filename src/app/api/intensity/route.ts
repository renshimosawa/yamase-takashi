import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase";

const JAPAN_TZ = "Asia/Tokyo";

const getTodayDateRange = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: JAPAN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter
    .formatToParts(now)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  const year = parts.year;
  const month = parts.month;
  const day = parts.day;

  const start = new Date(`${year}-${month}-${day}T00:00:00+09:00`);
  const end = new Date(`${year}-${month}-${day}T23:59:59.999+09:00`);

  return { start: start.toISOString(), end: end.toISOString() };
};

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { start, end } = getTodayDateRange();

    const { data, error } = await supabase
      .from("posts")
      .select("intensity")
      .gte("inserted_at", start)
      .lte("inserted_at", end);

    if (error) {
      console.error("Failed to fetch intensity data", error);
      return NextResponse.json(
        { error: "強度データの取得に失敗しました" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ average: null }, { status: 200 });
    }

    const validValues = data
      .map((item) =>
        typeof item.intensity === "number" ? item.intensity : null
      )
      .filter((value): value is number => value !== null);

    if (validValues.length === 0) {
      return NextResponse.json({ average: null }, { status: 200 });
    }

    const sum = validValues.reduce((acc, value) => acc + value, 0);
    const average = sum / validValues.length;

    return NextResponse.json({ average }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error on GET /api/intensity", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
