import { EmbedBuilder } from "discord.js";
import type { Command } from "../types/Command";

export default {
    name: "ping",
    aliases: ['p'],

    run(client, message, args) {
        const Latency = Date.now() - message.createdTimestamp;

        const Embed = new EmbedBuilder();
        Embed.setTitle("Pong! 🏓")
        Embed.setDescription(`Latency: ${Latency}ms`)
        Embed.setColor("Green")
        Embed.setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
        Embed.setTimestamp();
      
        message.reply({ embeds: [Embed] });
    },
} as Command;