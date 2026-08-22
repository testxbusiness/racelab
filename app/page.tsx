import { getOpenF1Env } from "@/lib/openf1/env";
import { getDiagnostics } from "@/lib/openf1/diagnostics";

export const dynamic = "force-dynamic";

function age(timestamp: string | null) { return timestamp ? `${Math.max(0, (Date.now() - Date.parse(timestamp)) / 1000).toFixed(1)}s` : "—"; }

export default async function HomePage() {
  const diagnosticsEnabled = getOpenF1Env().OPENF1_DIAGNOSTICS_ENABLED;
  if (!diagnosticsEnabled) return <main><h1>RaceLab</h1><p>Diagnostics are disabled.</p></main>;
  const result = await getDiagnostics();
  if (!result.ok) return <main><div className="status"><span className="dot" /> PROVIDER UNAVAILABLE</div><h1>Live proof</h1><p className="error">{result.error}</p><p>Received at {result.receivedAt}. Credentials remain server-side.</p></main>;
  const { data } = result;
  const session = data.sessions[0];
  const latestPositions = new Map<number, (typeof data.positions)[number]>();
  for (const position of data.positions) latestPositions.set(position.driver_number, position);
  const latestIntervals = new Map<number, (typeof data.intervals)[number]>();
  for (const interval of data.intervals) latestIntervals.set(interval.driver_number, interval);
  const rows = [...latestPositions.values()].sort((a, b) => a.position - b.position);
  return <main>
    <div className="status"><span className="dot ok" /> LIVE SESSION</div>
    <h1>{session.session_name}</h1><p>{session.country_name ?? ""} · {session.circuit_short_name ?? ""} · server-rendered OpenF1 diagnostic</p>
    <section className="grid"><div className="card"><div className="label">Session key</div><div className="value">{session.session_key}</div></div><div className="card"><div className="label">Lap</div><div className="value">{data.laps.length ? Math.max(...data.laps.map((lap) => lap.lap_number)) : "—"}</div></div><div className="card"><div className="label">Drivers</div><div className="value">{data.drivers.length}</div></div><div className="card"><div className="label">Last source age</div><div className="value">{age(result.lastSourceTimestamp)}</div></div><div className="card"><div className="label">Requests / load</div><div className="value">{result.requestCount}</div></div></section>
    <p>Received at <code>{result.receivedAt}</code> · source timestamp <code>{result.lastSourceTimestamp ?? "—"}</code> · request count/min <code>{result.requestCount}</code></p>
    <h2>Position + intervals</h2><table><thead><tr><th>Pos</th><th>Driver</th><th>Interval</th><th>Gap leader</th><th>Source</th></tr></thead><tbody>{rows.map((position) => { const driver = data.drivers.find((item) => item.driver_number === position.driver_number); const interval = latestIntervals.get(position.driver_number); return <tr key={position.driver_number}><td>{position.position}</td><td>{driver?.name_acronym ?? position.driver_number}</td><td>{interval?.interval ?? "—"}</td><td>{interval?.gap_to_leader ?? "—"}</td><td>{position.date}</td></tr>; })}</tbody></table>
    <h2>Race control</h2>{data.raceControl.length ? <ul>{data.raceControl.slice(-10).reverse().map((event) => <li key={`${event.date}-${event.message}`}>{event.date} — {event.message ?? event.category}</li>)}</ul> : <p>No race-control events returned for this session.</p>}
  </main>;
}
