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

const deferredEphemeral = () => Response.json({ type: 5, data: { flags: EPHEMERAL_FLAG } });

export function handlePost(
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

    const colonIdx = reasonRaw!.indexOf(":");
    const tagId = reasonRaw!.slice(0, colonIdx);
    const tagName = reasonRaw!.slice(colonIdx + 1);
    const publicContent = `Your post **${postTitle}** has been closed and tagged as **${tagName}**.`;

    ctx.waitUntil(
      (async () => {
        if (isThread) {
          const thread = await getChannelInfo(channelId, env.DISCORD_BOT_TOKEN);
          const currentTags = thread?.applied_tags ?? [];
          const appliedTags = currentTags.includes(tagId)
            ? currentTags
            : [...currentTags, tagId];

          const ok = await patchThread(
            channelId,
            { archived: true, applied_tags: appliedTags },
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
          await editInteractionResponse(application_id, token, env.DISCORD_BOT_TOKEN,
            "Post closed and tagged."
          );
        } else {
          await sendFollowup(application_id, token, env.DISCORD_BOT_TOKEN, { content: publicContent });
          await editInteractionResponse(application_id, token, env.DISCORD_BOT_TOKEN, "Done.");
        }
      })()
    );

    return deferredEphemeral();
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

        const publicContent = `Your post **${postTitle}** has been re-opened.`;
        const sent = await sendChannelMessage(channelId, publicContent, env.DISCORD_BOT_TOKEN);

        if (sent) {
          await editInteractionResponse(application_id, token, env.DISCORD_BOT_TOKEN, "Post re-opened.");
        } else {
          await sendFollowup(application_id, token, env.DISCORD_BOT_TOKEN, { content: publicContent });
          await editInteractionResponse(application_id, token, env.DISCORD_BOT_TOKEN, "Done.");
        }
      })()
    );

    return deferredEphemeral();
  }

  return Response.json({
    type: 4,
    data: { content: "Unknown subcommand.", flags: EPHEMERAL_FLAG },
  });
}
