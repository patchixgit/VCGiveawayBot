import { Client, Collection } from "discord.js";
import { Command } from "./Command";

export interface VCGiveawayBotClient extends Client {
  commands: Collection<string, Command>;
}
