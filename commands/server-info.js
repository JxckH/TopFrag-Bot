// Define and require modules
const { Command }      = require("discord.js-commando");
const { stripIndents } = require("common-tags");
const options          = require("../../config");
const moment           = require("moment");

const actions = ["standard", "advanced", "all"];

module.exports = class ServerInfoCommand extends Command {
	constructor(client) {
		super(client, {
			"name":        "server-info",
			"memberName":  "server-info",
			"group":       "search",
			"description": "View information about the server you are in.",
			"details": stripIndents`
				Run \`${options.prefix.commands}server-info [level]\` to view server info.
				**Notes:**
				[action]: Optional, what level to grab server info at.

				Levels: \`${actions.join("`, `")}\`
			`,
			"args": [
				{
					"key": "action",
					"prompt": "",
					"type": "string",
					"default": "standard",
					"oneOf": actions
				}
			],
			"clientPermissions": ["SEND_MESSAGES", "EMBED_LINKS"],
			"throttling": {
				"usages":   2,
				"duration": 5
			}
		});
	}

	run(message, { action }) {
		const guild = message.guild; let icon, splash;
		const defaultMessageNotifications = guild.defaultMessageNotifications === "MENTIONS" ? "@mentions" : "All";
		const embedMessage = { "message": message, "title": `${guild.name} Info:`, "fields": [] };

		// Server icon & splash image
		const iconURL = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=4096`;
		const splashURL = `https://cdn.discordapp.com/icons/${guild.id}/${guild.splash}.png?size=4096`;
		if (guild.icon) {
			icon = `[Click](${iconURL})`;
			embedMessage.thumbnail = iconURL;
		} else icon = "None";

		if (guild.splash) {
			splash = `[Click](${splashURL})`;
			embedMessage.image = splashURL;
		} else splash = "None";

		// "All" level
		if (actions.indexOf(action) > 0) {
			embedMessage.fields.push(
				["name",        guild.name,                                                true],
				["ID",          guild.id,                                                  true],
				["Owner",       guild.owner,                                               true],
				["Created on",  moment(guild.createdTimestamp).format("M/D/YY h:mm:ss A"), true],
				["AFK Channel", guild.afkChannel ? guild.afkChannel : "None",              true],
				["AFK Timeout", guild.afkChannel ? guild.afkTimeout : "None",              true],
				["Region",      guild.region,                                              true],
				["Icon",        icon,                                                      true],
				["Splash",      splash,                                                    true]
			);
		}

		// "Advanced" level
		if (actions.indexOf(action) > 1) {
			embedMessage.fields.push(
				["Verification",    guild.verificationLevel,                            true],
				["2FA Requirement", guild.mfaLevel      ? "On" : "Off",                 true],
				["Content Filter",  guild.explicitContentFilter,                        true],
				["Verified",        guild.verified      ? "Yes" : "No",                 true],
				["System Channel",  guild.systemChannel ? guild.systemChannel : "None", true],
				["Notifications",   defaultMessageNotifications,                        true]
			);
		}

		// Default/standard level
		embedMessage.fields.push(
			["Channels",    guild.channels.cache.size,                                   true],
			["Emojis",      guild.emojis.cache.size,                                     true],
			["Roles",       guild.roles.cache.size,                                      true],
			["Members",     guild.members.cache.filter(member => !member.user.bot).size, true],
			["Bots",        guild.members.cache.filter(member =>  member.user.bot).size, true],
			["Total users", guild.memberCount,                                           true]
		);

		return message.channel.send(this.client.embed(embedMessage));
	}
};