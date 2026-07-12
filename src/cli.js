#!/usr/bin/env node
// YCS Discord toolkit — command-line entry point.
//
// Usage:
//   npm run whoami
//   npm run blast   -- --message "text" [--title "T"] [--channel ID] [--mention @everyone] [--webhook]
//   npm run discuss -- --name "Topic"   [--message "opener"] [--channel ID] [--forum]
//   npm run invite  -- [--channel ID] [--max-age 0] [--max-uses 0] [--publish README.md]
//   npm run link

import { whoami, blast, discuss, invite, link } from "./commands.js";

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        args[key] = true; // boolean flag
      } else {
        args[key] = next;
        i++;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}
function out(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

const HELP = `YCS Discord toolkit

Commands:
  whoami                       Verify the bot token and show the bot identity.
  blast    --message "..."     Send an announcement to a channel.
             [--title "..."] [--channel ID] [--mention @everyone] [--webhook]
  discuss  --name "Topic"      Start a discussion thread (or --forum post).
             [--message "opener"] [--channel ID] [--forum]
  invite   [--channel ID]      Create/refresh a permanent invite link.
             [--max-age SECONDS] [--max-uses N] [--publish README.md]
  link                         Show the current stored invite link.

Global config comes from .env (see .env.example). Pass flags after the
npm "--" separator, e.g.:  npm run blast -- --message "We are live!"`;

async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  const cmd = args._[0];

  try {
    switch (cmd) {
      case "whoami": {
        const me = await whoami();
        ok(`Bot connected as ${me.tag} (id ${me.id})`);
        break;
      }
      case "blast": {
        const res = await blast({
          channel: typeof args.channel === "string" ? args.channel : undefined,
          title: typeof args.title === "string" ? args.title : undefined,
          message: typeof args.message === "string" ? args.message : undefined,
          mention: typeof args.mention === "string" ? args.mention : undefined,
          useWebhook: !!args.webhook,
        });
        ok(`Blast sent via ${res.via} (message ${res.messageId} in channel ${res.channelId}).`);
        break;
      }
      case "discuss": {
        const res = await discuss({
          channel: typeof args.channel === "string" ? args.channel : undefined,
          name: typeof args.name === "string" ? args.name : undefined,
          message: typeof args.message === "string" ? args.message : undefined,
          forum: !!args.forum,
        });
        ok(`Discussion "${res.name}" started (${res.type}, thread ${res.threadId}).`);
        break;
      }
      case "invite": {
        const res = await invite({
          channel: typeof args.channel === "string" ? args.channel : undefined,
          maxAge: args["max-age"] !== undefined ? args["max-age"] : 0,
          maxUses: args["max-uses"] !== undefined ? args["max-uses"] : 0,
          publish: typeof args.publish === "string" ? args.publish : undefined,
        });
        ok(`Invite ready: ${res.url}`);
        if (res.published.length) ok(`Published to: ${res.published.join(", ")}`);
        console.log(`   (stored in ${res.storedAt})`);
        break;
      }
      case "link": {
        const res = link();
        if (res.url) {
          ok(`Current invite: ${res.url}`);
          out(res);
        } else {
          console.log(res.message);
        }
        break;
      }
      case undefined:
      case "help":
      case "--help":
      case "-h":
        console.log(HELP);
        break;
      default:
        console.error(`Unknown command: ${cmd}\n`);
        console.log(HELP);
        process.exitCode = 1;
    }
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exitCode = 1;
  }
}

main();
