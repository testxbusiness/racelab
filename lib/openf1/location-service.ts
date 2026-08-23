import "server-only";
import { isUsableLocationSample } from "@/lib/f1/domain/location";
import { mapLocation } from "./mappers";
import { openF1Provider, type OpenF1LiveProvider } from "./provider";

export type LocationSnapshot = { samples: ReturnType<typeof mapLocation>[]; sourceTimestamp: string | null; receivedAt: string };

export function createLocationService(provider: Pick<OpenF1LiveProvider, "getLocations"> = openF1Provider) {
  return {
    async getLocationSnapshot(sessionKey: number, after: string | null): Promise<LocationSnapshot> {
      const samples = (await provider.getLocations(sessionKey, after)).map(mapLocation).filter(isUsableLocationSample);
      const sourceTimestamp = samples.map((sample) => sample.sourceTimestamp).sort().at(-1) ?? null;
      return { samples, sourceTimestamp, receivedAt: new Date().toISOString() };
    },
  };
}

export const getLocationSnapshot = createLocationService().getLocationSnapshot;
