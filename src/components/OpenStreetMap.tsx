"use client";

import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";

export type MapPost = {
  id: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  intensity: number | null;
  emoji: string | null;
  inserted_at?: string | null;
};

type OpenStreetMapProps = {
  center?: LatLngExpression;
  zoom?: number;
  posts?: MapPost[];
};

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
});

export default function OpenStreetMap({
  posts = [],
  ...props
}: OpenStreetMapProps) {
  return <LeafletMap {...props} posts={posts} />;
}
