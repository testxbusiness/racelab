import { notFound } from "next/navigation";
import { getOpenF1Env } from "@/lib/openf1/env";
import { getDiagnostics } from "@/lib/openf1/diagnostics";

export const dynamic = "force-dynamic";

function formatAge(ageMs: number | null) { return ageMs === null ? "—" : `${(ageMs / 1000).toFixed(1)}s`; }

export default async function DiagnosticsPage() {
  if (!getOpenF1Env().OPENF1_DIAGNOSTICS_ENABLED) notFound();
  const result = await getDiagnostics();
  if (!result.ok) return <main className="diagnostics-page"><p className="diagnostics-kicker">OPENF1 / DIAGNOSTICS</p><h1>Provider unavailable</h1><p className="error">{result.error}</p><p>Checked at {result.receivedAt}</p></main>;
  const { state } = result;
  const lastError = Object.entries(state.streams).find(([, stream]) => stream.error);
  return <main className="diagnostics-page"><p className="diagnostics-kicker">OPENF1 / DIAGNOSTICS</p><h1>Live proof</h1><p>{state.session.name} · {state.session.countryName ?? "Unknown venue"}</p><section className="diagnostics-grid"><div><span>SESSION KEY</span><strong>{state.session.key}</strong></div><div><span>LAP</span><strong>{state.lapNumber ?? "—"}</strong></div><div><span>DRIVERS</span><strong>{state.timing.length}</strong></div><div><span>DATA AGE</span><strong>{formatAge(state.freshness.ageMs)}</strong></div><div><span>REQUESTS / MIN</span><strong>{state.rateBudget.requestsLast60Seconds}</strong></div><div><span>AUTH REFRESHES</span><strong>{state.rateBudget.authRefreshes}</strong></div></section><section className="diagnostics-panel"><h2>Freshness</h2><dl><dt>Source timestamp</dt><dd>{state.freshness.sourceTimestamp ?? "—"}</dd><dt>Received at</dt><dd>{state.freshness.receivedAt}</dd><dt>Status</dt><dd>{state.freshness.status.toUpperCase()}</dd><dt>Last provider error</dt><dd>{lastError ? `${lastError[0]}: ${lastError[1].error}` : "None"}</dd></dl></section><section className="diagnostics-panel"><h2>Endpoint metrics</h2><div className="diagnostics-table-wrap"><table><thead><tr><th>Endpoint</th><th>HTTP</th><th>Latency</th><th>Payload</th><th>Records</th><th>Validation failures</th><th>Last source</th></tr></thead><tbody>{Object.entries(state.rateBudget.endpoints).map(([endpoint, metric]) => <tr key={endpoint}><td>{endpoint}</td><td>{metric.lastStatus ?? "—"}</td><td>{metric.lastLatencyMs === null ? "—" : `${metric.lastLatencyMs}ms`}</td><td>{metric.lastPayloadBytes === null ? "—" : `${metric.lastPayloadBytes}B`}</td><td>{metric.lastRecordCount ?? "—"}</td><td>{metric.validationFailures}</td><td>{metric.lastSourceTimestamp ?? "—"}</td></tr>)}</tbody></table></div></section></main>;
}
