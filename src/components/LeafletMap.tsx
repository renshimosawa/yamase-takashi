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
  onMarkerSelect?: (group: {
    latitude: number;
    longitude: number;
    posts: MapPost[];
    tooltipLines: string[];
    emojiSummary: string[];
  }) => void;
};

export default function LeafletMap({
  center,
  zoom = 13,
  posts = [],
  onMarkerSelect,
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
        .map((emoji) => `<span>${emoji}</span>`)
        .join("");

      cache.set(
        key,
        L.divIcon({
          className: "post-cluster-icon",
          html: `<div class="cluster-circle">${grid}</div>`,
          iconSize: [56, 56],
          iconAnchor: [28, 28],
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

  const groupedMarkers = useMemo(() => {
    type GroupData = {
      latitude: number;
      longitude: number;
      posts: MapPost[];
      tooltipLines: string[];
      emojiSummary: string[];
    };

    const groups = new Map<string, GroupData>();

    const truncateToPrecision = (value: number, precision: number) => {
      const multiplier = 10 ** precision;
      return Math.trunc(value * multiplier) / multiplier;
    };

    for (const post of posts) {
      if (
        typeof post.latitude !== "number" ||
        typeof post.longitude !== "number"
      ) {
        continue;
      }

      const latKey = truncateToPrecision(post.latitude, 4);
      const lngKey = truncateToPrecision(post.longitude, 4);
      const key = `${latKey}:${lngKey}`;
      const summary = `${post.emoji ?? fallbackEmoji}｜Lv.${
        post.intensity ?? "-"
      }｜${post.description}`;

      const existing = groups.get(key);
      if (existing) {
        existing.posts.push(post);
        existing.tooltipLines.push(summary);
        if (existing.emojiSummary.length < 9) {
          existing.emojiSummary.push(post.emoji ?? fallbackEmoji);
        }
      } else {
        groups.set(key, {
          latitude: latKey,
          longitude: lngKey,
          posts: [post],
          tooltipLines: [summary],
          emojiSummary: [post.emoji ?? fallbackEmoji],
        });
      }
    }

    return Array.from(groups.values());
  }, [posts, fallbackEmoji]);

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
        {groupedMarkers.map((group, index) => {
          const icon =
            group.posts.length > 1
              ? getClusterIcon(group.emojiSummary)
              : getEmojiIcon(group.posts[0]?.emoji ?? undefined);

          const markerKey = `${group.latitude}-${group.longitude}-${index}`;
          const handleSelect = () => onMarkerSelect?.(group);

          return (
            <Marker
              key={markerKey}
              position={[group.latitude, group.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  onMarkerSelect?.(group);
                },
              }}
            >
              <Tooltip
                interactive
                eventHandlers={{ click: handleSelect }}
                direction="top"
                offset={[0, group.posts.length > 1 ? -30 : -32]}
                opacity={1}
                permanent
                className="!pointer-events-auto !cursor-pointer !bg-white/95 !text-black !rounded-xl !px-4 !py-2 !text-xs !shadow-lg"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleSelect}
                  onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onMarkerSelect?.(group);
                    }
                  }}
                  className="space-y-2"
                >
                  {group.posts.length > 1 && (
                    <p className="text-xs font-semibold text-black/60">
                      {group.posts.length} 件の投稿
                    </p>
                  )}
                  <ul className="space-y-2">
                    {group.tooltipLines.map((line, lineIndex) => (
                      <li
                        key={`${markerKey}-line-${lineIndex}`}
                        className="rounded-lg bg-white/70 p-2 text-sm text-black/90"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
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
