"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  getSmellIconPath,
  isValidSmellType,
  SMELL_TYPE_LABELS,
  NEUTRAL_SMELL_EMOJI,
  NEUTRAL_SMELL_KEY,
  type SmellSummaryValue,
  type SmellType,
} from "@/constants/smell";
import type { MapPostGroup } from "./OpenStreetMap";

type MapPost = {
  id: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  intensity: number | null;
  smell_type: SmellType | null;
};

type LeafletMapProps = {
  center?: LatLngExpression;
  zoom?: number;
  posts?: MapPost[];
  onMarkerSelect?: (group: MapPostGroup) => void;
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
  const [hasGeolocationFix, setHasGeolocationFix] = useState(false);
  const [shouldFollowUser, setShouldFollowUser] = useState(true);

  const smellIconCache = useRef(new Map<SmellType, L.DivIcon>());

  const getSmellIcon = useCallback((smellType?: SmellType | null) => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const fallback: SmellType = "hoya";
    const key = smellType && isValidSmellType(smellType) ? smellType : fallback;
    const cache = smellIconCache.current;

    if (!cache.has(key)) {
      const iconPath = getSmellIconPath(key);
      cache.set(
        key,
        L.divIcon({
          className: "post-marker-icon",
          html: `<div class="marker-smell-pin"><img src="${iconPath}" alt="${SMELL_TYPE_LABELS[key]}" /></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        })
      );
    }

    return cache.get(key);
  }, []);

  const clusterIconCache = useRef(new Map<string, L.DivIcon>());

  const getClusterIcon = useCallback(
    (smellTypes: SmellSummaryValue[], hasNeutral: boolean) => {
      if (typeof window === "undefined") {
        return undefined;
      }

      const uniqueTypes = Array.from(new Set(smellTypes));
      if (hasNeutral) {
        uniqueTypes.unshift(NEUTRAL_SMELL_KEY);
      }

      if (uniqueTypes.length === 0) {
        return undefined;
      }

      const cache = clusterIconCache.current;
      const key = uniqueTypes.join("|") || "_empty";
      if (!cache.has(key)) {
        const maxItems = 4;
        const sliced = uniqueTypes.slice(0, maxItems);
        const baseSize = 28;
        const gap = 6;
        const itemCount = sliced.length;
        const width = itemCount * baseSize + Math.max(0, itemCount - 1) * gap;
        const height = baseSize;

        const grid = sliced
          .map((type) => {
            if (type === NEUTRAL_SMELL_KEY) {
              return `<span class="stacked-smell-icons__item stacked-smell-icons__item--neutral">${NEUTRAL_SMELL_EMOJI}</span>`;
            }
            const icon = getSmellIconPath(type);
            return `<span class="stacked-smell-icons__item"><img src="${icon}" alt="${SMELL_TYPE_LABELS[type]}" /></span>`;
          })
          .join("");

        cache.set(
          key,
          L.divIcon({
            className: "post-cluster-icon",
            html: `<div class="stacked-smell-icons">${grid}</div>`,
            iconSize: [width, height],
            iconAnchor: [width / 2, height],
          })
        );
      }

      return cache.get(key);
    },
    []
  );

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setUserPosition([latitude, longitude]);
      setHasGeolocationFix(true);
    };

    const watcherId = navigator.geolocation.watchPosition(onSuccess, () => {
      // geolocation 取得に失敗した場合はデフォルト位置のまま
    });

    return () => {
      navigator.geolocation.clearWatch(watcherId);
    };
  }, []);

  const fallbackCenter = useMemo<LatLngExpression>(
    () => center ?? [40.5086, 141.4882],
    [center]
  );

  const effectiveCenter = useMemo<LatLngExpression>(
    () => userPosition ?? fallbackCenter,
    [userPosition, fallbackCenter]
  );

  const handleUserInteraction = useCallback(() => {
    setShouldFollowUser((prev) => (prev ? false : prev));
  }, []);

  const handleMarkerSelect = useCallback(
    (group: MapPostGroup) => {
      setShouldFollowUser(false);
      onMarkerSelect?.(group);
    },
    [onMarkerSelect]
  );

  const groupedMarkers = useMemo(() => {
    type GroupData = {
      latitude: number;
      longitude: number;
      posts: MapPost[];
      tooltipLines: string[];
      smellSummary: SmellSummaryValue[];
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

      const latKey = truncateToPrecision(post.latitude, 3);
      const lngKey = truncateToPrecision(post.longitude, 3);
      const key = `${latKey}:${lngKey}`;
      const trimmedDescription =
        post.description.length > 15
          ? `${post.description.slice(0, 15)}…`
          : post.description;
      const summary = `Lv.${post.intensity ?? "-"}｜${trimmedDescription}`;

      const existing = groups.get(key);
      if (existing) {
        existing.posts.push(post);
        existing.tooltipLines.push(summary);
        if (post.intensity === 0) {
          if (!existing.smellSummary.includes(NEUTRAL_SMELL_KEY)) {
            existing.smellSummary.push(NEUTRAL_SMELL_KEY);
          }
        } else if (
          post.smell_type &&
          !existing.smellSummary.includes(post.smell_type)
        ) {
          existing.smellSummary.push(post.smell_type);
        }
      } else {
        groups.set(key, {
          latitude: latKey,
          longitude: lngKey,
          posts: [post],
          tooltipLines: [summary],
          smellSummary:
            post.intensity === 0
              ? [NEUTRAL_SMELL_KEY]
              : post.smell_type
              ? [post.smell_type]
              : [],
        });
      }
    }

    return Array.from(groups.values());
  }, [posts]);

  return (
    <div className="relative h-full w-full">
      {hasGeolocationFix && (
        <div className="pointer-events-none absolute top-[185px] right-[23px] z-[1000] flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              if (userPosition) {
                setShouldFollowUser(true);
              }
            }}
            className="pointer-events-auto rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 p-3 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 transform"
            aria-label="現在地に戻る"
            title="現在地に戻る"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      )}
      <MapContainer
        center={effectiveCenter}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        zoomControl={false}
      >
        <MapInteractionHandler onUserInteraction={handleUserInteraction} />
        <MapViewUpdater
          position={effectiveCenter}
          shouldFollowUser={shouldFollowUser}
        />
        <TileLayer
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={userPosition ?? fallbackCenter}
          radius={10}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#60a5fa",
            fillOpacity: 0.6,
          }}
        />
        {groupedMarkers.map((group, index) => {
          const hasNeutral = group.smellSummary.includes(NEUTRAL_SMELL_KEY);
          const iconOption =
            group.posts.length > 1 && group.smellSummary.length > 0
              ? getClusterIcon(group.smellSummary, hasNeutral)
              : group.posts[0]?.intensity === 0
              ? L.divIcon({
                  className: "post-marker-icon",
                  html: `<div class="marker-emoji-pin">${NEUTRAL_SMELL_EMOJI}</div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 32],
                })
              : getSmellIcon(group.posts[0]?.smell_type ?? undefined);

          const icon =
            iconOption ??
            L.divIcon({
              className: "post-marker-icon",
              html: `<div class="marker-emoji-pin">${NEUTRAL_SMELL_EMOJI}</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 32],
            });

          const markerKey = `${group.latitude}-${group.longitude}-${index}`;
          const handleSelect = () => handleMarkerSelect(group);

          return (
            <Marker
              key={markerKey}
              position={[group.latitude, group.longitude]}
              icon={icon}
              eventHandlers={{
                click: handleSelect,
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
                      handleMarkerSelect(group);
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
  shouldFollowUser: boolean;
};

function MapViewUpdater({ position, shouldFollowUser }: MapViewUpdaterProps) {
  const map = useMap();

  useEffect(() => {
    if (!shouldFollowUser) {
      return;
    }
    map.setView(position);
  }, [map, position, shouldFollowUser]);

  return null;
}

type MapInteractionHandlerProps = {
  onUserInteraction: () => void;
};

function MapInteractionHandler({
  onUserInteraction,
}: MapInteractionHandlerProps) {
  useMapEvents({
    dragstart: onUserInteraction,
    zoomstart: onUserInteraction,
    movestart: onUserInteraction,
  });

  return null;
}
