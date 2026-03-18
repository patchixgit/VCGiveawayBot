import { Client, Message } from "discord.js";

export interface Command {
    name: string;
    aliases: string[];
    run: (client: Client, message: Message, args: string[]) => Promise<void>;
};