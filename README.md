# Flashpoint Risk Index Lookup

A single-purpose React + Vite application that surfaces public, read-only Flashpoint Risk Index (FRI) data from Firestore. Provide a date, U.S. state, and optional city/county to see the risk score, band, advisory checklist, and sources for situational awareness.

## Features

- Zero-write, read-only Firestore access.
- No tracking, no analytics, no persistent client storage.
- Diagnostics mode via `?debug=1` for troubleshooting deployments.
- Sensible defaults and fallbacks when city/county detail is missing.

## Prerequisites

- Node.js 18+
- Firebase project with Firestore enabled (Analytics disabled)

## Setup

1. **Create a Firebase project** and add a Web App. Copy the configuration values into `.env` using the provided keys:

   ```bash
   cp .env.example .env
   # fill in the VITE_FIREBASE_* values
   ```

2. **Enable Firestore** in the Firebase console. Do **not** enable Firebase Analytics for this app.

3. **Deploy the security rules** to lock the dataset to read-only access:

   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Seed sample data** so the lookup has something to show. Follow [`tools/seed-sample.md`](./tools/seed-sample.md) or add documents manually in the Firebase Console. The document ID pattern is `{date}_{state}_{cityOrCountyOrEmpty}` in lowercase with spaces replaced by underscores (e.g. `2025-10-18_fl_webster`). Each document should match this schema:

   ```json
   {
     "date": "2025-10-18",
     "state": "FL",
     "place_type": "city",
     "city_or_county": "Webster",
     "risk_score": 7,
     "risk_band": "High",
     "advisory": "Bring legal hotline; avoid chokepoints; …",
     "sources": ["https://example.com/a", "https://example.com/b"]
   }
   ```

5. **Install dependencies and run locally**:

   ```bash
   npm install
   npm run dev
   ```

6. **Build for production**:

   ```bash
   npm run build
   ```

7. **Deploy via Firebase Hosting CLI**:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting   # select your project, choose "dist" as the public directory
   npm run build
   firebase deploy
   ```

## Privacy stance

- No Firebase Analytics or other telemetry is enabled.
- The app performs read-only queries; no writes, no auth, and no user-identifying data is persisted.
- No cookies or local storage are used beyond what Firebase strictly requires for public reads.

## Diagnostics

Append `?debug=1` to the URL to reveal the diagnostics panel. It surfaces the Firebase project ID, current origin, last query payload, fetch status, and any errors. Use the "Copy Debug Snapshot" button to capture the current state for troubleshooting.

## Happy-path validation

With a document such as `2025-10-18_fl_webster` in the collection, submitting the form for **2025-10-18 / FL / Webster** should display the stored risk band and score (e.g., “High — 7/10”). Submitting an unknown combination should display “No data published for that place/date.”
