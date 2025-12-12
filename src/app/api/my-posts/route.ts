import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
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
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { start, end } = getTodayDateRange();

    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, description, intensity, smell_type, emoji, latitude, longitude, inserted_at"
      )
      .eq("user_id", session.user.id)
      .gte("inserted_at", start)
      .lte("inserted_at", end)
      .order("inserted_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch my posts", error);
      return NextResponse.json(
        { error: "投稿の取得中にエラーが発生しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ posts: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error on GET /api/my-posts", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
