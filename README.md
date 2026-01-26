# DropCode

**DropCode** is a fast, no-nonsense file sharing utility built with a **Neo-Brutalist** design philosophy. It prioritizes speed and simplicity over permanent storage.

![DropCode UI](https://via.placeholder.com/800x400?text=DropCode+UI+Preview)

## 🚀 The Concept

DropCode solves the problem of quick, ad-hoc file transfer between devices (e.g., Laptop to Phone, Colleague to Colleague) without login, accounts, or complex links.

1.  **Drop** a file (or multiple files).
2.  **Get** a short 5-character code (e.g., `HJRMC`).
3.  **Enter** the code on the receiving device to download.

Everything is **ephemeral**. Files are automatically deleted 10 minutes after upload.

## ✨ Features

-   **Zero Friction**: No accounts, no links, just a short code.
-   **Multi-File Support**: Upload multiple files at once; they are automatically zipped on download.
-   **Neo-Brutalist Design**: Thick borders, high contrast, bold typography.
-   **Production Hardened**: Handles network interruptions, server restarts, and stalls gracefully.
-   **Secure-ish**: Files expire automatically. Codes are random.

## 🛠️ Tech Stack

-   **Frontend**: React, Vite, Tailwind CSS
-   **Backend**: Node.js, Express, Multer, Archiver
-   **Storage**: Local filesystem (Ephemeral `tmp/uploads`)

## ⚡ Quick Start

### Prerequisites
-   Node.js (v18+)

### 1. Start the Backend
```bash
cd server
npm install
npm start
# Server runs on http://localhost:3000
```

### 2. Start the Frontend
```bash
cd client
npm install
npm run dev
# App opens at http://localhost:5173
```

## 🔒 Edge Case Handling

DropCode is designed to be robust. See [EDGE_CASES.md](./EDGE_CASES.md) for our detailed handling of:
-   Network drops during upload (Auto-cleanup)
-   Server restarts (Orphan file cleanup)
-   Disk space limits
-   Race conditions

## 📂 Project Structure

```
DropCode/
├── client/              # React Frontend
│   ├── src/components/  # Atomic UI Components
│   ├── src/context/     # App State Machine
│   └── src/services/    # API Integration
├── server/              # Express Backend
│   ├── routes/          # API Routes (upload, download, file)
│   └── utils/           # Helpers (store, codegen)
└── EDGE_CASES.md        # Hardening Specification
```
