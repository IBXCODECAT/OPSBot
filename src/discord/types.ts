export interface Env {
  DISCORD_PUBLIC_KEY: string;
  DISCORD_BOT_TOKEN: string;
  DISCORD_APPLICATION_ID: string;
}

// Re-export the Discord API types we use throughout the codebase
export type {
  APIInteraction,
  APIChatInputApplicationCommandInteraction,
  APIApplicationCommandInteractionDataSubcommandOption,
  APIApplicationCommandInteractionDataStringOption,
} from "discord-api-types/v10";

export { InteractionType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
