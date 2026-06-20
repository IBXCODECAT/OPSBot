import { sendFollowup } from "../discord/api.js";
import { AUTHORIZED_ROLE_ID, EPHEMERAL_FLAG } from "../constants.js";
import type { Env } from "../discord/types.js";
import type {
  APIChatInputApplicationCommandInteraction,
  APIApplicationCommandInteractionDataSubcommandOption,
} from "discord-api-types/v10";
import { ApplicationCommandOptionType } from "discord-api-types/v10";

export function handleBugr(
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

  const reasonOption = subcommand?.options?.find(
    (o) => o.name === "reason" && o.type === ApplicationCommandOptionType.String
  );
  const reason = reasonOption && "value" in reasonOption ? String(reasonOption.value) : undefined;
  const reasonSuffix = reason ? ` due to **${reason}**` : "";
  const postTitle = interaction.channel?.name ?? "Unknown Post";

  let publicContent: string;
  if (subName === "close") {
    publicContent = `Your bug report **${postTitle}** has been closed${reasonSuffix}.`;
  } else if (subName === "open") {
    publicContent = `Your bug report **${postTitle}** has been re-opened${reasonSuffix}.`;
  } else {
    return Response.json({
      type: 4,
      data: { content: "Unknown subcommand.", flags: EPHEMERAL_FLAG },
    });
  }

  ctx.waitUntil(
    sendFollowup(interaction.application_id, interaction.token, env.DISCORD_BOT_TOKEN, {
      content:
        "Remember: tags still need to be applied to the post and it will need to be manually closed.",
      flags: EPHEMERAL_FLAG,
    })
  );

  return Response.json({ type: 4, data: { content: publicContent } });
}
