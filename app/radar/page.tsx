import { RadarScreen } from "@/components/radar/RadarScreen";

export default function RadarPage() {
  return <RadarScreen initialState={null} initialError="The live provider is unavailable. Race Radar will retry automatically." />;
}
