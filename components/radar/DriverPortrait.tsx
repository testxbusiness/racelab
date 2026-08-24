import React from "react";
import Image from "next/image";
import { driverPortraitPath } from "@/lib/f1/assets";

export function DriverPortrait({ acronym, className = "" }: { acronym: string; className?: string }) {
  const src = driverPortraitPath(acronym);
  return src ? <Image className={`driver-portrait-image ${className}`} src={src} alt="" width={160} height={160} sizes="160px" /> : null;
}
