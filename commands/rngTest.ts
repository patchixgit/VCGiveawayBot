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
import { getRandomNumber } from "../utils/rng";

export default {
  name: "test-rng",
  aliases: ["trng"],

  async run(client, message, args) {
    
    let [min = 1, max = 100, passes = 1000] = args.map(Number);
    
    if (passes > 1_000_000) {
        return 'That is a bit excessive for just a simple test, please tone down the number of passes.'
    }

    const num = getRandomNumber(min, max, passes);


    const Embed = new EmbedBuilder();
    Embed.setTitle("RNG Test")
    Embed.setDescription(`Generated number between ${min} and ${max}: **${num}**`)
    Embed.setColor("Blue")
    Embed.setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
    Embed.setTimestamp();

    message.reply({ embeds: [Embed] });
    return;

  },
} as Command;
