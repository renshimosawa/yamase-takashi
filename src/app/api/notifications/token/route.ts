import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

type RegisterTokenRequest = {
  token?: string;
  platform?: string;
};
type DeleteTokenRequest = {
  token?: string;
};

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as RegisterTokenRequest;
    const token = body.token?.trim();
    const platform = body.platform?.trim() ?? null;

    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("fcm_tokens").upsert(
      {
        user_id: session.user.id,
        token,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "token" }
    );

    if (error) {
      console.error("Failed to register FCM token", error);
      return NextResponse.json(
        { error: "FCMトークンの保存に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error on POST /api/notifications/token", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as DeleteTokenRequest;
    const token = body.token?.trim();
    const supabase = getSupabaseAdmin();

    if (token) {
      const { error } = await supabase
        .from("fcm_tokens")
        .delete()
        .eq("user_id", session.user.id)
        .eq("token", token);

      if (error) {
        console.error("Failed to delete FCM token", error);
        return NextResponse.json(
          { error: "FCMトークンの削除に失敗しました" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error on DELETE /api/notifications/token", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
