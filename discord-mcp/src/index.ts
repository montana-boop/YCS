#!/usr/bin/env node
/**
 * Discord MCP server — stdio entry point (local connector).
 *
 * Communicates over stdin/stdout; register it with a `command`/`args` MCP
 * config. For the remote HTTP transport, see http.ts.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr is safe for logging; stdout is reserved for the JSON-RPC stream.
  console.error("discord-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting discord-mcp:", err);
  process.exit(1);
});
