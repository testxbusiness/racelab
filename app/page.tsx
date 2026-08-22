import { getOpenF1Env } from "@/lib/openf1/env";
import { getDiagnostics } from "@/lib/openf1/diagnostics";

export const dynamic = "force-dynamic";

function age(ageMs: number | null) { return ageMs === null ? "—" : `${(ageMs / 1000).toFixed(1)}s`; }

export default async function HomePage() {
  const diagnosticsEnabled = getOpenF1Env().OPENF1_DIAGNOSTICS_ENABLED;
  if (!diagnosticsEnabled) return <main><h1>RaceLab</h1><p>Diagnostics are disabled.</p></main>;
  const result = await getDiagnostics();
  if (!result.ok) return <main><div className="status"><span className="dot" /> PROVIDER UNAVAILABLE</div><h1>Live proof</h1><p className="error">{result.error}</p><p>Received at {result.receivedAt}. Credentials remain server-side.</p></main>;
  const { state } = result;
  return <main>
    <div className="status"><span className={`dot ${state.freshness.status === "live" ? "ok" : ""}`} /> {state.freshness.status.toUpperCase()} SESSION</div>
    <h1>{state.session.name}</h1><p>{state.session.countryName ?? ""} · {state.session.circuitName ?? ""} · server-rendered RaceLab domain diagnostic</p>
    <section className="grid"><div className="card"><div className="label">Session key</div><div className="value">{state.session.key}</div></div><div className="card"><div className="label">Lap</div><div className="value">{state.lapNumber ?? "—"}</div></div><div className="card"><div className="label">Drivers</div><div className="value">{state.timing.length}</div></div><div className="card"><div className="label">Data age</div><div className="value">{age(state.freshness.ageMs)}</div></div><div className="card"><div className="label">Requests / min</div><div className="value">{state.rateBudget.requestsLast60Seconds}</div></div></section>
    <p>Received at <code>{result.receivedAt}</code> · source timestamp <code>{state.freshness.sourceTimestamp ?? "—"}</code> · rate budget <code>{state.rateBudget.warning}</code></p>
    <h2>Position + intervals</h2><table><thead><tr><th>Pos</th><th>Driver</th><th>Interval</th><th>Gap leader</th><th>Tyre</th><th>Source</th></tr></thead><tbody>{state.timing.map((driver) => <tr key={driver.driver.number}><td>{driver.position ?? "—"}</td><td>{driver.driver.acronym}</td><td>{driver.interval ?? "—"}</td><td>{driver.gapToLeader ?? "—"}</td><td>{driver.compound ? `${driver.compound} ${driver.tyreAge ?? ""}` : "—"}</td><td>{driver.sourceTimestamp ?? "—"}</td></tr>)}</tbody></table>
    <h2>Race control</h2>{state.raceControl.length ? <ul>{state.raceControl.slice(-10).reverse().map((event) => <li key={event.id}>{event.sourceTimestamp} — {event.message ?? event.category}</li>)}</ul> : <p>No race-control events returned for this session.</p>}
  </main>;
}
