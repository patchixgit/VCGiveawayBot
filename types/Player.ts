import { GuildMember } from "discord.js";

export type Player = {
    id: String;
    user: GuildMember;
    eliminated: boolean;
    joinedAtDate: Date;
}