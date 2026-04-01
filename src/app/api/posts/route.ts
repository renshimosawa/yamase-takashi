import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { getServerAuthSession } from "@/lib/auth";
import { getFirebaseAdminMessaging } from "@/lib/firebase-admin";
import {
  isValidNeutralSmellEmoji,
  isValidSmellType,
  NEUTRAL_SMELL_EMOJI,
  SMELL_TYPE_LABELS,
  type SmellType,
} from "@/constants/smell";

const JAPAN_TZ = "Asia/Tokyo";
const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "https://yamasekun-no-shirase.vercel.app";

type FcmTokenRecord = {
  token: string;
};

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
  emoji?: string | null;
};

const truncateText = (text: string, maxLength: number) =>
  text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`;

async function notifyNewPost(post: {
  userId: string;
  description: string;
  insertedAt: string;
  intensity: number | null;
  smellType: SmellType | null;
  emoji: string | null;
}) {
  const messaging = getFirebaseAdminMessaging();
  if (!messaging) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("fcm_tokens")
    .select("token")
    .neq("user_id", post.userId);

  if (error) {
    console.error("Failed to fetch FCM tokens", error);
    return;
  }

  const tokens = Array.from(
    new Set(
      ((data as FcmTokenRecord[] | null) ?? [])
        .map((row) => row.token?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );

  if (tokens.length === 0) {
    return;
  }

  const smellLabel =
    post.intensity === 0
      ? "ニュートラル"
      : post.smellType
      ? SMELL_TYPE_LABELS[post.smellType]
      : "未選択";
  const meta =
    post.intensity === 0
      ? `Lv0 ${post.emoji ?? NEUTRAL_SMELL_EMOJI}`
      : `Lv${post.intensity ?? "-"} ${smellLabel}`;

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: "新しい投稿があります",
      body: `${meta} - ${truncateText(post.description, 48)}`,
    },
    webpush: {
      fcmOptions: {
        link: `${APP_ORIGIN}/`,
      },
      notification: {
        icon: `${APP_ORIGIN}/favicon.png`,
        badge: `${APP_ORIGIN}/favicon.png`,
      },
    },
    data: {
      type: "new_post",
      insertedAt: post.insertedAt,
      link: `${APP_ORIGIN}/`,
    },
  });

  const failedCodes = response.responses
    .filter((result) => !result.success)
    .map((result) => result.error?.code ?? "unknown_error");

  console.info("FCM multicast result", {
    tokenCount: tokens.length,
    successCount: response.successCount,
    failureCount: response.failureCount,
    failedCodes,
  });

  const invalidTokens = response.responses
    .map((result, index) => {
      if (result.success) {
        return null;
      }
      const code = result.error?.code;
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) {
        return tokens[index];
      }
      return null;
    })
    .filter((value): value is string => Boolean(value));

  if (invalidTokens.length === 0) {
    return;
  }

  const { error: cleanupError } = await supabase
    .from("fcm_tokens")
    .delete()
    .in("token", invalidTokens);

  if (cleanupError) {
    console.error("Failed to cleanup invalid FCM tokens", cleanupError);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreatePostRequest;
    const { description, smell_type, latitude, longitude, intensity, emoji } =
      body;

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

    const sanitizedEmoji =
      typeof emoji === "string" ? emoji.trim() || null : null;

    if (normalizedIntensity !== null && normalizedIntensity > 0) {
      if (!smell_type) {
        return NextResponse.json(
          { error: "においタイプを選択してください" },
          { status: 400 }
        );
      }
    }

    if (normalizedIntensity === 0) {
      if (!sanitizedEmoji || !isValidNeutralSmellEmoji(sanitizedEmoji)) {
        return NextResponse.json(
          { error: "ピン用の絵文字が不正です" },
          { status: 400 }
        );
      }
    }

    if (normalizedIntensity !== null && normalizedIntensity > 0) {
      if (sanitizedEmoji) {
        console.warn(
          "Ignoring emoji for non-neutral post submission",
          sanitizedEmoji
        );
      }
    }

    const storedSmellType = normalizedIntensity === 0 ? null : smell_type;
    const storedEmoji =
      normalizedIntensity === 0
        ? sanitizedEmoji ?? NEUTRAL_SMELL_EMOJI
        : null;

    const supabase = getSupabaseAdmin();
    const insertedAt = new Date().toISOString();

    const { error } = await supabase.from("posts").insert({
      user_id: session.user.id,
      description,
      content: description,
      intensity: normalizedIntensity,
      smell_type: storedSmellType,
      emoji: storedEmoji,
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

    void notifyNewPost({
      userId: session.user.id,
      description,
      insertedAt,
      intensity: normalizedIntensity,
      smellType: storedSmellType,
      emoji: storedEmoji,
    }).catch((notifyError) => {
      console.error("Failed to send FCM notification", notifyError);
    });

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
        "id, description, intensity, smell_type, emoji, latitude, longitude, inserted_at"
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
