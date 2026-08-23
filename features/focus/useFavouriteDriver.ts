"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "racelab:favourite-driver";

export function useFavouriteDriver(): [number | null, (driverNumber: number | null) => void] {
  const [favourite, setFavourite] = useState<number | null>(null);
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored === null ? null : Number(stored);
    if (parsed !== null && Number.isInteger(parsed)) setFavourite(parsed);
  }, []);
  const update = (driverNumber: number | null) => {
    setFavourite(driverNumber);
    if (driverNumber === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, String(driverNumber));
  };
  return [favourite, update];
}
