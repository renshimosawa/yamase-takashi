"use client";

import { useEffect, useMemo, useState } from "react";
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

type LeafletMapProps = {
  center?: LatLngExpression;
  zoom?: number;
  posts?: Array<{
    id: string;
    content: string;
    latitude: number | null;
    longitude: number | null;
  }>;
};

export default function LeafletMap({
  center,
  zoom = 13,
  posts = [],
}: LeafletMapProps) {
  const [userPosition, setUserPosition] = useState<LatLngExpression | null>(
    null
  );
  const postIcon = useMemo(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    return L.divIcon({
      className: "post-marker-icon",
      html: '<span class="marker-emoji">📝</span>',
      iconSize: [32, 32],
      iconAnchor: [16, 28],
    });
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

  return (
    <div className="h-full w-full">
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
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
        {posts
          .filter(
            (post) =>
              typeof post.latitude === "number" &&
              typeof post.longitude === "number"
          )
          .map((post) => (
            <Marker
              key={post.id}
              position={[post.latitude!, post.longitude!]}
              icon={postIcon}
            >
              <Tooltip
                direction="top"
                offset={[0, -10]}
                opacity={1}
                permanent
                className="!bg-white !text-black !rounded-lg !px-3 !py-2 !text-xs !shadow"
              >
                {post.content}
              </Tooltip>
            </Marker>
          ))}
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
