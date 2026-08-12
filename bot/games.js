// Daily nudge to play Wordle, posted to #daily-games. Finds the channel by name
// so no channel ID/config is needed. Same DST-safe timing as the daily QOTD.

import { tzNow } from "./daily.js";

const WORDLE_URL = "https://www.nytimes.com/games/wordle/index.html";

const MESSAGE = `🟩🟨⬜ wordle o'clock, besties!
today's puzzle 👉 ${WORDLE_URL}
drop your score below (no spoilers 🙈) — how many tries did it take you?`;

export function startGamesScheduler(client, cfg) {
  const channelName = cfg.gamesChannelName;
  const target = cfg.gamesTime; // "HH:MM" in dailyTz
  console.log(`   🎮 Daily games: every day at ${target} ${cfg.dailyTz} → #${channelName}`);

  let lastPostedDate = null;
  const tick = async () => {
    const { time, date } = tzNow(cfg.dailyTz);
    if (time !== target || lastPostedDate === date) return;
    lastPostedDate = date;
    try {
      const guild = client.guilds.cache.get(cfg.guildId);
      const channel = guild?.channels?.cache.find(
        (c) => c.name === channelName && c.isTextBased?.()
      );
      if (!channel) {
        console.error(`   ⚠️ #${channelName} not found — daily game skipped`);
        return;
      }
      await channel.send({ content: MESSAGE, allowedMentions: { parse: [] } });
      console.log("   ✅ Posted daily wordle nudge");
    } catch (err) {
      console.error(`   ⚠️ Daily game post failed: ${err.message}`);
    }
  };
  setInterval(tick, 30_000);
  tick();
}
