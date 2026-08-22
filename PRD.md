# RaceLab — Product Requirements Document

**Versione:** 0.2  
**Data:** 22 agosto 2026  
**Stato:** Baseline operativa per sprint Monza  
**Working title:** RaceLab  
**MVP name:** Race Radar  
**Tipo di progetto:** PWA personale, non commerciale  
**Evento-obiettivo:** GP d'Italia — Monza, 4–6 settembre 2026

---

## 1. Missione

RaceLab nasce con un obiettivo concreto:

> **essere utile mentre si guarda dal vivo un Gran Premio, soprattutto quando dalla propria posizione si vede solo una piccola parte della pista.**

Il caso d'uso di riferimento è Monza: utente in piedi o seduto sul prato, iPhone in mano, sole diretto, rete mobile potenzialmente congestionata, batteria limitata.

L'app deve rispondere immediatamente alla domanda:

> **“Cosa sta succedendo adesso in pista?”**

Non deve essere una copia di Formula1.com e non deve partire come sito enciclopedico di statistiche.

Per il 6 settembre 2026 RaceLab deve essere soprattutto un **second screen live**.

---

## 2. Visione prodotto

RaceLab combina tre idee:

1. **Race Radar** — comprensione live della gara;
2. **Focus Driver** — seguire il proprio pilota preferito;
3. **Race Lab** — analisi, replay e telemetria post-gara.

La prima release si concentra quasi esclusivamente sul punto 1.

### Promessa

> **See the whole race, even when you can only see one corner.**

---

## 3. Priorità assoluta

In caso di conflitto tra funzionalità, sviluppo e design, usare questo ordine:

1. comprensione immediata della gara;
2. affidabilità live;
3. resilienza alla rete;
4. usabilità mobile;
5. leggibilità all'aperto;
6. consumo batteria/dati;
7. estetica;
8. profondità analitica.

Una feature “wow” non deve mai peggiorare il live timing.

---

## 4. Utente principale

### Primary user

Appassionato di Formula 1 che segue il GP:

- fisicamente in autodromo;
- da casa come second screen.

### Profilo d'uso di riferimento

- iPhone in modalità portrait;
- utilizzo con una mano;
- interazioni rapide;
- sessioni lunghe;
- connessione 4G/5G instabile;
- nessun login;
- nessuna configurazione complessa.

---

## 5. Scenario di riferimento — Monza

Durante il GP l'utente apre RaceLab.

Entro pochi secondi deve vedere:

- stato della sessione;
- giro attuale / totale;
- classifica;
- gap dal leader;
- intervallo dalla vettura davanti;
- gomme;
- età delle gomme se disponibile;
- pit stop;
- bandiere / Safety Car / VSC / Red Flag;
- posizione approssimata delle vetture sulla pista se disponibile;
- stato connessione;
- età del dato.

### Esempio

```text
● LIVE                     DATA AGE 3.6s

ITALIAN GRAND PRIX
LAP 37 / 53

01 NOR   +0.000      M 13
02 LEC   +1.842      M  9
03 VER   +4.391      H 21
04 PIA   +8.133      M 15

YELLOW FLAG — SECTOR 2
```

L'utente non deve navigare in più schermate per capire lo stato della gara.

---

## 6. Evento di validazione anticipato

Il primo test live non sarà Monza.

### GP d'Olanda — 23 agosto 2026

Obiettivo:

- verificare autenticazione OpenF1;
- verificare dati live reali;
- misurare latenza;
- verificare schemi reali;
- osservare frequenza aggiornamenti;
- rilevare anomalie e campi mancanti;
- verificare rate limit;
- testare una pagina live grezza su iPhone.

Questo test è un **technical proof**, non un test di design.

---

## 7. Data strategy

## 7.1 Primary provider — OpenF1

OpenF1 è il provider iniziale per:

- meeting;
- sessioni;
- drivers;
- position;
- intervals;
- laps;
- stints;
- pit;
- race control;
- weather;
- location;
- telemetry in fasi successive;
- classifiche e risultati storici.

### Historical access

Lo storico dal 2023 è utilizzabile senza autenticazione.

### Live access

Il live richiede accesso autenticato OpenF1.

Le credenziali e i token devono esistere solo lato server.

---

## 7.2 Provider abstraction

La UI non deve conoscere i payload OpenF1.

Pipeline:

```text
OpenF1
   ↓
validation
   ↓
provider adapter
   ↓
RaceLab domain model
   ↓
selectors / state composition
   ↓
UI
```

Interfaccia concettuale:

```ts
interface F1DataProvider {
  getMeetings(...): Promise<Meeting[]>
  getSessions(...): Promise<Session[]>
  getDrivers(...): Promise<Driver[]>

  getPositions(...): Promise<DriverPosition[]>
  getIntervals(...): Promise<DriverInterval[]>
  getLaps(...): Promise<Lap[]>
  getStints(...): Promise<Stint[]>
  getPitStops(...): Promise<PitStop[]>
  getRaceControl(...): Promise<RaceControlEvent[]>
  getWeather(...): Promise<WeatherState[]>
  getLocations(...): Promise<TrackLocationSample[]>
}
```

Prima implementazione:

`OpenF1Provider`

Possibile futuro:

`Formula1LiveTimingProvider`

---

## 7.3 Official Formula 1 live feed

L'accesso diretto al live timing Formula 1 non è parte dell'MVP.

Può diventare:

- fallback tecnico;
- laboratorio;
- provider alternativo.

Non deve essere necessario per essere pronti a Monza.

Motivi:

- maggiore complessità;
- feed non documentato come API pubblica stabile;
- protocollo e autenticazione possono cambiare;
- manutenzione superiore.

---

## 7.4 Secondary providers

Nessun secondo provider nel core MVP.

Jolpica o altre fonti potranno essere aggiunte dopo Monza solo se risolvono un requisito reale non coperto da OpenF1.

---

## 8. Live Race State

RaceLab deve comporre più endpoint.

`/position` non contiene da solo lo stato completo.

```text
position
+
intervals
+
laps
+
stints
+
pit
+
race_control
+
weather
+
location
=
LiveRaceState
```

Modello indicativo:

```ts
type LiveDriverTiming = {
  driverNumber: number
  position: number | null
  gapToLeader: string | number | null
  interval: string | number | null
  compound: TyreCompound | null
  tyreAge: number | null
  inPit: boolean
  retired: boolean
}

type LiveRaceState = {
  sessionKey: number
  lapNumber: number | null
  totalLaps: number | null

  connection: LiveConnectionStatus
  dataAgeMs: number

  timing: LiveDriverTiming[]
  raceControl: RaceControlEvent[]
  weather?: WeatherState

  updatedAt: string
  sourceTimestamp?: string
}
```

---

## 9. Live freshness

Ogni stream deve mantenere:

```ts
{
  sourceTimestamp,
  receivedAt,
  ageMs
}
```

UI:

`DATA AGE 3.6s`

Stati indicativi:

- `LIVE`
- `DELAYED`
- `STALE`
- `RECONNECTING`
- `OFFLINE`
- `SESSION ENDED`
- `UNAVAILABLE`

Threshold iniziali:

- 0–8 s → live;
- 8–20 s → delayed;
- >20 s → stale.

Da validare dopo il test live.

---

## 10. MVP MONZA — P0

Queste funzionalità sono il prodotto da consegnare.

## 10.1 Race Radar

### Header live

- nome GP;
- stato sessione;
- lap current / total;
- connection badge;
- data age.

### Live leaderboard

Per ogni pilota:

- posizione;
- acronimo;
- team accent;
- gap leader;
- intervallo;
- compound;
- tyre age quando disponibile;
- pit/retired status.

### Race status

Mostrare chiaramente:

- Green;
- Yellow;
- Double Yellow;
- SC;
- VSC;
- Red Flag;
- session suspended/ended.

### Race Control

Feed degli eventi recenti.

---

## 10.2 Track Map

Obiettivo:

visualizzare la posizione approssimata delle vetture.

Requisiti:

- non è obbligatoria per il funzionamento del timing;
- può essere disattivata;
- si blocca sull'ultimo stato valido se location non arriva;
- favorite driver evidenziato;
- niente etichette permanenti per tutte le auto.

MVP implementation preference:

**SVG prima di Canvas.**

Passare a Canvas solo se i test misurati mostrano un problema reale.

---

## 10.3 Focus Driver

L'utente seleziona il proprio pilota preferito.

Salvato localmente.

Race Radar evidenzia:

- posizione;
- posizione in pista;
- gap leader;
- gap davanti;
- gap dietro;
- ultimo giro;
- compound;
- stint.

Tap sulla riga → Focus sheet.

---

## 10.4 PWA

Requisiti:

- installabile;
- icona home screen;
- standalone;
- shell disponibile offline;
- ultima route ripristinata;
- dati statici disponibili dalla cache.

La cache offline non deve mai far sembrare “live” un dato vecchio.

---

## 10.5 Connection resilience

Obbligatorio:

- ultimo stato valido resta visibile;
- retry automatico;
- backoff;
- niente schermata vuota durante reconnect;
- età dato sempre mostrata quando non è live.

---

## 10.6 Low Data Mode

Toggle esplicito.

Quando attivo:

- stop location/map live;
- no telemetry;
- animazioni ridotte;
- polling meno aggressivo;
- mantieni timing, gap, tyres e race control.

È una modalità primaria, non un fallback nascosto.

---

## 10.7 Outdoor mode

Design dedicato per sole diretto.

Caratteristiche:

- contrasto aumentato;
- testo ancora più netto;
- superfici meno “soft”;
- dati critici mai in grigio debole.

Può essere un toggle manuale nell'MVP.

---

## 11. P1 — Solo se P0 è stabile prima di Monza

- strategy view;
- pit stop details;
- weather live;
- gap trend;
- event ticker più ricco;
- landscape map;
- local notifications dove tecnicamente affidabili.

La vibrazione non è requisito iPhone.

---

## 12. Post-Monza

Da affrontare solo dopo il GP:

### Race Replay

- timeline;
- seek;
- play/pause;
- accelerazione;
- map sync;
- leaderboard sync;
- event markers.

### Driver Compare

- speed;
- throttle;
- brake;
- gear;
- RPM;
- lap delta.

### Historical exploration

- calendario;
- standings;
- results;
- driver pages;
- Monza history.

### Fan layer

- quiz;
- facts;
- achievements;
- favourite races;
- team radio.

---

## 13. Data volume constraints

Mai scaricare:

```text
all drivers
×
full race
×
high-frequency telemetry
```

se la UI non lo richiede.

### Location delta

Non effettuare query dalla partenza della gara a ogni refresh.

Mantenere:

`lastLocationTimestamp`

e chiedere solo:

```text
date > LAST_RECEIVED_TIMESTAMP
```

### Telemetry futura

Fetch:

- driver specifici;
- lap specifici;
- range temporali specifici;
- downsampling client/server.

---

## 14. Live V1 vs Live V2

## Live V1 — Monza

Obiettivo: semplicità e affidabilità.

- Next.js server proxy;
- OpenF1 authenticated REST;
- polling intelligente;
- cache breve;
- domain composition;
- iPhone client.

Indicative intervals da validare:

```text
position       6 s
intervals      6 s
location       6 s only if map visible
laps          15 s
stints        30 s
race_control  10 s
weather       60 s
```

Le frequenze devono essere adattate ai rate limit effettivi e ai test live.

---

## Live V2 — dopo validazione

Possibile:

```text
OpenF1 MQTT/WebSocket
        ↓
RaceLab Live Gateway
        ↓
WebSocket / SSE
        ↓
clients
```

Non introdurre questa complessità prima di aver dimostrato che Live V1 è insufficiente.

---

## 15. Non-functional requirements

### Reliability

Un endpoint può fallire senza far fallire l'app.

### Performance

- niente rerender totale a ogni sample;
- map isolata dal timing;
- bundle mobile controllato;
- no immagini pesanti nel percorso live.

### Battery

- sospendere polling non essenziale in background;
- low-data/low-power;
- animazioni moderate.

### Privacy

- no login;
- no geolocalizzazione utente;
- preferenze locali;
- analytics non richieste.

---

## 16. Legal / branding

RaceLab è:

- progetto personale;
- non ufficiale;
- non affiliato a Formula 1.

Requisiti:

- attribuzione OpenF1;
- disclaimer;
- identità grafica originale;
- niente branding che possa sembrare ufficiale.

Footer suggerito:

> Unofficial Formula 1 fan project. Data powered by OpenF1.

---

## 17. Definition of success — Monza

Il 6 settembre il progetto è riuscito se:

1. l'app si apre rapidamente su iPhone;
2. la classifica live è leggibile in pochi secondi;
3. gap e intervalli sono comprensibili;
4. stato gara e bandiere sono sempre evidenti;
5. il pilota preferito è facilmente seguibile;
6. l'ultimo stato valido resta visibile durante problemi di rete;
7. `DATA AGE` rende evidente se il feed è in ritardo;
8. Low Data Mode funziona;
9. la PWA si apre anche con rete degradata;
10. la map è utile quando disponibile ma non blocca mai il timing.

---

## 18. Scope discipline

Fino al 6 settembre:

> **non aggiungere feature post-gara se esistono bug, rischi live, problemi di rete, consumo eccessivo o problemi di leggibilità.**

Prima si rende affidabile Race Radar.

Poi si costruisce RaceLab.
