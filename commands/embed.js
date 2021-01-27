// Define and require modules
const { Command }      = require("discord.js-commando");
const { stripIndents } = require("common-tags");
const options          = require("../../config");

const values = ["author", "author.name", "author.picture", "title", "url", "thumbnail", "description", "footer", "color", "fields", "image"];

module.exports = class EmbedCommand extends Command {
	constructor(client) {
		super(client, {
			"name":        "embed",
			"memberName":  "embed",
			"group":       "misc",
			"description": "Create an embedded message.",
			"details": stripIndents`
				Run \`${options.prefix.commands}embed <JSON>\` to make an embed
				**Notes:**
				<JSON>: Required, the contents of the embed.
				How to format JSON: JSON always starts and ends with \`{\`/\`}\`
				For an example on how to format the JSON for this command,
				look a bit below these notes.

				JSON elements: \`${values.join("`, `")}\`
			`,
			"examples": [
				`${options.prefix.commands}embed {"footer": "Hello"}`,
				`\`\`\`json
{
	"author": {
		"name": "Encode42",
		"picture": "me"
	},
	"title": "Embed title",
	"description": "Embed description"
}
\`\`\``, `\`\`\`json
{
	"author": { "name": "Cool Guy" }
	"fields": [
		["Field 1", "This is a field that is next to another", true],
		["Field 2", "This is a field that is next to another", true],
		["Field 3", "This is a field that isn't next to another"]
	]
}
\`\`\``],
			"clientPermissions": ["SEND_MESSAGES", "EMBED_LINKS"],
			"args": [
				{
					"key":    "embedJSON",
					"prompt": "What is the JSON you would like to embed?",
					"type":   "string"
				}
			],
			"throttling": {
				"usages":   2,
				"duration": 5
			}
		});
	}

	run(message, { embedJSON }) {
		let embedMessage;
		try {
			embedMessage = JSON.parse(embedJSON.match(/{[^]+}/));
			if (!(embedMessage instanceof Object)) throw TypeError;
		}
		catch {return message.reply(`That's not valid JSON! Check the examples in \`${options.prefix.commands}help embed\`.`)}
		embedMessage.message = message;

		if (embedMessage.author) {
			if (!(embedMessage.author instanceof Object)) embedMessage.author = { "name": embedMessage.author };

			if (embedMessage.author.name === "me") {
				embedMessage.author = {
					"name":    message.author.username,
					"picture": message.author.displayAvatarURL({ "format": "png", "dynamic": true, "size": 512 })
				};
			}
		}

		return message.channel.send(this.client.embed(embedMessage));
	}
};