import Link from "next/link";
import Image from "next/image";
import { HomeEventCard } from "@/components/home/HomeEventCard";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const showReplay = process.env.NODE_ENV !== "production";
  return <main className="home-page">
    <Image className="home-background" src="/immagine_sfondo_home.png" alt="" fill priority sizes="100vw" />
    <div className="home-overlay" aria-hidden="true" />
    <div className="home-grid" aria-hidden="true" />
    <header className="home-topbar">
      <div className="home-brand"><span className="brand-mark">RL</span><span>RACELAB / LIVE TIMING</span></div>
      <HomeEventCard />
    </header>
    <Image className="home-f1-logo" src="/assets/F1.png" alt="Formula 1" width={174} height={174} priority />
    <section className="home-hero">
      <p className="eyebrow">SECOND SCREEN FOR RACE DAY</p>
      <h1>See the whole race.<br /><span>Even from one corner.</span></h1>
      <p className="home-copy">Live timing, gaps, tyres and race control in a focused race HUD built for your phone.</p>
      <div className="home-actions"><Link className="primary-cta" href="/radar"><span>Open Race Radar</span><span aria-hidden="true">→</span></Link>{showReplay ? <Link className="secondary-cta" href="/replay"><span>Open Historical Replay</span><span aria-hidden="true">↗</span></Link> : null}</div>
    </section>
    <div className="home-status"><span className="status-dot" aria-hidden="true" /> Provider-backed live timing <span>·</span> iPhone portrait first</div>
  </main>;
}
