import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <main className="home-page"><div className="home-grid" aria-hidden="true" /><div className="home-brand"><span className="brand-mark">RL</span><span>RACELAB / LIVE TIMING</span></div><section className="home-hero"><p className="eyebrow">SECOND SCREEN FOR RACE DAY</p><h1>See the whole race.<br /><span>Even from one corner.</span></h1><p className="home-copy">Live timing, gaps, tyres and race control in a focused race HUD built for your phone.</p><Link className="primary-cta" href="/radar"><span>Open Race Radar</span><span aria-hidden="true">→</span></Link></section><div className="home-status"><span className="status-dot" aria-hidden="true" /> Provider-backed live timing <span>·</span> iPhone portrait first</div></main>;
}
