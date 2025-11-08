import NextAuth, { getServerSession } from "next-auth";
import Google from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const providers: NextAuthOptions["providers"] = [];

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    })
  );
} else {
  console.warn(
    "[next-auth] GOOGLE_CLIENT_ID または GOOGLE_CLIENT_SECRET が設定されていません。環境変数を確認してください。"
  );
}

const secret = process.env.NEXTAUTH_SECRET;

const baseConfig: NextAuthOptions = {
  secret,
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session: ({ session, token }) => {
      if (session.user && token.sub) {
        (session.user as typeof session.user & { id?: string }).id = token.sub;
      }
      return session;
    },
  },
};

const isAuthConfigured = Boolean(secret && providers.length > 0);

export const authConfig: NextAuthOptions | null = isAuthConfigured
  ? baseConfig
  : null;

const handler = authConfig
  ? NextAuth(authConfig)
  : async () =>
      NextResponse.json(
        { error: "Authentication is not configured." },
        { status: 503 }
      );

export { handler as GET, handler as POST };

export async function getServerAuthSession() {
  if (!authConfig) {
    return null;
  }

  try {
    return await getServerSession(authConfig);
  } catch (error) {
    console.error("[next-auth] getServerSession の取得に失敗しました", error);
    return null;
  }
}
