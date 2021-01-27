// Define and require modules
const { Command }      = require("discord.js-commando");
const { stripIndents } = require("common-tags");
const TinyConfig       = require("../../data/js/config");
const options          = require("../../config");
const _                = require("lodash");

const actions = ["view", "set", "add", "remove", "reset"];

module.exports = class ConfigCommand extends Command {
	constructor(client) {
		super(client, {
			"name": "config",
			"memberName": "config",
			"aliases": ["conf"],
			"group": "moderation",
			"description": "Edit the server configuration.",
			"details": stripIndents`
				Run \`${options.prefix.commands}config <action> (property) (value)\` to interact with the config.
				**Notes:**
				<action>: Required, what to do.
				(name): Required depending on action, what property to take action on.
				(content): Required depending on action, what to set the value of property to.

				Actions: \`${actions.join("`, `")}\`
			`,
			"args": [
				{
					"key":     "action",
					"prompt":  "What would you like to do?",
					"type":    "string",
					"oneOf":   actions
				},
				{
					"key":     "property",
					"prompt":  "",
					"default": "",
					"type":    "string"
				},
				{
					"key":     "value",
					"prompt":  "",
					"default": "",
					"type":    "string"
				}
			],
			"guildOnly": true,
			"clientPermissions": ["SEND_MESSAGES", "EMBED_LINKS"],
			"throttling": {
				"usages":   2,
				"duration": 5
			}
		});
	}

	async run(message, { action, property, value }) {
		const config = new TinyConfig("guild", message.guild, message);
		const guildConfig = await config.get();
		if (!guildConfig)
			return message.reply(`This server's config must be migrated, but some steps have breaking changes! Please run \`${options.prefix.commands}migrate\`.`);

		// Permission check
		if (!this.client.checkRole(message, guildConfig.automod.adminID)) return message.reply("You do not have permission to use this command.");

		// View command
		if (action === "view") {
			return message.channel.send(this.client.embed({
				"message":     message,
				"title":       `${message.guild.name}'s config:`,
				"description": `
\`\`\`json
${JSON.stringify(guildConfig, null, 2)}
\`\`\`
				`
			}));
		}

		// Reset command
		if (action === "reset") {
			const oldConfig = this.client.embed({
				"title":       `${message.guild.name}'s old config:`,
				"description": `
\`\`\`json
${JSON.stringify(await config.getRaw(), null, 2)}
\`\`\`
				`
			});
			message.reply("Resetting the config. Here's your old config so you can copy over any lost data: ", { "embed": oldConfig });

			config.reset();
			return message.reply("Successfully reset the config.");
		}

		// Sanitize property
		property = property.replace(/[^\w.]/, "");

		// Make sure the property exists
		if (!this.client.checkExists(guildConfig, property)) return message.reply("That config property does not exist.");

		// Set command
		if (action === "set") {
			if (isArray()) return message.reply("That config property is an array. Use `add` instead.");

			const checked = await config.set(property, value);
			out(checked.valid, { "action": "Set", "reason": checked.reason });
		}

		// Add command
		if (action === "add") {
			if (!isArray()) return message.reply("That config property is not an array. Use `set` instead.");

			const checked = await config.add(property, value);
			out(checked.valid, { "action": "Added", "reason": checked.reason });
		}

		// Remove command
		if (action === "remove") {
			if (!isArray()) return message.reply("That config property is not an array.");

			const checked = await config.set(property, value);
			out(checked.valid, { "action": "Removed", "reason": checked.reason });
		}

		function out(success, options) {
			if (success) return message.reply(`${options.action} \`${property}\` → \`${value}\`.`);
			return message.reply(`Unable to execute the change \`${property}\` → \`${value}\`! ${options.reason}`);
		}

		// Function to check if a config value is an array
		function isArray() {return Array.isArray(_.get(guildConfig, property))}
	}
};