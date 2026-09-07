# Chronograph

**Real-time F1 telemetry analytics system built with NestJS, PostgreSQL, Prisma, React, and Socket.IO.**

Chronograph receives telemetry data from an F1 simulator over UDP, parses the binary packets, extracts the player's car data, reconstructs laps, persists telemetry, and streams processed data to connected clients in real time.

> 🚧 **Status: Active development**
>
> The core telemetry ingestion, parsing, lap processing, persistence, and real-time transport are implemented. Advanced telemetry analysis and visualization are currently being developed.

---

## Overview

Chronograph is an experimental telemetry platform designed for collecting and analyzing F1 simulator data in real time.

The main goal is to build a reliable data pipeline that turns low-level UDP telemetry packets into structured, queryable racing data.

The current pipeline is:

```text
F1 Simulator
     │
     │ UDP telemetry
     ▼
┌─────────────────┐
│  UDP Receiver   │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Binary Parser   │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Lap Processing  │
└────────┬────────┘
         ├──────────────► Socket.IO ► Frontend
         │
         ▼
┌─────────────────┐
│ PostgreSQL      │
│ + Prisma        │
└─────────────────┘
```

---

## Current Features

### Telemetry ingestion

* UDP telemetry receiver
* F1 telemetry packet detection
* Session identification
* Player car extraction
* Support for:

    * `CarTelemetry`
    * `LapData`

### Binary packet parsing

Chronograph currently parses the binary F1 telemetry protocol directly using Node.js `Buffer` operations.

Extracted telemetry includes:

* Speed
* Throttle
* Steering
* Brake
* Clutch
* Gear
* RPM
* DRS
* Brake temperatures
* Tyre surface temperatures
* Tyre inner temperatures
* Tyre pressures
* Engine temperature
* Surface type
* Lap distance
* Lap time
* Sector
* Lap number
* Driver status
* Result status
* Pit information
* Penalties and warnings
* Speed trap data

### Lap processing

The backend maintains an in-memory representation of the currently active lap.

It handles:

* Lap creation
* Lap transitions
* Telemetry point aggregation
* Sector time extraction
* Invalid laps
* Finished laps
* DNF / retired / disqualified states
* Session changes
* Basic handling of telemetry time resets

### Persistence

Completed laps are stored in PostgreSQL through Prisma.

Current data model:

```text
Session
   │
   └───< Lap
           │
           ├── lap number
           ├── lap time
           ├── sector times
           ├── invalid status
           └── telemetry data
```

Telemetry points are currently stored as JSON inside each completed lap.

### Real-time communication

Processed telemetry is broadcast to connected clients using Socket.IO.

The frontend can subscribe to telemetry events without directly communicating with the UDP layer.

---

## Architecture

Chronograph currently follows an event-driven data pipeline:

```text
┌──────────────────────┐
│     F1 Simulator     │
└──────────┬───────────┘
           │ UDP
           ▼
┌──────────────────────┐
│  TelemetryGateway    │
│                      │
│ UDP + Socket.IO      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  TelemetryParser     │
│                      │
│ Binary → structured  │
│ telemetry objects    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│     LapsService      │
│                      │
│ Lap state + points   │
└──────────┬───────────┘
           │
           ├──────────────► Socket.IO
           │
           ▼
┌──────────────────────┐
│   LapsRepository     │
│                      │
│ Prisma → PostgreSQL  │
└──────────────────────┘
```

The architecture is intentionally split into several responsibilities:

* **TelemetryGateway** — receives UDP packets and publishes real-time events.
* **TelemetryParser** — converts binary packets into structured data.
* **LapsService** — maintains active lap state and builds telemetry points.
* **LapsRepository** — persists completed laps.
* **Prisma** — database access layer.
* **PostgreSQL** — persistent telemetry storage.
* **React client** — real-time telemetry visualization.

---

## Project Structure

```text
Chronograph/
│
├── client/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── server/
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── ...
│   │   └── telemetry/
│   │
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

---

## Technology Stack

### Backend

* **Node.js**
* **NestJS**
* **TypeScript**
* **Socket.IO**
* Native UDP sockets

### Database

* **PostgreSQL**
* **Prisma ORM**

### Frontend

* **React**
* **TypeScript**
* **Vite**

### Development

* Docker Compose
* ESLint
* TypeScript

---

## Telemetry Protocol

Chronograph works with the binary telemetry protocol provided by the F1 game.

The parser currently handles packet headers, packet IDs, session IDs, player-car indices, and packet-specific binary layouts.

For example, `CarTelemetry` data is extracted using the player's car index:

```text
Packet
 │
 ├── Header
 │
 ├── Player Car Index
 │
 └── Car Telemetry Array
        │
        ├── Car 0
        ├── Car 1
        ├── ...
        └── Player Car
```

The parser uses fixed offsets and little-endian reads to extract individual fields from the packet.

Protocol-specific implementation details are intentionally kept in the source code rather than making the main README a protocol specification.

---

## Data Model

The current Prisma schema consists of two main entities.

### Session

```text
Session
├── id
├── trackId
├── createdAt
└── laps[]
```

### Lap

```text
Lap
├── id
├── sessionId
├── lapNumber
├── finalTimeInMS
├── isLapInvalid
├── sector1TimeMS
├── sector2TimeMS
├── sector3TimeMS
├── telemetryData
└── createdAt
```

A lap contains the telemetry points collected during that lap.

This model is intentionally simple at the current stage and is expected to evolve as the analytical layer grows.

---

## Telemetry Processing

A telemetry sample is converted into an internal `TelemetryPoint` containing the data required for lap analysis.

Conceptually:

```text
CarTelemetry + LapData
          │
          ▼
   TelemetryPoint
          │
          ▼
    Active Lap Buffer
          │
          ├── next lap
          │
          └── lap finished
                 │
                 ▼
             Database
```

This allows raw simulator packets to be separated from the higher-level racing concepts used by the analytical layer.

---

## Planned Telemetry Analysis

The analytical layer is the next major stage of the project.

Planned capabilities include:

### Driver inputs

Analysis of:

* Throttle application
* Brake application
* Steering input
* Gear selection
* DRS usage

### Braking analysis

Potential metrics include:

* Braking point
* Brake application rate
* Peak brake pressure
* Braking distance
* Trail braking
* Speed reduction during braking

### Corner analysis

Compare:

* Entry speed
* Minimum speed
* Exit speed
* Throttle application
* Steering input
* Racing line

---

## Roadmap

### Phase 1 — Telemetry Pipeline

* [x] UDP telemetry receiver
* [x] Binary packet parser
* [x] Player car extraction
* [x] Session tracking
* [x] Lap reconstruction
* [x] Sector time extraction
* [x] PostgreSQL persistence
* [x] Socket.IO telemetry streaming

### Phase 2 — Visualization

* [ ] Live telemetry dashboard
* [ ] Speed graph
* [ ] Throttle / brake graph
* [ ] Steering graph
* [ ] RPM / gear visualization
* [ ] Track position visualization
* [ ] Lap timeline

### Phase 3 — Telemetry Analysis

* [ ] Lap comparison
* [ ] Braking point detection
* [ ] Corner detection
* [ ] Throttle analysis
* [ ] Trail braking analysis
* [ ] Racing line analysis
* [ ] Sector performance analysis

### Phase 4 — Advanced Analytics

* [ ] Signal smoothing
* [ ] Driver performance metrics
* [ ] Automated time-loss detection
* [ ] Optimal lap reconstruction
* [ ] Cross-lap telemetry comparison
* [ ] Historical session analysis

---

## Current Limitations

Chronograph is still under active development.

Some architectural decisions are intentionally pragmatic and may change as the system grows.

For example:

* Only a subset of the available F1 UDP packet types is currently parsed.
* Telemetry is currently accumulated in memory while a lap is active.
* Telemetry points are persisted as JSON rather than in a fully normalized analytical schema.
* Packet synchronization between different telemetry packet types is still relatively simple.
* Advanced analytics are not implemented yet.
* The frontend visualization layer is still under development.

These are known areas of future improvement rather than finished architectural decisions.

---

## Getting Started

### Prerequisites

Make sure you have:

* Node.js
* npm
* Docker / Docker Compose
* PostgreSQL, if running the database outside Docker
* An F1 game capable of sending UDP telemetry

### Clone the repository

```bash
git clone https://github.com/Vashagod1/Chronograph.git
cd Chronograph
```

### Start the database

From the server directory:

```bash
docker compose up -d
```

### Install dependencies

Backend:

```bash
cd server
npm install
```

Frontend:

```bash
cd ../client
npm install
```

### Configure telemetry

Configure the F1 game's UDP telemetry settings to send data to:

```text
IP: 127.0.0.1
Port: 20777
```

If the game is running on another machine, replace `127.0.0.1` with the IP address of the machine running Chronograph.

### Run the server

```bash
cd server
npm run start:dev
```

### Run the client

```bash
cd client
npm run dev
```

The exact startup commands may evolve while the project is under active development.

---

## Why Chronograph?

Most telemetry tools focus primarily on displaying data.

Chronograph is being built around a different idea:

> **Raw telemetry should become useful driving information.**

The long-term goal is to connect low-level telemetry signals with higher-level racing concepts:

```text
Raw Telemetry
     │
     ▼
Structured Data
     │
     ▼
Lap Reconstruction
     │
     ▼
Feature Extraction
     │
     ▼
Performance Analysis
     │
     ▼
Actionable Feedback
```

Instead of only answering:

> "What happened?"

Chronograph aims to eventually answer:

> "Where did I lose time, why did I lose it, and what should I change?"

---

## Documentation

More detailed technical documentation will be added as the architecture stabilizes.

Planned documentation:

```text
docs/
├── architecture.md
├── telemetry-protocol.md
├── telemetry-analysis.md
└── decisions/
    ├── 001-event-driven-architecture.md
    └── 002-signal-smoothing.md
```

The README intentionally focuses on the system as a whole rather than documenting every byte offset and implementation detail.

---

## Project Status

Chronograph is currently a **work in progress**.

The telemetry pipeline is functional, while the analytical and visualization layers are being developed incrementally.

The project is primarily an engineering and research experiment focused on:

* Real-time data processing
* Binary protocol parsing
* Event-driven backend architecture
* Time-series telemetry
* Racing data analysis
* Performance-oriented software design

---

## License

License information will be added when the project reaches a more stable stage.
