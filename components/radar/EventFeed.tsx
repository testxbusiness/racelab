import React from "react";
import type { LiveRaceControlEvent } from "@/lib/f1/domain/live";

export function EventFeed({ events }: { events: LiveRaceControlEvent[] }) {
  const recent = events.slice(-8).reverse();
  return <section className="event-card" aria-label="Recent race control events"><div className="section-heading"><h2>Race control</h2><span>RECENT</span></div>{recent.length ? <div className="event-list">{recent.map((event) => <article className="event-item" key={event.id}><span className="event-lap">{event.lapNumber === null ? "—" : `LAP ${event.lapNumber}`}</span><div><strong>{event.message ?? event.category}</strong><span>{event.flag ?? event.category}</span></div></article>)}</div> : <p className="empty-state">No race-control events reported.</p>}</section>;
}
