// A tiny HTTP server (Node built-in, no deps) that exposes the ONE stable link
// you put in Kit. It 302-redirects to whatever the current live Discord invite
// is, so the public URL never changes even as the invite rotates underneath.
//
//   GET /discord  (also /join, /invite)  → redirect to the live invite
//   GET /                                 → status page
//   GET /healthz                          → 200 ok (for host health checks)

import http from "node:http";
import { readLink } from "../src/store.js";

const JOIN_PATHS = new Set(["/discord", "/join", "/invite"]);

export function startServer(cfg) {
  const server = http.createServer((req, res) => {
    let path = "/";
    try {
      path = new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname;
    } catch {
      /* keep default */
    }
    path = path.replace(/\/+$/, "") || "/";

    if (JOIN_PATHS.has(path)) {
      const rec = readLink();
      if (rec?.url) {
        res.writeHead(302, { Location: rec.url, "Cache-Control": "no-store, max-age=0" });
        res.end(`Redirecting to ${rec.url}`);
      } else {
        res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("The Discord link is warming up — try again in a few seconds.");
      }
      return;
    }

    if (path === "/healthz") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
      return;
    }

    if (path === "/") {
      const rec = readLink();
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
          `<title>Single Besties · Discord link</title>` +
          `<body style="font-family:system-ui,sans-serif;max-width:620px;margin:40px auto;padding:0 20px;line-height:1.6;color:#1a1b23">` +
          `<h1 style="color:#5865f2">Single Besties · Discord link</h1>` +
          `<p>Your <b>stable join link</b> is <a href="/discord">/discord</a> — put that in Kit; it never changes.</p>` +
          (rec?.url
            ? `<p>It currently forwards to <code>${rec.url}</code><br><small>refreshed ${rec.createdAt}</small></p>`
            : `<p><em>Warming up — the bot is minting the first invite…</em></p>`) +
          `</body>`
      );
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  });

  server.listen(cfg.port, () => {
    console.log(`   🌐 Stable-link server listening on :${cfg.port} — share the /discord path`);
  });
  return server;
}
