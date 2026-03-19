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

import * as Discord from "discord.js";
import fs from "fs";
import path from "path";
import { Command } from "./types/Command";
import { VCGiveawayBotClient } from "./types/Client";
import { BotEvent } from "./types/BotEvent";

const GatewayIntentBits = Discord.GatewayIntentBits;

const client = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
}) as VCGiveawayBotClient;

// Command & Event Handling

client.commands = new Discord.Collection();

const commandsPath = path.join(process.cwd(), "commands");
const eventsPath = path.join(process.cwd(), "events");

const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

let [commandsLoaded, commandsToLoad] = [0, commandFiles.length];
let [eventsLoaded, eventsToLoad] = [0, eventFiles.length];

for (const filePath of commandFiles) {
  let cmd: Command | { default: Command } = await import(
    path.join(commandsPath, filePath)
  );

  if ("default" in cmd && cmd.default) {
    cmd = cmd.default;
  }

  if (!("name" in cmd && "run" in cmd)) {
    console.warn(`Command ${filePath} is missing required properties.`);
    continue;
  }

  client.commands.set(cmd.name, cmd);

  if ("aliases" in cmd && Array.isArray(cmd.aliases)) {
    for (const alias of cmd.aliases) {
      if (typeof alias !== "string") {
        continue;
      }

      client.commands.set(alias, cmd);
    }
  }

  const tabs = cmd.name.length >= 7 ? "\t" : "\t\t\t";

  console.log(
    `Loaded command: ${cmd.name} ${tabs}[${++commandsLoaded}/${commandsToLoad}]`,
  );
}

console.log(
  "Finished Loading Commands. " + `\t\t[${commandsLoaded}/${commandsToLoad}]`,
);

for (const filePath of eventFiles) {
  let eventModule: BotEvent | { default: BotEvent } = await import(
    path.join(eventsPath, filePath)
  );

  if ("default" in eventModule && eventModule.default) {
    eventModule = eventModule.default;
  }

  if (!("name" in eventModule && "run" in eventModule)) {
    console.warn(`Event ${filePath} is missing required properties.`);
    continue;
  }
  const { name: eventName, run: eventRun } = eventModule;

  if (
    "once" in eventModule &&
    typeof eventModule.once === "boolean" &&
    eventModule.once
  ) {
    client.once(eventName, (...args) => eventRun(client, ...args));
    console.log(
      `Loaded event (once): ${eventName} \t\t[${++eventsLoaded}/${eventsToLoad}]`,
    );
  } else {
    client.on(eventName, (...args) => eventRun(client, ...args));
    console.log(
      `Loaded event: ${eventName} \t\t[${++eventsLoaded}/${eventsToLoad}]`,
    );
  }
}

console.log(
  "Finished Loading Events. " + `\t\t[${eventsLoaded}/${eventsToLoad}]`,
);

await client.login(process.env.DISCORD_TOKEN);
