import React from "react";

function RailIcon({ type }: { type: "radar" | "map" | "focus" | "events" | "settings" }) {
  if (type === "map") return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15M15 6v15" /></svg>;
  if (type === "focus") return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>;
  if (type === "events") return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4" /></svg>;
  if (type === "settings") return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9.5 3.8.6-1.3h3.8l.6 1.3 1.5.9 1.4-.3 1.9 3.3-1 1.1v1.8l1 1.1-1.9 3.3-1.4-.3-1.5.9-.6 1.3h-3.8l-.6-1.3-1.5-.9-1.4.3-1.9-3.3 1-1.1V8.8l-1-1.1L6.6 4.4l1.4.3 1.5-.9Z" /><circle cx="12" cy="9.8" r="2.7" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5" /><path d="M12 4.5V2M12 22v-2.5M4.5 12H2M22 12h-2.5M7 7l-2-2M19 19l-2-2M17 7l2-2M5 19l2 2" /></svg>;
}

const items = [
  { label: "Race Radar", type: "radar" as const, active: true },
  { label: "Track Map", type: "map" as const },
  { label: "Focus Driver", type: "focus" as const },
  { label: "Event Feed", type: "events" as const },
  { label: "Settings", type: "settings" as const },
];

export function DesktopRail() {
  return <aside className="desktop-rail" aria-label="RaceLab sections"><div className="desktop-rail-brand"><span className="brand-mark">RL</span><div><strong>RACELAB</strong><span>F1 LIVE · REAL TIME</span></div></div><p className="desktop-rail-kicker">SECTIONS</p><nav>{items.map((item) => <a className={item.active ? "desktop-rail-link desktop-rail-link-active" : "desktop-rail-link"} href={item.active ? "/radar" : "#"} aria-current={item.active ? "page" : undefined} aria-disabled={!item.active} key={item.label} onClick={(event) => { if (!item.active) event.preventDefault(); }}><RailIcon type={item.type} /><span>{item.label}</span>{!item.active ? <small>SOON</small> : null}</a>)}</nav><div className="desktop-rail-footer"><span className="status-dot" aria-hidden="true" /> Provider-backed live timing</div></aside>;
}
