// Persists the current canonical invite link so `link` can report it and
// `invite --publish` can keep README / other files in sync.

import { readFileSync, writeFileSync, mkdirSync, accessSync, constants } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Where persisted data lives. Set DATA_DIR to a Railway volume mount path so
// data (e.g. birthdays) survives redeploys; defaults to a local ./data folder.
// If the configured dir can't be created or written (bad mount, permissions),
// fall back to the local folder and say so loudly — never crash the bot.
function resolveDataDir() {
  const local = join(ROOT, "data");
  const candidates = process.env.DATA_DIR ? [process.env.DATA_DIR, local] : [local];
  for (const dir of candidates) {
    try {
      mkdirSync(dir, { recursive: true });
      accessSync(dir, constants.R_OK | constants.W_OK);
      return dir;
    } catch (err) {
      console.error(`   ⚠️ Data dir "${dir}" not usable (${err.code || err.message}) — trying fallback.`);
    }
  }
  return local;
}

const DATA_DIR = resolveDataDir();
const LINK_FILE = join(DATA_DIR, "current-invite.json");
const BIRTHDAY_FILE = join(DATA_DIR, "birthdays.json");

// Read + parse a JSON file; missing or unreadable → the fallback value.
function readJSON(file, fallback) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") console.error(`   ⚠️ Could not read ${file}: ${err.message}`);
    return fallback;
  }
}

export function readLink() {
  return readJSON(LINK_FILE, null);
}

export function writeLink(record) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(LINK_FILE, JSON.stringify(record, null, 2) + "\n");
  return LINK_FILE;
}

// --- Birthdays --------------------------------------------------------------
// Stored as { "<userId>": { "m": <1-12>, "d": <1-31> }, ... }. Persisted to
// DATA_DIR so it survives restarts (attach a Railway volume for durability).
export function readBirthdays() {
  return readJSON(BIRTHDAY_FILE, {});
}

export function setBirthday(userId, month, day) {
  const all = readBirthdays();
  all[userId] = { m: month, d: day };
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(BIRTHDAY_FILE, JSON.stringify(all, null, 2) + "\n");
  return all[userId];
}

// Replaces the invite URL inside a marked block in a text file. The block is
// delimited by <!-- ycs:invite --> ... <!-- /ycs:invite --> so publishing is
// idempotent and safe to run repeatedly.
export function publishToFile(filePath, url) {
  const START = "<!-- ycs:invite -->";
  const END = "<!-- /ycs:invite -->";
  let content = "";
  try {
    content = readFileSync(filePath, "utf8");
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  const block = `${START}\n${url}\n${END}`;
  if (content.includes(START) && content.includes(END)) {
    const re = new RegExp(`${START}[\\s\\S]*?${END}`);
    content = content.replace(re, block);
  } else {
    content = content ? `${content.trimEnd()}\n\n${block}\n` : `${block}\n`;
  }
  writeFileSync(filePath, content);
  return filePath;
}

export { LINK_FILE, DATA_DIR };
