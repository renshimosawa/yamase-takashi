このプロジェクトは [Next.js](https://nextjs.org) を用いて構築されています。

## 開発環境の起動

```bash
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くとアプリが表示されます。

## Google ログイン（NextAuth）設定

Google 認証を利用するには、以下の環境変数を `.env.local` に設定してください。

```
GOOGLE_CLIENT_ID="Google Cloud Console で発行したクライアントID"
GOOGLE_CLIENT_SECRET="Google Cloud Console で発行したクライアントシークレット"
NEXTAUTH_SECRET="十分に長いランダム文字列"
NEXTAUTH_URL="http://localhost:3000"
SUPABASE_URL="https://<project>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) で OAuth 2.0 クライアント ID を作成します。
   - 認証情報 > 認証情報を作成 > OAuth クライアント ID を選択
   - アプリケーションの種類: ウェブアプリケーション
   - 承認済みのリダイレクト URI に `http://localhost:3000/api/auth/callback/google` を追加
2. 発行されたクライアント ID / シークレットを `.env.local` に設定します。
3. `NEXTAUTH_SECRET` は `openssl rand -base64 32` などで生成してください。

環境変数を設定した後、開発サーバーを再起動すると、画面下部のバーから Google ログインを行えます。

## Supabase の利用手順

Supabase の利用手順:

1. [Supabase](https://supabase.com/) でプロジェクトを作成し、左メニュー「プロジェクト設定 > API」から URL と `service_role` キーを取得します。
   - URL を `SUPABASE_URL` に設定
   - `service_role` キーを `SUPABASE_SERVICE_ROLE_KEY` に設定（機密情報のため公開リポジトリにコミットしないでください）
2. Supabase SQL Editor で投稿テーブルを作成します。

```sql
create table if not exists public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  content text not null,
  latitude double precision,
  longitude double precision,
  inserted_at timestamp with time zone default timezone('utc'::text, now())
);
```

3. 必要に応じて Supabase 側で Row Level Security を有効化し、サービスロールキーで書き込みできるようにポリシーを設定してください。

## 技術スタック

- Next.js 15 App Router
- TypeScript / React 19
- NextAuth.js (Google OAuth)
- Leaflet + React Leaflet
