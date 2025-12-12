import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function DELETE(_request: Request, context: any) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postId = context?.params?.id as string | undefined;
    if (!postId || typeof postId !== "string") {
      return NextResponse.json(
        { error: "投稿IDが不正です" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", session.user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Failed to delete post", error);
      return NextResponse.json(
        { error: "投稿の削除に失敗しました" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "投稿が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error on DELETE /api/posts/[id]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

