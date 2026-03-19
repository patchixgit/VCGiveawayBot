/* Copyright (c) 2026 Patware LLC. All rights reserved. */
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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