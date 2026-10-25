/**
 * Minimal zero-dependency local HTTP development server for Node.js.
 * Serves static files for the Enigma Rotor Mealy Machine project.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".md": "text/markdown; charset=utf-8"
};

const server = http.createServer((req, res) => {
  // Normalize URL and strip query strings or hash
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  if (pathname === "/" || pathname === "") {
    pathname = "/index.html";
  }

  const safePath = path.normalize(path.join(ROOT_DIR, pathname));

  // Security check: prevent directory traversal
  if (!safePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("403 Forbidden: Access denied.");
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }

    let filePathToServe = safePath;
    if (stats.isDirectory()) {
      filePathToServe = path.join(safePath, "index.html");
    }

    const ext = path.extname(filePathToServe).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    fs.readFile(filePathToServe, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`500 Internal Server Error: ${readErr.message}`);
        return;
      }

      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate"
      });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log("==================================================================");
  console.log("  ENIGMA ROTOR MEALY MACHINE - LOCAL HTTP DEVELOPMENT SERVER      ");
  console.log("==================================================================");
  console.log(`\n  Server is running at: http://localhost:${PORT}/`);
  console.log(`  Serving files from:   ${ROOT_DIR}`);
  console.log("\n  Press Ctrl+C to stop the server anytime.\n");
});
