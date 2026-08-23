import React from "react";
import Link from "next/link";

type NavItem = { label: string; icon: "radar" | "calendar" | "focus" | "settings"; active?: boolean };
const items: NavItem[] = [{ label: "Radar", icon: "radar", active: true }, { label: "Weekend", icon: "calendar" }, { label: "Focus", icon: "focus" }, { label: "Settings", icon: "settings" }];

function NavIcon({ icon }: { icon: NavItem["icon"] }) {
  if (icon === "calendar") return <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M7 3.5v3M17 3.5v3M3.5 10h17" /></svg>;
  if (icon === "focus") return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="2.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>;
  if (icon === "settings") return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9.5 3.8.6-1.3h3.8l.6 1.3 1.5.9 1.4-.3 1.9 3.3-1 1.1v1.8l1 1.1-1.9 3.3-1.4-.3-1.5.9-.6 1.3h-3.8l-.6-1.3-1.5-.9-1.4.3-1.9-3.3 1-1.1V8.8l-1-1.1L6.6 4.4l1.4.3 1.5-.9Z" /><circle cx="12" cy="9.8" r="2.7" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5" /><path d="M12 4.5V2M12 22v-2.5M4.5 12H2M22 12h-2.5M7 7l-2-2M19 19l-2-2M17 7l2-2M5 19l2-2" /></svg>;
}

export function RadarNav() {
  return <nav className="radar-nav" aria-label="Primary navigation">{items.map((item) => item.active ? <Link className="nav-item nav-item-active" href="/radar" aria-current="page" key={item.label}><NavIcon icon={item.icon} /><span>{item.label}</span></Link> : <span className="nav-item nav-item-disabled" aria-disabled="true" title={`${item.label} coming soon`} key={item.label}><NavIcon icon={item.icon} /><span>{item.label}</span></span>)}</nav>;
}
