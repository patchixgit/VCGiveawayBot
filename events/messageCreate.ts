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

import { Events, Message } from "discord.js";
import { VCGiveawayBotClient } from "../types/Client";
import { BotEvent } from "../types/BotEvent";

export default {
  name: Events.MessageCreate,

  run: async (client: VCGiveawayBotClient, message: Message) => {
    if (message.author.bot) return;

    if (
      !message.content ||
      (message.content === "" && !message.attachments.size)
    ) {
      // most likely you need to enable the gateway bit, warn the bot owner about it
      console.warn(
        "Received a message without content or attachments. This may be due to missing the MessageContent intent. Please ensure that the MessageContent intent is enabled in your bot's settings and that you have included it in your client's intents.",
      );
      return;
    }

    if (!message.content.startsWith(process.env.BOT_PREFIX!)) return;

    const args = message.content
      .slice(process.env.BOT_PREFIX!.length)
      .trim()
      .split(/ +/g);

    const commandName = args.shift()!.toLowerCase();

    if (!client.commands.has(commandName)) {
      // aliases are handled by loading an alias as its own command, so it should work fine
      return;
    }

    const command = client.commands.get(commandName)!;

    try {
      const result = await command.run(client, message, args);

      if (typeof result === "string") {
        return message.reply({
          content: result,
        });
      }
    } catch (err) {
      console.error(`Error executing command ${commandName}:`, err);
    }
  },
} as BotEvent;
