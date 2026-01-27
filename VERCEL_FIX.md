# Vercel Deployment Fix: NOT_FOUND Error

## Root Cause Analysis
The deployment returned `NOT_FOUND` because the project root was missing `next.config.js`. 
Although Next.js works locally without it, Vercel's build pipeline relies on this file to:
1.  **Auto-detect Next.js Framework**: Without it, Vercel may misconfigure the build output directory.
2.  **Route Handling**: Correctly map the App Router (`app/`) structure.

## ✅ A. Corrected Folder Structure

```
/
├── app/
│   ├── api/
│   │   ├── upload/route.ts
│   │   └── ...
│   ├── page.tsx
│   └── globals.css
├── next.config.js       <-- CREATED (Critical Fix)
├── package.json
└── ...
```

## ✅ B. and C. Corrected Code
The code in `app/api/*` and `lib/api.ts` is already correct.
- API Routes export `GET`, `POST`, `PATCH`.
- Frontend calls `/api/upload` etc.

## ✅ D. Deployment Notes

### 1. Vercel Project Settings
**CRITICAL**: Check your Vercel Dashboard > Settings > General.
- **Framework Preset**: MUST be **Next.js**. (If it says "Vite" or "Other", change it).
- **Root Directory**: MUST be `./`.

### 2. Redeploy
Push the new `next.config.js` and wait for a new build.
