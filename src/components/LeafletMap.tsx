"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

type MapPost = {
  id: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  intensity: number | null;
  emoji: string | null;
};

type LeafletMapProps = {
  center?: LatLngExpression;
  zoom?: number;
  posts?: MapPost[];
};

export default function LeafletMap({
  center,
  zoom = 13,
  posts = [],
}: LeafletMapProps) {
  const [userPosition, setUserPosition] = useState<LatLngExpression | null>(
    null
  );

  const fallbackEmoji = "📍";
  const emojiIconCache = useRef(new Map<string, L.DivIcon>());

  const getEmojiIcon = useCallback(
    (emoji?: string | null) => {
      if (typeof window === "undefined") {
        return undefined;
      }

      const key = emoji && emoji.trim() ? emoji : fallbackEmoji;
      const cache = emojiIconCache.current;

      if (!cache.has(key)) {
        cache.set(
          key,
          L.divIcon({
            className: "post-marker-icon",
            html: `<span class="marker-emoji-pin">${key}</span>`,
            iconSize: [36, 36],
            iconAnchor: [18, 30],
          })
        );
      }

      return cache.get(key);
    },
    [fallbackEmoji]
  );

  const clusterIconCache = useRef(new Map<string, L.DivIcon>());

  const getClusterIcon = useCallback((emojis: string[]) => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const cache = clusterIconCache.current;
    const key = emojis.join("|") || "_empty";
    if (!cache.has(key)) {
      const grid = emojis
        .slice(0, 9)
        .map((emoji, index) => `<span data-idx="${index}">${emoji}</span>`) // simple span grid
        .join("");

      cache.set(
        key,
        L.divIcon({
          className: "post-cluster-icon",
          html: `<div class="cluster-circle"><div class="cluster-emoji-grid">${grid}</div></div>`,
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        })
      );
    }

    return cache.get(key);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setUserPosition([latitude, longitude]);
    };

    const watcherId = navigator.geolocation.watchPosition(onSuccess, () => {
      // geolocation 取得に失敗した場合はデフォルト位置のまま
    });

    return () => {
      navigator.geolocation.clearWatch(watcherId);
    };
  }, []);

  const defaultCenter = useMemo<LatLngExpression>(
    () => userPosition ?? center ?? [35.6809591, 139.7673068],
    [userPosition, center]
  );

  const { singleMarkers, clusterMarkers } = useMemo(() => {
    const groups = new Map<
      string,
      {
        latitude: number;
        longitude: number;
        posts: MapPost[];
      }
    >();

    for (const post of posts) {
      if (
        typeof post.latitude !== "number" ||
        typeof post.longitude !== "number"
      ) {
        continue;
      }

      const key = `${post.latitude.toFixed(4)}:${post.longitude.toFixed(4)}`;
      const existing = groups.get(key);

      if (existing) {
        existing.posts?.push(post);
      } else {
        groups.set(key, {
          latitude: post.latitude,
          longitude: post.longitude,
          posts: [post],
        });
      }
    }

    const singles: Array<{
      latitude: number;
      longitude: number;
      post: MapPost;
    }> = [];
    const clusters: Array<{
      latitude: number;
      longitude: number;
      posts: MapPost[];
    }> = [];

    groups.forEach((group) => {
      if (!group.posts) {
        return;
      }

      if (group.posts.length === 1) {
        singles.push({
          latitude: group.latitude,
          longitude: group.longitude,
          post: group.posts[0]!,
        });
      } else {
        clusters.push({
          latitude: group.latitude,
          longitude: group.longitude,
          posts: group.posts,
        });
      }
    });

    return {
      singleMarkers: singles,
      clusterMarkers: clusters,
    };
  }, [posts]);

  return (
    <div className="h-full w-full">
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        zoomControl={false}
      >
        <MapViewUpdater position={defaultCenter} />
        <TileLayer
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={defaultCenter}
          radius={10}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#60a5fa",
            fillOpacity: 0.6,
          }}
        />
        {singleMarkers.map(({ latitude, longitude, post }) => {
          const icon = getEmojiIcon(post.emoji ?? undefined);
          return (
            <Marker key={post.id} position={[latitude, longitude]} icon={icon}>
              <Tooltip
                direction="top"
                offset={[0, -32]}
                opacity={1}
                permanent
                className="!bg-white/95 !text-black !rounded-xl !px-4 !py-2 !text-xs !shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{post.emoji ?? fallbackEmoji}</span>
                  <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] text-black">
                    {post.intensity !== null ? `Lv.${post.intensity}` : "Lv.-"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-black/80">{post.description}</p>
              </Tooltip>
            </Marker>
          );
        })}
        {clusterMarkers.map(({ latitude, longitude, posts: clusterPosts }) => {
          const count = clusterPosts?.length ?? 0;
          const emojiList = (clusterPosts ?? []).map(
            (p) => p.emoji ?? fallbackEmoji
          );
          const icon = getClusterIcon(emojiList);

          return (
            <Marker
              key={`${latitude}-${longitude}`}
              position={[latitude, longitude]}
              icon={icon}
            >
              <Tooltip
                direction="top"
                offset={[0, -30]}
                opacity={1}
                permanent
                className="!bg-white/95 !text-black !rounded-xl !px-4 !py-2 !text-xs !shadow-lg"
              >
                <p className="mb-2 text-xs font-semibold text-black/60">
                  {count} 件の投稿
                </p>
                <ul className="max-h-48 w-48 space-y-2 overflow-auto">
                  {clusterPosts?.map((clusterPost) => (
                    <li
                      key={clusterPost.id}
                      className="rounded-lg bg-white/70 p-2"
                    >
                      <div className="mb-1 flex items-center gap-2 text-xs text-black/70">
                        <span className="text-lg">
                          {clusterPost.emoji ?? fallbackEmoji}
                        </span>
                        <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] text-black">
                          {clusterPost.intensity !== null
                            ? `Lv.${clusterPost.intensity}`
                            : "Lv.-"}
                        </span>
                      </div>
                      <p className="text-sm text-black/90">
                        {clusterPost.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

type MapViewUpdaterProps = {
  position: LatLngExpression;
};

function MapViewUpdater({ position }: MapViewUpdaterProps) {
  const map = useMap();

  useEffect(() => {
    map.setView(position);
  }, [map, position]);

  return null;
}
