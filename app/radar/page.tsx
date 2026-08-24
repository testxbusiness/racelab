import { RadarScreen } from "@/components/radar/RadarScreen";

export default async function RadarPage({ searchParams }: { searchParams: Promise<{ replay?: string | string[] }> }) {
  const value = (await searchParams).replay;
  const replayFixtureId = process.env.NODE_ENV !== "production" && typeof value === "string" && /^[a-zA-Z0-9_-]+$/.test(value) ? value : null;
  return <RadarScreen replayFixtureId={replayFixtureId} initialState={null} initialError={replayFixtureId ? null : "The live provider is unavailable. Race Radar will retry automatically."} />;
}
