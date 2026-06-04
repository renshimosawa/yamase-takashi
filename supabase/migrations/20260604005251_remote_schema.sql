
  create table "public"."fcm_tokens" (
    "id" bigint generated always as identity not null,
    "user_id" text not null,
    "token" text not null,
    "platform" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."fcm_tokens" enable row level security;


  create table "public"."posts" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" text not null,
    "content" text not null,
    "latitude" double precision,
    "longitude" double precision,
    "inserted_at" timestamp with time zone default timezone('utc'::text, now()),
    "description" text not null,
    "intensity" integer,
    "emoji" text,
    "smell_type" text
      );


alter table "public"."posts" enable row level security;

CREATE UNIQUE INDEX fcm_tokens_pkey ON public.fcm_tokens USING btree (id);

CREATE UNIQUE INDEX fcm_tokens_token_key ON public.fcm_tokens USING btree (token);

CREATE INDEX idx_fcm_tokens_user_id ON public.fcm_tokens USING btree (user_id);

CREATE UNIQUE INDEX posts_pkey ON public.posts USING btree (id);

alter table "public"."fcm_tokens" add constraint "fcm_tokens_pkey" PRIMARY KEY using index "fcm_tokens_pkey";

alter table "public"."posts" add constraint "posts_pkey" PRIMARY KEY using index "posts_pkey";

alter table "public"."fcm_tokens" add constraint "fcm_tokens_token_key" UNIQUE using index "fcm_tokens_token_key";

alter table "public"."posts" add constraint "posts_smell_type_check" CHECK ((smell_type = ANY (ARRAY['hoya'::text, 'iron'::text, 'umineko'::text, 'dog_food'::text, 'livestock'::text]))) not valid;

alter table "public"."posts" validate constraint "posts_smell_type_check";

grant delete on table "public"."fcm_tokens" to "anon";

grant insert on table "public"."fcm_tokens" to "anon";

grant references on table "public"."fcm_tokens" to "anon";

grant select on table "public"."fcm_tokens" to "anon";

grant trigger on table "public"."fcm_tokens" to "anon";

grant truncate on table "public"."fcm_tokens" to "anon";

grant update on table "public"."fcm_tokens" to "anon";

grant delete on table "public"."fcm_tokens" to "authenticated";

grant insert on table "public"."fcm_tokens" to "authenticated";

grant references on table "public"."fcm_tokens" to "authenticated";

grant select on table "public"."fcm_tokens" to "authenticated";

grant trigger on table "public"."fcm_tokens" to "authenticated";

grant truncate on table "public"."fcm_tokens" to "authenticated";

grant update on table "public"."fcm_tokens" to "authenticated";

grant delete on table "public"."fcm_tokens" to "service_role";

grant insert on table "public"."fcm_tokens" to "service_role";

grant references on table "public"."fcm_tokens" to "service_role";

grant select on table "public"."fcm_tokens" to "service_role";

grant trigger on table "public"."fcm_tokens" to "service_role";

grant truncate on table "public"."fcm_tokens" to "service_role";

grant update on table "public"."fcm_tokens" to "service_role";

grant delete on table "public"."posts" to "anon";

grant insert on table "public"."posts" to "anon";

grant references on table "public"."posts" to "anon";

grant select on table "public"."posts" to "anon";

grant trigger on table "public"."posts" to "anon";

grant truncate on table "public"."posts" to "anon";

grant update on table "public"."posts" to "anon";

grant delete on table "public"."posts" to "authenticated";

grant insert on table "public"."posts" to "authenticated";

grant references on table "public"."posts" to "authenticated";

grant select on table "public"."posts" to "authenticated";

grant trigger on table "public"."posts" to "authenticated";

grant truncate on table "public"."posts" to "authenticated";

grant update on table "public"."posts" to "authenticated";

grant delete on table "public"."posts" to "service_role";

grant insert on table "public"."posts" to "service_role";

grant references on table "public"."posts" to "service_role";

grant select on table "public"."posts" to "service_role";

grant trigger on table "public"."posts" to "service_role";

grant truncate on table "public"."posts" to "service_role";

grant update on table "public"."posts" to "service_role";


  create policy "service role full access"
  on "public"."posts"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text))
with check ((auth.role() = 'service_role'::text));


CREATE TRIGGER notify AFTER INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://yamasekun-no-shirase.vercel.app/api/webhooks/new-post', 'POST', '{"Authorization":"Bearer post-webhook-nc89ehqbdggienxvbr7yhsbkpiclma53fdhjcn8"}', '{}', '5000');


