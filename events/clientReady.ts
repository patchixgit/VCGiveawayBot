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

import { Events } from "discord.js";
import { VCGiveawayBotClient } from "../types/Client";
import { BotEvent } from "../types/BotEvent";

export default {
  name: Events.ClientReady,
  once: true,

  run: (client: VCGiveawayBotClient) => {
    console.log(`Logged in as ${client.user?.tag}!`);
  },
} as BotEvent;