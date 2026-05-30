# Property Finder (InvestLocate)

Web-based real estate cash-flow analysis tool for discovering active listings, running investment scenarios, and managing property shortlists. Built with Next.js, TypeScript, Tailwind CSS, Prisma, and PostgreSQL with PostGIS for spatial search.

## Architecture

```
property_finder/
├── prisma/
│   ├── schema.prisma          # User, Property, SavedShortlist models
│   └── migrations/            # SQL migrations (PostGIS extension + GIST index)
├── src/
│   ├── app/                   # Next.js App Router pages and API routes
│   ├── components/            # Reusable UI components
│   ├── hooks/                 # Client-side React hooks
│   ├── lib/
│   │   ├── api/               # API types and client helpers
│   │   ├── db.ts              # Prisma client singleton
│   │   └── postgis.ts         # Spatial query helpers (ST_DWithin, etc.)
│   └── generated/prisma/      # Generated Prisma Client (postinstall)
├── .env.example
└── prisma.config.ts           # Prisma datasource configuration
```

### Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend | Next.js Route Handlers / Server Actions (Node.js runtime) |
| ORM | Prisma 7 with `@prisma/adapter-pg` driver |
| Database | PostgreSQL + PostGIS |

### Data model

- **User** — application accounts
- **Property** — active listings with address, pricing, and WGS84 coordinates; a PostGIS `geometry(Point, 4326)` column (`location`) supports radius and proximity search via GIST index
- **SavedShortlist** — many-to-many join between users and saved properties, with optional notes

Latitude and longitude are stored as native floats for Prisma access. A database trigger keeps the PostGIS `location` column in sync on insert/update.

## Prerequisites

- Node.js 20+
- npm 10+
- Docker (recommended) or a local PostgreSQL instance with PostGIS

## Local installation

### 1. Clone and install dependencies

```bash
git clone https://github.com/cgray-redhat/property_finder.git
cd property_finder
npm install
```

### 2. Start PostgreSQL with PostGIS

Using Docker:

```bash
docker run --name property-finder-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=property_finder \
  -p 5432:5432 \
  -d postgis/postgis:16-3.4
```

### 3. Configure environment

```bash
cp .env.example .env
```

Update `DATABASE_URL` in `.env` if your credentials differ from the defaults.

### 4. Run database migrations

```bash
npm run db:migrate
```

This applies the initial migration, enables the PostGIS extension, creates tables, adds a GIST spatial index on `properties.location`, and installs the lat/lng sync trigger.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Generate Prisma client and build for production |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Create/apply migrations in development |
| `npm run db:push` | Push schema changes without a migration (prototyping) |
| `npm run db:studio` | Open Prisma Studio |

## Spatial search

Use `findPropertiesNearby()` in `src/lib/postgis.ts` for radius-based queries:

```typescript
import { findPropertiesNearby } from "@/lib/postgis";

const nearby = await findPropertiesNearby(37.7749, -122.4194, 5000); // 5 km
```

Queries use `ST_DWithin` on the PostGIS geography type for accurate distance calculations.

## License

Private / internal use — see repository owner for terms.
