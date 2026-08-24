import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8")) as { display: string; start_url: string; icons: Array<{ src: string }> };
const serviceWorker = readFileSync("public/sw.js", "utf8");

describe("PWA foundation", () => {
  it("declares a standalone Radar start URL and install assets", () => {
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/radar");
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    for (const icon of manifest.icons) expect(existsSync(`public${icon.src}`)).toBe(true);
  });

  it("keeps live API requests outside the service-worker cache", () => {
    expect(serviceWorker).toContain('if (url.pathname.startsWith("/api/openf1/")) return;');
    expect(serviceWorker).toContain('"/radar"');
  });

  it("keeps localhost development requests outside the service-worker cache", () => {
    expect(serviceWorker).toContain('if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return;');
  });

  it("precaches the static Monza geometry", () => {
    expect(serviceWorker).toContain('"/tracks/monza.svg"');
    expect(existsSync("public/tracks/monza.svg")).toBe(true);
  });

  it("keeps the home hero image assets available", () => {
    expect(existsSync("public/immagine_sfondo_home.png")).toBe(true);
    expect(existsSync("public/assets/F1.png")).toBe(true);
  });

  it("keeps driver, team, and car assets available", () => {
    expect(existsSync("public/assets/piloti/lando-norris-f1-driver-profile-picture.webp")).toBe(true);
    expect(existsSync("public/assets/teams/mclaren.jpeg")).toBe(true);
    expect(existsSync("public/assets/vetture/2026mclarencarright.avif")).toBe(true);
  });
});
