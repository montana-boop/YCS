// Persists the current canonical invite link so `link` can report it and
// `invite --publish` can keep README / other files in sync.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// Where persisted data lives. Set DATA_DIR to a Railway volume mount path so
// data (e.g. birthdays) survives redeploys; defaults to a local ./data folder.
const DATA_DIR = process.env.DATA_DIR || join(ROOT, "data");
const LINK_FILE = join(DATA_DIR, "current-invite.json");
const BIRTHDAY_FILE = join(DATA_DIR, "birthdays.json");

export function readLink() {
  try {
    return JSON.parse(readFileSync(LINK_FILE, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

export function writeLink(record) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(LINK_FILE, JSON.stringify(record, null, 2) + "\n");
  return LINK_FILE;
}

// --- Birthdays --------------------------------------------------------------
// Stored as { "<userId>": { "m": <1-12>, "d": <1-31> }, ... }. Persisted to
// DATA_DIR so it survives restarts (attach a Railway volume for durability).
export function readBirthdays() {
  try {
    return JSON.parse(readFileSync(BIRTHDAY_FILE, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

export function setBirthday(userId, month, day) {
  const all = readBirthdays();
  all[userId] = { m: month, d: day };
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
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

export { LINK_FILE };
