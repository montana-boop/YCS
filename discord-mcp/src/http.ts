#!/usr/bin/env node
/**
 * Discord MCP server — remote HTTP entry point (Streamable HTTP transport).
 *
 * Serves the MCP protocol over HTTP at POST/GET/DELETE `/mcp`, with per-session
 * transports. Every request must present a bearer token matching MCP_AUTH_TOKEN;
 * without it the endpoint would let anyone act on your Discord server.
 *
 * Environment:
 *   DISCORD_BOT_TOKEN  (required) — the Discord bot token used for API calls.
 *   MCP_AUTH_TOKEN     (required) — the bearer token clients must present.
 *   PORT               (optional, default 3000) — HTTP listen port.
 *   HOST               (optional, default 0.0.0.0) — HTTP bind address.
 */
import { randomUUID } from "node:crypto";
import express, { type Request, type Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createServer } from "./server.js";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";
const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error(
    "MCP_AUTH_TOKEN is not set. Refusing to start an unauthenticated remote server. " +
      "Set MCP_AUTH_TOKEN to a strong secret that clients must present as a bearer token.",
  );
  process.exit(1);
}

if (!process.env.DISCORD_BOT_TOKEN) {
  // Not fatal (tool calls will error clearly), but warn loudly at boot.
  console.error("Warning: DISCORD_BOT_TOKEN is not set. Discord tool calls will fail until it is.");
}

/**
 * Constant-time-ish bearer check. Rejects any request whose Authorization
 * header does not carry the configured token.
 */
function isAuthorized(req: Request): boolean {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return false;
  const presented = header.slice("Bearer ".length).trim();
  // Length check first avoids leaking length via early return timing.
  return presented.length === AUTH_TOKEN!.length && presented === AUTH_TOKEN;
}

const app = express();
app.use(express.json({ limit: "1mb" }));

// Unauthenticated health check for load balancers / uptime monitors.
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", server: "discord-mcp", transport: "streamable-http" });
});

// Active transports keyed by MCP session ID.
const transports: Record<string, StreamableHTTPServerTransport> = {};

app.post("/mcp", async (req: Request, res: Response) => {
  if (!isAuthorized(req)) {
    res.status(401).json({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Unauthorized: missing or invalid bearer token" },
      id: null,
    });
    return;
  }

  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => {
        transports[sid] = transport;
      },
    });
    transport.onclose = () => {
      if (transport.sessionId) delete transports[transport.sessionId];
    };
    const server = createServer();
    await server.connect(transport);
  } else {
    res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Bad Request: no valid session ID provided" },
      id: null,
    });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

// GET (server-to-client SSE stream) and DELETE (session teardown) share logic.
async function handleSessionRequest(req: Request, res: Response): Promise<void> {
  if (!isAuthorized(req)) {
    res.status(401).send("Unauthorized");
    return;
  }
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  await transports[sessionId].handleRequest(req, res);
}

app.get("/mcp", handleSessionRequest);
app.delete("/mcp", handleSessionRequest);

app.listen(PORT, HOST, () => {
  console.error(`discord-mcp remote server listening on http://${HOST}:${PORT}/mcp`);
});
