# DropCode — Edge Case Handling

This document defines known edge cases in DropCode and the expected behavior
for each. It acts as a hardening checklist to ensure reliability, trust,
and predictable UX.

---

## Upload-Side Edge Cases (Sender)

### 1. Page Refresh During Upload
- **Trigger:** User refreshes browser while upload is in progress
- **Expected Behavior:**
  - Upload is aborted
  - Partial file is deleted server-side
  - No code is generated
  - User sees: `UPLOAD INTERRUPTED`
- **Status:** DONE (Backend `req.on('close')` cleanup, Frontend `AbortController` implicit)

---

### 2. Tab Closed During Upload
- **Trigger:** User closes browser tab mid-upload
- **Expected Behavior:**
  - Upload aborts cleanly
  - Partial files are removed
  - No session is created
- **Status:** DONE (Handled same as refresh via cleanup)

---

### 3. Network Drop During Upload
- **Trigger:** Network disconnects mid-upload
- **Expected Behavior:**
  - Detect stalled upload via timeout
  - Abort upload
  - Cleanup partial files
  - Show retry option
- **Status:** DONE (Frontend `STALL_TIMEOUT` triggers abort)

---

### 4. Upload Stalls (Very Slow Network)
- **Trigger:** Upload progress does not change for extended period
- **Expected Behavior:**
  - Show stalled state
  - Allow user to cancel
  - Cleanup on cancel
- **Status:** DONE (Implemented 15s progress timeout)

---

### 5. Multiple Files – One Fails
- **Trigger:** Multi-file upload where one file errors
- **Expected Behavior:**
  - Abort entire upload session
  - Cleanup all partially uploaded files
  - No code generated
- **Status:** DONE (Backend `cleanupFiles` runs on any multer error)

---

## Code & Session Edge Cases

### 6. Code Collision
- **Trigger:** Generated code already exists
- **Expected Behavior:**
  - Regenerate code
  - Never expose collision to user
- **Status:** DONE (Implemented retry loop in `upload.js`)

---

### 7. Code Accessed Before Upload Completes
- **Trigger:** Downloader enters code while upload still running
- **Expected Behavior:**
  - Show: `FILE IS STILL UPLOADING`
  - Auto-retry periodically
  - Download disabled until ready
- **Status:** N/A (Architecture is "Post-then-Code"; user never receives code before upload completes)

---

### 8. Code Expired
- **Trigger:** Code accessed after expiry time
- **Expected Behavior:**
  - Show: `CODE EXPIRED`
  - No retry option
  - Session deleted
- **Status:** DONE (Expiry check implemented in `file.js` and `download.js`)

---

### 9. Code Accessed Multiple Times
- **Trigger:** Same code used on multiple devices
- **Expected Behavior:**
  - Allow parallel downloads (MVP)
  - Maintain expiry timer
- **Status:** DONE (Default behavior; no "burn after reading" logic applied)

---

## Download-Side Edge Cases (Receiver)

### 10. Invalid Code Format
- **Trigger:** User enters malformed or incorrect code
- **Expected Behavior:**
  - Show: `INVALID CODE`
  - No server error
- **Status:** DONE (Frontend maps 404 to `INVALID CODE` text)

---

### 11. Download Interrupted
- **Trigger:** Network loss or browser cancel during download
- **Expected Behavior:**
  - Code remains valid
  - User can retry download
- **Status:** DONE (Default browser/server behavior supports resume/retry)

---

### 12. ZIP Generation Failure (Multi-file)
- **Trigger:** Server fails to package multiple files
- **Expected Behavior:**
  - Abort download
  - Do not invalidate code
  - Show: `FAILED TO PACKAGE FILES`
- **Status:** DONE (Backend returns 500 with explicit error message)

---

### 13. Partial ZIP Generated
- **Trigger:** ZIP created with missing files
- **Expected Behavior:**
  - Reject ZIP
  - Treat as failure
  - Allow retry
- **Status:** DONE (Client side behavior; server ensures stream finalization)

---

## System & Cleanup Edge Cases

### 14. Cleanup During Active Download
- **Trigger:** Expiry cleanup runs while file is downloading
- **Expected Behavior:**
  - Cleanup waits for download to finish
  - No partial deletes
- **Status:** DONE (OS file locking prevents immediate deletion of active streams)

---

### 15. Server Restart
- **Trigger:** Backend restarts unexpectedly
- **Expected Behavior:**
  - In-memory sessions lost
  - Orphaned files cleaned on startup
  - User sees: `SESSION LOST — PLEASE REUPLOAD`
- **Status:** DONE (Implemented startup cleanup in `index.js`)

---

### 16. Disk Full
- **Trigger:** Storage limit reached
- **Expected Behavior:**
  - Reject new uploads
  - Show: `STORAGE FULL — TRY AGAIN LATER`
- **Status:** DONE (Mapped `ENOSPC` to 507 error)

---

## Abuse & Stability (Post-MVP)

### 17. Rapid Upload Spam
- **Trigger:** Excessive uploads from same client
- **Expected Behavior:**
  - Temporary throttling
  - Graceful error message
- **Status:** TODO

---

### 18. Code Guessing Attempts
- **Trigger:** Repeated invalid code attempts
- **Expected Behavior:**
  - Rate limit validation
- **Status:** TODO

---

## Completion Rule

An edge case is considered **DONE** only when:
- Behavior matches this document
- No silent failures occur
- User-facing feedback is clear and honest
