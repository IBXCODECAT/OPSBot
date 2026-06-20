// Registers slash commands with Discord.
// Uses PUT which atomically replaces ALL existing commands — old commands are automatically deleted.
// Run with: npm run register

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const APP_ID = process.env.DISCORD_APPLICATION_ID;

if (!TOKEN || !APP_ID) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_APPLICATION_ID environment variables.");
  process.exit(1);
}

const COMMANDS = [
  {
    name: "post",
    description: "Manage forum posts",
    options: [
      {
        name: "close",
        description: "Close a post",
        type: 1,
        options: [
          {
            name: "reason",
            description: "Select a tag reason for closing",
            type: 3,
            required: true,
            autocomplete: true,
          },
        ],
      },
      {
        name: "open",
        description: "Re-open a post",
        type: 1,
        options: [],
      },
    ],
  },
  {
    name: "faq",
    description: "FAQ management (coming soon)",
    options: [],
  },
];

const url = `https://discord.com/api/v10/applications/${APP_ID}/commands`;

const res = await fetch(url, {
  method: "PUT",
  headers: {
    Authorization: `Bot ${TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(COMMANDS),
});

if (res.ok) {
  const data = (await res.json()) as unknown[];
  console.log(`Registered ${data.length} commands successfully. All previous commands replaced.`);
} else {
  const err = await res.json();
  console.error("Discord API error:", JSON.stringify(err, null, 2));
  process.exit(1);
}
