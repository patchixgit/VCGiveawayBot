import { Events } from "discord.js";
import { VCGiveawayBotClient } from "../types/Client";

export default {
  name: Events.ClientReady,

  run: (client: VCGiveawayBotClient) => {
    console.log(`Logged in as ${client.user?.tag}!`);
  },
};
