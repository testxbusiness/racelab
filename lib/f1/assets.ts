const driverPortraits: Record<string, string> = {
  ALB: "/assets/piloti/alex-albon-f1-driver-profile-picture.webp", ARV: "/assets/piloti/arvid-lindblad-f1-driver-profile-picture.webp", SAI: "/assets/piloti/carlos-sainz-f1-driver-profile-picture.webp", LEC: "/assets/piloti/charles-leclerc-f1-driver-profile-picture.webp", OCO: "/assets/piloti/esteban-ocon-f1-driver-profile-picture.webp", ALO: "/assets/piloti/fernando-alonso-f1-driver-profile-picture.webp", COL: "/assets/piloti/franco-colapinto-f1-driver-profile-picture.webp", BOR: "/assets/piloti/gabriel-bortoleto-f1-driver-profile-picture.webp", RUS: "/assets/piloti/george-russell-f1-driver-profile-picture.webp", HAD: "/assets/piloti/isack-hadjar-f1-driver-profile-picture.webp", ANT: "/assets/piloti/kimi-antonelli-f1-driver-profile-picture.webp", STR: "/assets/piloti/lance-stroll-f1-driver-profile-picture.webp", NOR: "/assets/piloti/lando-norris-f1-driver-profile-picture.webp", HAM: "/assets/piloti/lewis-hamilton-f1-driver-profile-picture.webp", LAW: "/assets/piloti/liam-lawson-f1-driver-profile-picture.webp", VER: "/assets/piloti/max-verstappen-f1-driver-profile-picture.webp", HUL: "/assets/piloti/nico-hulkenberg-f1-driver-profile-picture.webp", BEA: "/assets/piloti/oliver-bearman-f1-driver-profile-picture.webp", PIA: "/assets/piloti/oscar-piastri-f1-driver-profile-picture.webp", GAS: "/assets/piloti/pierre-gasly-f1-driver-profile-picture.webp", PER: "/assets/piloti/sergio-perez-f1-driver-profile-picture.webp", BOT: "/assets/piloti/valtteri-bottas-f1-driver-profile-picture.webp", TSU: "/assets/piloti/yuki-tsunoda-f1-driver-profile-picture.webp",
};

const teamAssets: Array<{ match: RegExp; logo: string; car: string }> = [
  { match: /ferrari/i, logo: "/assets/teams/Ferrari-logo-png-full-colour-small-size.png", car: "/assets/vetture/2026ferraricarright.avif" },
  { match: /mercedes/i, logo: "/assets/teams/Mercedes-AMG_Petronas_F1_Team_logo_(2026).svg.webp", car: "/assets/vetture/2026mercedescarright.avif" },
  { match: /mclaren/i, logo: "/assets/teams/mclaren.jpeg", car: "/assets/vetture/2026mclarencarright.avif" },
  { match: /red bull/i, logo: "/assets/teams/redbull.png", car: "/assets/vetture/2026redbullracingcarright.avif" },
  { match: /racing bulls|rb/i, logo: "/assets/teams/racingbulls.png", car: "/assets/vetture/2026racingbullscarright.avif" },
  { match: /aston martin/i, logo: "/assets/teams/astonmartin.png", car: "/assets/vetture/2026astonmartincarright.avif" },
  { match: /alpine/i, logo: "/assets/teams/alpine.png", car: "/assets/vetture/2026alpinecarright.avif" },
  { match: /audi|sauber/i, logo: "/assets/teams/audi.jpeg", car: "/assets/vetture/2026audicarright.avif" },
  { match: /cadillac/i, logo: "/assets/teams/cadillac.png", car: "/assets/vetture/2026cadillaccarright.avif" },
  { match: /haas/i, logo: "/assets/teams/haas.jpeg", car: "/assets/vetture/2026haascarright.avif" },
  { match: /williams/i, logo: "/assets/teams/williams.png", car: "/assets/vetture/2026williamscarright.avif" },
];

export function driverPortraitPath(acronym: string): string | null { return driverPortraits[acronym.toUpperCase()] ?? null; }

export function teamAsset(teamName: string | null): { logo: string; car: string } | null {
  if (!teamName) return null;
  return teamAssets.find((asset) => asset.match.test(teamName)) ?? null;
}

export function currentCarPath(teamName: string | null, sessionDateStart: string | null): string | null {
  if (!sessionDateStart || new Date(sessionDateStart).getUTCFullYear() !== 2026) return null;
  return teamAsset(teamName)?.car ?? null;
}
