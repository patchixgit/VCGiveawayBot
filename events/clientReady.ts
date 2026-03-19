import { Events } from "discord.js";
import { VCGiveawayBotClient } from "../types/Client";
import { BotEvent } from "../types/BotEvent";

export default {
  name: Events.ClientReady,

  run: (client: VCGiveawayBotClient) => {
    console.log(`Logged in as ${client.user?.tag}!`);
  },
} as BotEvent;