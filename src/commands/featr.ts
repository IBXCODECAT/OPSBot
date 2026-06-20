import {
  sendChannelMessage,
  sendFollowup,
  editInteractionResponse,
  patchThread,
  getChannelInfo,
} from "../discord/api.js";
import { AUTHORIZED_ROLE_ID, EPHEMERAL_FLAG } from "../constants.js";
import type { Env } from "../discord/types.js";
import type {
  APIChatInputApplicationCommandInteraction,
  APIApplicationCommandInteractionDataSubcommandOption,
} from "discord-api-types/v10";
import { ApplicationCommandOptionType, ChannelType } from "discord-api-types/v10";

const THREAD_TYPES = [
  ChannelType.PublicThread,
  ChannelType.PrivateThread,
  ChannelType.AnnouncementThread,
];

const DEFERRED_EPHEMERAL = Response.json({ type: 5, data: { flags: EPHEMERAL_FLAG } });

export function handleFeatr(
  interaction: APIChatInputApplicationCommandInteraction,
  env: Env,
  ctx: ExecutionContext
): Response {
  const roles = interaction.member?.roles ?? [];
  if (!roles.includes(AUTHORIZED_ROLE_ID)) {
    return Response.json({
      type: 4,
      data: { content: "You are not authorized.", flags: EPHEMERAL_FLAG },
    });
  }

  const subcommand = interaction.data.options?.[0] as
    | APIApplicationCommandInteractionDataSubcommandOption
    | undefined;
  const subName = subcommand?.name;
  const postTitle = interaction.channel?.name ?? "Unknown Post";
  const isThread = THREAD_TYPES.includes(interaction.channel?.type as ChannelType);
  const channelId = interaction.channel!.id;
  const { application_id, token } = interaction;

  if (subName === "close") {
    const reasonOption = subcommand?.options?.find(
      (o) => o.name === "reason" && o.type === ApplicationCommandOptionType.String
    );
    const reasonRaw =
      reasonOption && "value" in reasonOption ? String(reasonOption.value) : undefined;

    let tagId: string | undefined;
    let tagName: string | undefined;
    if (reasonRaw) {
      const colonIdx = reasonRaw.indexOf(":");
      if (colonIdx > 0) {
        tagId = reasonRaw.slice(0, colonIdx);
        tagName = reasonRaw.slice(colonIdx + 1);
      } else {
        tagName = reasonRaw;
      }
    }

    const reasonSuffix = tagName ? ` due to **${tagName}**` : "";
    const publicContent = `Your feature request **${postTitle}** has been closed${reasonSuffix}.`;

    ctx.waitUntil(
      (async () => {
        if (isThread) {
          const thread = tagId ? await getChannelInfo(channelId, env.DISCORD_BOT_TOKEN) : null;
          const currentTags = thread?.applied_tags ?? [];
          const appliedTags = tagId
            ? currentTags.includes(tagId)
              ? currentTags
              : [...currentTags, tagId]
            : currentTags;

          const ok = await patchThread(
            channelId,
            { archived: true, ...(appliedTags.length ? { applied_tags: appliedTags } : {}) },
            env.DISCORD_BOT_TOKEN
          );

          if (!ok) {
            await editInteractionResponse(application_id, token, env.DISCORD_BOT_TOKEN,
              "Could not close the post due to missing permissions. No changes were made."
            );
            return;
          }
        }

        const sent = await sendChannelMessage(channelId, publicContent, env.DISCORD_BOT_TOKEN);

        if (sent) {
          const ack = tagId
            ? "Post closed and tagged."
            : "Post closed. Remember to apply tags.";
          await editInteractionResponse(application_id, token, env.DISCORD_BOT_TOKEN, ack);
        } else {
          await sendFollowup(application_id, token, env.DISCORD_BOT_TOKEN, {
            content: publicContent,
          });
          const ack = tagId
            ? "Done."
            : "Remember: tags still need to be applied to the post.";
          await editInteractionResponse(application_id, token, env.DISCORD_BOT_TOKEN, ack);
        }
      })()
    );

    return DEFERRED_EPHEMERAL;
  }

  if (subName === "open") {
    ctx.waitUntil(
      (async () => {
        if (isThread) {
          const ok = await patchThread(channelId, { archived: false }, env.DISCORD_BOT_TOKEN);
          if (!ok) {
            await editInteractionResponse(application_id, token, env.DISCORD_BOT_TOKEN,
              "Could not re-open the post due to missing permissions. No changes were made."
            );
            return;
          }
        }

        const publicContent = `Your feature request **${postTitle}** has been re-opened.`;
        const sent = await sendChannelMessage(channelId, publicContent, env.DISCORD_BOT_TOKEN);

        if (sent) {
          await editInteractionResponse(application_id, token, env.DISCORD_BOT_TOKEN, "Post re-opened.");
        } else {
          await sendFollowup(application_id, token, env.DISCORD_BOT_TOKEN, { content: publicContent });
          await editInteractionResponse(application_id, token, env.DISCORD_BOT_TOKEN, "Done.");
        }
      })()
    );

    return DEFERRED_EPHEMERAL;
  }

  return Response.json({
    type: 4,
    data: { content: "Unknown subcommand.", flags: EPHEMERAL_FLAG },
  });
}
