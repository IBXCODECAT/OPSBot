import { getChannelInfo } from "../discord/api.js";
import type { Env } from "../discord/types.js";
import type { APIApplicationCommandAutocompleteInteraction } from "discord-api-types/v10";

export async function handleAutocomplete(
  interaction: APIApplicationCommandAutocompleteInteraction,
  env: Env
): Promise<Response> {
  const empty = Response.json({ type: 8, data: { choices: [] } });

  // Dig into the subcommand to find the focused option
  const subcommand = interaction.data.options?.[0];
  if (!subcommand || !("options" in subcommand)) return empty;

  const focusedOption = subcommand.options?.find((o) => "focused" in o && o.focused);
  const query =
    focusedOption && "value" in focusedOption ? String(focusedOption.value).toLowerCase() : "";

  // Fetch the thread to get the parent forum channel ID
  const threadId = interaction.channel!.id;
  const thread = await getChannelInfo(threadId, env.DISCORD_BOT_TOKEN);
  if (!thread?.parent_id) return empty;

  // Fetch the forum channel's available tags
  const forum = await getChannelInfo(thread.parent_id, env.DISCORD_BOT_TOKEN);
  if (!forum?.available_tags?.length) return empty;

  const choices = forum.available_tags
    .filter((tag) => tag.name.toLowerCase().includes(query))
    .slice(0, 25)
    // Value encodes both id and name so execution can use both without an extra fetch
    .map((tag) => ({ name: tag.name, value: `${tag.id}:${tag.name}` }));

  return Response.json({ type: 8, data: { choices } });
}
