# phmappers-web

React + Vite frontend, Express + Prisma backend, PostgreSQL in Docker.

## What you need

| | |
|---|---|
| **Node 24+** | The server runs TypeScript files directly. Older Node will not start it. |
| **pnpm** | Package manager for both apps. |
| **Docker** | Runs PostgreSQL. Nothing else is containerised. |

### Windows

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and [Node](https://nodejs.org/) (pick the LTS installer), then in PowerShell:

```powershell
npm install -g pnpm
```

Docker Desktop will ask to enable WSL2 during install — say yes. You don't need to work inside WSL; PowerShell is fine.

### Arch

```bash
sudo pacman -S nodejs npm docker docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER      # log out and back in after this
npm install -g pnpm
```

### Debian / Ubuntu

The versions in `apt` are too old for both Node and Docker, so use their official installers:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER      # log out and back in after this
npm install -g pnpm
```

## Setup

```bash
git clone git@github.com:osu-sisigan/phmappers-web.git
cd phmappers-web

pnpm install
docker compose up -d --wait        # starts postgres, waits until it accepts connections
cp server/.env.example server/.env # on Windows: copy server\.env.example server\.env
pnpm dev
```

That's it. `pnpm dev` runs the frontend and backend together:

| | |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:4000 |
| Postgres | `localhost:5432`, user / password / db all `phmappers` |

## Commands

| | |
|---|---|
| `pnpm dev` | Frontend + backend, both with hot reload |
| `docker compose up -d` | Start the database |
| `docker compose down` | Stop it (data is kept) |
| `docker compose down -v` | Stop it and **delete all data** |
| `pnpm lint` | Lint everything |
| `pnpm --filter server typecheck` | Typecheck the backend |

## A note on the database

The schema has no tables yet — `server/prisma/schema.prisma` defines the connection but no models. Postgres will start and the API will run, but there is nothing to query until models and a first migration are added.

## If something breaks

**The frontend opened on a different port.** Vite takes the next free one when 5173 is busy. Check the terminal for the actual URL.

**Port 4000 is already in use.** Set a different `PORT` in `server/.env`.

**`permission denied` talking to Docker (Linux).** You skipped the `usermod` step above, or haven't logged out and back in since running it.

**The server exits immediately, complaining about TypeScript.** Your Node is too old. Check with `node --version` — it needs to be 24 or newer.

**Prisma can't find `DATABASE_URL`.** You don't have `server/.env` yet. Copy it from `server/.env.example`.
