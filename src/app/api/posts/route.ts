import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { getServerAuthSession } from "@/lib/auth";
import { isValidSmellType, type SmellType } from "@/constants/smell";

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

const getCleanupThreshold = (days = 7) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return cutoff.toISOString();
};
type CreatePostRequest = {
  description: string;
  smell_type: SmellType | null;
  latitude?: number | null;
  longitude?: number | null;
  intensity?: number | null;
};

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreatePostRequest;
    const { description, smell_type, latitude, longitude, intensity } = body;

    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { error: "自由入力欄を入力してください" },
        { status: 400 }
      );
    }

    if (description.length > 50) {
      return NextResponse.json(
        { error: "自由入力欄は50文字以内で入力してください" },
        { status: 400 }
      );
    }

    const normalizedIntensity =
      typeof intensity === "number" && !Number.isNaN(intensity)
        ? Math.min(Math.max(Math.round(intensity), 0), 3)
        : null;

    if (smell_type !== null && !isValidSmellType(smell_type)) {
      return NextResponse.json(
        { error: "においタイプが不正です" },
        { status: 400 }
      );
    }

    if (normalizedIntensity !== null && normalizedIntensity > 0) {
      if (!smell_type) {
        return NextResponse.json(
          { error: "においタイプを選択してください" },
          { status: 400 }
        );
      }
    }

    const storedSmellType = normalizedIntensity === 0 ? null : smell_type;

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("posts").insert({
      user_id: session.user.id,
      description,
      content: description,
      intensity: normalizedIntensity,
      smell_type: storedSmellType,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    });

    if (error) {
      console.error("Failed to insert post", error);
      return NextResponse.json(
        { error: "投稿の保存中にエラーが発生しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error on POST /api/posts", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const cutoff = getCleanupThreshold();
    const { error: cleanupError } = await supabase
      .from("posts")
      .delete()
      .lt("inserted_at", cutoff);

    if (cleanupError) {
      console.error("Failed to cleanup old posts", cleanupError);
    }

    const { start, end } = getTodayDateRange();

    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, description, intensity, smell_type, latitude, longitude, inserted_at"
      )
      .gte("inserted_at", start)
      .lte("inserted_at", end)
      .order("inserted_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Failed to fetch posts", error);
      return NextResponse.json(
        { error: "投稿の取得中にエラーが発生しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ posts: data }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error on GET /api/posts", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
