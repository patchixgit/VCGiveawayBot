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

import { EmbedBuilder, VoiceChannel, TextChannel } from "discord.js";
import type { Command } from "../types/Command";
import config from "../config.json";
import { RouletteGame } from "../utils/game";

export default {
  name: "start-game",
  aliases: ["sg"],

  async run(client, message, args) {
    // Check perms

    const hasUserPerms = (config.StartGamePerms.UserIds as string[]).includes(
      message.author.id,
    );
    const hasRolePerms = message.member?.roles.cache.some((role) =>
      (config.StartGamePerms.RoleIds as string[]).includes(role.id),
    );

    if (!hasUserPerms && !hasRolePerms) {
      message.reply(
        "You don't have permission to start a game. Please contact an administrator if you think this is a mistake.",
      );
      return;
    }

    // Check active game

    if (client.game?.active) {
      message.reply(
        "A game is already active. Please wait for it to finish before starting a new one.",
      );
      return;
    }

    // not sure if this will ever be useful, but typescript wants it so

    if (!message.guild) {
      message.reply(
        "This command can only be run in guilds (discord Servers).",
      );
      return;
    }

    // get the channels from the config

    const voiceChannel = message.guild?.channels.cache.get(
      config.vcChannelId,
    ) as VoiceChannel;
    const textChannel = message.guild?.channels.cache.get(
      config.txtChannelId,
    ) as TextChannel;

    // verify the types of the channel

    if (!voiceChannel.isVoiceBased() || !textChannel.isTextBased()) {
      message.reply(
        "The configured channels are not valid text or voice channels.",
      );
      message.reply("Please edit your config.json file to fix this issue.");
      return;
    }

    // create a new game instance, assign it to the client

    const game = new RouletteGame(
      client,
      message.guild,
      message.channel as TextChannel,
    );

    // assign our channel instances to the game so it can use them later

    game.voiceChannel = voiceChannel;
    game.textChannel = textChannel;

    // set the game instance to the client so other commands and events can access it

    client.game = game;
  },
} as Command;
