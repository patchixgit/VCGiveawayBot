/* Copyright (c) 2026 Patware LLC. All rights reserved. */
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
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
  public pendingStart: boolean = false;
  public joinPeriodOpen: boolean = false; // join period
  public participants: Map<Snowflake, Player> = new Map();

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

  private canJoin(): boolean {
    return !this.active && this.joinPeriodOpen;
  }

  public async addParticipant(user: GuildMember): Promise<boolean> {
    if (Configs.BlacklistedUserIds.includes(user.id)) {
      this.txtChannel?.send({
        content: `<@${user.id}> attempted to join, but they are blacklisted from participating in the game.`,
      });
      return false;
    }

    const existing = this.participants.get(user.id);

    if (existing) {
      if (existing.eliminated && this.canJoin()) {
        existing.eliminated = false;
        existing.joinedAtDate = new Date();
        this.txtChannel?.send({
          content: `[Re-Join] <@${user.id}> has re-joined the game!`,
        });
        return true;
      } else {
        return false;
      }
    }

    if (!this.canJoin()) {
      this.txtChannel?.send({
        content: `<@${user.id}> attempted to join, but the join period has ended.`,
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
    this.txtChannel?.send({
      content: `[Join] <@${user.id}> has joined the game!`,
    });
    return true;
  }

  public async onVoiceUpdate(oldState: VoiceState, newState: VoiceState) {
    // Leaving after game started → eliminate
    if (oldState.channelId === this.vcChannel?.id && this.active) {
      const participant = this.participants.get(oldState.id);
      if (participant && !participant.eliminated) {
        participant.eliminated = true;
        this.txtChannel?.send({
          content: `<@${oldState.id}> has been eliminated for leaving the voice channel!`,
        });
      }
    }

    // Leaving during join period → just announce
    else if (
      oldState.channelId === this.vcChannel?.id &&
      !this.active &&
      this.joinPeriodOpen
    ) {
      const participant = this.participants.get(oldState.id);
      if (participant) {
        this.txtChannel?.send({
          content: `<@${oldState.id}> has left the voice channel during the join period.`,
        });
        participant.eliminated = true;
      }
    }

    // Joining during join period
    else if (newState.channelId === this.vcChannel?.id && this.canJoin()) {
      const member = newState.member;
      if (member instanceof GuildMember) {
        const succ = await this.addParticipant(member);
        if (!succ) console.warn(`Failed to add participant: ${member.id}`);
      }
    }

    // Joining after game started → disconnect
    else if (newState.channelId === this.vcChannel?.id && this.active) {
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
    this.joinPeriodOpen = true;

    // Add everyone currently in VC
    this.vcChannel.members.forEach(async (member) => {
      if (member instanceof GuildMember) {
        await this.addParticipant(member);
      }
    });

    this.txtChannel?.send({
      content: `🕒 Join period started! You have ${
        Configs.timeToJoin / 1000
      } seconds to join the game by entering the VC.`,
    });

    setTimeout(() => {
      this.active = true;
      this.pendingStart = false;
      this.joinPeriodOpen = false;

      const uneliminatedParticipants = Array.from(
        this.participants.values(),
      ).filter((p) => !p.eliminated);

      this.txtChannel?.send({
        content: `The game has started with ${uneliminatedParticipants.length} participants!`,
      });

      this._startGame();
    }, Configs.timeToJoin);
  }

  private async _startGame() {
    let _al = Array.from(this.participants.values()).filter(
      (p) => !p.eliminated,
    );

    if (_al.length < 5) {
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

      // Shuffle alive participants
      for (let i = aliveParticipants.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        // @ts-ignore
        [aliveParticipants[i], aliveParticipants[j]] = [
          aliveParticipants[j],
          aliveParticipants[i],
        ];
      }

      if (aliveParticipants.length <= 3) {
        aliveParticipants.forEach((p) => {
          if (!ranking.includes(p)) ranking.unshift(p); // 1st place ends up last
        });

        const top3 = ranking.slice(0, 3).reverse();
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

      const idx = getRandomNumber(0, aliveParticipants.length - 1);
      const playerToEliminate = aliveParticipants[idx]!;
      playerToEliminate.eliminated = true;

      this.txtChannel?.send({
        content: `<@${playerToEliminate.id}> has been eliminated!`,
      });

      ranking.unshift(playerToEliminate);

      await new Promise((resolve) =>
        setTimeout(resolve, Configs.eliminationPassWaitTime),
      );
    }
  }
}
