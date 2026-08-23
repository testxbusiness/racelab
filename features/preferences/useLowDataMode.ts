"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "racelab:low-data-mode";

export function useLowDataMode(): [boolean, () => void] {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => { setEnabled(window.localStorage.getItem(STORAGE_KEY) === "true"); }, []);
  const toggle = () => setEnabled((current) => {
    const next = !current;
    window.localStorage.setItem(STORAGE_KEY, String(next));
    return next;
  });
  return [enabled, toggle];
}
