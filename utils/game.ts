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

import {
  Guild,
  GuildMember,
  Snowflake,
  TextChannel,
  VoiceChannel,
  VoiceState,
} from "discord.js";

import { VCGiveawayBotClient } from "../types/Client";
import crypto from "node:crypto";
import Configs from "../config.json";
import { Player } from "../types/Player";
import { getRandomNumber } from "./rng";

export class RouletteGame {
  private readonly client: VCGiveawayBotClient;
  private readonly initializingChannel: TextChannel;
  private readonly currentGuild: Guild;

  public active: boolean = false;
  public participants: Map<Snowflake, Player> = new Map();
  public pendingStart: boolean = false;

  private vcChannel: VoiceChannel | null;
  private txtChannel: TextChannel | null;

  constructor(
    client: VCGiveawayBotClient,
    guild: Guild,
    initializingChannel: TextChannel,
  ) {
    this.client = client;
    this.currentGuild = guild;
    this.initializingChannel = initializingChannel;

    this.vcChannel = null;
    this.txtChannel = null;

    this.active = false;
  }

  // Mutators
  set voiceChannel(voiceChannel: VoiceChannel) {
    if (this.vcChannel)
      throw new Error(
        "Cannot assign voiceChannelInstance after initialization.",
      );
    this.vcChannel = voiceChannel;
  }

  set textChannel(textChannel: TextChannel) {
    if (this.txtChannel)
      throw new Error(
        "Cannot assign textChannelInstance after initialization.",
      );
    this.txtChannel = textChannel;
  }

  // Accessors
  get voiceChannel(): VoiceChannel | null {
    return this.vcChannel;
  }

  get textChannel(): TextChannel | null {
    return this.txtChannel;
  }

  // Methods
  async addParticipant(user: GuildMember): Promise<boolean> {
    if (Configs.BlacklistedUserIds.includes(user.id)) {
      this.textChannel?.send({
        content: `<@${user.id}> attempted to join, but they are blacklisted from participating in the game.`,
      });
      return false;
    }

    const existing = this.participants.get(user.id);

    if (existing) {
      if (existing.eliminated && !this.active) {
        existing.eliminated = false;
        existing.joinedAtDate = new Date();
        this.textChannel?.send({
          content: `[Re-Join] <@${user.id}> has re-joined the game!`,
        });
        return true;
      } else {
        if (!existing.user.permissions.has("Administrator")) {
          this.vcChannel?.members
            .get(user.id)
            ?.voice.disconnect("Player attempted to rejoin after elimination.");
        }
        return false;
      }
    }

    if (this.active) {
      this.textChannel?.send({
        content: `<@${user.id}> attempted to join, but the game is already active.`,
      });
      return false;
    }

    const newParticipant: Player = {
      id: user.id,
      eliminated: false,
      user: user,
      joinedAtDate: new Date(),
    };

    this.participants.set(user.id, newParticipant);
    this.textChannel?.send({
      content: `[Join] <@${user.id}> has joined the game!`,
    });
    return true;
  }

  public async onVoiceUpdate(oldState: VoiceState, newState: VoiceState) {
    if (oldState.channelId === this.vcChannel?.id && this.active) {
      const participant = this.participants.get(oldState.id);
      if (participant) {
        participant.eliminated = true;
        this.textChannel?.send({
          content: `<@${oldState.id}> has been eliminated for leaving the voice channel!`,
        });
      }
    } else if (newState.channelId === this.vcChannel?.id && !this.active) {
      const member = newState.member;
      if (member instanceof GuildMember) {
        const succ = await this.addParticipant(member);
        if (!succ) console.warn(`Failed to add participant: ${member.id}`);
      }
    } else if (newState.channelId === this.vcChannel?.id && this.active) {
      this.vcChannel?.members
        .get(newState.id)
        ?.voice.disconnect("Player attempted to join during an active game.");
    }
  }

  public async startGame() {
    if (this.pendingStart) throw new Error("Game is already pending start.");
    if (this.active) throw new Error("The game is already active.");
    if (!this.vcChannel || !this.txtChannel)
      throw new Error(
        "Voice and Text channels must be assigned before starting the game.",
      );

    this.pendingStart = true;

    setTimeout(() => {
      this.active = true;
      this.pendingStart = false;
      this.txtChannel?.send({
        content: `The game has started with ${this.participants.size} participants!`,
      });
      this._startGame();
    }, Configs.timeToJoin);
  }

  private async _startGame() {
    if (this.participants.size < 5) {
      this.txtChannel?.send({
        content: `Not enough participants joined the game. Minimum 5 required. Ending game...`,
      });
      this.active = false;
      this.participants.clear();
      return;
    }

    const ranking: Player[] = [];

    while (this.active) {
      let aliveParticipants = Array.from(this.participants.values()).filter(
        (p) => !p.eliminated,
      );

      if (aliveParticipants.length <= 3) {
        aliveParticipants.forEach((p) => {
          if (!ranking.includes(p)) ranking.unshift(p); // Insert at start so 1st place ends up last
        });

        // Announce Top 3
        const top3 = ranking.slice(0, 3).reverse(); // 3->2->1
        const contentLines = top3.map(
          (p, idx) => `${idx + 1}. <@${p.user.id}>`,
        );
        this.txtChannel?.send({
          content: `🏆 Top 3 Players:\n${contentLines.join("\n")}`,
        });

        this.active = false;
        this.participants.clear();
        break;
      }

      // Shuffle alive participants
      for (let i = aliveParticipants.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        // @ts-ignore - we know these are alive participants so they can't be undefined
        [aliveParticipants[i], aliveParticipants[j]] = [
          aliveParticipants[j],
          aliveParticipants[i],
        ];
      }

      // eliminate
      const idx = getRandomNumber(0, aliveParticipants.length - 1);
      const playerToEliminate = aliveParticipants[idx]!;
      playerToEliminate.eliminated = true;
      this.txtChannel?.send({
        content: `<@${playerToEliminate.id}> has been eliminated!`,
      });

      // Prepend to ranking (so 1st place ends up last)
      ranking.unshift(playerToEliminate);

      await new Promise((resolve) =>
        setTimeout(resolve, Configs.eliminationPassWaitTime),
      );
    }
  }
}
