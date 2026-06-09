alter table "public"."posts" add column if not exists "temperature" double precision;
alter table "public"."posts" add column if not exists "wind_direction" double precision;
