import { sendChannelMessage, sendFollowup, editInteractionResponse } from "../discord/api.js";
import {
  MANAGE_MESSAGES_BIT,
  EPHEMERAL_FLAG,
  BUG_REPORT_CHANNEL_ID,
  FEATURE_REQUEST_CHANNEL_ID,
} from "../constants.js";
import type { Env } from "../discord/types.js";
import type {
  APIChatInputApplicationCommandInteraction,
  APIApplicationCommandInteractionDataSubcommandOption,
} from "discord-api-types/v10";

const FAQ: Record<string, string> = {
  "release-date":
    "**When is Orbital Physics Simulator releasing?**\nOrbital Physics Simulator is set to release on **June 23rd, 2026**.",

  platforms:
    "**What platforms will Orbital Physics Simulator support?**\nOrbital Physics Simulator will be available on **Windows 10/11** and **Linux**. Steam Deck is not officially supported at launch, but may be possible.",

  updates:
    "**How often will the game receive updates?**\nUpdates will be released **when they are ready**. We prioritize quality over a fixed schedule.",

  "report-bug":
    `**How do I report a bug?**\nFound a bug? Head over to <#${BUG_REPORT_CHANNEL_ID}> and create a new post. Please include steps to reproduce, your system specs, and any screenshots or logs if possible.`,

  "request-feature":
    `**How do I request a feature?**\nHave an idea? Share it in <#${FEATURE_REQUEST_CHANNEL_ID}> by creating a new post. Describe your suggestion clearly and explain why it would improve the game.`,
};

export function handleFaq(
  interaction: APIChatInputApplicationCommandInteraction,
  env: Env,
  ctx: ExecutionContext
): Response {
  const perms = interaction.member?.permissions ?? "0";
  const hasPermission = (BigInt(perms) & MANAGE_MESSAGES_BIT) !== 0n;

  if (!hasPermission) {
    return Response.json({
      type: 4,
      data: { content: "You are not authorized.", flags: EPHEMERAL_FLAG },
    });
  }

  const subcommand = interaction.data.options?.[0] as
    | APIApplicationCommandInteractionDataSubcommandOption
    | undefined;
  const content = FAQ[subcommand?.name ?? ""];

  if (!content) {
    return Response.json({
      type: 4,
      data: { content: "Unknown FAQ topic.", flags: EPHEMERAL_FLAG },
    });
  }

  const channelId = interaction.channel!.id;
  const { application_id, token } = interaction;

  ctx.waitUntil(
    (async () => {
      const sent = await sendChannelMessage(channelId, content, env.DISCORD_BOT_TOKEN);
      if (sent) {
        await editInteractionResponse(application_id, token, env.DISCORD_BOT_TOKEN, "FAQ sent.");
      } else {
        await sendFollowup(application_id, token, env.DISCORD_BOT_TOKEN, { content });
        await editInteractionResponse(application_id, token, env.DISCORD_BOT_TOKEN, "Done.");
      }
    })()
  );

  return Response.json({ type: 5, data: { flags: EPHEMERAL_FLAG } });
}
