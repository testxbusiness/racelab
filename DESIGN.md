# RaceLab — Design Specification

**Versione:** 0.2  
**Data:** 22 agosto 2026  
**Focus:** Race Radar / Monza MVP  
**Piattaforma di riferimento:** iPhone PWA  
**Contesto di riferimento:** utilizzo all'aperto, una mano, rete instabile

---

## 1. Design mission

RaceLab deve sembrare un **race HUD tascabile**, non una dashboard aziendale.

Il design deve rispondere a una priorità:

> **capire la gara con un colpo d'occhio.**

La componente visiva “wow” è importante, ma sempre subordinata alla comprensione del live.

---

## 2. Design principles

### 2.1 Glance first

Entro 2–5 secondi devono essere comprensibili:

- stato gara;
- lap;
- P1;
- posizione favourite driver;
- gap;
- flag/SC/VSC.

### 2.2 One-hand first

- touch target grandi;
- niente menu profondi;
- massimo 1–2 tap per dati importanti;
- bottom navigation;
- bottom sheet per dettagli.

### 2.3 Outdoor first

- contrasto forte;
- numeri grandi;
- nessun dato critico in testo tenue;
- superfici pulite;
- UI leggibile al sole.

### 2.4 Data before decoration

Ordine gerarchico:

1. session status;
2. leaderboard;
3. gaps;
4. tyres;
5. race control;
6. track map;
7. detail analytics.

### 2.5 Young, not childish

Usare:

- grandi numeri;
- motion controllato;
- accent team;
- layout dinamico;
- elementi racing.

Evitare:

- UI cartoon;
- eccesso di emoji;
- decorazioni gratuite;
- imitazione diretta dell'identità F1 ufficiale.

---

## 3. Visual direction

### Base theme

Dark mode come default.

Motivi:

- look racing;
- contrasto con team colours;
- OLED;
- second-screen usage.

### Outdoor Mode

Toggle dedicato.

Effetti:

- background meno “black crush”;
- text contrast maggiore;
- border più visibili;
- secondary text più chiaro;
- riduzione blur/transparency.

---

## 4. Colour system

Token iniziali:

```css
--bg: #07080A;
--surface-1: #0F1115;
--surface-2: #171A20;
--surface-3: #21252D;

--text-primary: #F7F8FA;
--text-secondary: #BBC0C9;
--text-muted: #858B96;

--border: rgba(255,255,255,.10);

--accent: #FF3B30;
--success: #32D74B;
--warning: #FFD60A;
--danger: #FF453A;
--info: #64D2FF;
```

Outdoor mode potrà aumentare:

- border opacity;
- secondary contrast;
- surface separation.

---

## 5. Team colour system

Il colore team arriva dal provider quando disponibile.

Uso:

- accent strip leaderboard;
- driver dot map;
- selected driver;
- charts;
- focus ring.

Non usarlo:

- come intero background;
- per testo lungo;
- come unico indicatore di stato.

---

## 6. Tyres

Sempre:

**colore + lettera**

- Soft → `S`
- Medium → `M`
- Hard → `H`
- Intermediate → `I`
- Wet → `W`
- Unknown → `?`

Esempio:

```text
M 13
```

significa Medium, 13 giri di stint/age quando disponibile.

---

## 7. Typography

Priorità assoluta: numeri leggibili.

Raccomandazione:

- Geist / Inter per UI;
- eventuale font più racing solo per titoli limitati;
- tabular numerals sempre per timing.

```css
font-variant-numeric: tabular-nums;
```

Scala mobile:

- hero/lap number: 40–56 px
- page title: 28–34 px
- leaderboard primary: 17–20 px
- body: 14–16 px
- metadata: 12–13 px

Mai ridurre i timing per far entrare più informazioni.

---

## 8. App shell

### Bottom navigation

MVP:

1. **Radar**
2. **Weekend**
3. **Focus**
4. **Settings**

Post-Monza potrà diventare:

1. Home
2. Live
3. Season
4. Compare

Nel periodo Monza la navigazione deve riflettere l'obiettivo reale.

---

# 9. Race Radar — schermata principale

## 9.1 Layout

```text
┌──────────────────────────────┐
│ ● LIVE      ITALIAN GP      │
│ LAP 37/53   DATA AGE 3.6s   │
├──────────────────────────────┤
│ [ TIMING | MAP | EVENTS ]   │
├──────────────────────────────┤
│                              │
│ CURRENT CONTENT              │
│                              │
├──────────────────────────────┤
│ Favourite Driver compact     │
└──────────────────────────────┘
```

Su mobile non mostrare tutto contemporaneamente.

Modalità:

- Timing;
- Map;
- Events.

Default:

**Timing**

---

## 9.2 Live header

Sempre sticky.

Contiene:

- connection state;
- race name abbreviato;
- lap;
- data age.

Esempi:

```text
● LIVE
DATA AGE 3.2s
```

```text
◐ RECONNECTING
LAST UPDATE 14s
```

```text
⚠ STALE
LAST UPDATE 31s
```

Lo stato non può dipendere solo dal colore.

---

# 10. Leaderboard

Componente core.

### Riga

```text
01  NOR   +0.000    M 13
02  LEC   +1.842    M  9
03  VER   +4.391    H 21
```

### Informazioni

- position;
- team accent;
- driver code;
- gap leader;
- tyre;
- tyre age.

Tap:

apre `DriverFocusSheet`.

### Favourite driver

Evidenziazione:

- bordo/accent più netto;
- background leggermente differente;
- icona piccola opzionale.

Non rendere la riga molto più alta delle altre.

---

## 11. Driver Focus Sheet

Bottom sheet.

Mostra:

```text
LEC  P2

Gap leader      +1.842
Ahead           NOR +1.842
Behind          VER +2.549

Last lap        1:24.318
Best lap        1:22.981

Tyre            MEDIUM
Age             9 laps
```

Se un dato manca:

non lasciare layout rotto.

Usare `—`.

---

# 12. Track Map

## MVP implementation

Preferenza:

**SVG**

Ragioni:

- facile da sviluppare;
- facile da debuggare;
- sufficiente per ~20 auto;
- accessibile a trasformazioni CSS;
- semplice overlay/label.

Canvas sarà valutato solo tramite profiling.

### Track

- stroke neutro;
- no satellite map;
- no decorazioni inutili;
- forma precalcolata da dati storici/location.

### Drivers

- small dots;
- team colour;
- favourite larger;
- selected larger + label;
- top 3 label opzionale.

No 20 label contemporaneamente.

### Interpolation

I dati provider possono arrivare ogni alcuni secondi.

L'interfaccia deve animare il passaggio:

```text
last coordinate
→
new coordinate
```

senza far rerenderizzare tutto il Race Radar.

---

# 13. Map failure states

### Fresh

normale.

### Delayed

marker animati fino all'ultima posizione nota.

Badge discreto:

`MAP DELAYED`

### Stale

freeze.

`TRACK POSITIONS 26s OLD`

### Unavailable

non occupare metà schermo con un errore.

Mostrare:

`Track positions unavailable`

e CTA:

`View Timing`

---

# 14. Events

Event screen/feed.

Priorità visiva:

### Critical

- red flag;
- session suspended;
- Safety Car.

### High

- VSC;
- yellow/double yellow;
- penalty.

### Normal

- pit;
- investigation;
- track clear;
- other race-control message.

Card:

```text
LAP 33
YELLOW FLAG
SECTOR 2
```

---

# 15. Focus Mode

Pagina o sheet dedicata al pilota preferito.

Obiettivo:

rispondere a:

> “Come sta andando il mio pilota?”

Mostrare:

- current position;
- map location;
- gap ahead;
- gap behind;
- tyre;
- tyre age;
- last lap;
- best lap;
- pit history sintetica.

No telemetry live ad alta frequenza nell'MVP.

---

# 16. Low Data Mode

Toggle visibile nelle settings e, se utile, quick action.

Badge:

`LOW DATA`

Quando attivo:

- no live location fetch;
- no map animation;
- no heavy imagery;
- riduzione polling;
- minimal transitions;
- keep leaderboard;
- keep intervals;
- keep race control;
- keep tyre data.

### Design

Low Data non deve sembrare uno stato di errore.

---

# 17. Outdoor Mode

Toggle:

`OUTDOOR`

Quando attivo:

- più contrasto;
- secondary text più chiaro;
- border più visibili;
- meno trasparenza;
- niente blur;
- contenuti prioritari più grandi se necessario.

Da testare fisicamente fuori casa prima di Monza.

---

# 18. Power-friendly behaviour

Se browser/app va in background:

- ridurre/sospendere requests non essenziali;
- niente map animation;
- niente transitions continue.

Al ritorno:

- aggiornamento immediato del timing;
- poi stream secondari.

---

# 19. Motion

Usare solo quando comunica un cambiamento.

Buono:

- position change;
- new race-control event;
- map interpolation;
- favourite driver state;
- tab transition.

Evitare:

- decorative loops;
- flashing;
- background motion;
- animation su ogni polling update.

Supportare:

`prefers-reduced-motion`.

---

# 20. Notifications / vibration

Non fare affidamento sulla vibrazione su iPhone.

Se disponibile:

progressive enhancement.

Le notifiche devono essere considerate post-MVP salvo che risultino semplici e affidabili nei test.

---

# 21. Loading states

Initial:

- skeleton leaderboard;
- static shell immediata.

Reconnect:

non sostituire il contenuto.

```text
RECONNECTING
Last update 12s ago
```

L'ultimo stato resta leggibile.

---

# 22. Offline state

Service worker deve garantire:

- app shell;
- icons;
- fonts se locali/cached;
- track outline;
- static assets.

Lo stato live viene conservato separatamente con timestamp.

Offline:

```text
OFFLINE
Last valid race data: 43s ago
```

Nessuna response live cached deve apparire senza data age.

---

# 23. Weekend screen

Prima di una sessione:

```text
ITALIAN GP

FRI
FP1   13:30
FP2   17:00

SAT
FP3
QUALIFYING

SUN
RACE
```

Durante sessione:

CTA principale:

`OPEN RACE RADAR`

---

# 24. Settings

MVP settings:

- favourite driver;
- low-data mode;
- outdoor mode;
- reduced motion / system;
- reset local data.

Niente account.

---

# 25. Responsive

## <= 480 px

Reference.

- single column;
- tabs;
- sheets;
- bottom nav.

## 481–900 px

Timing + optional map/detail.

## > 900 px

Desktop pit-wall layout possibile:

```text
Leaderboard | Map
Strategy    | Events
```

Desktop non guida le scelte MVP.

---

# 26. Accessibility

- semantic elements;
- tyre text labels;
- textual race status;
- no colour-only meaning;
- WCAG AA where practical;
- visible focus;
- reduced motion;
- large touch targets.

---

# 27. Branding

Brand RaceLab originale.

Possibili elementi:

- radar;
- track lines;
- chevrons;
- timing numerals;
- racing grid;
- moving dot.

Non usare logo F1 come identità.

---

# 28. Design acceptance criteria — Monza

Il design è pronto quando:

1. classifica visibile senza scrolling iniziale eccessivo;
2. favourite driver identificabile subito;
3. lap e race status sempre visibili;
4. data age sempre accessibile;
5. timing funziona senza map;
6. map degrada senza rompere layout;
7. Outdoor Mode esiste;
8. Low Data Mode esiste;
9. reconnect mantiene l'ultimo stato;
10. uso con una mano è naturale.
