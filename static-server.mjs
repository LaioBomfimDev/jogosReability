import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClinicAPI } from "./clinic-server.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const clinic = createClinicAPI(process.env.REABILITY_DATA_DIR || path.join(root, '.data'));

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function sendText(response, status, message) {
  response.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  response.end(message);
}

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl, `http://${host}:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  const resolved = path.resolve(path.join(root, pathname));

  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    return null;
  }

  return resolved;
}

const server = createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'same-origin');
  if (request.url.startsWith('/api/')) return clinic.handle(request, response);
  if (request.method !== "GET" && request.method !== "HEAD") {
    sendText(response, 405, "Method not allowed");
    return;
  }

  let requestedPath;
  try { requestedPath = resolveRequestPath(request.url); } catch { return sendText(response, 400, 'Bad request'); }
  if (!requestedPath) {
    sendText(response, 403, "Forbidden");
    return;
  }
  const relative = path.relative(root, requestedPath);
  const blocked = relative.split(/[\\/]/).some(part => part.startsWith('.') || ['node_modules', 'codigo-fonte-autorizado', 'tools', 'tests'].includes(part));
  const allowed = new Set(['.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.webmanifest', '.woff', '.woff2', '.mp3', '.wav']);
  if (blocked || (path.extname(relative) && !allowed.has(path.extname(relative)))) return sendText(response, 404, 'Not found');

  try {
    const fileStats = await stat(requestedPath);
    const filePath = fileStats.isDirectory()
      ? path.join(requestedPath, "index.html")
      : requestedPath;
    const body = await readFile(filePath);
    const contentType =
      mimeTypes.get(path.extname(filePath).toLowerCase()) ||
      "application/octet-stream";

    response.writeHead(200, { "content-type": contentType });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    sendText(response, 404, "Not found");
  }
});

server.listen(port, host, () => {
  console.log(`Serving ${root} at http://${host}:${port}/`);
});
