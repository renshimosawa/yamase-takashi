"use client";

import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";

import type { SmellType, SmellSummaryValue } from "@/constants/smell";

export type MapPost = {
  id: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  intensity: number | null;
  smell_type: SmellType | null;
  emoji?: string | null;
  inserted_at?: string | null;
};

export type MapPostGroup = {
  latitude: number;
  longitude: number;
  posts: MapPost[];
  tooltipLines: string[];
  smellSummary: SmellSummaryValue[];
};

type OpenStreetMapProps = {
  center?: LatLngExpression;
  zoom?: number;
  posts?: MapPost[];
  onMarkerSelect?: (group: MapPostGroup) => void;
  followUserRequestToken?: number;
  onGeolocationFixChange?: (hasFix: boolean) => void;
};

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
});

export default function OpenStreetMap({
  posts = [],
  onMarkerSelect,
  followUserRequestToken,
  onGeolocationFixChange,
  ...props
}: OpenStreetMapProps) {
  return (
    <LeafletMap
      {...props}
      posts={posts}
      onMarkerSelect={onMarkerSelect}
      followUserRequestToken={followUserRequestToken}
      onGeolocationFixChange={onGeolocationFixChange}
    />
  );
}
