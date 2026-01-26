# DropCode — TODO

## Phase 1: Setup

- [x] **Initialize Frontend Project**
  - Create React + Vite project in `/client` directory
  - Configure Tailwind CSS with neo-brutalist design tokens (strict colors, spacing, typography)
  - Expected output: Project runs with `npm run dev`, Tailwind configured

- [x] **Initialize Backend Project**
  - Create Express.js server in `/server` directory
  - Set up project structure with routes, controllers, and utilities folders
  - Configure Multer for file uploads with 200MB limit
  - Expected output: Server runs on port 3000, health endpoint `/api/health` returns 200

- [x] **Configure Development Environment**
  - Add CORS configuration for local development
  - Set up environment variables (PORT, UPLOAD_DIR, FILE_EXPIRY_MS)
  - Create `/tmp/uploads` directory for temporary file storage
  - Expected output: Frontend can make API calls to backend without CORS errors

---

## Phase 2: Backend

- [ ] **Implement File Upload Endpoint**
  - Create `POST /api/upload` endpoint
  - Accept multipart file upload via Multer
  - Store file in temp directory
  - Return file metadata (name, size) on success
  - Handle file size limit errors
  - Expected output: Can upload file via curl/Postman, file saved to disk

- [ ] **Implement Code Generation Utility**
  - Create short code generator (5-char alphanumeric, case-insensitive)
  - Ensure randomness and collision checking
  - Expected output: Generates unique codes like `F7K9Q`

- [ ] **Implement In-Memory File Store**
  - Create Map-based store for code-to-file mapping
  - Store: code, filePath, fileName, fileSize, expiryTimestamp
  - Integrate with upload endpoint to register new uploads
  - Expected output: Upload returns generated code with expiry time

- [ ] **Implement File Metadata Endpoint**
  - Create `GET /api/file/:code` endpoint
  - Validate code exists and not expired
  - Return file metadata (name, size)
  - Return appropriate error for invalid/expired codes
  - Expected output: Valid code returns metadata, invalid returns 404

- [ ] **Implement File Download Endpoint**
  - Create `GET /api/download/:code` endpoint
  - Stream file to client with proper headers
  - Expected output: Browser downloads file with correct filename

- [ ] **Implement Expiry & Cleanup System**
  - Create background cleanup job (runs every 60 seconds)
  - Delete expired files from disk
  - Remove expired entries from in-memory store
  - Default TTL: 10 minutes
  - Expected output: Uploaded files auto-delete after 10 minutes

---

## Phase 3: Frontend

- [ ] **Create App Shell & State Management**
  - Set up React Context for app state
  - Define states: idle, uploading, codeGenerated, downloadEntry, downloading, error
  - Create state transition logic
  - Expected output: App renders, state transitions work

- [ ] **Build Upload Zone Component (Idle State)**
  - Create full-screen drag-and-drop zone
  - Neo-brutalist styling: thick black border, bold text, sharp corners
  - Microcopy: "DROP FILE HERE" / "CLICK IF YOU MUST"
  - Handle file selection via click fallback
  - Expected output: Drag-drop and click-to-upload both trigger file selection

- [ ] **Build Uploading State UI**
  - Show file name in bold
  - Display progress bar with solid fill (no animation easing)
  - Show percentage in large font
  - Integrate with upload API (track upload progress)
  - Expected output: Progress bar updates during upload

- [ ] **Build Code Generated State UI (Hero Moment)**
  - Display code in huge monospace font, center screen
  - Thick border around code block
  - Add "COPY CODE" button with click feedback
  - Show expiry countdown timer ("EXPIRES IN 10:00")
  - Optional: small QR code (secondary)
  - Expected output: Code dominates screen, copy works, timer counts down

- [ ] **Build Download Entry State UI**
  - Full-screen layout with bold input rectangle
  - Auto-focus code input field
  - "GET FILE" button below input
  - Keyboard-optimized (mobile-first)
  - Expected output: User can type code and submit

- [ ] **Build Downloading State UI**
  - Show file name and size
  - Display download progress bar
  - Trigger browser download on success
  - Expected output: File downloads to device

- [ ] **Build Error State UI**
  - Display error messages: "CODE EXPIRED", "FILE NOT FOUND"
  - Show "TRY AGAIN" action
  - No illustrations or emojis, text only
  - Expected output: Clear error feedback, can retry

---

## Phase 4: Integration

- [ ] **Connect Upload Flow End-to-End**
  - Wire upload zone → upload API → code generated state
  - Handle network errors gracefully
  - Expected output: Full upload flow works from drag-drop to code display

- [ ] **Connect Download Flow End-to-End**
  - Wire code entry → metadata API → download API → browser download
  - Handle invalid/expired code errors
  - Expected output: Full download flow works from code entry to file save

- [ ] **Add Entry Point Toggle**
  - Allow users to switch between upload and download modes
  - Simple toggle or auto-detect based on device (desktop = upload, mobile = download)
  - Expected output: Both flows accessible from single page

---

## Phase 5: Polish & QA

- [ ] **Responsive Design Pass**
  - Ensure mobile-first download flow works perfectly
  - Ensure desktop upload flow is optimal
  - Test on various screen sizes
  - Expected output: Usable on phones, tablets, and desktops

- [ ] **Accessibility Pass**
  - Verify high contrast text
  - Ensure large touch targets (min 44x44px)
  - Test keyboard navigation
  - Expected output: All interactive elements keyboard accessible

- [ ] **Performance Optimization**
  - Verify SPA loads under 2 seconds
  - Ensure upload starts under 1 second
  - Verify code generation under 300ms
  - Expected output: Meets all performance targets from PRD

- [ ] **Error Handling Polish**
  - Test all error scenarios: file too large, network failure, server down
  - Ensure friendly, direct error messages
  - Expected output: All errors handled gracefully with clear messaging

- [ ] **Final End-to-End Testing**
  - Test complete PC → mobile transfer flow
  - Test complete mobile → PC transfer flow
  - Verify file auto-deletes after 10 minutes
  - Expected output: MVP complete — upload, code, download, expiry all work
