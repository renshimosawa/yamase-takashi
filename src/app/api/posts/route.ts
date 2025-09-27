import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { getServerAuthSession } from "@/lib/auth";
type CreatePostRequest = {
  content: string;
  latitude?: number | null;
  longitude?: number | null;
};

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreatePostRequest;
    const { content, latitude, longitude } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "本文を入力してください" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("posts").insert({
      user_id: session.user.id,
      content,
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
      .select("id, content, latitude, longitude, inserted_at")
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
