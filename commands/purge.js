// Define and require modules
const { Command }      = require("discord.js-commando");
const { stripIndents } = require("common-tags");
const TinyConfig       = require("../../data/js/config");
const options          = require("../../config");

module.exports = class PurgeCommand extends Command {
	constructor(client) {
		super(client, {
			"name": "purge",
			"memberName": "purge",
			"group": "moderation",
			"description": "Purge messages from chat or from a specific user.",
			"details": stripIndents`
				Run \`${options.prefix.commands}purge <amount> [user]\` to purge messages.
				**Notes:**
				<amount>: Required, how many messages to delete. Use "\`all\`" to remove all messages.
				[user]: Optional, what user to delete messages for.
			`,
			"args": [
				{
					"key":      "amount",
					"prompt":   "How many messages would you like to purge?",
					"type":     "string",
					"validate": arg => {
						if (arg < 3) return "You must purge at least 3 messages!";
						else if (arg > 99) return "You must purge less than 99 messages!";
						return true;
					}
				},
				{
					"key":     "user",
					"prompt":  "",
					"default": "",
					"type":    "string",
					"parse": arg => {return this.client.translate(arg, "mentions")}
				}
			],
			"guildOnly": true,
			"clientPermissions": ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_MESSAGES"],
			"throttling": {
				"usages":   2,
				"duration": 5
			}
		});
	}

	async run(message, { amount, user }) {
		if (!isNaN(parseInt(amount))) amount = parseInt(amount);
		const config = new TinyConfig("guild", message.guild);
		const guildConfig = await config.get();
		if (!guildConfig)
			return message.reply(`This server's config must be migrated, but some steps have breaking changes! Please run \`${options.prefix.commands}migrate\`.`);

		// Permission check
		if (!this.client.checkRole(message, guildConfig.automod.adminID)) return message.reply("You do not have permission to use this command.");

		// Purge entire channel
		if (amount === "all") {
			await message.channel.clone({ "reason": "Channel purged." });
			message.channel.delete("Channel purged.");
			return;
		}

		// Purge some messages
		if (!user) {
			message.channel.bulkDelete(amount + 1, true);
			return;
		}

		// Purge messages from user
		if (amount !== "all") {
			const allMessages = await message.channel.messages.fetch({ "limit": amount + 1 });
			const messages    = allMessages.filter(m => m.author.username === user);

			message.channel.bulkDelete(messages);
		}
	}
};