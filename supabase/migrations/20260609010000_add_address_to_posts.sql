alter table "public"."posts" add column if not exists "address" text;
alter table "public"."posts" add column if not exists "municipality" text;
alter table "public"."posts" add column if not exists "district" text;
