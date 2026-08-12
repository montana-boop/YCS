// Self-assign role menu for #get-your-roles.
// `/setup-roles` creates any missing roles and posts select menus; members pick
// their roles and the handler toggles them. Region/interest/event roles are made
// mentionable so people can be pinged (e.g. "@USA besties, meetup?").

import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";

const BRAND = 0xd8283f;

// group key → { label, placeholder, mentionable, options: [{ name }] }
export const ROLE_GROUPS = {
  pronouns: {
    label: "Pronouns",
    placeholder: "your pronouns",
    mentionable: false,
    options: [{ name: "she/her" }, { name: "they/them" }, { name: "he/him" }, { name: "ask me" }],
  },
  age: {
    label: "Age",
    placeholder: "your age range",
    mentionable: false,
    options: [{ name: "20s" }, { name: "30s" }, { name: "40s" }, { name: "50+" }],
  },
  region: {
    label: "Region",
    placeholder: "where you are (for meetups)",
    mentionable: true,
    options: [
      { name: "USA" },
      { name: "Canada" },
      { name: "Mexico" },
      { name: "Latin America" },
      { name: "UK & Ireland" },
      { name: "Europe" },
      { name: "Middle East" },
      { name: "Africa" },
      { name: "Asia" },
      { name: "Australia & Oceania" },
    ],
  },
  interests: {
    label: "Interests",
    placeholder: "what you're into",
    mentionable: true,
    options: [
      { name: "solo travel" },
      { name: "pets" },
      { name: "entertainment" },
      { name: "work & career" },
      { name: "fitness" },
      { name: "books" },
      { name: "food & cooking" },
    ],
  },
  events: {
    label: "Event pings",
    placeholder: "get pinged for online events",
    mentionable: true,
    options: [
      { name: "coworking" },
      { name: "game night" },
      { name: "movie night" },
      { name: "hangout" },
    ],
  },
  meetups: {
    label: "Live group events",
    placeholder: "get pinged for in-person meetups",
    mentionable: true,
    options: [{ name: "local meetups" }],
  },
};

// Create any roles that don't exist yet.
export async function ensureRoles(guild) {
  await guild.roles.fetch();
  for (const g of Object.values(ROLE_GROUPS)) {
    for (const o of g.options) {
      const exists = guild.roles.cache.find((r) => r.name === o.name);
      if (!exists) {
        await guild.roles.create({
          name: o.name,
          mentionable: g.mentionable,
          reason: "Single Besties self-assign role",
        });
      }
    }
  }
}

// Build the menu messages (Discord allows max 5 select rows per message).
export function buildMenus() {
  const rows = Object.entries(ROLE_GROUPS).map(([key, g]) =>
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`roles:${key}`)
        .setPlaceholder(g.placeholder)
        .setMinValues(0)
        .setMaxValues(g.options.length)
        .addOptions(g.options.map((o) => ({ label: o.name, value: o.name })))
    )
  );

  const intro = new EmbedBuilder()
    .setColor(BRAND)
    .setTitle("🍒 get your roles")
    .setDescription(
      "pick as many as you like — this is how you find your people, get pinged for stuff you care about, and skip what you don't. change them anytime."
    );

  const messages = [{ embeds: [intro], components: rows.slice(0, 5) }];
  if (rows.length > 5) {
    messages.push({ content: "…and a couple more:", components: rows.slice(5) });
  }
  return messages;
}

// Toggle a member's roles for one group based on their selection.
export async function handleRoleSelect(interaction) {
  const group = interaction.customId.split(":")[1];
  const g = ROLE_GROUPS[group];
  if (!g) return;
  const { guild, member } = interaction;
  const selected = new Set(interaction.values);
  const add = [];
  const remove = [];
  for (const o of g.options) {
    const role = guild.roles.cache.find((r) => r.name === o.name);
    if (!role) continue;
    const has = member.roles.cache.has(role.id);
    if (selected.has(o.name) && !has) add.push(role.id);
    if (!selected.has(o.name) && has) remove.push(role.id);
  }
  if (add.length) await member.roles.add(add, "self-assign via role menu");
  if (remove.length) await member.roles.remove(remove, "self-assign via role menu");
  await interaction.reply({
    content: `updated your ${g.label.toLowerCase()} 🍒`,
    flags: MessageFlags.Ephemeral,
  });
}
