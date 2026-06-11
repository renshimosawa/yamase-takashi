alter table "public"."posts" add column if not exists "pressure" double precision;
alter table "public"."posts" add column if not exists "normal_pressure" double precision;
alter table "public"."posts" add column if not exists "wind" double precision;
