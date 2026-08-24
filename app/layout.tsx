import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "RaceLab — Race Radar",
  description: "Live race timing for the whole race, at a glance",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "RaceLab", statusBarStyle: "black-translucent" },
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }], apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#07080A", viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body>{children}<PwaRegistration /></body></html>;
}

function PwaRegistration() {
  const script = process.env.NODE_ENV === "production"
    ? `if ('serviceWorker' in navigator) { window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); }); }`
    : `if ('serviceWorker' in navigator) { window.addEventListener('load', function () { navigator.serviceWorker.getRegistrations().then(function (registrations) { registrations.forEach(function (registration) { registration.unregister(); }); }); caches.keys().then(function (keys) { return Promise.all(keys.map(function (key) { return caches.delete(key); })); }); }); }`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
