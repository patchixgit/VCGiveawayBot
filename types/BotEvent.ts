import { ClientEvents } from "discord.js";
import { VCGiveawayBotClient } from "./Client";

export type BotEvent = {
  name: keyof ClientEvents;
  once?: boolean;
  run: (client: VCGiveawayBotClient, ...args: any[]) => Promise<void>;
};
