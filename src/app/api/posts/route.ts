import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { getServerAuthSession } from "@/lib/auth";
type CreatePostRequest = {
  description: string;
  latitude?: number | null;
  longitude?: number | null;
  intensity?: number | null;
  emoji?: string | null;
};

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreatePostRequest;
    const { description, latitude, longitude, intensity, emoji } = body;

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

    if (emoji && [...emoji].length !== 1) {
      return NextResponse.json(
        { error: "絵文字は1文字で入力してください" },
        { status: 400 }
      );
    }

    const normalizedIntensity =
      typeof intensity === "number" && !Number.isNaN(intensity)
        ? Math.min(Math.max(Math.round(intensity), 0), 3)
        : null;

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("posts").insert({
      user_id: session.user.id,
      description,
      content: description,
      intensity: normalizedIntensity,
      emoji: emoji ?? null,
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
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, description, intensity, emoji, latitude, longitude, inserted_at"
      )
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
