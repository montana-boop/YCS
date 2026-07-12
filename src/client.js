// Minimal, dependency-free Discord REST client.
// Uses Node's built-in fetch (Node 18+). No npm install required.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const API = "https://discord.com/api/v10";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- tiny .env loader -------------------------------------------------------
// Loads KEY=VALUE lines from ./.env into process.env without overwriting
// anything already set in the real environment.
export function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      // strip surrounding quotes if present
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    // No .env file — rely on the real environment. That's fine.
  }
}

export function config() {
  loadEnv();
  return {
    token: process.env.DISCORD_BOT_TOKEN || "",
    guildId: process.env.DISCORD_GUILD_ID || "",
    channelId: process.env.DISCORD_CHANNEL_ID || "",
    webhookUrl: process.env.DISCORD_WEBHOOK_URL || "",
    webhookName: process.env.DISCORD_WEBHOOK_NAME || "YCS",
  };
}

function requireToken(cfg) {
  if (!cfg.token) {
    throw new Error(
      "DISCORD_BOT_TOKEN is not set. Add it to your .env file (see .env.example) " +
        "or export it in your shell. See README.md for how to create a bot token."
    );
  }
}

// --- core request helper ----------------------------------------------------
export async function api(method, path, { body, cfg } = {}) {
  cfg = cfg || config();
  requireToken(cfg);
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${cfg.token}`,
      "Content-Type": "application/json",
      "User-Agent": "YCS-Discord-Toolkit (https://ycsproductions.com, 1.0.0)",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const detail =
      data && typeof data === "object"
        ? data.message || JSON.stringify(data)
        : String(data || "");
    throw new Error(`Discord API ${method} ${path} failed (${res.status}): ${detail}`);
  }
  return data;
}

// --- webhook (no bot token needed) -----------------------------------------
export async function webhookPost(url, payload) {
  // wait=true so Discord returns the created message object
  const res = await fetch(`${url}?wait=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const detail =
      data && typeof data === "object"
        ? data.message || JSON.stringify(data)
        : String(data || "");
    throw new Error(`Discord webhook POST failed (${res.status}): ${detail}`);
  }
  return data;
}
