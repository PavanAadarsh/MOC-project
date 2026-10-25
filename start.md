# How to Start the Local Development Server

This guide provides instructions on starting, verifying, and stopping the local development server for the **Enigma Rotor Mealy Machine** project.

---

## 1. Quick Start Commands

The server is currently running in the background at:
> **[http://localhost:8000/](http://localhost:8000/)**

Choose any of the following methods to start the server:

### Option A: Using NPM / Node.js (Recommended)
This uses the included zero-dependency [`server.js`](file:///d:/Collage%20works/semester%203/models%20of%20computation/server.js):

```bash
# Using npm script:
npm start

# Or directly with node:
node server.js
```

### Option B: Using Python 3 Built-in HTTP Server
If you prefer Python without touching Node.js:

```bash
python -m http.server 8000
```

### Option C: Using NPX Serve
If you prefer `npx`:

```bash
npx -y serve -p 8000 .
```

### Option D: Direct Browser Access (Offline / No Server)
The application has zero build steps and zero remote dependencies:
- Simply double-click [`index.html`](file:///d:/Collage%20works/semester%203/models%20of%20computation/index.html) or open it directly in Google Chrome, Microsoft Edge, Firefox, or Safari.

---

## 2. Server Architecture & Start Process

When `node server.js` is executed, the following sequence takes place:

1. **Port Selection & Binding**:
   - Reads `process.env.PORT` or defaults to port `8000`.
   - Binds an HTTP server listener to `0.0.0.0` / `localhost`.
2. **Request Routing & Traversal Protection**:
   - Intercepts requests, strips query parameters and fragment identifiers.
   - Maps root `/` to [`index.html`](file:///d:/Collage%20works/semester%203/models%20of%20computation/index.html).
   - Validates paths using `path.normalize` to block directory traversal attacks outside the workspace.
3. **MIME Type Mapping**:
   - Correctly serves headers for JavaScript (`application/javascript`), CSS (`text/css`), HTML (`text/html`), SVG, PDF, and XLSX assets.
4. **Cache Control**:
   - Injects `Cache-Control: no-cache, no-store, must-revalidate` so that edits to CSS or JavaScript update immediately upon browser refresh.

---

## 3. How to Verify the Server

### In the Browser:
1. Open your web browser and navigate to:
   ```
   http://localhost:8000/
   ```
2. Press `F12` (or `Ctrl+Shift+I`) to open Developer Tools:
   - Check the **Console** tab: All 4 data validation rules and 19 automated system self-checks will output `[PASS]`.

### From the Terminal:
Run an HTTP header inspection:
```bash
curl.exe -I http://localhost:8000/
```
Expected response:
```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
```

---

## 4. Running the Automated Test Suite

To verify all 19 unit tests (1 data validator + 18 simulation test cases):

```bash
# Using npm:
npm test

# Or directly with node:
node test.js
```

---

## 5. How to Stop the Server

- If running in an interactive terminal window:
  - Press `Ctrl + C`
- If running in background/daemon or finding the process by port:
  - **PowerShell**:
    ```powershell
    Get-NetTCPConnection -LocalPort 8000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
    ```

---

## 6. Custom Port Configuration

To start on a custom port (e.g. `3000` or `5500`):

```bash
# Node.js:
$env:PORT="3000"; node server.js

# Python:
python -m http.server 3000
```
