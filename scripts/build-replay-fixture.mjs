#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const sessionKey = Number(process.argv[2]);
if (!Number.isInteger(sessionKey)) throw new Error("Usage: npm run replay:download -- <session_key>");
const api = process.env.OPENF1_API_URL ?? "https://api.openf1.org/v1";
const root = process.argv[3] ?? join("fixtures", `session-${sessionKey}`);
const endpointNames = ["sessions", "drivers", "position", "intervals", "laps", "stints", "pit", "race_control", "weather"];
const requestIntervalMs = Number(process.env.OPENF1_REQUEST_INTERVAL_MS ?? 400);
let lastRequestAt = 0;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const get = async (path) => {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const waitMs = Math.max(0, requestIntervalMs - (Date.now() - lastRequestAt));
    if (waitMs) await sleep(waitMs);
    lastRequestAt = Date.now();
    const response = await fetch(`${api}/${path}`);
    if (response.ok) {
      const value = await response.json();
      if (!Array.isArray(value)) throw new Error(`${path}: expected array`);
      return value;
    }
    if (response.status === 404) {
      const body = await response.text();
      if (body.includes("No results found")) return [];
      throw new Error(`${path}: HTTP 404`);
    }
    if (response.status !== 429 || attempt === 5) throw new Error(`${path}: HTTP ${response.status}`);
    const retryAfter = Number(response.headers.get("retry-after"));
    const backoffMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1500 * (attempt + 1);
    console.warn(`${path}: HTTP 429, retrying in ${backoffMs}ms`);
    await sleep(backoffMs);
  }
  throw new Error(`${path}: exhausted retries`);
};
const timestamp = (record) => record.date_end ?? record.date_start ?? record.date ?? null;
const sort = (records) => records.toSorted((a, b) => String(timestamp(a)).localeCompare(String(timestamp(b))));
await mkdir(join(root, "endpoints"), { recursive: true });
const sessions = (await get(`sessions?session_key=${sessionKey}`));
if (!sessions.length) throw new Error(`No session found for ${sessionKey}`);
const endpoints = {};
for (const name of endpointNames) { const records = sort(await get(`${name}?session_key=${sessionKey}`)); const file = `endpoints/${name}.json`; await writeFile(join(root, file), JSON.stringify(records)); endpoints[name] = { file, records: records.length, firstTimestamp: timestamp(records[0] ?? {}), lastTimestamp: timestamp(records.at(-1) ?? {}) }; }
const session = sessions[0];
const locationFiles = [];
const start = Date.parse(session.date_start);
const end = session.date_end ? Date.parse(session.date_end) : start + 4 * 60 * 60 * 1000;
for (let from = start, index = 0; from < end; from += 15 * 60 * 1000, index += 1) { const to = Math.min(end, from + 15 * 60 * 1000); const query = `session_key=${sessionKey}&date>${encodeURIComponent(new Date(from).toISOString())}&date<${encodeURIComponent(new Date(to).toISOString())}`; const records = sort(await get(`location?${query}`)); const file = `endpoints/location-${String(index).padStart(3, "0")}.json`; await writeFile(join(root, file), JSON.stringify(records)); locationFiles.push(file); }
const year = session.year ?? new Date(session.date_start).getUTCFullYear();
const displayName = `${session.circuit_short_name ?? session.country_name ?? "Grand Prix"} ${year}`;
const manifest = { format: "racelab-replay", version: 1, sessionKey, displayName, createdAt: new Date().toISOString(), source: "OpenF1", sessionStart: session.date_start, sessionEnd: session.date_end ?? null, endpoints, location: { files: locationFiles, windowSeconds: 900, downsampleMs: null } };
await writeFile(join(root, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Replay fixture written to ${root}`);
