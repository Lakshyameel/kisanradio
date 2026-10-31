# Architecture

```text
Browser
  |
  v
React + TypeScript (Vite SPA)
  |
  | REST API (/api/v1)
  v
Node + Express
  |
  +--> Services (IMD Weather, AGMARKNET, e-NAM, Agri News)
  |
  +--> Prisma ORM
          |
          v
      SQLite (dev.db)

Object Storage / Static Assets
  +--> Audio files
  +--> Images
  +--> User uploads
```

Backend layering:

```text
Route -> Middleware (Auth/Role/Rate-Limit) -> Controller/Service -> Prisma ORM -> SQLite Database
```

The actual audio/image binary files live in storage or static assets; the SQLite database managed by Prisma ORM stores metadata, user profiles, credentials, content, mandi prices, and references.
