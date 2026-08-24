import React from "react";
import Image from "next/image";
import { teamAsset } from "@/lib/f1/assets";

export function TeamLogo({ teamName, className = "" }: { teamName: string | null; className?: string }) {
  const asset = teamAsset(teamName);
  return asset ? <Image className={`team-logo-image ${className}`} src={asset.logo} alt="" width={24} height={24} sizes="24px" /> : null;
}
