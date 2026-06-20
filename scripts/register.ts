// Run with: DISCORD_BOT_TOKEN=... DISCORD_APPLICATION_ID=... npm run register
// Or define both in a .env file and source it first.

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const APP_ID = process.env.DISCORD_APPLICATION_ID;

if (!TOKEN || !APP_ID) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_APPLICATION_ID environment variables.");
  process.exit(1);
}

const COMMANDS = [
  {
    name: "bugr",
    description: "Manage bug report posts",
    options: [
      {
        name: "close",
        description: "Close a bug report post",
        type: 1,
        options: [
          {
            name: "reason",
            description: "Reason for closing",
            type: 3,
            required: false,
          },
        ],
      },
      {
        name: "open",
        description: "Re-open a bug report post",
        type: 1,
        options: [
          {
            name: "reason",
            description: "Reason for re-opening",
            type: 3,
            required: false,
          },
        ],
      },
    ],
  },
  {
    name: "featr",
    description: "Manage feature request posts",
    options: [
      {
        name: "close",
        description: "Close a feature request post",
        type: 1,
        options: [
          {
            name: "reason",
            description: "Reason for closing",
            type: 3,
            required: false,
          },
        ],
      },
      {
        name: "open",
        description: "Re-open a feature request post",
        type: 1,
        options: [
          {
            name: "reason",
            description: "Reason for re-opening",
            type: 3,
            required: false,
          },
        ],
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
  console.log(`Registered ${data.length} commands successfully.`);
} else {
  const err = await res.json();
  console.error("Discord API error:", JSON.stringify(err, null, 2));
  process.exit(1);
}
