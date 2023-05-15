const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, CommandOptionTypes, CommandInteractionOptionTypes, CommandInteractionOptionResolver, CommandInteractionBuilder} = require('discord.js');
const { token } = require('./config.json');
const { generateByRawMessage } = require('./helpers.js');
const { api_secret } = require('./config.json');


const client = new Client({ 
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
    	GatewayIntentBits.MessageContent
	] 
});

client.commands = new Collection();
client.cooldowns = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}


client.once(Events.ClientReady, (c) => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async message => {
	const allowedChannels = ['881700124617769031', '1092209339609137183', '1093576925655617596', '1092919014705082398', '1093796191340331049'];
	const maps = ['the shores of vengeance', 'the shadows of war', 'the defense of aoi village', 'blood in the snow', 'twilight and ashes', 'blood and steel'];
	if(allowedChannels.includes(message.channelId)){
		for(let i = 0; i < maps.length; i++){
			if(message.content.toLowerCase().includes(maps[i])){
				let forProcessing = message.content.replace(/^\s+|\s+$/g, "").trim();
				let processing = forProcessing.split('\n')
				processing[processing.length-1] =  'credits '.concat(processing[processing.length-1]);
				let processed = processing.join('\n');
				//
				const channel = await client.channels.fetch(message.channelId);
				generateByRawMessage(processed, api_secret, channel);
				//
				break;
			}
		}
	}
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	const { cooldowns } = client;

	if (!cooldowns.has(command.data.name)) {
		cooldowns.set(command.data.name, new Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.data.name);
	const defaultCooldownDuration = 3;
	const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

	if (timestamps.has(interaction.user.id)) {
		const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

		if (now < expirationTime) {
			const expiredTimestamp = Math.round(expirationTime / 1000);
			return interaction.reply({ content: `Please wait <t:${expiredTimestamp}:R> more second(s) before reusing the \`${command.data.name}\` command.`, ephemeral: true });
		}
	}

	timestamps.set(interaction.user.id, now);
	setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.login(token);
