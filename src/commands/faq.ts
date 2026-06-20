import { MANAGE_MESSAGES_BIT, EPHEMERAL_FLAG } from "../constants.js";
import type { Env } from "../discord/types.js";
import type { APIChatInputApplicationCommandInteraction } from "discord-api-types/v10";

export function handleFaq(
  interaction: APIChatInputApplicationCommandInteraction,
  _env: Env,
  _ctx: ExecutionContext
): Response {
  const perms = interaction.member?.permissions ?? "0";
  const hasPermission = (BigInt(perms) & MANAGE_MESSAGES_BIT) !== 0n;

  if (!hasPermission) {
    return Response.json({
      type: 4,
      data: { content: "You are not authorized.", flags: EPHEMERAL_FLAG },
    });
  }

  return Response.json({
    type: 4,
    data: { content: "FAQ command — coming soon!", flags: EPHEMERAL_FLAG },
  });
}
