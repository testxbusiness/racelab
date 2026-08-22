import { RadarScreen } from "@/components/radar/RadarScreen";
import { getLiveRaceState } from "@/lib/openf1/live-state-service";

export const dynamic = "force-dynamic";

export default async function RadarPage() {
  try { return <RadarScreen initialState={await getLiveRaceState()} initialError={null} />; } catch { return <RadarScreen initialState={null} initialError="The live provider is unavailable. Race Radar will retry automatically." />; }
}
