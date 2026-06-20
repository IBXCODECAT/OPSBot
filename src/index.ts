import { verifyDiscordRequest } from "./discord/verify.js";
import { handlePost } from "./commands/post.js";
import { handleFaq } from "./commands/faq.js";
import { handleAutocomplete } from "./commands/autocomplete.js";
import type { Env } from "./discord/types.js";
import type {
  APIInteraction,
  APIChatInputApplicationCommandInteraction,
  APIApplicationCommandAutocompleteInteraction,
} from "discord-api-types/v10";
import { InteractionType } from "discord-api-types/v10";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { valid, body } = await verifyDiscordRequest(request, env.DISCORD_PUBLIC_KEY);
    if (!valid) {
      return new Response("Invalid request signature", { status: 401 });
    }

    const interaction = JSON.parse(body) as APIInteraction;

    if (interaction.type === InteractionType.Ping) {
      return Response.json({ type: 1 });
    }

    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      return handleAutocomplete(interaction as APIApplicationCommandAutocompleteInteraction, env);
    }

    if (interaction.type === InteractionType.ApplicationCommand && interaction.data) {
      const cmd = interaction as APIChatInputApplicationCommandInteraction;
      const { name } = cmd.data;

      if (name === "post") return handlePost(cmd, env, ctx);
      if (name === "faq") return handleFaq(cmd, env, ctx);
    }

    return new Response("Unknown interaction", { status: 400 });
  },
};
