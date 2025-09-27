import NextAuth, { getServerSession } from "next-auth";
import Google from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn(
    "[next-auth] GOOGLE_CLIENT_ID または GOOGLE_CLIENT_SECRET が設定されていません。環境変数を確認してください。"
  );
}

export const authConfig: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: GOOGLE_CLIENT_ID ?? "",
      clientSecret: GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
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

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };

export async function getServerAuthSession() {
  return getServerSession(authConfig);
}
