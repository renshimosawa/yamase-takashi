"use client";

import { useRef } from "react";
import LpCtaBar from "./LpCtaBar";

export default function LpHeroRef({
  children,
}: {
  children: React.ReactNode;
}) {
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div ref={heroRef}>{children}</div>
      <LpCtaBar heroRef={heroRef} />
    </>
  );
}
