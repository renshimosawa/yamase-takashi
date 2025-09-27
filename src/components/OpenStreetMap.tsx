"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";

type OpenStreetMapProps = {
  center?: LatLngExpression;
  zoom?: number;
};

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
});

export default function OpenStreetMap(props: OpenStreetMapProps) {
  return <LeafletMap {...props} />;
}
