import { verifyDiscordRequest } from "./discord/verify.js";
import { handleBugr } from "./commands/bugr.js";
import { handleFeatr } from "./commands/featr.js";
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
      const ac = interaction as APIApplicationCommandAutocompleteInteraction;
      return handleAutocomplete(ac, env);
    }

    if (interaction.type === InteractionType.ApplicationCommand && interaction.data) {
      const cmd = interaction as APIChatInputApplicationCommandInteraction;
      const { name } = cmd.data;

      if (name === "bugr") return handleBugr(cmd, env, ctx);
      if (name === "featr") return handleFeatr(cmd, env, ctx);
      if (name === "faq") return handleFaq(cmd, env, ctx);
    }

    return new Response("Unknown interaction", { status: 400 });
  },
};
