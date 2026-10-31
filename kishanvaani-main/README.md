# 🌾 KishanVaani - Audio-First Agriculture Platform

KishanVaani is a production-ready, audio-first web platform tailored for Indian farmers and rural communities. It delivers daily agriculture news, agro-weather forecasts, real-time APMC mandi prices, expert agronomy guidance, livestock management, rural literature, and farmer community experiences across multiple regional languages.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v20+ or v22+
- **npm** or **pnpm**

### 2. Install Dependencies
```bash
# In apps/server
cd apps/server && npm install

# In apps/web
cd ../web && npm install
```

### 3. Database Initialization & Seeding
The project uses Prisma ORM configured with SQLite (`dev.db`). All application routes, relations, and persistence use Prisma exclusively.
```bash
# Generate Prisma client & sync schema
cd apps/server
npx prisma generate
npx prisma db push

# Seed rich agricultural data (17+ audio tracks, mandi rates, weather, expert Q&As)
npx tsx src/seed.ts
```

### 4. Run Development Servers
Open two terminal windows or run the npm scripts:

**Backend Server (Port 4000):**
```bash
cd apps/server
npm run dev
```

**Frontend Web App (Port 5173):**
```bash
cd apps/web
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🔑 Demo Accounts (1-Click Login on `/login`)

| Role | Email | Password | Access / Capabilities |
| :--- | :--- | :--- | :--- |
| **Farmer** | `farmer@kishanvaani.in` | `password123` | Bookmarks, listening history, asking experts, sharing stories |
| **Agronomist** | `expert@kishanvaani.in` | `password123` | Answering farmer queries with audio notes & agronomy advice |
| **Admin** | `admin@kishanvaani.in` | `password123` | Admin dashboard, content CMS publisher, community moderation |

> [!WARNING]
> **Production Security & Deployment Checklist:**
> 1. **Rotate JWT Secret**: The repository/zip template includes a development `JWT_SECRET`. Before deploying to production, generate a fresh 64-byte random hex secret using:
>    ```bash
>    node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
>    ```
> 2. **Delete `dev.db` Before Sharing Code**: Never share or commit local database files containing sample data or hashes.
> 3. **Remove Demo Accounts in Production**: Set `NODE_ENV=production`. This automatically disables the `/api/v1/auth/demo-login` shortcut and blocks `seed.ts` from creating accounts with default passwords (`password123`). Create real, password-protected administrator accounts directly via authenticated registration or custom production seeds.
> 4. **Live Mandi Key**: Set `DATA_GOV_IN_API_KEY` in `apps/server/.env` to stream live Agmarknet prices instead of static benchmarks.

---

## 📈 Real-Time Mandi Prices (data.gov.in Agmarknet Setup)

KishanVaani streams live daily spot prices directly from the Ministry of Agriculture & Farmers Welfare (Agmarknet) via the Open Government Data (OGD) platform.

### 1. Where to put the key
1. Sign up for a free developer account at [data.gov.in](https://data.gov.in).
2. Go to **My Account** -> **API Keys** and generate/copy your personal API key.
3. Open `apps/server/.env` and paste your key:
   ```env
   DATA_GOV_IN_API_KEY=your_copied_api_key_here
   ```
*(Do not include quotes or surrounding whitespace. The server automatically sanitizes it).*

### 2. Verify the connection
Run the built-in diagnostic script from either the root or server directory:
```bash
# From repository root:
npm run check:mandi

# Or inside apps/server:
cd apps/server && npm run check:mandi
```
This tests the live endpoint with a 15-second timeout and reports the HTTP status, record count, and sample record fields without printing or exposing your key.

### 3. Setting the variable on hosting platforms
When deploying the backend (Render, Railway, Fly.io, AWS, Heroku, Docker):
- Add an Environment Variable with key `DATA_GOV_IN_API_KEY` and value set to your API key.
- Never commit `.env` into git repositories (`.env` is strictly git-ignored).
- At server startup, the system will log:
  `Data.gov.in key: configured`
  or gracefully fallback if missing:
  `Data.gov.in key: MISSING - mandi prices will not be live`

---

## 🧭 Key Features & Architecture

- **Home**: Live agro-weather widget, real-time APMC mandi benchmark rates, 1-click featured audio player, continue listening with progress recovery, and top news.
- **Agriculture Hub (`/agriculture`)**:
  - News (`/agriculture/news`)
  - Agro-Weather with spray window advisories (`/agriculture/weather`)
  - Mandi Prices Explorer (`/agriculture/mandi-prices`):
    - **AGMARKNET Integration**: Physical APMC arrivals & spot prices (Directorate of Marketing & Inspection, GoI) with Data.gov.in integration.
    - **e-NAM Integration**: National electronic trading platform auction bids, lots traded, and live auction status.
    - **Price Spread Comparator**: Physical APMC vs Digital e-NAM price comparison with actionable farmer selling recommendations.
  - Crop Advisory with pest management & seasonal sowing guides (`/agriculture/crop-advisory`)
  - Livestock Care with dairy milk yield & vaccination calendar (`/agriculture/livestock`)
  - Government Schemes (PM-KISAN, PMFBY, Solar Pump Subsidy) (`/agriculture/government-schemes`)
- **Community Hub (`/community`)**:
  - Success stories & breakthroughs (`/community/success-stories`)
  - Learning from failure & post-harvest lessons (`/community/learning-from-failure`)
  - Everyday farmer experiences & hacks (`/community/farmer-experiences`)
  - Ask an Expert desk with specialist answers (`/community/ask-an-expert`)
  - "Share Your Story" submission modal
- **Literature Hub (`/literature`)**:
  - Rural stories, harvest poems, folk tales & full organic farming audiobooks
- **Persistent Global Audio Player**:
  - Continuous streaming across pages, speed controls (0.75x - 2x), 10s skip, progress sync to backend, transcript reading drawer, WhatsApp & direct link sharing, and bookmarks.
- **Universal Search (`/search`)**:
  - Multi-resource faceted search across audio articles, mandi rates, and expert advice with popular tags.
- **Multilingual Support**:
  - Instant UI and content language switcher for **Hindi (हिन्दी)**, **English**, **Telugu (తెలుగు)**, **Tamil (தமிழ்)**, **Marathi (मराठी)**, and **Punjabi (ਪੰਜਾਬੀ)**.
- **Admin & Agronomist Dashboard (`/admin`)**:
  - Live system stats, article publishing CMS with audio transcripts, story moderation queue, and expert Q&A desk.

---

## 📦 Production Build

```bash
# Build Server
cd apps/server && npm run build

# Build Frontend
cd ../web && npm run build
```
Production assets are generated in `apps/web/dist` and server distribution in `apps/server/dist`.
